import { consentStats, listConsentDocs } from "@/lib/admin/repo";
import Pill from "@/components/admin/Pill";
import { H1, Table } from "@/components/admin/Table";
export default async function Consents() {
  const [docs, stats] = await Promise.all([listConsentDocs(), consentStats()]);
  return (
    <div className="space-y-6">
      <H1>약관 · 개인정보 · 마케팅 동의</H1>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {stats.map((s) => { const d = docs.find((x) => x.code === s.code); const pct = s.total ? Math.round((s.agreed / s.total) * 100) : 0; return (
          <div key={s.code} className="rounded-xl bg-white border border-neutral-200 p-4"><p className="text-xs text-neutral-500 line-clamp-1">{d?.title ?? s.code}</p>
            <p className="text-2xl font-bold tabular-nums mt-1">{pct}%</p><p className="text-xs text-neutral-400 tabular-nums">{s.agreed} / {s.total}명</p></div>); })}
      </div>
      <Table head={["코드", "제목", "버전", "필수", "시행일", "내용"]}>
        {docs.map((d) => <tr key={d.id}><td className="font-mono text-xs">{d.code}</td><td>{d.title}</td><td>{d.version}</td><td>{d.required ? <Pill s="active" label="필수" /> : <Pill s="hidden" label="선택" />}</td><td className="text-xs">{d.effective_at}</td><td className="text-xs text-neutral-500 max-w-md">{d.body}</td></tr>)}
      </Table>
      <ul className="text-xs text-neutral-500 list-disc pl-5 space-y-1">
        <li>동의·철회는 덮어쓰지 않고 이력(user_consents)으로 쌓여 일시·IP·기기 정보가 남습니다.</li>
        <li>약관 개정 시 새 버전을 추가하면 기존 회원에게 재동의 안내를 띄울 수 있습니다 (추가 선택사항).</li>
        <li>마케팅 수신 동의자는 정보통신망법에 따라 2년마다 수신동의 여부 확인 안내가 필요합니다.</li>
      </ul>
    </div>
  );
}
