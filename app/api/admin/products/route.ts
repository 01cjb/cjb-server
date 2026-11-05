import { NextResponse } from "next/server";
import { mockSaved, requireAdminApi } from "@/lib/admin/guard";
import { createServiceClient } from "@/lib/auth";
import { pickProduct } from "@/lib/admin/validate";

// POST /api/admin/products — 상품 등록
export async function POST(req: Request) {
  const { admin, deny } = await requireAdminApi(); if (deny) return deny;
  const r = pickProduct(await req.json().catch(() => ({})));
  if (r.errors.length) return NextResponse.json({ error: r.errors.join(", ") }, { status: 400 });
  if (admin.mock) return mockSaved({ id: 999 });
  const db = createServiceClient();
  const { data, error } = await db.from("products").insert(r.data).select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await db.from("product_logs").insert({ product_id: data.id, action: "create", after: r.data, actor: admin.userId });
  return NextResponse.json({ ok: true, id: data.id });
}
