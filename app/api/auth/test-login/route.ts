import { NextResponse } from "next/server";
import { adminEnabled } from "@/lib/auth";
import { ensureTestUser, startSession, testLoginOn } from "@/lib/storeLogin";

// POST /api/auth/test-login — 오픈 전 테스트 계정으로 바로 로그인 (Vercel 환경변수 TEST_LOGIN=off 로 끔)
export async function POST() {
  if (!testLoginOn()) return NextResponse.json({ error: "테스트 로그인이 꺼져 있어요." }, { status: 404 });
  if (!adminEnabled()) return NextResponse.json({ ok: true, mock: true });
  try {
    const email = await ensureTestUser();
    if (!(await startSession(email))) throw new Error("세션을 만들지 못했습니다.");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
