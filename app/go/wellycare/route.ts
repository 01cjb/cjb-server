import { NextResponse } from "next/server";
import { getMe } from "@/lib/me";
import { partnerSecret } from "@/lib/partnerSso";
import { digits } from "@/lib/storeLogin";

export const dynamic = "force-dynamic";

// GET /go/wellycare — 뷰티웰 → 웰리케어 이동 (웰리케어 → 뷰티웰과 같은 방식, 방향만 반대)
// 로그인한 회원이면 웰리케어 서버에서 1회용 입장 주소를 받아 그리로 보낸다.
// 웰리케어 쪽 준비가 안 됐거나 실패하면 그냥 웰리케어 주소로 보낸다(그쪽에서 직접 로그인).
//   WELLYCARE_APP_URL    웰리케어 주소 (기본 https://salon.wellycare.kr/)
//   WELLYCARE_TICKET_URL 웰리케어의 입장 주소 발급 API (없으면 자동 로그인 없이 이동)
//   WELLYCARE_SSO_SECRET 양쪽이 같이 쓰는 비밀키
const APP = () => process.env.WELLYCARE_APP_URL || "https://salon.wellycare.kr/";

export async function GET() {
  const app = APP();
  const plain = () => { const r = NextResponse.redirect(app, 303); r.headers.set("cache-control", "no-store"); r.headers.set("referrer-policy", "no-referrer"); return r; };
  const api = process.env.WELLYCARE_TICKET_URL, secret = partnerSecret();
  if (!api || !secret) return plain();
  const me = await getMe();
  const phone = me.mock ? "" : digits(me.user?.phone);
  if (phone.length < 9) return plain();
  try {
    const res = await fetch(api, { method: "POST", cache: "no-store", signal: AbortSignal.timeout(5000), headers: { authorization: `Bearer ${secret}`, "content-type": "application/json" }, body: JSON.stringify({ phone }) });
    const d = (await res.json().catch(() => null)) as { member?: boolean; url?: string } | null;
    if (!res.ok || !d?.url) return plain();
    // 받은 주소가 웰리케어 주소일 때만 이동 (엉뚱한 곳으로 보내지 않게)
    const to = new URL(d.url), home = new URL(app);
    const sameSite = to.protocol === "https:" && (to.hostname === home.hostname || to.hostname.endsWith("." + home.hostname.split(".").slice(-2).join(".")));
    if (!sameSite) return plain();
    const r = NextResponse.redirect(to, 303); r.headers.set("cache-control", "no-store"); r.headers.set("referrer-policy", "no-referrer"); return r;
  } catch { return plain(); }
}
