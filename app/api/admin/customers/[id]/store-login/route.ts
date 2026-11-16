import { NextResponse } from "next/server";
import { mockSaved, requireAdminApi } from "@/lib/admin/guard";
import { createServiceClient } from "@/lib/auth";
import { hashPin, newPin, newStoreCode } from "@/lib/storeLogin";

// POST — 원장님 매장 코드 발급(없으면) + 임시 PIN 새로 발급. 임시 PIN은 이 응답에서 한 번만 보여줌
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { admin, deny } = await requireAdminApi(); if (deny) return deny;
  const id = (await params).id;
  const pin = newPin();
  if (admin.mock) return mockSaved({ code: "12345678", pin });
  const db = createServiceClient();
  const { data: p } = await db.from("profiles").select("store_code, phone").eq("id", id).maybeSingle();
  if (!p) return NextResponse.json({ error: "고객을 찾을 수 없습니다." }, { status: 404 });
  if (!p.phone) return NextResponse.json({ error: "연락처가 없는 고객이에요. 연락처를 먼저 저장해 주세요." }, { status: 400 });
  const code = p.store_code ?? (await newStoreCode());
  const { error } = await db.from("profiles").update({ store_code: code, pin_hash: hashPin(pin), pin_temp: true, pin_set_at: new Date().toISOString() }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, code, pin });
}
