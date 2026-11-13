import { NextResponse } from "next/server";
import { requireWork } from "@/lib/work/auth";
import { fetchSlipNos, pingLogen, registerToLogen, removeWaybill } from "@/lib/carriers/logen";

// 로젠 송장: register(선택 주문 등록) / slips(송장번호 가져오기) / remove(출력 전 등록 기록 지우기)
export async function POST(req: Request) {
  const { me, deny } = await requireWork({ menu: "waybill" });
  if (deny) return deny;
  const b = await req.json().catch(() => ({}));
  try {
    if (b.action === "register") {
      const keys = Array.isArray(b.keys) ? b.keys.filter((k: unknown) => typeof k === "string").slice(0, 300) : [];
      if (!keys.length) return NextResponse.json({ error: "주문을 선택하세요." }, { status: 400 });
      return NextResponse.json(await registerToLogen(keys, me!.id));
    }
    if (b.action === "ping") { // 대표 전용 연결 확인 (읽기 전용)
      if (!me!.is_owner) return NextResponse.json({ error: "대표만 사용할 수 있습니다." }, { status: 403 });
      return NextResponse.json(await pingLogen(typeof b.custCd === "string" ? b.custCd : undefined));
    }
    if (b.action === "slips") return NextResponse.json(await fetchSlipNos());
    if (b.action === "remove" && typeof b.key === "string") { await removeWaybill(b.key); return NextResponse.json({ ok: true }); }
    return NextResponse.json({ error: "알 수 없는 요청" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
