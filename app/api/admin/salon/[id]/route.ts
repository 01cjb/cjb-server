import { NextResponse } from "next/server";
import { mockSaved, requireAdminApi } from "@/lib/admin/guard";
import { createServiceClient } from "@/lib/auth";

// PATCH {status: approved|rejected, memo} — 승인 시 DB 트리거가 고객 등급을 미용실회원으로 변경
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { admin, deny } = await requireAdminApi(); if (deny) return deny;
  const b = await req.json().catch(() => ({}));
  if (!["approved", "rejected"].includes(b.status)) return NextResponse.json({ error: "status 오류" }, { status: 400 });
  if (b.status === "rejected" && !b.memo) return NextResponse.json({ error: "반려 사유를 입력하세요" }, { status: 400 });
  if (admin.mock) return mockSaved();
  const { error } = await createServiceClient().from("salon_verifications").update({ status: b.status, memo: b.memo ?? null }).eq("id", Number((await params).id));
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
