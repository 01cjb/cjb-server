import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { adminEnabled, createServiceClient } from "@/lib/auth";
import { MENUS } from "./menus";
import { digits, hashPin, newToken, sha256, verifyPin } from "./pin";
import * as mock from "./mock";

export const WORK_COOKIE = "cjb_work";
const SESSION_HOURS = 12;
const MAX_FAILS = 5;
const LOCK_MINUTES = 15;

export type WorkUser = {
  id: string; name: string; phone: string | null; team: string; position: string | null; is_owner: boolean;
  status: "active" | "disabled"; failed_count: number; locked_until: string | null; pin_set_at: string | null;
  memo: string | null; last_login_at: string | null; created_at: string;
};
export type WorkMe = WorkUser & { menus: string[] };

export const workLive = () => adminEnabled();
const db = () => createServiceClient();
const USER_COLS = "id,name,phone,team,position,is_owner,status,failed_count,locked_until,pin_set_at,memo,last_login_at,created_at";

export const allMenuKeys = () => MENUS.map((m) => m.key);
export const canSee = (me: WorkMe, key: string) => me.is_owner || me.menus.includes(key);

async function menusOf(u: WorkUser): Promise<string[]> {
  if (u.is_owner) return allMenuKeys();
  if (!workLive()) return mock.menus(u.id);
  const { data } = await db().from("work_user_menus").select("menu_key").eq("user_id", u.id);
  return (data ?? []).map((r) => r.menu_key as string);
}

// 현재 로그인 직원 (요청당 1회 조회)
export const getWorkMe = cache(async (): Promise<WorkMe | null> => {
  const token = (await cookies()).get(WORK_COOKIE)?.value;
  if (!token) return null;
  let u: WorkUser | null = null;
  if (!workLive()) {
    u = token.startsWith("mock.") ? mock.users().find((x) => x.id === token.slice(5)) ?? null : null;
  } else {
    const { data: s } = await db().from("work_sessions").select("user_id,expires_at").eq("token_hash", sha256(token)).maybeSingle();
    if (!s || new Date(s.expires_at) < new Date()) return null;
    const { data } = await db().from("work_users").select(USER_COLS).eq("id", s.user_id).maybeSingle();
    u = (data as WorkUser) ?? null;
  }
  if (!u || u.status !== "active") return null;
  return { ...u, menus: await menusOf(u) };
});

async function clientInfo() {
  const h = await headers();
  return { ip: (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || null, ua: h.get("user-agent")?.slice(0, 300) ?? null };
}

const GENERIC = "이름·연락처·PIN을 확인해 주세요.";

// 로그인: 연락처 입력 시 이름+연락처로, 미입력 시 연락처 미등록 직원만 이름으로 찾음
export async function login(nameIn: string, phoneIn: string, pin: string): Promise<{ ok: true; token: string; user: WorkUser } | { ok: false; error: string; status: number }> {
  const name = nameIn.trim(), phone = digits(phoneIn);
  if (!name || !/^\d{6}$/.test(pin)) return { ok: false, error: GENERIC, status: 400 };
  const { ip, ua } = await clientInfo();

  let candidates: (WorkUser & { pin_hash: string | null })[];
  if (!workLive()) {
    candidates = mock.users().filter((u) => u.name === name && (phone ? u.phone === phone : !u.phone)).map((u) => ({ ...u, pin_hash: mock.pinHash(u.id) }));
  } else {
    let q = db().from("work_users").select(USER_COLS + ",pin_hash").eq("name", name).eq("status", "active");
    q = phone ? q.eq("phone", phone) : q.is("phone", null);
    candidates = ((await q).data as unknown as (WorkUser & { pin_hash: string | null })[]) ?? [];
  }
  const log = async (user_id: string | null, ok: boolean, reason: string) => {
    if (workLive()) await db().from("work_login_logs").insert({ user_id, name, phone: phone || null, ok, reason, ip });
  };

  const active = candidates.filter((u) => u.status === "active");
  if (!active.length) { await log(null, false, "no_user"); return { ok: false, error: GENERIC, status: 401 }; }

  const now = new Date();
  const unlocked = active.filter((u) => !u.locked_until || new Date(u.locked_until) <= now);
  const hit = unlocked.find((u) => verifyPin(pin, u.pin_hash));
  if (!hit) {
    if (!unlocked.length) { await log(active[0].id, false, "locked"); return { ok: false, error: `PIN을 ${MAX_FAILS}회 잘못 입력해 잠겼습니다. ${LOCK_MINUTES}분 뒤 다시 시도하거나 대표에게 잠금 해제를 요청하세요.`, status: 423 }; }
    if (unlocked.length === 1 && workLive()) {
      const u = unlocked[0], n = u.failed_count + 1;
      await db().from("work_users").update({ failed_count: n, locked_until: n >= MAX_FAILS ? new Date(now.getTime() + LOCK_MINUTES * 60_000).toISOString() : null }).eq("id", u.id);
      await log(u.id, false, n >= MAX_FAILS ? "pin_locked" : "bad_pin");
      if (n >= MAX_FAILS) return { ok: false, error: `PIN을 ${MAX_FAILS}회 잘못 입력해 ${LOCK_MINUTES}분간 잠겼습니다.`, status: 423 };
      return { ok: false, error: `${GENERIC} (남은 시도 ${MAX_FAILS - n}회)`, status: 401 };
    }
    await log(null, false, "bad_pin");
    return { ok: false, error: GENERIC, status: 401 };
  }

  if (!workLive()) return { ok: true, token: `mock.${hit.id}`, user: hit };
  const token = newToken();
  await db().from("work_sessions").insert({ token_hash: sha256(token), user_id: hit.id, expires_at: new Date(now.getTime() + SESSION_HOURS * 3600_000).toISOString(), ip, user_agent: ua });
  await db().from("work_users").update({ failed_count: 0, locked_until: null, last_login_at: now.toISOString() }).eq("id", hit.id);
  await db().from("work_sessions").delete().lt("expires_at", now.toISOString());
  await log(hit.id, true, "ok");
  return { ok: true, token, user: hit };
}

export async function logout() {
  const token = (await cookies()).get(WORK_COOKIE)?.value;
  if (token && workLive()) await db().from("work_sessions").delete().eq("token_hash", sha256(token));
}

export const sessionCookie = (token: string) => ({
  name: WORK_COOKIE, value: token, httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: SESSION_HOURS * 3600,
});

// API 보호: 로그인 필수 + (선택) 대표 전용 / 특정 메뉴 권한
export async function requireWork(opts: { owner?: boolean; menu?: string } = {}) {
  const me = await getWorkMe();
  if (!me) return { me: null, deny: NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 }) };
  if (opts.owner && !me.is_owner) return { me, deny: NextResponse.json({ error: "대표만 사용할 수 있습니다." }, { status: 403 }) };
  if (opts.menu && !canSee(me, opts.menu)) return { me, deny: NextResponse.json({ error: "이 메뉴 권한이 없습니다." }, { status: 403 }) };
  return { me, deny: null };
}

export { hashPin };
