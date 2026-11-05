import { listConsentDocs } from "@/lib/admin/repo";
export const metadata = { title: "이용약관" };
export default async function Terms() {
  const docs = (await listConsentDocs()).filter((d) => d.code === "terms");
  return <div className="max-w-3xl mx-auto px-4 py-10"><h1 className="text-2xl font-bold mb-6">이용약관</h1>{docs.map((d) => <article key={d.id} className="text-sm leading-7 whitespace-pre-wrap"><p className="text-xs text-neutral-400 mb-2">버전 {d.version} · 시행일 {d.effective_at}</p>{d.body}</article>)}</div>;
}
