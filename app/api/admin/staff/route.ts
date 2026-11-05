import { NextResponse } from "next/server";
import { mockSaved, requireAdminApi } from "@/lib/admin/guard";
import { createClient } from "@/lib/supabase/server";

// POST {email, role: customer|staff|admin, is_test?, note?}
// 권한 변경은 DB 함수 set_staff_role 이 처리 (최고관리자만, 마지막 admin 해제 방지, 감사로그)
// ADMIN_EMAIL_DOMAINS="회사도메인.com" 설정 시: 테스트 표시가 없는 관리자는 회사 메일만 허용
export async function POST(req: Request) {
  const { admin, deny } = await requireAdminApi(); if (deny) return deny;
  const b = await req.json().catch(() => ({}));
  const email = String(b.email ?? "").trim().toLowerCase();
  const role = String(b.role ?? "");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.json({ error: "이메일 형식을 확인하세요." }, { status: 400 });
  if (!["customer", "staff", "admin"].includes(role)) return NextResponse.json({ error: "권한 값 오류" }, { status: 400 });

  const domains = (process.env.ADMIN_EMAIL_DOMAINS ?? "").split(",").map((d) => d.trim().toLowerCase()).filter(Boolean);
  if (role !== "customer" && domains.length && !b.is_test && !domains.includes(email.split("@")[1])) {
    return NextResponse.json({ error: `관리자는 회사 메일(${domains.join(", ")})만 지정할 수 있습니다. 개인 계정은 ‘테스트 계정’으로 표시해 주세요.` }, { status: 400 });
  }
  if (admin.mock) return mockSaved();

  // 로그인한 관리자 본인 권한으로 호출 → DB가 최고관리자인지 확인
  const sb = await createClient();
  const { data, error } = await sb.rpc("set_staff_role", { target_email: email, new_role: role, mark_test: typeof b.is_test === "boolean" ? b.is_test : null, note: b.note ?? null });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, ...data, message: `${email} → ${{ customer: "일반회원", staff: "직원", admin: "최고관리자" }[role]}` });
}
