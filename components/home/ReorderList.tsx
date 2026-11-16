"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/components/Store";
import ProductThumb from "@/components/ProductThumb";

export type ReorderItem = { id: number; name: string; brand?: string; icon?: string; thumb?: string | null; price: number; times: number; lastQty: number; lastDate: string; soldout: boolean };

export default function ReorderList({ items }: { items: ReorderItem[] }) {
  const { addToCart } = useStore();
  const router = useRouter();
  const [sel, setSel] = useState<number[]>(items.filter((i) => !i.soldout).map((i) => i.id));
  const toggle = (id: number) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const buyable = items.filter((i) => !i.soldout);
  const all = buyable.length > 0 && sel.length === buyable.length;
  return (
    <>
      <div className="rounded-[20px] border border-[#ece6f1] bg-white divide-y divide-[#ece6f1]">
        <label className="flex items-center gap-3 px-4 py-3 text-sm">
          <input type="checkbox" className="size-5 accent-brand-600" checked={all} onChange={() => setSel(all ? [] : buyable.map((i) => i.id))} /> 전체 선택
        </label>
        {items.map((i) => (
          <label key={i.id} className={`flex items-center gap-3 px-4 py-3 ${i.soldout ? "opacity-50" : ""}`}>
            <input type="checkbox" className="size-5 accent-brand-600 shrink-0" disabled={i.soldout} checked={sel.includes(i.id)} onChange={() => toggle(i.id)} />
            <Link href={`/product/${i.id}`} className="relative size-16 shrink-0 overflow-hidden rounded-xl border border-neutral-100"><ProductThumb id={i.id} src={i.thumb} icon={i.icon} className="[&_.text-4xl]:text-2xl" /></Link>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] leading-snug line-clamp-2">{i.name}</p>
              <p className="text-xs text-neutral-500 mt-0.5">{i.times}회 구매 · 마지막 {i.lastDate} · {i.lastQty}개</p>
              <b className="text-sm">{i.soldout ? "품절" : i.price.toLocaleString("ko-KR") + "원"}</b>
            </div>
          </label>
        ))}
      </div>
      <div className="fixed md:static bottom-[60px] inset-x-0 z-30 bg-white/95 md:bg-transparent border-t md:border-0 border-neutral-200 px-4 py-3 md:px-0 safe-bottom">
        <button type="button" disabled={!sel.length} className="w-full rounded-2xl bg-brand-600 text-white font-extrabold py-4 disabled:opacity-40"
          onClick={() => { items.filter((i) => sel.includes(i.id)).forEach((i) => addToCart(i.id, i.lastQty)); router.push("/cart"); }}>
          선택한 {sel.length}개 상품 장바구니 담기
        </button>
      </div>
    </>
  );
}
