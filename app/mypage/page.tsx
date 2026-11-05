import Link from "next/link";
import { redirect } from "next/navigation";
import { getMe, myOrders, myInvoices, myContracts } from "@/lib/me";
import { GRADE_NAME, ORDER_STATUS } from "@/lib/admin/types";
import GradePreview from "@/components/me/GradePreview";
import Pill from "@/components/admin/Pill";
import { company } from "@/lib/company";
import { dt, won } from "@/lib/fmt";

const BENEFIT = { general: "판매가 적용 · 신규가입 쿠폰", salon: "미용실회원가 적용 · 세금계산서 발행", vip: "미용실회원가 + VIP 전용관 · 계약 할인" };

export default async function MyPage() {
  const me = await getMe();
  if (!me.user) redirect("/login?next=/mypage");
  const [orders, invoices, contracts] = await Promise.all([myOrders(), myInvoices(), myContracts()]);
  const u = me.user;
  const active = orders.filter((o) => ["paid", "preparing", "shipped"].includes(o.status));
  return (
    <div className="space-y-6">
      {me.mock && <p className="text-xs rounded-lg bg-amber-50 text-amber-800 px-3 py-2">목업 모드: 예시 회원(김예시)으로 보입니다. Supabase 연결 후 로그인한 본인 정보가 표시됩니다.</p>}
      <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 text-white p-6">
        <p className="text-sm opacity-80">{u.company_name ?? u.salon_name ?? ""}</p>
        <p className="text-xl font-bold mt-0.5">{u.name}님 · {GRADE_NAME[u.grade_id]}</p>
        <p className="text-sm opacity-80 mt-1">{BENEFIT[u.grade_id]}</p>
        <div className="grid grid-cols-4 mt-5 text-center text-sm">
          <Link href="/mypage/orders">전체주문<b className="block text-lg tabular-nums">{orders.length}</b></Link>
          <Link href="/mypage/orders">진행중<b className="block text-lg tabular-nums">{active.length}</b></Link>
          <Link href="/mypage/invoices">계산서<b className="block text-lg tabular-nums">{invoices.length}</b></Link>
          <Link href="/mypage/contracts">계약<b className="block text-lg tabular-nums">{contracts.filter((c) => c.status === "active").length}</b></Link>
        </div>
      </div>
      {u.grade_id === "general" && <Link href="/salon-member" className="block rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm"><b className="text-brand-700">미용실 원장님이신가요?</b> 사업자 인증하고 미용실회원가로 구매하세요 ›</Link>}
      {!u.business_no && u.grade_id !== "general" && <Link href="/mypage/profile" className="block rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">세금계산서를 받으려면 <b>사업자정보</b>를 입력해 주세요 ›</Link>}
      <div>
        <div className="flex justify-between items-end mb-2"><h2 className="font-semibold">최근 구매</h2><Link href="/mypage/orders" className="text-sm text-neutral-500">전체보기 ›</Link></div>
        <ul className="divide-y divide-neutral-200 border-y border-neutral-200">
          {orders.slice(0, 3).map((o) => (
            <li key={o.id}><Link href={`/mypage/orders/${o.order_no}`} className="flex items-center gap-3 py-3 text-sm">
              <div className="flex-1 min-w-0"><p className="truncate">{o.items?.[0]?.product_name}{(o.items?.length ?? 0) > 1 && ` 외 ${(o.items?.length ?? 1) - 1}건`}</p><p className="text-xs text-neutral-400">{dt(o.created_at)} · {o.order_no}</p></div>
              <b className="tabular-nums">{won(o.total)}</b><Pill s={o.status} label={ORDER_STATUS[o.status]} /></Link></li>
          ))}
          {!orders.length && <li className="py-8 text-center text-sm text-neutral-400">구매내역이 없습니다.</li>}
        </ul>
      </div>
      {me.mock && <GradePreview />}
      <div className="rounded-2xl bg-neutral-50 p-5 text-sm flex flex-wrap items-center justify-between gap-2">
        <div><p className="font-semibold">고객센터</p><p className="text-neutral-500 text-xs">{company.hours}</p></div>
        <p className="text-2xl font-bold text-brand-700">{company.tel}</p>
      </div>
      {!me.mock && <a href="/logout" className="block text-center text-sm text-neutral-400 underline">로그아웃</a>}
    </div>
  );
}
