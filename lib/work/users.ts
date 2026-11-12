import "server-only";
import { createServiceClient } from "@/lib/auth";
import { workLive, type WorkUser } from "./auth";
import { MENUS, TEAMS } from "./menus";
import { digits, hashPin, isPin, randomPin, weakPin } from "./pin";
import * as mock from "./mock";

export type UserRow = WorkUser & { menus: string[] };
export type LoginLog = { id: number; name: string | null; phone: string | null; ok: boolean; reason: string | null; ip: string | null; created_at: string };

const db = () => createServiceClient();
const COLS = "id,name,phone,team,position,is_owner,status,failed_count,locked_until,pin_set_at,memo,last_login_at,created_at";
const MENU_KEYS = new Set(MENUS.map((m) => m.key));
const TEAM_KEYS = new Set(TEAMS.map((t) => t.key));

export async function listUsers(): Promise<UserRow[]> {
  if (!workLive()) return mock.users().map((u) => ({ ...u, menus: mock.menus(u.id) }));
  const [u, m] = await Promise.all([
    db().from("work_users").select(COLS).order("is_owner", { ascending: false }).order("team").order("name"),
    db().from("work_user_menus").select("user_id,menu_key"),
  ]);
  const by: Record<string, string[]> = {};
  for (const r of m.data ?? []) (by[r.user_id] ??= []).push(r.menu_key);
  return ((u.data as WorkUser[]) ?? []).map((x) => ({ ...x, menus: by[x.id] ?? [] }));
}

export async function listLoginLogs(limit = 30): Promise<LoginLog[]> {
  if (!workLive()) return [];
  const { data } = await db().from("work_login_logs").select("id,name,phone,ok,reason,ip,created_at").order("id", { ascending: false }).limit(limit);
  return (data as LoginLog[]) ?? [];
}

async function audit(actor: string, action: string, target: string | null, detail?: Record<string, unknown>) {
  if (workLive()) await db().from("work_audit").insert({ actor_id: actor || null, action, target_id: target, detail: detail ?? null });
}

type Input = { name?: unknown; phone?: unknown; team?: unknown; position?: unknown; memo?: unknown; is_owner?: unknown; status?: unknown };

function clean(i: Input, partial: boolean): { ok: true; v: Partial<WorkUser> } | { ok: false; error: string } {
  const v: Partial<WorkUser> = {};
  if (!partial || i.name !== undefined) {
    const name = typeof i.name === "string" ? i.name.trim() : "";
    if (!name || name.length > 30) return { ok: false, error: "이름을 1~30자로 입력하세요." };
    v.name = name;
  }
  if (!partial || i.phone !== undefined) {
    const p = digits(i.phone);
    if (p && !/^01\d{8,9}$/.test(p)) return { ok: false, error: "연락처는 010으로 시작하는 휴대폰 번호로 입력하세요." };
    v.phone = p || null;
  }
  if (!partial || i.team !== undefined) {
    if (!TEAM_KEYS.has(String(i.team) as never)) return { ok: false, error: "소속 팀을 선택하세요." };
    v.team = String(i.team);
  }
  if (i.position !== undefined) v.position = typeof i.position === "string" && i.position.trim() ? i.position.trim().slice(0, 20) : null;
  if (i.memo !== undefined) v.memo = typeof i.memo === "string" && i.memo.trim() ? i.memo.trim().slice(0, 500) : null;
  if (i.is_owner !== undefined) v.is_owner = i.is_owner === true;
  if (i.status !== undefined) {
    if (i.status !== "active" && i.status !== "disabled") return { ok: false, error: "상태 값이 올바르지 않습니다." };
    v.status = i.status;
  }
  return { ok: true, v };
}

async function phoneTaken(phone: string | null | undefined, exceptId?: string) {
  if (!phone) return false;
  const list = workLive() ? (((await db().from("work_users").select("id").eq("phone", phone)).data ?? []) as { id: string }[]) : mock.users().filter((u) => u.phone === phone);
  return list.some((u) => u.id !== exceptId);
}

// 직원 등록 — PIN 미입력 시 자동 발급(화면에 1회 표시)
export async function createUser(actor: string, i: Input & { pin?: unknown; menus?: unknown }) {
  const c = clean(i, false);
  if (!c.ok) return c;
  if (await phoneTaken(c.v.phone)) return { ok: false as const, error: "이미 등록된 연락처입니다." };
  let pin = typeof i.pin === "string" && i.pin ? i.pin : "";
  if (pin && (!isPin(pin) || weakPin(pin))) return { ok: false as const, error: "PIN은 6자리 숫자이며, 같은 숫자 반복·연속 숫자는 쓸 수 없습니다." };
  if (!pin) pin = randomPin();
  const keys = Array.isArray(i.menus) ? i.menus.filter((k): k is string => typeof k === "string" && MENU_KEYS.has(k)) : [];
  const row = { name: c.v.name!, phone: c.v.phone ?? null, team: c.v.team!, position: c.v.position ?? null, memo: c.v.memo ?? null, is_owner: c.v.is_owner ?? false, status: "active" as const, pin_set_at: new Date().toISOString() };

  if (!workLive()) {
    const u = mock.insert(row, hashPin(pin));
    mock.setMenus(u.id, keys);
    return { ok: true as const, id: u.id, pin };
  }
  const { data, error } = await db().from("work_users").insert({ ...row, pin_hash: hashPin(pin) }).select("id").single();
  if (error) return { ok: false as const, error: "등록하지 못했습니다: " + error.message };
  if (keys.length) await db().from("work_user_menus").insert(keys.map((k) => ({ user_id: data.id, menu_key: k })));
  await audit(actor, "user.create", data.id, { name: row.name, team: row.team, menus: keys });
  return { ok: true as const, id: data.id as string, pin };
}

export async function updateUser(actor: string, id: string, i: Input) {
  const c = clean(i, true);
  if (!c.ok) return c;
  if (c.v.phone !== undefined && (await phoneTaken(c.v.phone, id))) return { ok: false as const, error: "이미 등록된 연락처입니다." };
  if ((c.v.is_owner === false || c.v.status === "disabled") && (await isLastOwner(id))) return { ok: false as const, error: "마지막 대표 계정은 해제하거나 중지할 수 없습니다." };
  if (!workLive()) { mock.update(id, c.v); return { ok: true as const }; }
  const { error } = await db().from("work_users").update({ ...c.v, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  if (c.v.status === "disabled") await db().from("work_sessions").delete().eq("user_id", id);
  await audit(actor, "user.update", id, c.v as Record<string, unknown>);
  return { ok: true as const };
}

async function isLastOwner(id: string) {
  const list = await listUsers();
  const owners = list.filter((u) => u.is_owner && u.status === "active");
  return owners.length === 1 && owners[0].id === id;
}

export async function setUserMenus(actor: string, id: string, keysIn: unknown) {
  const keys = Array.isArray(keysIn) ? [...new Set(keysIn.filter((k): k is string => typeof k === "string" && MENU_KEYS.has(k)))] : null;
  if (!keys) return { ok: false as const, error: "메뉴 목록이 올바르지 않습니다." };
  if (!workLive()) { mock.setMenus(id, keys); return { ok: true as const }; }
  await db().from("work_user_menus").delete().eq("user_id", id);
  if (keys.length) await db().from("work_user_menus").insert(keys.map((k) => ({ user_id: id, menu_key: k })));
  await audit(actor, "user.menus", id, { menus: keys });
  return { ok: true as const };
}

// PIN 재발급(자동) 또는 지정 — 잠금 해제 + 기존 세션 종료
export async function resetPin(actor: string, id: string, pinIn?: unknown) {
  let pin = typeof pinIn === "string" && pinIn ? pinIn : "";
  if (pin && (!isPin(pin) || weakPin(pin))) return { ok: false as const, error: "PIN은 6자리 숫자이며, 같은 숫자 반복·연속 숫자는 쓸 수 없습니다." };
  if (!pin) pin = randomPin();
  const patch = { pin_set_at: new Date().toISOString(), failed_count: 0, locked_until: null };
  if (!workLive()) { mock.update(id, { ...patch, pin_hash: hashPin(pin) }); return { ok: true as const, pin }; }
  await db().from("work_users").update({ ...patch, pin_hash: hashPin(pin) }).eq("id", id);
  await db().from("work_sessions").delete().eq("user_id", id);
  await audit(actor, "user.pin_reset", id);
  return { ok: true as const, pin };
}

export async function unlockUser(actor: string, id: string) {
  if (!workLive()) { mock.update(id, { failed_count: 0, locked_until: null }); return { ok: true as const }; }
  await db().from("work_users").update({ failed_count: 0, locked_until: null }).eq("id", id);
  await audit(actor, "user.unlock", id);
  return { ok: true as const };
}

// 첫 대표 계정 (직원이 0명일 때만)
export async function countUsers() {
  if (!workLive()) return mock.users().length;
  const { count } = await db().from("work_users").select("id", { count: "exact", head: true });
  return count ?? 0;
}
