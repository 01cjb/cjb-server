import { NextResponse } from "next/server";
import { requireWork } from "@/lib/work/auth";
import { buildLogenXlsx, waybillDay } from "@/lib/carriers/logen-excel";

// 날짜별 출고 주문 → 로젠 양식 엑셀 (사방넷 로젠택배 양식과 같은 칸 순서)
export async function GET(req: Request) {
  const { deny } = await requireWork({ menu: "waybill" });
  if (deny) return deny;
  const u = new URL(req.url);
  const date = u.searchParams.get("date") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: "날짜를 선택하세요." }, { status: 400 });
  const ch = (u.searchParams.get("ch") ?? "").split(",").filter(Boolean);
  const list = await waybillDay(date, ch);
  if (!list.length) return NextResponse.json({ error: "그날 출고할 주문이 없습니다." }, { status: 404 });
  const buf = await buildLogenXlsx(list, date);
  const name = `${date.replace(/-/g, "")}_업무시스템_로젠택배양식_${list.length}건.xlsx`;
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": `attachment; filename="logen_${date}.xlsx"; filename*=UTF-8''${encodeURIComponent(name)}`,
      "cache-control": "no-store",
    },
  });
}
