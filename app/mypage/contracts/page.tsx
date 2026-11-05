import { myContracts } from "@/lib/me";
import { CONTRACT_TYPE } from "@/lib/admin/types";
import Pill from "@/components/admin/Pill";
import { won } from "@/lib/fmt";
const ST: Record<string, string> = { draft: "작성중", active: "유효", expired: "만료", terminated: "해지" };
export default async function MyContracts() {
  const list = await myContracts();
  return (
    <div>
      <h1 className="text-xl font-bold mb-4">계약정보</h1>
      <div className="grid gap-3 md:grid-cols-2">
        {list.map((k) => (
          <div key={k.id} className="rounded-xl border border-neutral-200 p-4 text-sm">
            <div className="flex items-center gap-2 mb-3"><b>{CONTRACT_TYPE[k.contract_type]}</b><span className="font-mono text-xs text-neutral-400">{k.contract_no}</span><span className="ml-auto"><Pill s={k.status} label={ST[k.status]} /></span></div>
            <dl className="grid grid-cols-[88px_1fr] gap-y-1.5">
              <dt className="text-neutral-500">업체</dt><dd>{k.company_name}</dd>
              <dt className="text-neutral-500">계약기간</dt><dd>{k.start_date} ~ {k.end_date ?? "무기한"}</dd>
              <dt className="text-neutral-500">추가할인</dt><dd className="tabular-nums">{k.discount_rate}%</dd>
              <dt className="text-neutral-500">결제조건</dt><dd>{k.payment_terms ?? "-"}</dd>
              <dt className="text-neutral-500">외상한도</dt><dd className="tabular-nums">{k.credit_limit ? won(k.credit_limit) : "-"}</dd>
            </dl>
          </div>
        ))}
        {!list.length && <p className="py-16 text-center text-sm text-neutral-400 md:col-span-2">체결된 계약이 없습니다. 대량 구매·대리점 계약은 고객센터로 문의해 주세요.</p>}
      </div>
    </div>
  );
}
