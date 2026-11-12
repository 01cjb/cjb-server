import { NextResponse } from "next/server";
import { canSee, requireWork } from "@/lib/work/auth";
import { syncCafe24 } from "@/lib/channels/cafe24";

// 지금 가져오기 (주문 또는 판매채널 메뉴 권한)
export async function POST() {
  const { me, deny } = await requireWork();
  if (deny) return deny;
  if (!canSee(me!, "orders") && !canSee(me!, "channels")) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  const r = await syncCafe24(14);
  return NextResponse.json(r, { status: r.ok ? 200 : 502 });
}
