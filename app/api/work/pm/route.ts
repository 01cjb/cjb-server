import { NextResponse } from "next/server";
import { requireWork } from "@/lib/work/auth";
import { createPm, listPm, todaySlots } from "@/lib/work/pm";

// PM 지시함 읽기 — 대표 계정만. 화면은 없고, Claude(기술 AI PM)가 예약된 일을 확인할 때 씁니다.
export async function GET(req: Request) {
  const { deny } = await requireWork({ owner: true });
  if (deny) return deny;
  const all = new URL(req.url).searchParams.get("all") === "1";
  return NextResponse.json({ now: new Date().toISOString(), todaySlots: todaySlots(), items: await listPm({ openOnly: !all }) }, { headers: { "cache-control": "no-store" } });
}

// 정산 진행 기록 만들기 — 대표 계정만
export async function POST(req: Request) {
  const { deny } = await requireWork({ owner: true });
  if (deny) return deny;
  const b = await req.json().catch(() => ({}));
  const r = await createPm({ title: String(b.title ?? ""), status: typeof b.status === "string" ? b.status : undefined, result: typeof b.result === "string" ? b.result : undefined });
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
  return NextResponse.json({ ok: true, id: r.id });
}
