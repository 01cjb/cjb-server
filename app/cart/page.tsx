"use client";
import Link from "next/link";
import ProductThumb from "@/components/ProductThumb";
import { useStore } from "@/components/Store";
import { useQuote, won } from "@/components/useQuote";

export default function CartPage() {
  const { cart, setQty, removeFromCart } = useStore();
  const q = useQuote();
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">장바구니</h1>
      {!cart.length ? (
        <div className="py-20 text-center text-neutral-400">
          장바구니가 비어 있습니다.<br />
          <Link href="/category/best" className="inline-block mt-4 rounded-full bg-brand-600 text-white px-5 py-2 text-sm">BEST 상품 보러가기</Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-[1fr_280px]">
          <ul className="divide-y divide-neutral-200 border-y border-neutral-200">
            {q?.items.map((i) => (
              <li key={i.id} className="flex gap-3 py-4">
                <Link href={`/product/${i.id}`} className="size-20 rounded-lg overflow-hidden shrink-0"><ProductThumb id={i.id} src={i.thumbnail_url} /></Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/product/${i.id}`} className="text-sm line-clamp-2">{i.name}</Link>
                  {i.blocked && <p className="text-xs text-accent mt-1">VIP 전용 상품 — 결제에서 제외됩니다</p>}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center border border-neutral-300 rounded-lg text-sm">
                      <button className="px-2.5 py-1" onClick={() => setQty(i.id, i.qty - 1)}>−</button>
                      <span className="w-8 text-center">{i.qty}</span>
                      <button className="px-2.5 py-1" onClick={() => setQty(i.id, i.qty + 1)}>+</button>
                    </div>
                    <b className="text-sm">{won(i.amount)}</b>
                  </div>
                </div>
                <button onClick={() => removeFromCart(i.id)} className="text-neutral-400 text-sm self-start" aria-label="삭제">✕</button>
              </li>
            ))}
          </ul>
          <aside className="rounded-2xl bg-neutral-50 p-5 h-fit space-y-2 text-sm">
            <div className="flex justify-between"><span>상품금액</span><span>{q ? won(q.subtotal) : "-"}</span></div>
            <div className="flex justify-between"><span>배송비</span><span>{q ? won(q.shipping) : "-"}</span></div>
            <p className="text-xs text-neutral-400">50,000원 이상 무료배송</p>
            <div className="flex justify-between text-lg font-bold pt-3 border-t border-neutral-200"><span>결제예정금액</span><span className="text-brand-700">{q ? won(q.total) : "-"}</span></div>
            <Link href="/checkout" className="block text-center rounded-xl bg-brand-600 text-white font-semibold py-3 mt-3">주문하기</Link>
          </aside>
        </div>
      )}
    </div>
  );
}
