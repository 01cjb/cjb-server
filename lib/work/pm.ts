import "server-only";
import { createServiceClient } from "@/lib/auth";
import { workLive, type WorkMe } from "./auth";

// PM 지시함 (pm_directives) — 화면에는 내보내지 않는 DB 전용 표.
// 미니가 받은 "정산 예약"을 여기에 적어 두면, Claude(기술 AI PM)가 정해진 시각에 읽고 크롬에서 진행합니다.
export type Pm = { id: number; title: string; body: string | null; requested_by: string | null; priority: string; status: "open" | "doing" | "done" | "hold"; result: string | null; due_date: string | null; created_at: string; done_at: string | null };
const COLS = "id,title,body,requested_by,priority,status,result,due_date,created_at,done_at";
const STATUS = new Set(["open", "doing", "done", "hold"]);
export const PM_STATUS: Record<string, string> = { open: "예약됨", doing: "진행 중", done: "완료", hold: "보류" };
export const SETTLE_PREFIX = "[정산 예약]";
const db = () => createServiceClient();
const mem: { rows: Pm[]; seq: number } = ((globalThis as Record<string, unknown>).__cjbPm ??= { rows: [], seq: 1 }) as never;
const kstDay = (d = new Date()) => new Date(d.getTime() + 9 * 3600e3).toISOString().slice(0, 10);

export async function listPm(opts: { openOnly?: boolean; days?: number } = {}): Promise<Pm[]> {
  const since = new Date(Date.now() - (opts.days ?? 7) * 86400e3).toISOString();
  let rows: Pm[];
  if (!workLive()) rows = mem.rows.filter((r) => r.created_at >= since).sort((a, b) => b.id - a.id);
  else rows = ((await db().from("pm_directives").select(COLS).gte("created_at", since).order("created_at", { ascending: false }).limit(100)).data as Pm[]) ?? [];
  return opts.openOnly ? rows.filter((r) => r.status === "open" || r.status === "doing") : rows;
}

// 정산 예약: 시각은 09:00~16:00, 오늘 날짜만. 같은 시각·차수 예약이 이미 있으면 새로 만들지 않음
export async function reserveSettle(me: WorkMe, v: { time: string; round?: string; note?: string }) {
  if (!(me.is_owner || me.menus.includes("orders") || me.menus.includes("waybill"))) return { ok: false as const, error: "주문·송장 메뉴 권한이 있는 직원만 정산을 예약할 수 있습니다." };
  const m = /^(\d{1,2}):(\d{2})$/.exec((v.time ?? "").trim());
  if (!m) return { ok: false as const, error: "시각을 11:00 같은 형식으로 알려 주세요." };
  const hh = Number(m[1]), mm = Number(m[2]);
  if (hh < 9 || hh > 16 || mm > 59 || (hh === 16 && mm > 0)) return { ok: false as const, error: "예약은 오전 9시부터 오후 4시 사이만 됩니다." };
  const time = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  const round = /2/.test(v.round ?? "") ? "2차" : /1/.test(v.round ?? "") ? "1차" : "";
  const today = kstDay();
  const title = `${SETTLE_PREFIX} ${today} ${time}${round ? ` ${round}` : ""}`;
  const dup = (await listPm({ openOnly: true, days: 1 })).find((r) => r.title === title);
  if (dup) return { ok: true as const, id: dup.id, title, already: true };
  const row = { title, body: (v.note ?? "").trim().slice(0, 1000) || null, requested_by: `${me.name} (미니)`, priority: "normal", status: "open" as const, result: null, due_date: today };
  if (!workLive()) { const r: Pm = { id: mem.seq++, ...row, created_at: new Date().toISOString(), done_at: null }; mem.rows.push(r); return { ok: true as const, id: r.id, title, already: false }; }
  const { data, error } = await db().from("pm_directives").insert(row).select("id").single();
  if (error) return { ok: false as const, error: "예약을 저장하지 못했습니다." };
  return { ok: true as const, id: data.id as number, title, already: false };
}

export async function cancelSettle(me: WorkMe, id: number) {
  const r = (await listPm({ openOnly: true })).find((x) => x.id === id && x.title.startsWith(SETTLE_PREFIX));
  if (!r) return { ok: false as const, error: "취소할 예약을 찾지 못했습니다." };
  if (r.status !== "open") return { ok: false as const, error: "이미 진행 중인 정산은 취소할 수 없습니다." };
  return updatePm(id, { status: "hold", result: `${me.name} 님이 미니에게 취소 요청` });
}

export async function updatePm(id: number, v: { status?: string; result?: string }) {
  if (v.status && !STATUS.has(v.status)) return { ok: false as const, error: "상태 값이 올바르지 않습니다." };
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (v.status) { patch.status = v.status; patch.done_at = v.status === "done" ? new Date().toISOString() : null; }
  if (typeof v.result === "string") patch.result = v.result.trim().slice(0, 4000) || null;
  if (!workLive()) { const r = mem.rows.find((x) => x.id === id); if (!r) return { ok: false as const, error: "없는 지시입니다." }; Object.assign(r, patch); return { ok: true as const }; }
  const { error } = await db().from("pm_directives").update(patch).eq("id", id);
  if (error) return { ok: false as const, error: "저장 실패" };
  return { ok: true as const };
}
