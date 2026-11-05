"use client";
import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/components/Store";
import { useQuote, won } from "@/components/useQuote";

export default function Checkout() {
  const { cart, grade, clearCart } = useStore();
  const q = useQuote();
  const [form, setForm] = useState({ name: "", phone: "", address: "", memo: "" });
  const [result, setResult] = useState<{ orderNo?: string; error?: string; mock?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    const r = await fetch("/api/orders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ lines: cart, grade, receiver: form }) });
    const d = await r.json(); setBusy(false); setResult(d);
    if (r.ok) clearCart();
  };

  if (result?.orderNo) return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <div className="text-5xl">✅</div>
      <h1 className="text-xl font-bold mt-4">주문이 접수되었습니다</h1>
      <p className="text-sm text-neutral-500 mt-2">주문번호 <b>{result.orderNo}</b>{result.mock && " (목업 — DB 미저장)"}</p>
      <p className="text-xs text-neutral-400 mt-1">결제(PG) 연동 후 결제 단계가 추가됩니다.</p>
      <Link href="/" className="inline-block mt-6 rounded-full bg-brand-600 text-white px-6 py-2.5 text-sm">홈으로</Link>
    </div>
  );

  const field = (k: keyof typeof form, label: string, ph: string) => (
    <label className="block text-sm"><span className="text-neutral-600">{label}</span>
      <input required={k !== "memo"} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} placeholder={ph} className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2.5 outline-none focus:border-brand-500" />
    </label>
  );

  return (
    <form onSubmit={submit} className="max-w-4xl mx-auto px-4 py-6 grid gap-6 md:grid-cols-[1fr_280px]">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">주문/결제</h1>
        {field("name", "받는 분", "홍길동")}
        {field("phone", "연락처", "010-0000-0000")}
        {field("address", "주소", "서울시 관악구 ...")}
        {field("memo", "배송 메모 (선택)", "부재 시 문 앞")}
        <div className="rounded-xl border border-dashed border-neutral-300 p-4 text-sm text-neutral-500">결제수단 영역 — 토스페이먼츠 등 PG 연동 예정</div>
      </div>
      <aside className="rounded-2xl bg-neutral-50 p-5 h-fit space-y-2 text-sm">
        <p className="font-semibold mb-2">주문상품 {q?.items.length ?? 0}건</p>
        <div className="flex justify-between"><span>상품금액</span><span>{q ? won(q.subtotal) : "-"}</span></div>
        <div className="flex justify-between"><span>배송비</span><span>{q ? won(q.shipping) : "-"}</span></div>
        <div className="flex justify-between text-lg font-bold pt-3 border-t border-neutral-200"><span>총 결제금액</span><span className="text-brand-700">{q ? won(q.total) : "-"}</span></div>
        {result?.error && <p className="text-accent text-xs">{result.error}</p>}
        <button disabled={busy || !cart.length} className="w-full rounded-xl bg-brand-600 text-white font-semibold py-3 mt-3 disabled:opacity-40">{busy ? "처리 중…" : "주문하기"}</button>
      </aside>
    </form>
  );
}
