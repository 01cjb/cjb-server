import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/admin/guard";
import { countUsers, createUser } from "@/lib/work/users";

// 첫 대표 계정 만들기: 직원이 0명이고, 쇼핑몰 최고관리자(Supabase 로그인)일 때만
export async function POST(req: Request) {
  const a = await getAdmin();
  if (!a.ok || a.mock) return NextResponse.json({ error: "쇼핑몰 관리자 계정으로 로그인한 상태에서만 만들 수 있습니다." }, { status: 403 });
  if ((await countUsers()) > 0) return NextResponse.json({ error: "이미 직원이 등록되어 있습니다. 대표 계정으로 로그인해 관리하세요." }, { status: 409 });
  const b = await req.json().catch(() => ({}));
  const r = await createUser("", { name: b.name, phone: b.phone, team: "mgmt", position: "대표", is_owner: true, pin: b.pin });
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
