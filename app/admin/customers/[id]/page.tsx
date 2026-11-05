import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomer } from "@/lib/admin/repo";
import { CONTRACT_TYPE, GRADE_NAME, ORDER_STATUS } from "@/lib/admin/types";
import CustomerEditor from "@/components/admin/CustomerEditor";
import Pill from "@/components/admin/Pill";
import { H1, Table } from "@/components/admin/Table";
import { day, dt, won } from "@/lib/fmt";

export default async function CustomerDetail({ params }: { params: Promise<{ id: string }> }) {
  const { customer: c, orders, contracts, consents, addresses } = await getCustomer((await params).id);
  if (!c) notFound();
  return (
    <div className="space-y-6">
      <H1 right={<div className="flex gap-2 text-xs text-neutral-500"><span>가입 {day(c.created_at)}</span><span>최근접속 {dt(c.last_login_at)}</span></div>}>
        {c.name} <span className="text-sm font-normal text-neutral-500">{c.email}</span> <Pill s={c.grade_id} label={GRADE_NAME[c.grade_id]} />
      </H1>
      <CustomerEditor c={c} />
      <div className="grid gap-6 lg:grid-cols-2">
        <div><h2 className="font-semibold text-sm mb-2">주문 {orders.length}건</h2>
          <Table head={["주문번호", "금액", "상태", "일시"]} empty={!orders.length}>
            {orders.map((o) => <tr key={o.id}><td><Link href={`/admin/orders/${o.id}`} className="font-mono text-xs text-brand-700">{o.order_no}</Link></td><td className="tabular-nums">{won(o.total)}</td><td><Pill s={o.status} label={ORDER_STATUS[o.status]} /></td><td className="text-xs text-neutral-500">{dt(o.created_at)}</td></tr>)}
          </Table></div>
        <div><h2 className="font-semibold text-sm mb-2">계약</h2>
          <Table head={["계약번호", "유형", "기간", "할인", "상태"]} empty={!contracts.length}>
            {contracts.map((k) => <tr key={k.id}><td className="font-mono text-xs">{k.contract_no}</td><td>{CONTRACT_TYPE[k.contract_type]}</td><td className="text-xs">{k.start_date} ~ {k.end_date ?? ""}</td><td className="tabular-nums">{k.discount_rate}%</td><td><Pill s={k.status} /></td></tr>)}
          </Table></div>
        <div><h2 className="font-semibold text-sm mb-2">약관·마케팅 동의 (현재)</h2>
          <Table head={["항목", "버전", "동의", "채널", "일시"]} empty={!consents.length}>
            {(consents as { code: string; title?: string; version: string; agreed: boolean; channel_email?: boolean; channel_sms?: boolean; channel_push?: boolean; created_at: string }[]).map((s) => (
              <tr key={s.code}><td>{s.title ?? s.code}</td><td className="text-xs">{s.version}</td><td>{s.agreed ? <Pill s="active" label="동의" /> : <Pill s="cancelled" label="미동의" />}</td>
                <td className="text-xs">{s.code === "marketing" ? [s.channel_email && "이메일", s.channel_sms && "문자", s.channel_push && "푸시"].filter(Boolean).join(", ") || "-" : ""}</td><td className="text-xs text-neutral-500">{dt(s.created_at)}</td></tr>
            ))}
          </Table></div>
        <div><h2 className="font-semibold text-sm mb-2">배송지</h2>
          <Table head={["구분", "받는 분", "주소", "기본"]} empty={!addresses.length}>
            {addresses.map((a) => <tr key={a.id}><td>{a.label}</td><td>{a.receiver_name}<div className="text-xs text-neutral-500">{a.phone}</div></td><td className="text-xs">{a.address1} {a.address2}</td><td>{a.is_default ? "✓" : ""}</td></tr>)}
          </Table></div>
      </div>
    </div>
  );
}
