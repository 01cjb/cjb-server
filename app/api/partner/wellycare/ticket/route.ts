import { NextResponse } from "next/server";
import { adminEnabled } from "@/lib/auth";
import { findMemberByPhone, issueTicket, partnerSecret, secretOk, TICKET_SECONDS } from "@/lib/partnerSso";

export const dynamic = "force-dynamic";

// POST /api/partner/wellycare/ticket   (웰리케어 "서버"에서만 호출 — 앱·브라우저에서 직접 부르지 말 것)
//   헤더  Authorization: Bearer <비밀키>
//   본문  { "phone": "01012345678" }
//   응답  { member: true,  url: "https://…/api/partner/wellycare/enter?ticket=…", expires_in: 120 }
//         { member: false, url: "https://…/login", reason: "not_member" | "duplicate" }
export async function POST(req: Request) {
  if (!partnerSecret()) return NextResponse.json({ error: "연동이 아직 켜지지 않았습니다. (WELLYCARE_SSO_SECRET 미설정)" }, { status: 503 });
  const auth = req.headers.get("authorization") ?? "";
  if (!secretOk(auth.startsWith("Bearer ") ? auth.slice(7).trim() : null)) return NextResponse.json({ error: "인증 실패" }, { status: 401 });
  if (!adminEnabled()) return NextResponse.json({ error: "DB가 연결되지 않았습니다." }, { status: 503 });

  const b = await req.json().catch(() => ({}));
  const origin = new URL(req.url).origin;
  const m = await findMemberByPhone(b?.phone);
  if (m.status === "bad_phone") return NextResponse.json({ error: "phone(연락처)을 확인해 주세요." }, { status: 400 });
  if (m.status !== "ok") return NextResponse.json({ member: false, reason: m.status, url: `${origin}/login` });

  const token = await issueTicket(m.userId);
  if (!token) return NextResponse.json({ error: "입장권을 만들지 못했습니다. 잠시 후 다시 시도해 주세요." }, { status: 500 });
  return NextResponse.json({ member: true, url: `${origin}/api/partner/wellycare/enter?ticket=${token}`, expires_in: TICKET_SECONDS }, { headers: { "cache-control": "no-store" } });
}
