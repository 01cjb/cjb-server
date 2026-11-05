import "server-only";
import { createClient, createServiceClient } from "./supabase/server";
import type { Grade } from "./pricing";

export const authEnabled = () => !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export const adminEnabled = () => authEnabled() && !!process.env.SUPABASE_SERVICE_ROLE_KEY;

// 로그인 사용자와 등급 (등급은 클라이언트 값이 아닌 DB 값을 신뢰)
export async function currentUser(): Promise<{ id: string | null; grade: Grade }> {
  if (!authEnabled()) return { id: null, grade: "general" };
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { id: null, grade: "general" };
  const { data: prof } = await supabase.from("profiles").select("grade_id").eq("id", data.user.id).maybeSingle();
  return { id: data.user.id, grade: (prof?.grade_id as Grade) ?? "general" };
}

export { createServiceClient };
