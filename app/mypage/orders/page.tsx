import Link from "next/link";
import { myOrders } from "@/lib/me";
import { ORDER_STATUS } from "@/lib/admin/types";
import Pill from "@/components/admin/Pill";
import { dt, won } from "@/lib/fmt";

export default async function MyOrders() {
  const orders = await myOrders();
  const total = orders.filter((o) => o.status !== "cancelled" && o.status !== "pending").reduce((a, o) => a + o.total, 0);
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-2 mb-4"><h1 className="text-xl font-bold">구매내역</h1><p className="text-sm text-neutral-500">누적 구매 <b className="text-neutral-900 tabular-nums">{won(total)}</b></p></div>
      <ul className="space-y-3">
        {orders.map((o) => (
          <li key={o.id} className="rounded-xl border border-neutral-200 p-4">
            <div className="flex flex-wrap items-center gap-2 text-sm mb-2"><b>{dt(o.created_at)}</b><span className="font-mono text-xs text-neutral-400">{o.order_no}</span><Pill s={o.status} label={ORDER_STATUS[o.status]} />
              <Link href={`/mypage/orders/${o.order_no}`} className="ml-auto text-sm text-brand-700">상세·배송조회 ›</Link></div>
            <ul className="text-sm text-neutral-700 space-y-0.5">{(o.items ?? []).map((i) => <li key={i.id} className="flex justify-between gap-3"><span className="truncate">{i.product_name}</span><span className="shrink-0 tabular-nums text-neutral-500">{i.qty}개 · {won(i.unit_price * i.qty)}</span></li>)}</ul>
            <p className="text-right text-sm mt-2">결제금액 <b className="tabular-nums">{won(o.total)}</b></p>
          </li>
        ))}
        {!orders.length && <li className="py-16 text-center text-sm text-neutral-400">구매내역이 없습니다.</li>}
      </ul>
    </div>
  );
}
