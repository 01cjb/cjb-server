import { listSalonRequests } from "@/lib/admin/repo";
import Pill from "@/components/admin/Pill";
import Act from "@/components/admin/Act";
import { H1, Table } from "@/components/admin/Table";
import { dt } from "@/lib/fmt";
const L: Record<string, string> = { pending: "대기", approved: "승인", rejected: "반려" };
export default async function Salon() {
  const list = await listSalonRequests();
  return (
    <>
      <H1>미용실 회원 인증</H1>
      <Table head={["상호", "대표자", "사업자번호", "연락처", "상태", "신청일", "처리"]} empty={!list.length}>
        {list.map((s) => (
          <tr key={s.id}><td>{s.salon_name}</td><td>{s.owner_name}</td><td className="tabular-nums">{s.business_no}</td><td>{s.phone}</td>
            <td><Pill s={s.status} label={L[s.status]} />{s.memo && <p className="text-[11px] text-neutral-500">{s.memo}</p>}</td><td className="text-xs text-neutral-500">{dt(s.created_at)}</td>
            <td className="space-x-1 whitespace-nowrap">{s.status === "pending" && <><Act url={`/api/admin/salon/${s.id}`} method="PATCH" body={{ status: "approved" }} label="승인" tone="primary" /><Act url={`/api/admin/salon/${s.id}`} method="PATCH" body={{ status: "rejected" }} ask="반려 사유" label="반려" tone="danger" /></>}</td></tr>
        ))}
      </Table>
      <p className="text-xs text-neutral-400 mt-2">승인하면 해당 회원 등급이 자동으로 ‘미용실회원’이 되고 사업자정보가 고객정보에 반영됩니다.</p>
    </>
  );
}
