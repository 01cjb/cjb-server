import { NextResponse } from "next/server";
import { adminEnabled, authEnabled, createServiceClient, currentUser } from "@/lib/auth";

// POST — 회원이 자기 주문을 취소. 아직 돈이 오가지 않은 「입금대기」 주문만 가능 (결제완료 이후는 환불이 필요해 고객센터에서 처리)
export async function POST(_req: Request, { params }: { params: Promise<{ no: string }> }) {
  const orderNo = decodeURIComponent((await params).no);
  if (!authEnabled() || !adminEnabled()) return NextResponse.json({ ok: true, mock: true, message: "목업 모드: 취소된 것으로 표시됩니다." });
  const user = await currentUser();
  if (!user.id) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const db = createServiceClient();
  const { data: o } = await db.from("orders").select("id,status").eq("order_no", orderNo).eq("user_id", user.id).maybeSingle();
  if (!o) return NextResponse.json({ error: "주문을 찾을 수 없습니다." }, { status: 404 });
  if (o.status === "cancelled") return NextResponse.json({ ok: true, already: true });
  if (o.status !== "pending") return NextResponse.json({ error: "결제가 끝난 주문은 여기서 취소할 수 없습니다. 고객센터로 문의해 주세요." }, { status: 400 });
  // 그 사이 입금 처리됐을 수 있으니 「입금대기」일 때만 바꿈
  const { data: done, error } = await db.from("orders").update({ status: "cancelled" }).eq("id", o.id).eq("status", "pending").select("id");
  if (error) return NextResponse.json({ error: "취소하지 못했습니다. 잠시 뒤 다시 시도해 주세요." }, { status: 500 });
  if (!done?.length) return NextResponse.json({ error: "주문 상태가 바뀌어 취소할 수 없습니다. 새로고침 후 확인해 주세요." }, { status: 409 });
  await db.from("order_status_logs").update({ memo: "고객이 직접 취소 (입금 전)" }).eq("order_id", o.id).eq("to_status", "cancelled").is("memo", null);
  return NextResponse.json({ ok: true });
}
