import { NextResponse } from "next/server";
import { mockSaved, requireAdminApi } from "@/lib/admin/guard";
import { createServiceClient } from "@/lib/auth";

const NEXT: Record<string, string[]> = {
  pending: ["paid", "cancelled"], paid: ["preparing", "cancelled"], preparing: ["shipped", "cancelled"],
  shipped: ["delivered"], delivered: [], cancelled: [],
};

// PATCH {status, memo} — 주문 상태 변경 (결제완료 시 계산서 요청 주문은 DB 트리거가 계산서 생성)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { admin, deny } = await requireAdminApi(); if (deny) return deny;
  const id = Number((await params).id);
  const b = await req.json().catch(() => ({}));
  if (admin.mock) return mockSaved();
  const db = createServiceClient();
  const { data: o } = await db.from("orders").select("status").eq("id", id).single();
  if (!o) return NextResponse.json({ error: "주문 없음" }, { status: 404 });
  if (!NEXT[o.status]?.includes(b.status)) return NextResponse.json({ error: `'${o.status}' 에서 '${b.status}' 로 바꿀 수 없습니다.` }, { status: 400 });
  const { error } = await db.from("orders").update({ status: b.status }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (b.memo) await db.from("order_status_logs").update({ memo: String(b.memo) }).eq("order_id", id).eq("to_status", b.status).is("memo", null);
  return NextResponse.json({ ok: true });
}
