import { NextResponse } from "next/server";
import { adminEnabled, createServiceClient } from "@/lib/auth";
import { checkPin, digits, logAttempt, startSession, tooManyFails, validCode, validPin } from "@/lib/storeLogin";

// POST /api/auth/store-login { code, phone, pin } — 원장님 로그인
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const code = digits(b.code), phone = digits(b.phone), pin = digits(b.pin);
  if (!validCode(code) || phone.length < 9 || !validPin(pin)) return NextResponse.json({ error: "매장 코드 8자리, 연락처, PIN 4~6자리를 확인해 주세요." }, { status: 400 });
  if (!adminEnabled()) return NextResponse.json({ ok: true, mock: true });
  if (await tooManyFails(code)) return NextResponse.json({ error: "틀린 시도가 많아 잠시 막혔어요. 15분 뒤에 다시 해 주시거나 고객센터로 연락 주세요." }, { status: 429 });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const { data: p } = await createServiceClient().from("profiles").select("id, email, phone, pin_hash, pin_temp, status").eq("store_code", code).maybeSingle();
  const ok = !!p && digits(p.phone) === phone && checkPin(pin, p.pin_hash) && p.status !== "blocked" && p.status !== "withdrawn";
  await logAttempt(code, ok, ip);
  if (!ok || !p) return NextResponse.json({ error: "매장 코드, 연락처, PIN이 맞지 않아요." }, { status: 401 });
  let email = p.email as string | null;
  if (!email) email = (await createServiceClient().auth.admin.getUserById(p.id)).data.user?.email ?? null;
  if (!email || !(await startSession(email))) return NextResponse.json({ error: "로그인 처리 중 오류가 났어요. 잠시 후 다시 시도해 주세요." }, { status: 500 });
  await createServiceClient().from("profiles").update({ last_login_at: new Date().toISOString() }).eq("id", p.id);
  return NextResponse.json({ ok: true, changePin: !!p.pin_temp });
}
