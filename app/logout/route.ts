import { NextResponse } from "next/server";
import { authEnabled } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
export async function GET(req: Request) {
  if (authEnabled()) await (await createClient()).auth.signOut();
  return NextResponse.redirect(new URL("/", req.url));
}
