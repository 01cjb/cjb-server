import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminEnabled, createServiceClient } from "@/lib/auth";
import { needsConsent } from "@/lib/consent";

// 이메일 인증·비밀번호 재설정·카카오 로그인(Supabase OAuth) 후 돌아오는 곳
export async function GET(req: Request) {
  const url = new URL(req.url);
  const next = url.searchParams.get("next");
  const dest = next && next.startsWith("/") && !next.startsWith("//") ? next : "/mypage";
  const fail = (code: string) => NextResponse.redirect(new URL(`/login?error=${code}`, url.origin));

  // 카카오에서 동의 취소 등으로 돌아온 경우
  if (url.searchParams.get("error")) return fail(url.searchParams.get("error") === "access_denied" ? "social_cancel" : "auth_fail");

  const code = url.searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL(dest, url.origin));
  const sb = await createClient();
  const { data, error } = await sb.auth.exchangeCodeForSession(code);
  if (error || !data.user) return fail("auth_fail");

  // 카카오로 처음 가입했거나 필수 약관 동의가 없으면 약관 동의 화면으로
  if (adminEnabled() && (await needsConsent(createServiceClient(), data.user.id)))
    return NextResponse.redirect(new URL(`/signup/consent?next=${encodeURIComponent(dest)}`, url.origin));
  return NextResponse.redirect(new URL(dest, url.origin));
}
