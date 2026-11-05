import { NextResponse } from "next/server";
import { mockSaved, requireAdminApi } from "@/lib/admin/guard";
import { createServiceClient } from "@/lib/auth";
import { pickProduct } from "@/lib/admin/validate";

type Ctx = { params: Promise<{ id: string }> };

// PATCH: 수정 · POST {action: cancel|restore, reason}: 등록취소/복구
export async function PATCH(req: Request, { params }: Ctx) {
  const { admin, deny } = await requireAdminApi(); if (deny) return deny;
  const id = Number((await params).id);
  const r = pickProduct(await req.json().catch(() => ({})), true);
  if (r.errors.length) return NextResponse.json({ error: r.errors.join(", ") }, { status: 400 });
  if (admin.mock) return mockSaved();
  const db = createServiceClient();
  const { data: before } = await db.from("products").select("*").eq("id", id).maybeSingle();
  const { error } = await db.from("products").update(r.data).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await db.from("product_logs").insert({ product_id: id, action: "update", before, after: r.data, actor: admin.userId });
  return NextResponse.json({ ok: true });
}

export async function POST(req: Request, { params }: Ctx) {
  const { admin, deny } = await requireAdminApi(); if (deny) return deny;
  const id = Number((await params).id);
  const b = await req.json().catch(() => ({}));
  if (!["cancel", "restore"].includes(b.action)) return NextResponse.json({ error: "action은 cancel 또는 restore" }, { status: 400 });
  if (b.action === "cancel" && !String(b.reason ?? "").trim()) return NextResponse.json({ error: "취소 사유를 입력하세요" }, { status: 400 });
  if (admin.mock) return mockSaved();
  const db = createServiceClient();
  const patch = b.action === "cancel"
    ? { status: "cancelled", cancelled_at: new Date().toISOString(), cancel_reason: String(b.reason).trim() }
    : { status: b.to && ["active", "hidden", "draft"].includes(b.to) ? b.to : "hidden", cancelled_at: null, cancel_reason: null };
  const { error } = await db.from("products").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await db.from("product_logs").insert({ product_id: id, action: b.action, after: patch, actor: admin.userId });
  return NextResponse.json({ ok: true });
}
