import Link from "next/link";
import { listCustomers } from "@/lib/admin/repo";
import { GRADE_NAME } from "@/lib/admin/types";
import Pill from "@/components/admin/Pill";
import { H1, Table, Tabs } from "@/components/admin/Table";
import { day, won } from "@/lib/fmt";

const ST: Record<string, string> = { active: "정상", dormant: "휴면", blocked: "정지", withdrawn: "탈퇴" };

export default async function Customers({ searchParams }: { searchParams: Promise<{ g?: string; q?: string }> }) {
  const { g = "all", q } = await searchParams;
  const all = await listCustomers();
  const list = await listCustomers(q, g);
  const tabs = [{ key: "all", label: "전체" }, ...Object.entries(GRADE_NAME).map(([key, label]) => ({ key, label }))]
    .map((t) => ({ ...t, href: `/admin/customers?g=${t.key}`, count: t.key === "all" ? all.length : all.filter((c) => c.grade_id === t.key).length }));
  return (
    <>
      <H1>고객정보</H1>
      <Tabs items={tabs} cur={g} />
      <form className="mb-3"><input type="hidden" name="g" value={g} /><input name="q" defaultValue={q} placeholder="이름·이메일·연락처·상호·사업자번호" className="rounded-lg border border-neutral-300 px-3 py-2 text-sm w-72" /></form>
      <Table head={["이름", "이메일 / 연락처", "등급", "상호 / 사업자번호", "주문", "구매액", "마케팅", "상태", "가입일"]} empty={!list.length}>
        {list.map((c) => (
          <tr key={c.id}>
            <td><Link href={`/admin/customers/${c.id}`} className="font-medium hover:text-brand-700">{c.name || "(이름 없음)"}</Link>{c.role !== "customer" && <span className="ml-1"><Pill s={c.role} label={c.role === "admin" ? "관리자" : "직원"} /></span>}</td>
            <td className="text-xs"><div>{c.email}</div><div className="text-neutral-500">{c.phone ?? "-"}</div></td>
            <td><Pill s={c.grade_id} label={GRADE_NAME[c.grade_id]} /></td>
            <td className="text-xs"><div>{c.company_name ?? c.salon_name ?? "-"}</div><div className="text-neutral-500 tabular-nums">{c.business_no ?? ""}</div></td>
            <td className="tabular-nums">{c.order_count ?? 0}</td><td className="tabular-nums whitespace-nowrap">{won(c.order_total ?? 0)}</td>
            <td>{c.marketing_agree ? <Pill s="active" label="동의" /> : <Pill s="hidden" label="미동의" />}</td>
            <td><Pill s={c.status} label={ST[c.status]} /></td><td className="text-xs text-neutral-500 whitespace-nowrap">{day(c.created_at)}</td>
          </tr>
        ))}
      </Table>
    </>
  );
}
