import Link from "next/link";
import { myInvoices } from "@/lib/me";
import { INVOICE_STATUS } from "@/lib/admin/types";
import Pill from "@/components/admin/Pill";
import { won } from "@/lib/fmt";
export default async function MyInvoices() {
  const list = await myInvoices();
  return (
    <div>
      <h1 className="text-xl font-bold mb-1">세금계산서</h1>
      <p className="text-sm text-neutral-500 mb-4">구매내역 › 주문상세에서 발행을 요청하거나, 주문 시 ‘세금계산서 발행 요청’을 선택하면 결제완료 후 자동 발행됩니다.</p>
      <ul className="divide-y divide-neutral-200 border-y border-neutral-200">
        {list.map((i) => (
          <li key={i.id}><Link href={`/mypage/invoices/${i.id}`} className="flex flex-wrap items-center gap-3 py-3 text-sm">
            <span className="font-mono text-xs">{i.invoice_no}</span><span className="text-neutral-500">{i.issue_date}</span><span className="text-xs text-neutral-400">주문 {i.order_no}</span>
            <span className="ml-auto tabular-nums">공급가 {won(i.supply_amount)} · 세액 {won(i.vat_amount)}</span><b className="tabular-nums">{won(i.total_amount)}</b><Pill s={i.status} label={INVOICE_STATUS[i.status]} /></Link></li>
        ))}
        {!list.length && <li className="py-16 text-center text-sm text-neutral-400">발행된 세금계산서가 없습니다.</li>}
      </ul>
    </div>
  );
}
