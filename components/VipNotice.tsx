import Link from "next/link";

// 카카오톡 채널 주소: Vercel 환경변수 NEXT_PUBLIC_KAKAO_CHANNEL_URL (예: https://pf.kakao.com/_xxxxx)
export const KAKAO_CHANNEL_URL = process.env.NEXT_PUBLIC_KAKAO_CHANNEL_URL || "";
export const KAKAO_CHANNEL_NAME = "씨제이비인터내셔널";

export function KakaoButton({ className = "" }: { className?: string }) {
  if (!KAKAO_CHANNEL_URL)
    return <span className={`inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#FEE500] text-[#191919] font-bold text-sm px-4 py-3 ${className}`}>카카오톡에서 ‘{KAKAO_CHANNEL_NAME}’ 검색 후 채널 추가</span>;
  return (
    <a href={KAKAO_CHANNEL_URL} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#FEE500] text-[#191919] font-bold text-sm px-4 py-3 ${className}`}>
      <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden><path d="M12 3C6.5 3 2 6.5 2 10.8c0 2.8 1.9 5.2 4.7 6.6l-1 3.6c-.1.3.3.6.6.4l4.2-2.8c.5.1 1 .1 1.5.1 5.5 0 10-3.5 10-7.9S17.5 3 12 3z" /></svg>
      카카오톡 채널 추가하기
    </a>
  );
}

const STEPS = [
  `카카오톡에서 ‘${KAKAO_CHANNEL_NAME}’ 채널 추가`,
  "채팅으로 미용사 면허증(자격증) 사진 보내기",
  "확인 후 VIP 등급으로 변경 · 모든 상품 VIP가 적용",
];

// VIP 전용관 맨 위 공지 (인증 안 된 분께)
export default function VipNotice({ compact = false }: { compact?: boolean }) {
  return (
    <div className="mb-5 rounded-2xl border border-gold/60 bg-gold-50 p-4">
      <p className="flex items-center gap-1.5 text-[13px] font-bold text-gold-ink">
        <span className="rounded-md bg-gold px-1.5 py-0.5 text-[11px] text-plum">공지</span>
        VIP가는 미용인 인증 회원만 볼 수 있어요
      </p>
      <p className="mt-2 text-[13px] leading-relaxed text-neutral-700">
        VIP 전용관은 <b>미용사 면허증(자격증)을 인증한 분</b>만 VIP가로 구매할 수 있어요. 인증 전에는 기본가로 보여요.
      </p>
      {!compact && (
        <ol className="mt-3 space-y-1.5">
          {STEPS.map((s, i) => (
            <li key={s} className="flex gap-2 text-[13px] text-neutral-800">
              <span className="grid size-5 shrink-0 place-items-center rounded-full bg-plum text-[11px] font-bold text-white">{i + 1}</span>{s}
            </li>
          ))}
        </ol>
      )}
      <p className="mt-3 text-xs text-neutral-500">자세한 인증 방법은 카카오톡 채널 추가 후 확인해 주세요.</p>
      <div className="mt-3 flex gap-2">
        <KakaoButton className="flex-1" />
        {compact && <Link href="/salon-member" className="rounded-xl border border-neutral-300 bg-white px-3 py-3 text-sm font-semibold">인증 방법</Link>}
      </div>
    </div>
  );
}
