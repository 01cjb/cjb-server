import { listConsentDocs } from "@/lib/admin/repo";
import { company } from "@/lib/company";
export const metadata = { title: "개인정보처리방침" };
export default async function Privacy() {
  const docs = (await listConsentDocs()).filter((d) => ["privacy", "privacy_third", "marketing"].includes(d.code));
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 text-sm leading-7">
      <h1 className="text-2xl font-bold mb-6">개인정보처리방침</h1>
      {docs.map((d) => <section key={d.id} className="mb-6"><h2 className="font-semibold">{d.title.replace(" (선택)", "")}</h2><p className="whitespace-pre-wrap text-neutral-700">{d.body}</p></section>)}
      <section><h2 className="font-semibold">개인정보 보호책임자</h2><p>{company.ceo} · {company.email} · {company.tel}</p></section>
    </div>
  );
}
