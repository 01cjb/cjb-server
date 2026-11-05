import { NextResponse } from "next/server";
import { mockSaved, requireAdminApi } from "@/lib/admin/guard";
import { createForOrder, issueById } from "@/lib/admin/invoice-actions";

// POST {issue?: boolean} — 주문 기준 계산서 생성 (+ 즉시 발행)
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { admin, deny } = await requireAdminApi(); if (deny) return deny;
  const b = await req.json().catch(() => ({}));
  if (admin.mock) return mockSaved();
  const c = await createForOrder(Number((await params).id));
  if (!c.ok) return NextResponse.json({ error: c.error }, { status: 400 });
  if (b.issue) { const r = await issueById(c.id!); return NextResponse.json({ ...r, id: c.id }, { status: r.ok ? 200 : 400 }); }
  return NextResponse.json(c);
}
