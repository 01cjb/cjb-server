import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

// 필수 약관(이용약관·개인정보·만14세 등) 중 아직 동의하지 않은 것이 있는지
// 소셜 로그인으로 처음 들어온 회원은 가입 화면의 약관 동의를 거치지 않으므로 별도 확인
export async function needsConsent(db: SupabaseClient, userId: string): Promise<boolean> {
  const [{ data: docs }, { data: given }] = await Promise.all([
    db.from("consent_documents").select("code").eq("required", true),
    db.from("user_consent_current").select("code, agreed").eq("user_id", userId),
  ]);
  const required = new Set((docs ?? []).map((d: { code: string }) => d.code));
  const agreed = new Set((given ?? []).filter((g: { agreed: boolean }) => g.agreed).map((g: { code: string }) => g.code));
  return [...required].some((c) => !agreed.has(c));
}
