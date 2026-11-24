import { NextResponse } from "next/server";
import { requireWork } from "@/lib/work/auth";
import { deleteDoc, docFileUrl } from "@/lib/work/docs";

// GET: 파일 내려받기 (1분짜리 주소로 이동) / DELETE: 서류 지우기
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { me, deny } = await requireWork({ menu: "docs" });
  if (deny) return deny;
  const url = await docFileUrl(me!, Number((await params).id));
  if (!url) return NextResponse.json({ error: "파일을 찾을 수 없습니다." }, { status: 404 });
  return NextResponse.redirect(url);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { me, deny } = await requireWork({ menu: "docs" });
  if (deny) return deny;
  const r = await deleteDoc(me!, Number((await params).id));
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
