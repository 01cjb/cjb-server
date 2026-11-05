import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrder, listCarriers } from "@/lib/admin/repo";
import { INVOICE_STATUS, ORDER_STATUS, SHIP_STATUS } from "@/lib/admin/types";
import Pill from "@/components/admin/Pill";
import Act from "@/components/admin/Act";
import OrderStatus from "@/components/admin/OrderStatus";
import { ShipForm, ShipStatusForm } from "@/components/admin/ShipForm";
import Timeline from "@/components/Timeline";
import { H1, Table } from "@/components/admin/Table";
import { dt, trackUrl, won } from "@/lib/fmt";

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const [{ order: o, shipments, invoice }, carriers] = await Promise.all([getOrder(id), listCarriers()]);
  if (!o) notFound();
  const box = "rounded-xl bg-white border border-neutral-200 p-5";
  return (
    <div className="space-y-5">
      <H1 right={<OrderStatus id={o.id} status={o.status} />}>주문 <span className="font-mono">{o.order_no}</span> <Pill s={o.status} label={ORDER_STATUS[o.status]} /></H1>
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <Table head={["상품", "단가", "수량", "금액"]}>
            {(o.items ?? []).map((i) => <tr key={i.id}><td>{i.product_name}</td><td className="tabular-nums">{won(i.unit_price)}</td><td className="tabular-nums">{i.qty}</td><td className="tabular-nums">{won(i.unit_price * i.qty)}</td></tr>)}
            <tr className="bg-neutral-50 font-semibold"><td colSpan={3}>합계 (배송비 {won(o.shipping_fee)})</td><td className="tabular-nums">{won(o.total)}</td></tr>
          </Table>
          <div className={box}>
            <h2 className="font-semibold text-sm mb-3">배송 추적</h2>
            {shipments.map((s) => {
              const c = carriers.find((x) => x.code === s.carrier_code); const url = trackUrl(c?.tracking_url, s.tracking_no);
              return (
                <div key={s.id} className="border-b border-neutral-100 pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-2 text-sm mb-3"><Pill s={s.status} label={SHIP_STATUS[s.status]} /><b>{c?.name ?? "택배사 미지정"}</b><span className="font-mono">{s.tracking_no ?? "-"}</span>
                    {url && <a href={url} target="_blank" rel="noreferrer" className="text-xs text-brand-700 underline">택배사 조회</a>}</div>
                  <Timeline events={s.events ?? []} />
                  {s.status !== "delivered" && <ShipStatusForm id={s.id} />}
                </div>
              );
            })}
            {!shipments.some((s) => s.tracking_no) && ["paid", "preparing", "shipped"].includes(o.status) && <ShipForm orderId={o.id} carriers={carriers} />}
          </div>
        </div>
        <div className="space-y-5">
          <div className={`${box} text-sm space-y-1`}>
            <h2 className="font-semibold mb-2">배송지</h2><p>{o.receiver_name} · {o.receiver_phone}</p><p className="text-neutral-600">{o.address}</p>{o.memo && <p className="text-xs text-neutral-500">메모: {o.memo}</p>}
            <p className="text-xs text-neutral-400 pt-2">주문 {dt(o.created_at)} · 결제 {dt(o.paid_at)}</p>
            {o.user_id && <Link href={`/admin/customers/${o.user_id}`} className="text-xs text-brand-700 underline">고객정보 보기</Link>}
          </div>
          <div className={`${box} text-sm`}>
            <h2 className="font-semibold mb-2">세금계산서</h2>
            {invoice ? (<>
              <p><Link href={`/admin/invoices/${invoice.id}`} className="font-mono text-brand-700">{invoice.invoice_no}</Link> <Pill s={invoice.status} label={INVOICE_STATUS[invoice.status]} /></p>
              <p className="text-xs text-neutral-500 mt-1">공급가 {won(invoice.supply_amount)} · 세액 {won(invoice.vat_amount)}</p>
              {invoice.error && <p className="text-xs text-rose-600 mt-1">{invoice.error}</p>}
              {["pending", "failed"].includes(invoice.status) && <div className="mt-2"><Act url={`/api/admin/invoices/${invoice.id}`} body={{ action: "issue" }} label="지금 발행" tone="primary" /></div>}
            </>) : (<>
              <p className="text-xs text-neutral-500 mb-2">{o.invoice_requested ? "고객이 발행을 요청했습니다." : "발행 요청 없음"}</p>
              <Act url={`/api/admin/orders/${o.id}/invoice`} body={{ issue: true }} label="계산서 생성·발행" tone="primary" />
            </>)}
          </div>
        </div>
      </div>
    </div>
  );
}
