import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { NAVER_COOKIE, naverAuthorizeUrl, naverEnabled, safeNext } from "@/lib/naver";

// GET /auth/naver?next=/mypage — 네이버 로그인 화면으로 보냄
export async function GET(req: Request) {
  const url = new URL(req.url);
  if (!naverEnabled()) return NextResponse.redirect(new URL("/login?error=naver_off", url.origin));
  const state = randomBytes(16).toString("hex");
  const next = safeNext(url.searchParams.get("next"));
  const res = NextResponse.redirect(naverAuthorizeUrl(state, `${url.origin}/auth/naver/callback`));
  res.cookies.set(NAVER_COOKIE, JSON.stringify({ state, next }), {
    httpOnly: true, secure: url.protocol === "https:", sameSite: "lax", path: "/auth/naver", maxAge: 600,
  });
  return res;
}
