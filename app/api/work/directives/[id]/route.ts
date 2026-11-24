import { NextResponse } from "next/server";
import { requireWork } from "@/lib/work/auth";
import { updateDirective } from "@/lib/work/docs";

// 지시 상태·처리 결과 바꾸기
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { me, deny } = await requireWork({ menu: "docs" });
  if (deny) return deny;
  const r = await updateDirective(me!, Number((await params).id), await req.json().catch(() => ({})));
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
