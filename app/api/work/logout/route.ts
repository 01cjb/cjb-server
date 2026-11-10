import { NextResponse } from "next/server";
import { logout, WORK_COOKIE } from "@/lib/work/auth";

export async function POST() {
  await logout();
  const res = NextResponse.json({ ok: true });
  res.cookies.set({ name: WORK_COOKIE, value: "", path: "/", maxAge: 0 });
  return res;
}
