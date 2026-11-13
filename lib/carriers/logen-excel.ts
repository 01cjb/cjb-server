import "server-only";
import ExcelJS from "exceljs";
import { adminEnabled, createServiceClient } from "@/lib/auth";
import { CHANNELS, mockChannelRows, unifiedOrders, type UOrder } from "@/lib/channels/orders";

// 로젠 엑셀 주고받기 (API 없이)
// 1) 사방넷 「로젠택배 양식」 엑셀 올리기 → 업무 시스템에 사방넷 주문으로 저장
// 2) 날짜별로 사방넷+카페24+뷰티웰 주문을 사방넷과 같은 로젠 양식 엑셀로 내려받기 → 로젠 사이트에 업로드해서 출력

// 사방넷 로젠 양식과 같은 칸 순서
const HEAD = ["수취인명", "우편번호", "주소", "수취인연락처", "수취인연락처", "공란", "공란", "주문번호", "상품명(수집)+옵션(수집)", "수량", "배송메세지", "송하인명"];
const WIDTH = [8, 9, 70, 15, 15, 4, 4, 18, 80, 5, 40, 10];
const SHIP_STATUS = ["paid", "preparing"]; // 출고 대상

const kstDay = (iso: string) => (iso ? new Date(new Date(iso).getTime() + 9 * 3600e3).toISOString().slice(0, 10) : "");
const zipFmt = (z: string | null | undefined) => { const d = (z ?? "").replace(/\D/g, ""); return d.length === 5 ? `${d.slice(0, 3)}-${d.slice(3)}` : (z ?? ""); };
const zipRaw = (z: unknown) => String(z ?? "").replace(/\D/g, "");
const cleanAddr = (a: string | null | undefined) => (a ?? "").replace(/^\(\d{5}\)\s*/, "").trim();
const cellText = (v: ExcelJS.CellValue): string => {
  if (v == null) return "";
  if (typeof v === "object") {
    if ("richText" in v) return v.richText.map((t) => t.text).join("");
    if ("text" in v) return String(v.text);
    if ("result" in v) return String(v.result ?? "");
    if (v instanceof Date) return v.toISOString();
  }
  return String(v);
};

// ---------- 1) 사방넷 엑셀 올리기 ----------
export type ImportResult = { total: number; saved: number; skipped: number; date: string; errors: string[] };

export async function importSabangnetLogen(buf: ArrayBuffer, date: string): Promise<ImportResult> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("날짜 형식이 올바르지 않습니다.");
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);
  const ws = wb.worksheets[0];
  if (!ws) throw new Error("엑셀에 시트가 없습니다.");

  // 머리글 위치 찾기 (같은 이름 '수취인연락처'가 두 번 있으니 첫 번째 사용)
  const head: Record<string, number> = {};
  ws.getRow(1).eachCell((c, col) => { const t = cellText(c.value).trim(); if (t && !(t in head)) head[t] = col; });
  const col = (...names: string[]) => names.map((n) => Object.keys(head).find((k) => k.replace(/\s/g, "").startsWith(n))).find(Boolean);
  const need = { name: col("수취인명"), zip: col("우편번호"), addr: col("주소"), tel: col("수취인연락처", "연락처"), no: col("주문번호", "사방넷주문번호"), item: col("상품명"), qty: col("수량"), msg: col("배송메세지", "배송메시지") };
  const missing = Object.entries(need).filter(([k, v]) => !v && k !== "msg").map(([k]) => k);
  if (missing.length) throw new Error("사방넷 「로젠택배 양식」 엑셀이 아닙니다. (수취인명·우편번호·주소·연락처·주문번호·상품명·수량 칸이 필요합니다)");
  const get = (r: ExcelJS.Row, k?: string) => (k ? cellText(r.getCell(head[k]).value).trim() : "");

  const orderedAt = new Date(`${date}T12:00:00+09:00`).toISOString();
  const rows: Record<string, unknown>[] = [];
  const errors: string[] = [];
  let bad = 0;
  ws.eachRow((r, i) => {
    if (i === 1) return;
    const no = get(r, need.no).replace(/\.0$/, "");
    const name = get(r, need.name);
    if (!no && !name) return;
    if (!name || !get(r, need.addr)) { bad++; errors.push(`${i}행: 수취인 또는 주소 없음`); return; }
    // 주문번호 없는 줄 = 엑셀에 직접 적어 넣은 주문(수기). 날짜+행번호로 구분
    const manual = !no;
    const item = get(r, need.item).replace(/\/\s*$/, "").trim();
    rows.push({
      channel: "sabangnet", external_order_id: manual ? `수기-${date.replace(/-/g, "")}-${String(i).padStart(3, "0")}` : no, order_place: manual ? "수기" : "사방넷", ordered_at: orderedAt, paid: true, canceled: false,
      status: "preparing", status_code: "출고대기", receiver_name: name, buyer_name: name, receiver_phone: get(r, need.tel),
      zipcode: zipRaw(get(r, need.zip)), address: get(r, need.addr), shipping_message: get(r, need.msg) || null,
      total_amount: 0, items: [{ name: item, qty: Number(get(r, need.qty)) || 1 }],
      raw: { file_row: i, source: "sabangnet-logen-excel" }, synced_at: new Date().toISOString(),
    });
  });

  // 같은 파일 안 중복 주문번호 정리
  const uniq = [...new Map(rows.map((r) => [r.external_order_id as string, r])).values()];
  const skipped = bad + rows.length - uniq.length;
  if (!adminEnabled()) {
    const mem = mockChannelRows();
    for (const r of uniq) {
      const i = mem.findIndex((m) => m.channel === "sabangnet" && m.external_order_id === r.external_order_id);
      const row = { id: -1000 - (i >= 0 ? i : mem.length), ...(r as object) } as (typeof mem)[number];
      if (i >= 0) mem[i] = row; else mem.push(row);
    }
  } else {
    for (let i = 0; i < uniq.length; i += 500) {
      const { error } = await createServiceClient().from("channel_orders").upsert(uniq.slice(i, i + 500), { onConflict: "channel,external_order_id" });
      if (error) throw new Error("저장 실패: " + error.message);
    }
  }
  return { total: rows.length + bad, saved: uniq.length, skipped, date, errors: errors.slice(0, 10) };
}

// ---------- 2) 로젠 양식 엑셀 만들기 ----------
export async function waybillDay(date: string, channels?: string[]) {
  const all = await unifiedOrders();
  const rank = (c: string) => ["sabangnet", "vuka", "cafe24", "beautywell"].indexOf(c);
  const num = (k: string) => Math.abs(Number(k.split("-").pop()) || 0);
  return all.filter((o) => kstDay(o.orderedAt) === date && SHIP_STATUS.includes(o.status) && !o.tracking?.some((t) => t.no)
    && (!channels?.length || channels.includes(o.channel)))
    .sort((a, b) => rank(a.channel) - rank(b.channel) || num(a.key) - num(b.key)); // 올린 엑셀 순서대로
}

export function dayCounts(list: UOrder[]) {
  const c: Record<string, number> = {};
  for (const o of list) c[o.channel] = (c[o.channel] ?? 0) + 1;
  return Object.entries(c).map(([k, n]) => ({ channel: k, label: CHANNELS[k] ?? k, count: n }));
}

export async function buildLogenXlsx(list: UOrder[], date: string) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(`${date.replace(/-/g, "")}_업무시스템_로젠택배 양식`);
  ws.addRow(HEAD);
  ws.getRow(1).font = { bold: true };
  WIDTH.forEach((w, i) => { ws.getColumn(i + 1).width = w; });
  const sender = process.env.LOGEN_SENDER_NAME ?? "";
  for (const o of list) {
    const items = o.items.map((i) => `${i.name}${i.option ? ` ${i.option}` : ""}${o.items.length > 1 ? ` x${i.qty}` : ""}`).join(" / ");
    const qty = o.items.length === 1 ? o.items[0].qty : o.items.reduce((n, i) => n + (i.qty || 0), 0) || 1;
    const tel = o.receiverPhone ?? "";
    const row = ws.addRow([
      o.receiver ?? o.buyer ?? "", zipFmt(o.zipcode), o.addressOnly ? o.addressOnly : cleanAddr(o.address), tel, tel, "", "",
      o.orderNo.startsWith("수기-") ? "" : o.orderNo, items, qty, o.message ?? "", sender,
    ]);
    // 우편번호·연락처·주문번호가 숫자로 바뀌어 0이 사라지지 않게 글자로
    [2, 4, 5, 8].forEach((c) => { row.getCell(c).numFmt = "@"; });
  }
  return Buffer.from(await wb.xlsx.writeBuffer());
}
