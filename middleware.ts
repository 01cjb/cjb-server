import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Supabase 로그인 세션 갱신 + 개인/관리자 페이지 보호
export async function middleware(req: NextRequest) {
  // 사내 업무 시스템: 세션 쿠키 없으면 로그인으로 (실제 검증은 서버에서)
  const path = req.nextUrl.pathname;
  if ((path === "/work" || path.startsWith("/work/")) && !path.startsWith("/work/login") && !path.startsWith("/work/setup") && !req.cookies.get("cjb_work")) {
    const to = req.nextUrl.clone(); to.pathname = "/work/login"; to.search = `?next=${encodeURIComponent(path)}`;
    return NextResponse.redirect(to);
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.next(); // 목업 모드
  let res = NextResponse.next({ request: req });
  const sb = createServerClient(url, key, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list) => { list.forEach(({ name, value }) => req.cookies.set(name, value)); res = NextResponse.next({ request: req }); list.forEach(({ name, value, options }) => res.cookies.set(name, value, options)); },
    },
  });
  const { data } = await sb.auth.getUser();
  const p = req.nextUrl.pathname;
  if (!data.user && (p.startsWith("/mypage/") || p.startsWith("/admin"))) {
    const to = req.nextUrl.clone(); to.pathname = "/login"; to.search = `?next=${encodeURIComponent(p)}`;
    return NextResponse.redirect(to);
  }
  return res;
}

export const config = { matcher: ["/((?!_next/static|_next/image|icons|sw.js|manifest.webmanifest|icon.png|apple-icon.png|api/cron).*)"] };
