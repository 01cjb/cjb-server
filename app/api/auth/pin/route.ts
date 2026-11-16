import { NextResponse } from "next/server";
import { adminEnabled, createServiceClient } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { digits, hashPin, validPin } from "@/lib/storeLogin";

// POST /api/auth/pin { pin } — 로그인한 원장님이 내 PIN 바꾸기 (임시 PIN → 새 PIN)
export async function POST(req: Request) {
  const pin = digits((await req.json().catch(() => ({}))).pin);
  if (!validPin(pin)) return NextResponse.json({ error: "PIN은 숫자 4~6자리로 정해 주세요." }, { status: 400 });
  if (!adminEnabled()) return NextResponse.json({ ok: true, mock: true });
  const { data } = await (await createClient()).auth.getUser();
  if (!data.user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const { error } = await createServiceClient().from("profiles").update({ pin_hash: hashPin(pin), pin_temp: false, pin_set_at: new Date().toISOString() }).eq("id", data.user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
