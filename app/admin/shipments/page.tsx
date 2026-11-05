import Link from "next/link";
import { listCarriers, listShipments } from "@/lib/admin/repo";
import { SHIP_STATUS } from "@/lib/admin/types";
import Pill from "@/components/admin/Pill";
import { H1, Table, Tabs } from "@/components/admin/Table";
import { dt, trackUrl } from "@/lib/fmt";

export default async function Shipments({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  const { s = "all" } = await searchParams;
  const [all, carriers] = await Promise.all([listShipments(), listCarriers()]);
  const list = s === "all" ? all : all.filter((x) => x.status === s);
  const tabs = [{ key: "all", label: "전체" }, ...Object.entries(SHIP_STATUS).map(([key, label]) => ({ key, label }))]
    .map((t) => ({ ...t, href: `/admin/shipments?s=${t.key}`, count: t.key === "all" ? all.length : all.filter((x) => x.status === t.key).length }));
  return (
    <>
      <H1>배송추적</H1>
      <Tabs items={tabs} cur={s} />
      <Table head={["주문번호", "받는 분", "택배사", "송장번호", "상태", "출고", "배송완료"]} empty={!list.length}>
        {list.map((x) => { const c = carriers.find((k) => k.code === x.carrier_code); const url = trackUrl(c?.tracking_url, x.tracking_no); return (
          <tr key={x.id}>
            <td><Link href={`/admin/orders/${x.order_id}`} className="font-mono text-xs text-brand-700">{x.order_no}</Link></td><td>{x.receiver_name}</td><td>{c?.name ?? "-"}</td>
            <td className="font-mono text-xs">{url ? <a href={url} target="_blank" rel="noreferrer" className="underline">{x.tracking_no}</a> : x.tracking_no ?? <span className="text-amber-600">송장 미등록</span>}</td>
            <td><Pill s={x.status} label={SHIP_STATUS[x.status]} /></td><td className="text-xs text-neutral-500">{dt(x.shipped_at)}</td><td className="text-xs text-neutral-500">{dt(x.delivered_at)}</td>
          </tr>); })}
      </Table>
      <p className="text-xs text-neutral-400 mt-2">배송 상태를 바꾸면 주문 상태(배송중/배송완료)가 자동으로 맞춰집니다. 택배사 자동조회 API(스마트택배 등) 연동은 추가 선택사항입니다.</p>
    </>
  );
}
