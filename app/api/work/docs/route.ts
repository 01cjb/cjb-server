import { NextResponse } from "next/server";
import { requireWork } from "@/lib/work/auth";
import { createDoc } from "@/lib/work/docs";

// 서류 올리기 (제목 + 설명·링크·파일 중 필요한 것)
export async function POST(req: Request) {
  const { me, deny } = await requireWork({ menu: "docs" });
  if (deny) return deny;
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "입력값을 읽지 못했습니다." }, { status: 400 });
  const file = form.get("file");
  const r = await createDoc(me!, {
    box: String(form.get("box") ?? ""), title: String(form.get("title") ?? ""), body: String(form.get("body") ?? ""),
    link_url: String(form.get("link_url") ?? ""), file: file instanceof File ? file : null,
  });
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
