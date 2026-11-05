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
  const latest = Object.values(Object.fromEntries(docs.map((d) => [d.code, d])));
  return <Suspense><LoginForm docs={latest} already={!me.mock && !!me.user} /></Suspense>;
}
