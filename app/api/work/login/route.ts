import { NextResponse } from "next/server";
import { login, sessionCookie } from "@/lib/work/auth";

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const r = await login(String(b.name ?? ""), String(b.phone ?? ""), String(b.pin ?? ""));
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
  const res = NextResponse.json({ ok: true, name: r.user.name });
  res.cookies.set(sessionCookie(r.token));
  return res;
}
