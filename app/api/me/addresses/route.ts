import { NextResponse } from "next/server";
import { authEnabled } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  if (!b.receiver_name || !b.phone || !b.address1) return NextResponse.json({ error: "받는 분, 연락처, 주소를 입력하세요." }, { status: 400 });
  if (!authEnabled()) return NextResponse.json({ ok: true, mock: true });
  const sb = await createClient();
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  if (b.is_default) await sb.from("customer_addresses").update({ is_default: false }).eq("user_id", u.user.id);
  const { error } = await sb.from("customer_addresses").insert({ user_id: u.user.id, label: b.label || "기본", receiver_name: b.receiver_name, phone: b.phone, zipcode: b.zipcode || null, address1: b.address1, address2: b.address2 || null, is_default: !!b.is_default });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!authEnabled()) return NextResponse.json({ ok: true, mock: true });
  const sb = await createClient();
  const { error } = await sb.from("customer_addresses").delete().eq("id", id); // RLS: 본인 것만
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
