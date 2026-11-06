import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NAVER_COOKIE, naverEnabled, naverProfile, naverToken, safeNext } from "@/lib/naver";
import { needsConsent } from "@/lib/consent";

// GET /auth/naver/callback — 네이버 인증 후 돌아오는 곳
//  1) state 검증 → 2) 토큰·프로필 조회 → 3) 회원 찾기/생성 → 4) 뷰티웰 로그인 세션 발급
export async function GET(req: Request) {
  const url = new URL(req.url);
  const jar = await cookies();
  const fail = (code: string) => {
    jar.delete({ name: NAVER_COOKIE, path: "/auth/naver" });
    return NextResponse.redirect(new URL(`/login?error=${code}`, url.origin));
  };
  if (!naverEnabled()) return fail("naver_off");
  if (url.searchParams.get("error")) return fail("naver_cancel");

  let saved: { state?: string; next?: string } = {};
  try { saved = JSON.parse(jar.get(NAVER_COOKIE)?.value ?? "{}"); } catch { /* 무시 */ }
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  if (!code || !state || saved.state !== state) return fail("naver_state");

  const token = await naverToken(code, state);
  const profile = token ? await naverProfile(token) : null;
  if (!profile) return fail("naver_profile");

  const admin = createServiceClient();
  const now = new Date().toISOString();

  // 이미 연결된 네이버 계정인지
  const { data: link } = await admin.from("social_accounts").select("user_id").eq("provider", "naver").eq("provider_uid", profile.id).maybeSingle();
  let userId: string | null = link?.user_id ?? null;
  let email: string | null = null;
  let isNew = false;

  if (userId) {
    const { data } = await admin.auth.admin.getUserById(userId);
    email = data.user?.email ?? null;
    if (!email) return fail("naver_profile");
  } else {
    email = profile.email?.trim().toLowerCase() || null;
    if (!email) return fail("naver_email");
    // 같은 이메일로 이미 가입된 회원은 자동으로 합치지 않음 (다른 사람이 계정을 가로채는 것 방지)
    const { data: exist } = await admin.from("profiles").select("id").eq("email", email).maybeSingle();
    if (exist) return fail("naver_exists");
    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { name: profile.name ?? profile.nickname ?? "", phone: profile.mobile ?? null, signup_provider: "naver" },
      app_metadata: { provider: "naver", providers: ["naver"] },
    });
    if (error || !created.user) return fail(error?.message?.includes("already") ? "naver_exists" : "naver_create");
    userId = created.user.id;
    isNew = true;
    await admin.from("social_accounts").insert({ provider: "naver", provider_uid: profile.id, user_id: userId, email });
  }

  // 뷰티웰 로그인 세션 발급 (서버에서 1회용 로그인 링크를 만들어 바로 사용 — 메일 발송 없음)
  const { data: magic, error: linkErr } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (linkErr || !magic.properties?.hashed_token) return fail("naver_session");
  const sb = await createClient();
  const { error: otpErr } = await sb.auth.verifyOtp({ type: "email", token_hash: magic.properties.hashed_token });
  if (otpErr) return fail("naver_session");

  await Promise.all([
    admin.from("social_accounts").update({ last_login_at: now }).eq("provider", "naver").eq("provider_uid", profile.id),
    admin.from("profiles").update({ last_login_at: now }).eq("id", userId),
  ]);

  jar.delete({ name: NAVER_COOKIE, path: "/auth/naver" });
  const next = safeNext(saved.next);
  // 처음 가입했거나 필수 약관 동의가 없으면 약관 동의 화면으로
  const dest = isNew || (await needsConsent(admin, userId)) ? `/signup/consent?next=${encodeURIComponent(next)}` : next;
  return NextResponse.redirect(new URL(dest, url.origin));
}
