import { NextResponse } from "next/server";
import { requireWork } from "@/lib/work/auth";
import { listPm } from "@/lib/work/pm";

// PM 지시함 읽기 — 대표 계정만. 화면은 없고, Claude(기술 AI PM)가 예약된 일을 확인할 때 씁니다.
export async function GET(req: Request) {
  const { deny } = await requireWork({ owner: true });
  if (deny) return deny;
  const all = new URL(req.url).searchParams.get("all") === "1";
  return NextResponse.json({ now: new Date().toISOString(), items: await listPm({ openOnly: !all }) }, { headers: { "cache-control": "no-store" } });
}
