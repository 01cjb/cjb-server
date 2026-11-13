import { NextResponse } from "next/server";
import { requireWork } from "@/lib/work/auth";
import { importSabangnetLogen } from "@/lib/carriers/logen-excel";

// 사방넷 「로젠택배 양식」 엑셀 올리기 → 사방넷 주문으로 저장
export async function POST(req: Request) {
  const { deny } = await requireWork({ menu: "waybill" });
  if (deny) return deny;
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const date = String(form?.get("date") ?? "");
  if (!(file instanceof File)) return NextResponse.json({ error: "엑셀 파일을 선택하세요." }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "파일이 너무 큽니다 (10MB 이하)." }, { status: 400 });
  if (!/\.xlsx$/i.test(file.name)) return NextResponse.json({ error: "xlsx 파일만 올릴 수 있습니다." }, { status: 400 });
  try {
    return NextResponse.json(await importSabangnetLogen(await file.arrayBuffer(), date));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
