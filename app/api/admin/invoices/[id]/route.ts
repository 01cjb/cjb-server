import { NextResponse } from "next/server";
import { mockSaved, requireAdminApi } from "@/lib/admin/guard";
import { createServiceClient } from "@/lib/auth";
import { issueById } from "@/lib/admin/invoice-actions";

// POST {action: issue|cancel}
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { admin, deny } = await requireAdminApi(); if (deny) return deny;
  const id = Number((await params).id);
  const b = await req.json().catch(() => ({}));
  if (!["issue", "cancel"].includes(b.action)) return NextResponse.json({ error: "action은 issue 또는 cancel" }, { status: 400 });
  if (admin.mock) return mockSaved({ confirmNo: "MOCK-PREVIEW" });
  if (b.action === "issue") { const r = await issueById(id); return NextResponse.json(r, { status: r.ok ? 200 : 400 }); }
  const { error } = await createServiceClient().from("tax_invoices").update({ status: "cancelled" }).eq("id", id).in("status", ["pending", "failed", "issued"]);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, note: "발행완료 건은 국세청 수정세금계산서(취소) 발행이 별도로 필요합니다." });
}
