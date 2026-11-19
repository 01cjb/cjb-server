import { NextResponse } from "next/server";
import { adminEnabled, createServiceClient } from "@/lib/auth";
import { redeemTicket } from "@/lib/partnerSso";
import { startSession } from "@/lib/storeLogin";

export const dynamic = "force-dynamic";

// GET /api/partner/wellycare/enter?ticket=…  — 웰리케어 앱이 여는 주소. 입장권이 맞으면 로그인시키고 홈으로 보낸다.
// 입장권이 틀리거나 이미 썼거나 2분이 지났으면 로그인 화면으로 보낸다.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const go = (path: string) => {
    const res = NextResponse.redirect(new URL(path, url.origin), 303);
    res.headers.set("cache-control", "no-store");
    res.headers.set("referrer-policy", "no-referrer"); // 입장권이 든 주소가 다른 곳으로 새지 않게
    return res;
  };
  if (!adminEnabled()) return go("/login");
  const userId = await redeemTicket(url.searchParams.get("ticket") ?? "");
  if (!userId) return go("/login?from=wellycare");

  const db = createServiceClient();
  const { data: p } = await db.from("profiles").select("email, status").eq("id", userId).maybeSingle();
  if (!p || p.status === "blocked" || p.status === "withdrawn") return go("/login?from=wellycare");
  const email = (p.email as string | null) ?? (await db.auth.admin.getUserById(userId)).data.user?.email ?? null;
  if (!email || !(await startSession(email))) return go("/login?from=wellycare");
  await db.from("profiles").update({ last_login_at: new Date().toISOString() }).eq("id", userId);
  return go("/");
}
