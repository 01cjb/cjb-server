import { NextResponse } from "next/server";
import { authEnabled } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { bizNoValid } from "@/lib/invoice";

const FIELDS = ["name", "phone", "birth", "salon_name", "company_name", "business_no", "ceo_name", "biz_type", "biz_item", "biz_address", "tax_email"];

// PATCH — 회원정보·사업자정보(계산서용) 수정. 등급/권한은 변경 불가(DB 트리거로 차단)
export async function PATCH(req: Request) {
  const b = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};
  for (const k of FIELDS) if (k in b) patch[k] = String(b[k] ?? "").trim() || null;
  if (patch.business_no && !bizNoValid(String(patch.business_no))) return NextResponse.json({ error: "사업자등록번호가 올바르지 않습니다." }, { status: 400 });
  if (patch.tax_email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(patch.tax_email))) return NextResponse.json({ error: "계산서 수신 이메일 형식을 확인하세요." }, { status: 400 });
  if (!authEnabled()) return NextResponse.json({ ok: true, mock: true });
  const sb = await createClient();
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const { error } = await sb.from("profiles").update(patch).eq("id", u.user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
