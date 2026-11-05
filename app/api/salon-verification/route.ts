import { NextResponse } from "next/server";
import { adminEnabled, createServiceClient, currentUser } from "@/lib/auth";

// POST /api/salon-verification — 미용실회원 인증 신청 (관리자 승인 시 profiles.grade_id='salon')
export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  const need = ["salon_name", "owner_name", "business_no", "phone"] as const;
  if (!b || need.some((k) => !String(b[k] ?? "").trim())) return NextResponse.json({ error: "필수 항목을 입력해 주세요." }, { status: 400 });
  if (!/^\d{3}-?\d{2}-?\d{5}$/.test(String(b.business_no))) return NextResponse.json({ error: "사업자등록번호 형식을 확인해 주세요." }, { status: 400 });

  if (!adminEnabled()) return NextResponse.json({ mock: true, status: "pending" });
  const user = await currentUser();
  const { error } = await createServiceClient().from("salon_verifications").insert({
    user_id: user.id, salon_name: b.salon_name, owner_name: b.owner_name, business_no: b.business_no, phone: b.phone,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ status: "pending" });
}
