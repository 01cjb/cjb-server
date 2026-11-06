import { Suspense } from "react";
import { redirect } from "next/navigation";
import SocialConsentForm from "@/components/me/SocialConsentForm";
import { getMe } from "@/lib/me";
import { listConsentDocs } from "@/lib/admin/repo";
import { authEnabled } from "@/lib/auth";

export const metadata = { title: "약관 동의" };
export const dynamic = "force-dynamic";

// 네이버·카카오로 처음 가입한 회원의 약관 동의 + 기본 정보 확인
export default async function SignupConsent() {
  if (!authEnabled()) redirect("/login");
  const me = await getMe();
  if (!me.user) redirect("/login");
  const docs = await listConsentDocs();
  // 코드별 최신 버전만 (목록은 코드순·시행일 최신순)
  const latest = docs.filter((d, i) => docs.findIndex((x) => x.code === d.code) === i);
  return (
    <Suspense>
      <SocialConsentForm docs={latest} name={me.user.name ?? ""} phone={me.user.phone ?? ""} email={me.user.email ?? ""} />
    </Suspense>
  );
}
