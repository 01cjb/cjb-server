import { NextResponse } from "next/server";
import { syncCafe24 } from "@/lib/channels/cafe24";

// 매일 자동 수집 (Vercel Cron) — 카페24 연결(refresh token 2주 만료)이 끊기지 않게 유지하는 역할도 함
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const r = await syncCafe24(30);
  return NextResponse.json(r);
}
