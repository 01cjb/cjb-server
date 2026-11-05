import { NextResponse } from "next/server";
import { mockSaved, requireAdminApi } from "@/lib/admin/guard";
import { createServiceClient } from "@/lib/auth";

// POST — 대량등록 되돌리기: 해당 배치로 등록된 상품을 '등록취소' 처리
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { admin, deny } = await requireAdminApi(); if (deny) return deny;
  const id = Number((await params).id);
  if (admin.mock) return mockSaved();
  const db = createServiceClient();
  const { error } = await db.from("products").update({ status: "cancelled", cancelled_at: new Date().toISOString(), cancel_reason: `대량등록 #${id} 되돌리기` }).eq("import_batch_id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await db.from("product_import_batches").update({ status: "reverted" }).eq("id", id);
  return NextResponse.json({ ok: true });
}
