import Link from "next/link";
import { listInvoices } from "@/lib/admin/repo";
import { INVOICE_STATUS } from "@/lib/admin/types";
import Pill from "@/components/admin/Pill";
import Act from "@/components/admin/Act";
import { H1, Table, Tabs } from "@/components/admin/Table";
import { won } from "@/lib/fmt";

export default async function Invoices({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  const { s = "all" } = await searchParams;
  const all = await listInvoices();
  const list = s === "all" ? all : all.filter((i) => i.status === s);
  const tabs = [{ key: "all", label: "전체" }, ...Object.entries(INVOICE_STATUS).map(([key, label]) => ({ key, label }))]
    .map((t) => ({ ...t, href: `/admin/invoices?s=${t.key}`, count: t.key === "all" ? all.length : all.filter((i) => i.status === t.key).length }));
  return (
    <>
      <H1>세금계산서</H1>
      <div className="rounded-xl bg-brand-50 text-sm p-4 mb-4 space-y-1">
        <p><b>자동발행 흐름</b>: 고객이 주문 시 ‘계산서 발행 요청’ → 결제완료 처리 → DB가 발행대기 계산서 자동 생성 → 매일 오전 10시 자동발행(또는 아래 ‘발행’ 버튼).</p>
        <p className="text-xs text-neutral-500">실제 국세청 전송은 팝빌/바로빌 등 발행대행 계약 후 API 키를 서버 환경변수(INVOICE_PROVIDER 등)에 넣으면 연결됩니다. 현재는 모의발행(mock)입니다.</p>
      </div>
      <Tabs items={tabs} cur={s} />
      <Table head={["계산서번호", "주문", "공급받는자", "사업자번호", "공급가액", "세액", "합계", "상태", ""]} empty={!list.length}>
        {list.map((i) => (
          <tr key={i.id}>
            <td><Link href={`/admin/invoices/${i.id}`} className="font-mono text-xs text-brand-700">{i.invoice_no}</Link></td>
            <td>{i.order_id && <Link href={`/admin/orders/${i.order_id}`} className="font-mono text-xs underline">{i.order_no}</Link>}</td>
            <td>{i.buyer_company}</td><td className="tabular-nums text-xs">{i.buyer_biz_no}</td>
            <td className="tabular-nums">{won(i.supply_amount)}</td><td className="tabular-nums">{won(i.vat_amount)}</td><td className="tabular-nums font-medium">{won(i.total_amount)}</td>
            <td><Pill s={i.status} label={INVOICE_STATUS[i.status]} />{i.error && <p className="text-[11px] text-rose-600">{i.error}</p>}</td>
            <td className="whitespace-nowrap space-x-1">{["pending", "failed"].includes(i.status) && <Act url={`/api/admin/invoices/${i.id}`} body={{ action: "issue" }} label="발행" tone="primary" />}
              {i.status !== "cancelled" && <Act url={`/api/admin/invoices/${i.id}`} body={{ action: "cancel" }} ask="취소 사유" label="취소" tone="danger" />}</td>
          </tr>
        ))}
      </Table>
    </>
  );
}
