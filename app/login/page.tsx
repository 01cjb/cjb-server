import { Suspense } from "react";
import LoginForm from "@/components/me/LoginForm";
import { getMe } from "@/lib/me";
import { listConsentDocs } from "@/lib/admin/repo";
import { consentDocs as mockDocs } from "@/lib/admin/mock";
import { authEnabled } from "@/lib/auth";

export const metadata = { title: "로그인" };
export default async function Login() {
  const docs = authEnabled() ? await listConsentDocs().catch(() => mockDocs) : mockDocs;
  const me = await getMe();
  // 코드별 최신 버전만 (목록은 코드순·시행일 최신순)
  const latest = docs.filter((d, i) => docs.findIndex((x) => x.code === d.code) === i);
  return <Suspense><LoginForm docs={latest} already={!me.mock && !!me.user} /></Suspense>;
}
