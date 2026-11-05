import "server-only";
import { NextResponse } from "next/server";
import { adminEnabled, authEnabled } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// 관리자 확인: DB 연결 시 profiles.role(staff/admin)만 허용, 목업 모드는 데모 허용(저장 안 됨)
export async function getAdmin(): Promise<{ ok: boolean; mock: boolean; userId: string | null; reason?: string }> {
  if (!adminEnabled()) return { ok: true, mock: true, userId: null };
  if (!authEnabled()) return { ok: false, mock: false, userId: null, reason: "auth disabled" };
  const sb = await createClient();
  const { data } = await sb.auth.getUser();
  if (!data.user) return { ok: false, mock: false, userId: null, reason: "login required" };
  const { data: p } = await sb.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  const ok = p?.role === "admin" || p?.role === "staff";
  return { ok, mock: false, userId: data.user.id, reason: ok ? undefined : "admin only" };
}

export async function requireAdminApi() {
  const a = await getAdmin();
  if (!a.ok) return { admin: a, deny: NextResponse.json({ error: a.reason === "login required" ? "로그인이 필요합니다." : "관리자만 사용할 수 있습니다." }, { status: a.reason === "login required" ? 401 : 403 }) };
  return { admin: a, deny: null };
}

export const mockSaved = (extra: Record<string, unknown> = {}) => NextResponse.json({ ok: true, mock: true, message: "목업 모드: 화면 동작만 확인되며 저장되지 않습니다.", ...extra });
