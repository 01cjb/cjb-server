import Link from "next/link";
import { getMe } from "@/lib/me";
import { GRADE_NAME } from "@/lib/admin/types";

export const metadata = { title: "쿠폰·포인트" };

const GRADES = [
  { id: "general", t: "일반회원", d: "판매가로 구매 · 신규가입 2,000원 쿠폰" },
  { id: "salon", t: "미용실회원", d: "미용실회원가 적용 · 세금계산서 발행", href: "/salon-member", cta: "인증하기" },
  { id: "vip", t: "VIP", d: "미용실회원가 + VIP 전용관 · 계약 할인", href: "/category/vip", cta: "VIP 전용관" },
] as const;

export default async function Benefits() {
  const me = await getMe();
  const g = me.user?.grade_id;
  return (
    <div className="max-w-3xl mx-auto px-4 py-5 grid gap-3">
      <h1 className="text-xl font-bold">쿠폰·포인트</h1>
      <div className="rounded-[20px] bg-plum p-5 text-white">
        <small className="text-[11.5px] text-gold-100">{g ? `현재 등급 · ${GRADE_NAME[g]}` : "로그인하면 내 혜택을 볼 수 있어요"}</small>
        <p className="mt-1 text-lg font-bold">구매 금액의 <span className="text-gold">1%</span>가 적립금으로 쌓여요</p>
        {!g && <Link href="/login?next=/benefits" className="mt-3 inline-block rounded-xl bg-gold px-4 py-2 text-sm font-bold text-plum">로그인 / 회원가입</Link>}
      </div>
      <div className="flex overflow-hidden rounded-2xl border border-[#ece6f1] bg-white">
        <div className="grid w-24 shrink-0 place-items-center border-r-2 border-dashed border-white bg-gold-100 text-lg font-extrabold text-gold-ink">2천원</div>
        <div className="p-4"><b className="text-sm">신규 회원 가입 쿠폰</b><p className="text-xs text-neutral-500 mt-0.5">회원가입하면 바로 지급돼요</p></div>
      </div>
      <h2 className="mt-3 text-[15px] font-bold">회원 등급별 혜택</h2>
      <div className="divide-y divide-[#ece6f1] rounded-[20px] border border-[#ece6f1] bg-white">
        {GRADES.map((x) => (
          <div key={x.id} className="flex items-center gap-3 px-4 py-3.5">
            <div className="flex-1"><b className="text-sm">{x.t}</b>{g === x.id && <span className="ml-2 rounded-full bg-gold-100 px-2 py-0.5 text-[11px] font-bold text-gold-ink">내 등급</span>}<p className="text-xs text-neutral-500 mt-0.5">{x.d}</p></div>
            {"href" in x && <Link href={x.href} className="shrink-0 rounded-lg border border-[#ece6f1] px-3 py-1.5 text-xs font-semibold text-plum">{x.cta}</Link>}
          </div>
        ))}
      </div>
      <p className="text-xs text-neutral-500">쿠폰함과 적립금 내역 화면은 준비 중이에요.</p>
    </div>
  );
}
