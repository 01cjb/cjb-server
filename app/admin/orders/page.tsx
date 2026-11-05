import Link from "next/link";
import { listOrders } from "@/lib/admin/repo";
import { ORDER_STATUS } from "@/lib/admin/types";
import Pill from "@/components/admin/Pill";
import { H1, Table, Tabs } from "@/components/admin/Table";
import { dt, won } from "@/lib/fmt";

export default async function Orders({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  const { s = "all" } = await searchParams;
  const all = await listOrders();
  const list = s === "all" ? all : all.filter((o) => o.status === s);
  const tabs = [{ key: "all", label: "전체" }, ...Object.entries(ORDER_STATUS).map(([key, label]) => ({ key, label }))]
    .map((t) => ({ ...t, href: `/admin/orders?s=${t.key}`, count: t.key === "all" ? all.length : all.filter((o) => o.status === t.key).length }));
  return (
    <>
      <H1>주문관리</H1>
      <Tabs items={tabs} cur={s} />
      <Table head={["주문번호", "고객", "받는 분", "금액", "계산서", "상태", "주문일시"]} empty={!list.length}>
        {list.map((o) => (
          <tr key={o.id}>
            <td><Link href={`/admin/orders/${o.id}`} className="font-mono text-xs text-brand-700">{o.order_no}</Link></td>
            <td>{o.customer_name ?? "-"}</td><td className="text-xs">{o.receiver_name}<div className="text-neutral-500">{o.receiver_phone}</div></td>
            <td className="tabular-nums whitespace-nowrap">{won(o.total)}</td><td>{o.invoice_requested ? <Pill s="paid" label="요청" /> : ""}</td>
            <td><Pill s={o.status} label={ORDER_STATUS[o.status]} /></td><td className="text-xs text-neutral-500 whitespace-nowrap">{dt(o.created_at)}</td>
          </tr>
        ))}
      </Table>
    </>
  );
}
