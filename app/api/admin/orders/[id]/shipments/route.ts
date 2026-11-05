import { NextResponse } from "next/server";
import { mockSaved, requireAdminApi } from "@/lib/admin/guard";
import { createServiceClient } from "@/lib/auth";

// POST {carrier_code, tracking_no} — 송장 등록 (집화 상태로 시작 → 주문 '배송중')
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { admin, deny } = await requireAdminApi(); if (deny) return deny;
  const orderId = Number((await params).id);
  const b = await req.json().catch(() => ({}));
  const no = String(b.tracking_no ?? "").replace(/[^0-9A-Za-z]/g, "");
  if (!b.carrier_code || no.length < 8) return NextResponse.json({ error: "택배사와 송장번호(8자리 이상)를 입력하세요." }, { status: 400 });
  if (admin.mock) return mockSaved();
  const db = createServiceClient();
  const { data: s, error } = await db.from("shipments").insert({ order_id: orderId, carrier_code: b.carrier_code, tracking_no: no, status: "ready" }).select("id").single();
  if (error) return NextResponse.json({ error: error.message.includes("shipments_tracking_uq") ? "이미 등록된 송장번호입니다." : error.message }, { status: 400 });
  await db.from("shipments").update({ status: "picked_up" }).eq("id", s.id);
  return NextResponse.json({ ok: true, id: s.id });
}
