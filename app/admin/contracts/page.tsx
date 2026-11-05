import { listContracts, listCustomers } from "@/lib/admin/repo";
import { CONTRACT_TYPE } from "@/lib/admin/types";
import ContractForm from "@/components/admin/ContractForm";
import Pill from "@/components/admin/Pill";
import Act from "@/components/admin/Act";
import { H1, Table } from "@/components/admin/Table";
import { won } from "@/lib/fmt";
const ST: Record<string, string> = { draft: "작성중", active: "유효", expired: "만료", terminated: "해지" };

export default async function Contracts() {
  const [list, customers] = await Promise.all([listContracts(), listCustomers()]);
  const soon = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
  return (
    <div className="space-y-6">
      <H1>계약정보</H1>
      <ContractForm customers={customers.filter((c) => c.role === "customer").map((c) => ({ id: c.id, name: c.name, company_name: c.company_name }))} />
      <Table head={["계약번호", "업체", "유형", "기간", "할인", "외상한도", "결제조건", "상태", ""]} empty={!list.length}>
        {list.map((k) => (
          <tr key={k.id}>
            <td className="font-mono text-xs">{k.contract_no}</td><td>{k.company_name}</td><td>{CONTRACT_TYPE[k.contract_type]}</td>
            <td className="text-xs whitespace-nowrap">{k.start_date} ~ {k.end_date ?? "무기한"}{k.status === "active" && k.end_date && k.end_date <= soon && <div className="text-amber-600">만료 임박</div>}</td>
            <td className="tabular-nums">{k.discount_rate}%</td><td className="tabular-nums whitespace-nowrap">{k.credit_limit ? won(k.credit_limit) : "-"}</td>
            <td className="text-xs max-w-[12rem]">{k.payment_terms ?? "-"}</td><td><Pill s={k.status} label={ST[k.status]} /></td>
            <td>{k.status === "active" && <Act url={`/api/admin/contracts/${k.id}`} method="PATCH" body={{ status: "terminated" }} ask="해지 사유(메모)" label="해지" tone="danger" />}</td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
