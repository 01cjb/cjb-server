import "server-only";
import { createServiceClient } from "@/lib/auth";
import { workLive, type WorkMe } from "./auth";

// PM 지시함 (pm_directives) — 화면에는 내보내지 않는 DB 전용 표.
// Claude(기술 AI PM)가 정해진 시각에 자동 정산을 하면서 진행 기록을 남기고, 미니가 받은 "건너뛰기" 요청도 여기에 적습니다.
export type Pm = { id: number; title: string; body: string | null; requested_by: string | null; priority: string; status: "open" | "doing" | "done" | "hold"; result: string | null; due_date: string | null; created_at: string; done_at: string | null };
const COLS = "id,title,body,requested_by,priority,status,result,due_date,created_at,done_at";
const STATUS = new Set(["open", "doing", "done", "hold"]);
export const PM_STATUS: Record<string, string> = { open: "대기", doing: "진행 중", done: "완료", hold: "보류" };
export const SETTLE_PREFIX = "[정산]";
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

// 자동 정산 시간표 (한국 시간). Claude가 이 시각에 깨어나 크롬에서 정산을 진행합니다.
// 월요일 09:30·15:00 / 화~금 11:00·15:00
export const SETTLE_SLOTS: Record<number, string[]> = { 1: ["09:30", "15:00"], 2: ["11:00", "15:00"], 3: ["11:00", "15:00"], 4: ["11:00", "15:00"], 5: ["11:00", "15:00"] };
export const SKIP_PREFIX = "[정산 건너뛰기]";
const canSettle = (me: WorkMe) => me.is_owner || me.menus.includes("orders") || me.menus.includes("waybill");
export const todaySlots = () => SETTLE_SLOTS[new Date(Date.now() + 9 * 3600e3).getUTCDay()] ?? [];

// 오늘 특정 회차를 건너뛰도록 표시 (Claude가 시작 전에 확인)
export async function skipSettle(me: WorkMe, v: { time: string; note?: string }) {
  if (!canSettle(me)) return { ok: false as const, error: "주문·송장 메뉴 권한이 있는 직원만 정산을 건너뛰게 할 수 있습니다." };
  const m = /^(\d{1,2}):(\d{2})$/.exec((v.time ?? "").trim());
  const time = m ? `${m[1].padStart(2, "0")}:${m[2]}` : "";
  const slots = todaySlots();
  if (!slots.includes(time)) return { ok: false as const, error: slots.length ? `오늘 자동 정산 시각은 ${slots.join(", ")} 입니다. 그중에서 골라 주세요.` : "오늘은 자동 정산이 없는 날입니다." };
  const today = kstDay();
  const title = `${SKIP_PREFIX} ${today} ${time}`;
  const dup = (await listPm({ openOnly: true, days: 1 })).find((r) => r.title === title);
  if (dup) return { ok: true as const, id: dup.id, title, already: true };
  const row = { title, body: (v.note ?? "").trim().slice(0, 1000) || null, requested_by: `${me.name} (미니)`, priority: "normal", status: "open" as const, result: null, due_date: today };
  if (!workLive()) { const r: Pm = { id: mem.seq++, ...row, created_at: new Date().toISOString(), done_at: null }; mem.rows.push(r); return { ok: true as const, id: r.id, title, already: false }; }
  const { data, error } = await db().from("pm_directives").insert(row).select("id").single();
  if (error) return { ok: false as const, error: "저장하지 못했습니다." };
  return { ok: true as const, id: data.id as number, title, already: false };
}

// 건너뛰기 취소 (다시 정산하도록)
export async function unskipSettle(me: WorkMe, id: number) {
  if (!canSettle(me)) return { ok: false as const, error: "권한이 없습니다." };
  const r = (await listPm({ openOnly: true })).find((x) => x.id === id && x.title.startsWith(SKIP_PREFIX));
  if (!r) return { ok: false as const, error: "취소할 건너뛰기 표시를 찾지 못했습니다." };
  return updatePm(id, { status: "hold", result: `${me.name} 님이 건너뛰기를 취소` });
}

// Claude가 정산 진행 기록을 남길 때 (대표 계정 API에서만 호출)
export async function createPm(v: { title: string; status?: string; result?: string }) {
  const title = (v.title ?? "").trim().slice(0, 200);
  if (!title) return { ok: false as const, error: "제목이 없습니다." };
  const status = v.status && STATUS.has(v.status) ? (v.status as Pm["status"]) : "doing";
  const row = { title, body: null, requested_by: "Claude (자동 정산)", priority: "normal", status, result: (v.result ?? "").trim().slice(0, 4000) || null, due_date: kstDay() };
  if (!workLive()) { const r: Pm = { id: mem.seq++, ...row, created_at: new Date().toISOString(), done_at: null }; mem.rows.push(r); return { ok: true as const, id: r.id }; }
  const { data, error } = await db().from("pm_directives").insert(row).select("id").single();
  if (error) return { ok: false as const, error: "저장 실패" };
  return { ok: true as const, id: data.id as number };
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
