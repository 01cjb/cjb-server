import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getWorkMe } from "@/lib/work/auth";
import { exchangeCode, syncCafe24 } from "@/lib/channels/cafe24";

// 카페24 동의 후 돌아오는 곳: 토큰 저장 → 최근 90일 주문 첫 수집
export async function GET(req: Request) {
  const url = new URL(req.url), origin = url.origin;
  const back = (q: string) => { const r = NextResponse.redirect(`${origin}/work/m/channels?${q}`); r.cookies.set({ name: "cjb_c24_state", value: "", path: "/", maxAge: 0 }); return r; };
  const err = url.searchParams.get("error");
  if (err) return back(`error=${encodeURIComponent("카페24에서 연결을 취소했거나 거부했습니다: " + err)}`);
  const code = url.searchParams.get("code"), state = url.searchParams.get("state");
  const saved = (await cookies()).get("cjb_c24_state")?.value;
  if (!code || !state || state !== saved) return back(`error=${encodeURIComponent("연결 요청이 만료되었거나 올바르지 않습니다. 다시 시도해 주세요.")}`);
  const me = await getWorkMe();
  if (!me?.is_owner) return back(`error=${encodeURIComponent("대표 계정으로 로그인한 상태에서 연결해 주세요.")}`);
  try {
    await exchangeCode(origin, code, me.id);
  } catch (e) {
    return back(`error=${encodeURIComponent((e as Error).message)}`);
  }
  const s = await syncCafe24(90);
  return back(s.ok ? `connected=1&count=${s.count}` : `connected=1&error=${encodeURIComponent(s.error ?? "첫 수집 실패")}`);
}
