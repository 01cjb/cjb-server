import { NextResponse } from "next/server";
import { requireWork } from "@/lib/work/auth";
import { setMenuOrder } from "@/lib/work/prefs";

// 내 왼쪽 메뉴 순서 저장 (본인 것만)
export async function PUT(req: Request) {
  const { me, deny } = await requireWork();
  if (deny) return deny;
  const b = await req.json().catch(() => ({}));
  const r = await setMenuOrder(me!.id, b.order);
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
