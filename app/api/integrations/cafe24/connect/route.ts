import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { getWorkMe } from "@/lib/work/auth";
import { authorizeUrl, cafe24Config } from "@/lib/channels/cafe24";

// 대표만: 카페24 로그인·권한 동의 화면으로 이동
export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  const me = await getWorkMe();
  if (!me) return NextResponse.redirect(`${origin}/work/login?next=/work/m/channels`);
  if (!me.is_owner) return NextResponse.redirect(`${origin}/work/m/channels?error=${encodeURIComponent("대표만 연결할 수 있습니다.")}`);
  if (!cafe24Config()) return NextResponse.redirect(`${origin}/work/m/channels?error=${encodeURIComponent("카페24 앱 정보(환경변수)가 아직 없습니다.")}`);
  const state = randomBytes(16).toString("hex");
  const res = NextResponse.redirect(authorizeUrl(origin, state));
  res.cookies.set({ name: "cjb_c24_state", value: state, httpOnly: true, sameSite: "lax", secure: origin.startsWith("https"), path: "/", maxAge: 600 });
  return res;
}
