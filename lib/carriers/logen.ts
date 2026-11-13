import "server-only";
import { adminEnabled, createServiceClient } from "@/lib/auth";
import { unifiedOrders, type UOrder } from "@/lib/channels/orders";

// 로젠택배 오픈API (https://openapihome.ilogen.com)
// 1) 주문 정보 일괄 등록 → 로젠 시스템 「다중 주문 등록/출력」 화면에 들어감 → 거기서 송장 출력
// 2) 출력 송장번호 조회 → 출력된 송장번호를 주문번호로 받아와 업무 시스템에 저장
// 처음엔 테스트 서버(dev)로 시작. 로젠 확인 후 LOGEN_ENV=prod 로 바꾸면 실제 접수

const HOST = { dev: "https://topenapi.ilogen.com", prod: "https://openapi.ilogen.com" } as const;
type Env = keyof typeof HOST;

export function logenConfig() {
  const custCd = process.env.LOGEN_CUST_CD ?? "";
  const env: Env = process.env.LOGEN_ENV === "prod" ? "prod" : "dev";
  const cfg = {
    env, custCd, userId: process.env.LOGEN_USER_ID || custCd,
    sender: { name: process.env.LOGEN_SENDER_NAME ?? "", addr: process.env.LOGEN_SENDER_ADDR ?? "", tel: process.env.LOGEN_SENDER_TEL ?? "" },
    fareTy: process.env.LOGEN_FARE_TY || "030", // 운임타입: 로젠 계약 기준(선불/착불/신용). 로젠 담당자에게 확인 후 설정
    fare: Number(process.env.LOGEN_FARE ?? 0),
  };
  const missing = [
    !cfg.custCd && "LOGEN_CUST_CD(거래처코드)", !cfg.sender.name && "LOGEN_SENDER_NAME(보내는 분)",
    !cfg.sender.addr && "LOGEN_SENDER_ADDR(보내는 주소)", !cfg.sender.tel && "LOGEN_SENDER_TEL(보내는 연락처)",
  ].filter(Boolean) as string[];
  return { ...cfg, missing, ready: !missing.length };
}

export type Waybill = {
  id: number; order_key: string; channel: string; order_no: string; fix_take_no: string; receiver_name: string | null; receiver_phone: string | null;
  address: string | null; item_summary: string | null; qty: number; env: string; status: "registered" | "done" | "error"; slip_no: string | null;
  result_msg: string | null; registered_at: string; slip_at: string | null;
};

// 목업 모드용 메모리 저장
const g = globalThis as unknown as { __logen?: Waybill[] };
const mem = () => (g.__logen ??= []);

const today = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10).replace(/-/g, "");
const cleanAddr = (a: string | null | undefined) => (a ?? "").replace(/^\(\d{5}\)\s*/, "").trim();
const phone = (p: string | null | undefined) => (p ?? "").replace(/[^\d-]/g, "");
const isCell = (p: string) => /^01\d/.test(p.replace(/-/g, ""));
const summary = (o: UOrder) => {
  const f = o.items[0]?.name ?? "";
  return o.items.length > 1 ? `${f} 외 ${o.items.length - 1}건` : f;
};

async function call<T>(path: string, body: unknown): Promise<T> {
  const { env } = logenConfig();
  const r = await fetch(HOST[env] + path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), cache: "no-store" });
  const text = await r.text();
  if (!r.ok) throw new Error(`로젠 응답 ${r.status}: ${text.slice(0, 200)}`);
  try { return JSON.parse(text) as T; } catch { throw new Error(`로젠 응답을 읽지 못했습니다: ${text.slice(0, 200)}`); }
}

// 송장 출력 대상: 결제완료·배송준비 상태이고 송장번호가 없는 주문
export async function waybillTargets() {
  const [orders, done] = await Promise.all([unifiedOrders(), listWaybills()]);
  const sent = new Set(done.filter((w) => w.status !== "error").map((w) => w.order_key));
  return orders.filter((o) => ["paid", "preparing"].includes(o.status) && !o.tracking?.some((t) => t.no) && !sent.has(o.key));
}

export async function listWaybills(): Promise<Waybill[]> {
  if (!adminEnabled()) return [...mem()].reverse();
  const { data, error } = await createServiceClient().from("logen_waybills").select("*").order("registered_at", { ascending: false }).limit(300);
  if (error) return []; // 테이블 생성 전
  return data as Waybill[];
}

async function save(rows: Partial<Waybill>[]) {
  if (!adminEnabled()) {
    for (const r of rows) {
      const i = mem().findIndex((x) => x.order_key === r.order_key);
      const base = { id: mem().length + 1, registered_at: new Date().toISOString(), slip_at: null, slip_no: null, result_msg: null } as Waybill;
      if (i >= 0) mem()[i] = { ...mem()[i], ...r } as Waybill; else mem().push({ ...base, ...r } as Waybill);
    }
    return;
  }
  const { error } = await createServiceClient().from("logen_waybills").upsert(rows, { onConflict: "order_key" });
  if (error) throw new Error("저장 실패: " + error.message);
}

// 1) 선택한 주문을 로젠에 등록
export async function registerToLogen(keys: string[], by: string | null) {
  const cfg = logenConfig();
  if (adminEnabled() && !cfg.ready) throw new Error("로젠 설정이 비어 있습니다: " + cfg.missing.join(", "));
  const targets = (await waybillTargets()).filter((o) => keys.includes(o.key));
  if (!targets.length) return { ok: 0, fail: 0, results: [] as { key: string; ok: boolean; msg: string | null }[] };

  const stamp = Date.now().toString(36).toUpperCase();
  const rows = targets.map((o, i) => {
    const p = phone(o.receiverPhone);
    return {
      o, fixTakeNo: `CJB${o.channel === "cafe24" ? "C" : "B"}-${o.orderNo}-${stamp}${i}`.slice(0, 100),
      data: {
        custCd: cfg.custCd, takeDt: today(),
        sndCustNm: cfg.sender.name, sndCustAddr: cfg.sender.addr, [isCell(cfg.sender.tel) ? "sndCellNo" : "sndTelNo"]: cfg.sender.tel,
        rcvCustNm: o.receiver ?? o.buyer ?? "", rcvCustAddr: cleanAddr(o.address), [isCell(p) ? "rcvCellNo" : "rcvTelNo"]: p,
        fareTy: cfg.fareTy, qty: 1, dlvFare: cfg.fare,
      },
    };
  });
  rows.forEach((r) => (r.data as Record<string, unknown>).fixTakeNo = r.fixTakeNo);
  const bad = rows.filter((r) => !r.data.rcvCustAddr || !r.data.rcvCustNm);
  if (bad.length) throw new Error(`주소·받는 분이 없는 주문이 있습니다: ${bad.map((b) => b.o.orderNo).join(", ")}`);

  let res: { data?: { fixTakeNo: string; resultCd: string; resultMsg: string | null }[]; sttsCd?: string; sttsMsg?: string };
  if (!adminEnabled()) res = { data: rows.map((r) => ({ fixTakeNo: r.fixTakeNo, resultCd: "TRUE", resultMsg: null })), sttsCd: "SUCCESS" };
  else res = await call("/lrm02b-edi/edi/registerOrderData", { userId: cfg.userId, data: rows.map((r) => r.data) });

  const by_no = new Map((res.data ?? []).map((d) => [d.fixTakeNo, d]));
  const saveRows: Partial<Waybill>[] = rows.map(({ o, fixTakeNo }) => {
    const d = by_no.get(fixTakeNo);
    const ok = d?.resultCd === "TRUE";
    return {
      order_key: o.key, channel: o.channel, order_no: o.orderNo, fix_take_no: fixTakeNo, receiver_name: o.receiver, receiver_phone: o.receiverPhone,
      address: cleanAddr(o.address), item_summary: summary(o), qty: 1, env: cfg.env, status: ok ? "registered" : "error",
      result_msg: ok ? null : d?.resultMsg ?? res.sttsMsg ?? "로젠 응답에 결과가 없습니다.", slip_no: null, slip_at: null,
      registered_at: new Date().toISOString(), ...(adminEnabled() ? { registered_by: by } : {}),
    } as Partial<Waybill>;
  });
  await save(saveRows);
  const results = saveRows.map((r) => ({ key: r.order_key!, ok: r.status === "registered", msg: r.result_msg ?? null }));
  return { ok: results.filter((r) => r.ok).length, fail: results.filter((r) => !r.ok).length, results };
}

// 2) 로젠에서 출력된 송장번호 가져오기
export async function fetchSlipNos() {
  const cfg = logenConfig();
  const pending = (await listWaybills()).filter((w) => w.status === "registered");
  if (!pending.length) return { updated: 0, waiting: 0 };
  let found: { fixTakeNo: string; slipNo: string | null; msg: string | null }[] = [];
  if (!adminEnabled()) {
    found = pending.map((w, i) => ({ fixTakeNo: w.fix_take_no, slipNo: `4557${String(4600000 + w.id * 7 + i).padStart(7, "0")}`, msg: null }));
  } else {
    if (!cfg.custCd) throw new Error("LOGEN_CUST_CD가 없습니다.");
    for (let i = 0; i < pending.length; i += 100) {
      const chunk = pending.slice(i, i + 100);
      const res = await call<{ data?: { fixTakeNo: string }[]; data1?: { slipNo?: string; resultCd?: string; resultMsg?: string | null }[] }>(
        "/lrm02b-edi/edi/inquirySlipNoMulti", { userId: cfg.userId, data: chunk.map((w) => ({ custCd: cfg.custCd, fixTakeNo: w.fix_take_no })) });
      // 응답 형태가 문서상 data/data1로 나뉘어 있어 두 가지 모두 처리
      const a = res.data ?? [], b = res.data1 ?? [];
      a.forEach((d, k) => {
        const x = { ...(d as object), ...(b[k] ?? {}) } as { fixTakeNo: string; slipNo?: string; resultMsg?: string | null };
        found.push({ fixTakeNo: x.fixTakeNo, slipNo: x.slipNo || null, msg: x.resultMsg ?? null });
      });
    }
  }
  const map = new Map(pending.map((w) => [w.fix_take_no, w]));
  const upd = found.filter((f) => f.slipNo && map.has(f.fixTakeNo)).map((f) => ({ ...map.get(f.fixTakeNo)!, slip_no: f.slipNo, status: "done" as const, slip_at: new Date().toISOString(), result_msg: null }));
  if (upd.length) await save(upd.map(({ id: _id, ...r }) => r));
  return { updated: upd.length, waiting: pending.length - upd.length };
}

// 등록 취소(출력 전 실수로 보낸 것 정리). 로젠 쪽 주문은 로젠 화면에서 삭제해야 함
export async function removeWaybill(orderKey: string) {
  if (!adminEnabled()) { g.__logen = mem().filter((w) => w.order_key !== orderKey); return; }
  await createServiceClient().from("logen_waybills").delete().eq("order_key", orderKey).neq("status", "done");
}

// 연결 확인(읽기 전용): 없는 주문번호로 송장번호 조회만 해서 테스트·실서버가 응답하는지 확인. 주문 등록·출력 안 함
export async function pingLogen(custCdInput?: string) {
  const custCd = logenConfig().custCd || (custCdInput ?? "").replace(/\D/g, "").slice(0, 8);
  if (!custCd) throw new Error("거래처코드가 필요합니다.");
  const body = JSON.stringify({ userId: process.env.LOGEN_USER_ID || custCd, data: [{ custCd, fixTakeNo: "CJB-CONNTEST-0001" }] });
  const out: Record<string, { status: number | null; body: string }> = {};
  for (const env of Object.keys(HOST) as Env[]) {
    try {
      const r = await fetch(HOST[env] + "/lrm02b-edi/edi/inquirySlipNoMulti", { method: "POST", headers: { "content-type": "application/json" }, body, cache: "no-store", signal: AbortSignal.timeout(10000) });
      out[env] = { status: r.status, body: (await r.text()).slice(0, 600) };
    } catch (e) { out[env] = { status: null, body: (e as Error).message }; }
  }
  return { custCd, ...out };
}
