"use client";
import Link from "next/link";
import { useStore } from "@/components/Store";
import { company } from "@/lib/company";

const grades = [
  { id: "general", name: "일반회원", desc: "판매가 적용" },
  { id: "salon", name: "미용실회원", desc: "미용실회원가 적용" },
  { id: "vip", name: "VIP", desc: "회원가 + VIP 전용관" },
] as const;

export default function MyPage() {
  const { grade, setGrade, cart, wish } = useStore();
  const g = grades.find((x) => x.id === grade)!;
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 text-white p-6">
        <p className="text-sm opacity-80">안녕하세요, 원장님</p>
        <p className="text-xl font-bold mt-1">회원등급 · {g.name}</p>
        <p className="text-sm opacity-80 mt-1">{g.desc}</p>
        <div className="grid grid-cols-3 mt-5 text-center text-sm">
          <Link href="/mypage">주문 <b className="block text-lg">0</b></Link>
          <Link href="/cart">장바구니 <b className="block text-lg">{cart.length}</b></Link>
          <Link href="/wishlist">찜 <b className="block text-lg">{wish.length}</b></Link>
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-brand-200 p-4">
        <p className="text-sm font-semibold">🔧 목업 전용: 회원등급 미리보기</p>
        <p className="text-xs text-neutral-500 mt-1">DB 연결 후에는 관리자 승인 등급(profiles.grade_id)으로 자동 적용됩니다.</p>
        <div className="flex gap-2 mt-3">
          {grades.map((x) => (
            <button key={x.id} onClick={() => setGrade(x.id)} className={`flex-1 rounded-lg py-2 text-sm border ${grade === x.id ? "bg-brand-600 text-white border-brand-600" : "border-neutral-300"}`}>{x.name}</button>
          ))}
        </div>
      </div>

      <ul className="divide-y divide-neutral-200 border-y border-neutral-200 text-sm">
        {[["주문/배송 조회", "/mypage"], ["미용실회원 인증", "/salon-member"], ["쿠폰/적립금", "/mypage"], ["상품 후기", "/mypage"], ["회원정보 수정", "/login"]].map(([l, h]) => (
          <li key={l}><Link href={h} className="flex justify-between py-4">{l}<span className="text-neutral-400">›</span></Link></li>
        ))}
      </ul>

      <div id="cs" className="rounded-2xl bg-neutral-50 p-5 text-sm">
        <p className="font-semibold">고객센터</p>
        <a href={`tel:${company.tel}`} className="block text-2xl font-bold text-brand-700 my-1">{company.tel}</a>
        <p className="text-neutral-500 text-xs">{company.hours}</p>
      </div>
    </div>
  );
}
