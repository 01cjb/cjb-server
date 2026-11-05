import Link from "next/link";
import { notFound } from "next/navigation";
import { myOrder } from "@/lib/me";
import { INVOICE_STATUS, ORDER_STATUS, SHIP_STATUS } from "@/lib/admin/types";
import Pill from "@/components/admin/Pill";
import Timeline from "@/components/Timeline";
import RequestInvoice from "@/components/me/RequestInvoice";
import { dt, trackUrl, won } from "@/lib/fmt";

const STEPS = ["paid", "preparing", "shipped", "delivered"] as const;

export default async function MyOrderDetail({ params }: { params: Promise<{ no: string }> }) {
  const { order: o, shipments, invoice, carriers } = await myOrder((await params).no);
  if (!o) notFound();
  const step = STEPS.indexOf(o.status as (typeof STEPS)[number]);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2"><h1 className="text-xl font-bold">주문상세</h1><span className="font-mono text-sm text-neutral-400">{o.order_no}</span><Pill s={o.status} label={ORDER_STATUS[o.status]} /></div>
      {o.status !== "cancelled" && o.status !== "pending" && (
        <ol className="grid grid-cols-4 text-center text-xs">
          {STEPS.map((s, i) => <li key={s} className={`border-t-4 pt-2 ${i <= step ? "border-brand-600 text-brand-700 font-semibold" : "border-neutral-200 text-neutral-400"}`}>{ORDER_STATUS[s]}</li>)}
        </ol>
      )}
      <section className="rounded-xl border border-neutral-200 p-4">
        <h2 className="font-semibold text-sm mb-3">배송조회</h2>
        {shipments.length ? shipments.map((s) => { const c = carriers.find((x) => x.code === s.carrier_code); const url = trackUrl(c?.tracking_url, s.tracking_no); return (
          <div key={s.id} className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-sm"><Pill s={s.status} label={SHIP_STATUS[s.status]} /><b>{c?.name ?? "출고 준비중"}</b>{s.tracking_no && <span className="font-mono">{s.tracking_no}</span>}
              {url && <a href={url} target="_blank" rel="noreferrer" className="text-xs text-brand-700 underline">택배사에서 조회</a>}</div>
            <Timeline events={s.events ?? []} />
          </div>); }) : <p className="text-sm text-neutral-400">상품 준비 후 송장번호가 등록됩니다.</p>}
      </section>
      <section className="rounded-xl border border-neutral-200 p-4">
        <h2 className="font-semibold text-sm mb-3">주문상품</h2>
        <ul className="text-sm divide-y divide-neutral-100">{(o.items ?? []).map((i) => <li key={i.id} className="flex justify-between gap-3 py-2"><Link href={i.product_id ? `/product/${i.product_id}` : "#"} className="truncate">{i.product_name}</Link><span className="shrink-0 tabular-nums">{i.qty}개 · {won(i.unit_price * i.qty)}</span></li>)}</ul>
        <dl className="text-sm mt-3 pt-3 border-t border-neutral-200 grid grid-cols-2 gap-1"><dt className="text-neutral-500">상품금액</dt><dd className="text-right tabular-nums">{won(o.subtotal)}</dd><dt className="text-neutral-500">배송비</dt><dd className="text-right tabular-nums">{won(o.shipping_fee)}</dd><dt className="font-semibold">결제금액</dt><dd className="text-right font-bold tabular-nums">{won(o.total)}</dd></dl>
      </section>
      <section className="rounded-xl border border-neutral-200 p-4 text-sm grid gap-1">
        <h2 className="font-semibold mb-2">배송지</h2><p>{o.receiver_name} · {o.receiver_phone}</p><p className="text-neutral-600">{o.address}</p><p className="text-xs text-neutral-400">주문 {dt(o.created_at)} · 결제 {dt(o.paid_at)}</p>
      </section>
      <section className="rounded-xl border border-neutral-200 p-4 text-sm">
        <h2 className="font-semibold mb-2">세금계산서</h2>
        {invoice ? <p><Link href={`/mypage/invoices/${invoice.id}`} className="font-mono text-brand-700 underline">{invoice.invoice_no}</Link> <Pill s={invoice.status} label={INVOICE_STATUS[invoice.status]} /></p>
          : ["paid", "preparing", "shipped", "delivered"].includes(o.status) ? <RequestInvoice orderNo={o.order_no} /> : <p className="text-neutral-400">결제완료 후 요청할 수 있습니다.</p>}
      </section>
    </div>
  );
}
