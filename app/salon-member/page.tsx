import Link from "next/link";
import VipNotice from "@/components/VipNotice";

export const metadata = { title: "VIP 인증 방법 | 뷰티웰" };

export default function SalonMember() {
  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="rounded-2xl bg-plum p-6 text-center text-white">
        <div className="text-4xl">⭐</div>
        <h1 className="text-2xl font-bold mt-2">VIP 인증 방법</h1>
        <p className="text-sm text-white/80 mt-2">미용사 면허증(자격증)을 인증하면 모든 상품에 <b className="text-gold">VIP가</b>가 적용되고, VIP 전용 상품도 구매할 수 있어요.</p>
      </div>
      <div className="mt-6"><VipNotice /></div>
      <ul className="mt-2 space-y-1.5 text-xs text-neutral-500 list-disc pl-4">
        <li>인증은 사이트에서 하지 않고, 카카오톡 채널 채팅으로만 받아요.</li>
        <li>뷰티웰에 먼저 회원가입한 뒤, 가입한 연락처와 함께 보내 주세요.</li>
        <li>사진은 이름과 면허(자격) 번호가 잘 보이게 찍어 주세요.</li>
      </ul>
      <Link href="/category/vip" className="mt-6 block rounded-xl border border-neutral-200 bg-white py-3 text-center text-sm font-semibold">VIP 전용관 둘러보기 ›</Link>
    </div>
  );
}
