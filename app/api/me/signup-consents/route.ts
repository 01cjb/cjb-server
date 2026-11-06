import { NextResponse } from "next/server";
import { authEnabled } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// POST {name, phone, consents:{code:boolean}, ch_email, ch_sms, ch_push}
// 소셜 로그인으로 가입한 회원의 약관 동의 저장 (이력으로 쌓임)
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  if (!authEnabled()) return NextResponse.json({ ok: true, mock: true });
  const sb = await createClient();
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const name = String(b.name ?? "").trim(), phone = String(b.phone ?? "").trim();
  if (!name || !phone) return NextResponse.json({ error: "이름과 휴대폰 번호를 입력해 주세요." }, { status: 400 });
  const c: Record<string, unknown> = b.consents ?? {};

  const { data: docs } = await sb.from("consent_documents").select("id, code, required, effective_at").order("effective_at", { ascending: false }).order("id", { ascending: false });
  const latest = (docs ?? []).filter((d, i, a) => a.findIndex((x) => x.code === d.code) === i);
  if (latest.some((d) => d.required && c[d.code] !== true)) return NextResponse.json({ error: "필수 약관에 동의해 주세요." }, { status: 400 });

  const marketing = c.marketing === true;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? null, ua = req.headers.get("user-agent");
  const { error } = await sb.from("user_consents").insert(latest.map((d) => ({
    user_id: u.user!.id, document_id: d.id, agreed: c[d.code] === true,
    channel_email: d.code === "marketing" ? marketing && !!b.ch_email : null,
    channel_sms: d.code === "marketing" ? marketing && !!b.ch_sms : null,
    channel_push: d.code === "marketing" ? marketing && !!b.ch_push : null,
    ip, user_agent: ua,
  })));
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const { error: e2 } = await sb.from("profiles").update({ name, phone, marketing_agree: marketing }).eq("id", u.user.id);
  if (e2) return NextResponse.json({ error: e2.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
