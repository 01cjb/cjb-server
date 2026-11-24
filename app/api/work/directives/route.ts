import { NextResponse } from "next/server";
import { requireWork } from "@/lib/work/auth";
import { createDirective } from "@/lib/work/docs";

// 지시 내리기 (서류 보관함 메뉴 권한이 있는 직원)
export async function POST(req: Request) {
  const { me, deny } = await requireWork({ menu: "docs" });
  if (deny) return deny;
  const r = await createDirective(me!, await req.json().catch(() => ({})));
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
