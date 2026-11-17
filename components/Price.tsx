"use client";
import { useStore } from "./Store";
import type { Product } from "@/lib/types";

const won = (n: number) => n.toLocaleString("ko-KR");

export default function Price({ p, large = false }: { p: Product; large?: boolean }) {
  const { grade } = useStore();
  const isSalon = grade !== "general";
  if (p.price_hidden)
    return (
      <div className={large ? "space-y-1" : "space-y-0.5"}>
        <div className={`font-bold text-neutral-700 ${large ? "text-xl" : "text-sm"}`}>판매가 회원공개</div>
        <div className={`text-brand-600 ${large ? "text-sm" : "text-[11px]"}`}>로그인 후 가격 확인</div>
      </div>
    );
  const sell = isSalon && p.salon_price ? p.salon_price : p.price;
  const base = p.consumer_price ?? p.price;
  const rate = base > sell ? Math.round((1 - sell / base) * 100) : 0;
  return (
    <div className={large ? "space-y-1" : "space-y-0.5"}>
      {p.consumer_price && p.consumer_price > sell && (
        <div className={`text-neutral-400 line-through ${large ? "text-sm" : "text-xs"}`}>{won(p.consumer_price)}원</div>
      )}
      <div className={`flex items-baseline gap-1.5 ${large ? "text-2xl" : "text-base"}`}>
        {rate > 0 && <span className="font-bold text-accent">{rate}%</span>}
        <span className="font-bold">{won(sell)}<span className="text-[0.7em] font-medium">원</span></span>
      </div>
      {!isSalon && (p.salon_price || p.has_vip_price) && (
        <div className={`font-semibold text-gold-ink ${large ? "text-sm" : "text-[11px]"}`}>VIP가 · 미용사 인증 후 공개</div>
      )}
      {isSalon && p.salon_price && <div className={`font-semibold text-brand-600 ${large ? "text-sm" : "text-[11px]"}`}>VIP가 적용</div>}
    </div>
  );
}
