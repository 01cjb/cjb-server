import { NextResponse } from "next/server";
import { authEnabled } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// POST {marketing, ch_email, ch_sms, ch_push} — 마케팅 수신 동의/철회 (이력으로 쌓임)
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  if (!authEnabled()) return NextResponse.json({ ok: true, mock: true });
  const sb = await createClient();
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const { data: doc } = await sb.from("consent_documents").select("id").eq("code", "marketing").order("effective_at", { ascending: false }).limit(1).single();
  if (!doc) return NextResponse.json({ error: "마케팅 약관이 없습니다." }, { status: 500 });
  const agreed = !!b.marketing;
  const { error } = await sb.from("user_consents").insert({
    user_id: u.user.id, document_id: doc.id, agreed,
    channel_email: agreed && !!b.ch_email, channel_sms: agreed && !!b.ch_sms, channel_push: agreed && !!b.ch_push,
    ip: req.headers.get("x-forwarded-for")?.split(",")[0] ?? null, user_agent: req.headers.get("user-agent"),
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await sb.from("profiles").update({ marketing_agree: agreed }).eq("id", u.user.id);
  return NextResponse.json({ ok: true, agreed, at: new Date().toISOString() });
}
