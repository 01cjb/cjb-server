import { NextResponse } from "next/server";
import { mockSaved, requireAdminApi } from "@/lib/admin/guard";
import { createServiceClient } from "@/lib/auth";

const FIELDS = ["name", "phone", "grade_id", "status", "memo", "company_name", "business_no", "ceo_name", "biz_type", "biz_item", "biz_address", "tax_email", "salon_name"];

// PATCH — 고객 정보·등급·상태·메모 수정 (role 변경은 admin만)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { admin, deny } = await requireAdminApi(); if (deny) return deny;
  const id = (await params).id;
  const b = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};
  for (const k of FIELDS) if (k in b) patch[k] = b[k] === "" ? null : b[k];
  if ("grade_id" in patch && !["general", "salon", "vip"].includes(String(patch.grade_id))) return NextResponse.json({ error: "등급 값 오류" }, { status: 400 });
  if ("status" in patch && !["active", "dormant", "blocked", "withdrawn"].includes(String(patch.status))) return NextResponse.json({ error: "상태 값 오류" }, { status: 400 });
  if ("role" in b) { if (!["customer", "staff", "admin"].includes(b.role)) return NextResponse.json({ error: "권한 값 오류" }, { status: 400 }); patch.role = b.role; }
  if (!Object.keys(patch).length) return NextResponse.json({ error: "변경할 항목이 없습니다." }, { status: 400 });
  if (admin.mock) return mockSaved();
  const db = createServiceClient();
  if (patch.role && admin.userId) {
    const { data: me } = await db.from("profiles").select("role").eq("id", admin.userId).single();
    if (me?.role !== "admin") return NextResponse.json({ error: "권한 변경은 최고관리자만 가능합니다." }, { status: 403 });
  }
  const { error } = await db.from("profiles").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if ("grade_id" in patch && b.reason) await db.from("grade_history").update({ reason: String(b.reason), actor: admin.userId }).eq("user_id", id).is("reason", null);
  return NextResponse.json({ ok: true });
}
