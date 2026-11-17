"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useStore } from "./Store";
import WishButton from "./WishButton";
import type { Product } from "@/lib/types";

export default function BuyBox({ p }: { p: Product }) {
  const { addToCart, grade } = useStore();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [toast, setToast] = useState(false);
  const blocked = p.vip_only && grade === "general"; // 미용사 인증(VIP) 회원만
  const soldout = p.status === "soldout" || p.stock <= 0;

  const add = () => { addToCart(p.id, qty); setToast(true); setTimeout(() => setToast(false), 1800); };

  if (p.price_hidden)
    return (
      <div className="pt-5 space-y-3">
        <p className="rounded-xl bg-neutral-50 px-4 py-3 text-sm text-neutral-600">가격은 <b>회원에게만 공개</b>돼요. 로그인하면 가격 확인과 주문을 할 수 있어요.</p>
        <div className="flex gap-2 fixed @3xl:static bottom-[64px] inset-x-0 mx-auto max-w-[480px] z-30 bg-white @3xl:bg-transparent p-3 @3xl:p-0 border-t @3xl:border-0 border-neutral-200">
          <div className="grid place-items-center size-12 border border-neutral-300 rounded-xl shrink-0"><WishButton id={p.id} /></div>
          <Link href="/login" className="flex-1 grid place-items-center rounded-xl bg-brand-600 py-3 text-white font-semibold">로그인하고 가격 보기</Link>
        </div>
      </div>
    );

  return (
    <div className="pt-5 space-y-4">
      <div className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3">
        <span className="text-sm">수량</span>
        <div className="flex items-center border border-neutral-300 rounded-lg bg-white">
          <button className="px-3 py-1.5" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="수량 감소">−</button>
          <span className="w-10 text-center text-sm">{qty}</span>
          <button className="px-3 py-1.5" onClick={() => setQty((q) => q + 1)} aria-label="수량 증가">+</button>
        </div>
      </div>
      {blocked && <p className="text-sm text-accent">미용사 인증(VIP) 회원만 구매할 수 있는 상품입니다.</p>}
      <div className="flex gap-2 fixed @3xl:static bottom-[64px] inset-x-0 mx-auto max-w-[480px] z-30 bg-white @3xl:bg-transparent p-3 @3xl:p-0 border-t @3xl:border-0 border-neutral-200">
        <div className="grid place-items-center size-12 border border-neutral-300 rounded-xl shrink-0"><WishButton id={p.id} /></div>
        <button disabled={blocked || soldout} onClick={add} className="flex-1 rounded-xl border border-brand-600 text-brand-600 font-semibold disabled:opacity-40">장바구니</button>
        <button disabled={blocked || soldout} onClick={() => { addToCart(p.id, qty); router.push("/cart"); }} className="flex-1 rounded-xl bg-brand-600 text-white font-semibold disabled:opacity-40">{soldout ? "품절" : "바로구매"}</button>
      </div>
      {toast && <div className="fixed bottom-36 @3xl:bottom-10 left-1/2 -translate-x-1/2 z-50 bg-neutral-900 text-white text-sm rounded-full px-5 py-2.5">장바구니에 담았습니다</div>}
    </div>
  );
}
