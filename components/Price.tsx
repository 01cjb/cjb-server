"use client";
import { useStore } from "./Store";
import type { Product } from "@/lib/types";

const won = (n: number) => n.toLocaleString("ko-KR");

export default function Price({ p, large = false }: { p: Product; large?: boolean }) {
  const { grade } = useStore();
  const isSalon = grade !== "general";
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
      {!isSalon && p.salon_price && (
        <div className={`text-brand-600 ${large ? "text-sm" : "text-[11px]"}`}>미용실회원가 {won(p.salon_price)}원</div>
      )}
      {isSalon && <div className={`text-brand-600 ${large ? "text-sm" : "text-[11px]"}`}>미용실회원가 적용</div>}
    </div>
  );
}
