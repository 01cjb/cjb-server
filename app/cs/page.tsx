import Link from "next/link";
import { company } from "@/lib/company";
import { KAKAO_CHANNEL_URL } from "@/components/VipNotice";

export const metadata = { title: "고객센터" };

const FAQ = [
  ["배송비는 얼마인가요?", "3,000원이며, 50,000원 이상 구매하면 무료배송이에요."],
  ["VIP가는 어떻게 받나요?", "카카오톡에서 ‘씨제이비인터내셔널’ 채널을 추가하고 미용사 면허증(자격증) 사진을 보내주시면, 확인 후 VIP가가 적용돼요. 자세한 방법은 채널 추가 후 확인해 주세요."],
  ["세금계산서는 어디서 보나요?", "마이페이지 › 세금계산서에서 발행 내역을 볼 수 있어요. 사업자정보를 먼저 입력해 주세요."],
  ["주문 상태와 송장번호는 어디서 보나요?", "마이페이지 › 구매내역에서 주문을 누르면 배송 단계와 송장번호를 볼 수 있어요."],
  ["적립금은 얼마나 쌓이나요?", "구매 금액의 1%가 적립돼요."],
];

export default function CS() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-5 grid gap-3">
      <h1 className="text-xl font-bold">고객센터</h1>
      <div className="rounded-[20px] bg-plum p-5 text-white">
        <small className="text-[11.5px] text-gold-100">전화 상담</small>
        <a href={`tel:${company.tel}`} className="block text-3xl font-extrabold text-gold mt-1">{company.tel}</a>
        <p className="text-xs opacity-80 mt-1">{company.hours}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <a href={`tel:${company.tel}`} className="rounded-2xl border border-[#ece6f1] bg-white py-3.5 text-center text-sm font-bold text-plum">전화하기</a>
        <a href={`${KAKAO_CHANNEL_URL}/chat`} target="_blank" rel="noopener noreferrer" className="rounded-2xl bg-[#FEE500] py-3.5 text-center text-sm font-bold text-[#191919]">카카오톡 문의</a>
      </div>
      <h2 className="mt-3 text-[15px] font-bold">자주 묻는 질문</h2>
      <div className="divide-y divide-[#ece6f1] overflow-hidden rounded-[20px] border border-[#ece6f1] bg-white">
        {FAQ.map(([q, a]) => (
          <details key={q} className="group">
            <summary className="flex cursor-pointer list-none gap-2 px-4 py-3.5 text-[13.5px]"><b className="text-brand-600">Q</b>{q}</summary>
            <p className="px-4 pb-4 pl-10 text-[12.5px] leading-relaxed text-neutral-600">{a}</p>
          </details>
        ))}
      </div>
      <div className="divide-y divide-[#ece6f1] rounded-[20px] border border-[#ece6f1] bg-white text-sm">
        <Link href="/mypage/orders" className="flex justify-between px-4 py-3.5">주문·배송 조회<span className="text-neutral-400">›</span></Link>
        <Link href="/salon-member" className="flex justify-between px-4 py-3.5">VIP 인증<span className="text-neutral-400">›</span></Link>
        <Link href="/mypage/invoices" className="flex justify-between px-4 py-3.5">세금계산서<span className="text-neutral-400">›</span></Link>
      </div>
    </div>
  );
}
