import { NextResponse } from "next/server";
import { mockSaved, requireAdminApi } from "@/lib/admin/guard";
import { createServiceClient } from "@/lib/auth";

const ST = ["ready", "picked_up", "in_transit", "out_for_delivery", "delivered", "returned", "failed"];

// PATCH {status, location?, description?} — 배송 상태 변경 + 추적 이벤트 기록 (주문 상태 자동 동기화)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { admin, deny } = await requireAdminApi(); if (deny) return deny;
  const id = Number((await params).id);
  const b = await req.json().catch(() => ({}));
  if (!ST.includes(b.status)) return NextResponse.json({ error: "배송 상태 값 오류" }, { status: 400 });
  if (admin.mock) return mockSaved();
  const db = createServiceClient();
  const { error } = await db.from("shipments").update({ status: b.status }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (b.location || b.description) await db.from("shipment_events").insert({ shipment_id: id, status: b.status, location: b.location ?? null, description: b.description ?? null });
  return NextResponse.json({ ok: true });
}
