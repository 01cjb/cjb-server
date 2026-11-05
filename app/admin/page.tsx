import Link from "next/link";
import { dashboard } from "@/lib/admin/repo";
import { ORDER_STATUS, PRODUCT_STATUS } from "@/lib/admin/types";
import Pill from "@/components/admin/Pill";
import { H1, Table } from "@/components/admin/Table";
import { dt, won } from "@/lib/fmt";

export default async function AdminHome() {
  const d = await dashboard();
  const cards = [
    ["오늘 주문", d.todayOrders, "/admin/orders"], ["입금 대기", d.pendingPay, "/admin/orders?s=pending"], ["출고 필요", d.toShip, "/admin/orders?s=paid"],
    ["배송중", d.inTransit, "/admin/shipments"], ["계산서 처리", d.invoicePending, "/admin/invoices?s=pending"], ["미용실 인증 대기", d.salonPending, "/admin/salon"],
  ] as const;
  return (
    <>
      <H1>대시보드</H1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {cards.map(([l, v, h]) => (
          <Link key={l} href={h} className="rounded-xl bg-white border border-neutral-200 p-4 hover:border-brand-300">
            <p className="text-xs text-neutral-500">{l}</p><p className={`text-2xl font-bold tabular-nums mt-1 ${v ? "text-neutral-900" : "text-neutral-300"}`}>{v}</p>
          </Link>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div>
          <h2 className="font-semibold mb-2 text-sm">최근 주문</h2>
          <Table head={["주문번호", "고객", "금액", "상태", "일시"]}>
            {d.recentOrders.map((o) => (
              <tr key={o.id}><td><Link href={`/admin/orders/${o.id}`} className="text-brand-700 font-mono text-xs">{o.order_no}</Link></td><td>{o.customer_name ?? o.receiver_name}</td><td className="tabular-nums">{won(o.total)}</td><td><Pill s={o.status} label={ORDER_STATUS[o.status]} /></td><td className="text-xs text-neutral-500">{dt(o.created_at)}</td></tr>
            ))}
          </Table>
        </div>
        <div className="rounded-xl bg-white border border-neutral-200 p-4 h-fit">
          <p className="text-xs text-neutral-500">누적 매출 (결제 이후)</p>
          <p className="text-2xl font-bold tabular-nums mt-1">{won(d.sales)}</p>
          <p className="text-xs text-neutral-500 mt-5 mb-2">상품 현황</p>
          <ul className="space-y-1.5 text-sm">
            {Object.entries(PRODUCT_STATUS).map(([k, l]) => <li key={k} className="flex justify-between"><Pill s={k} label={l} /><span className="tabular-nums">{d.products[k] ?? 0}</span></li>)}
          </ul>
        </div>
      </div>
    </>
  );
}
