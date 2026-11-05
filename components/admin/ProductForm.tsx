"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Brand, Category, Product } from "@/lib/types";
import { Msg, useApi } from "./Act";

function L({ l, children, wide }: { l: string; children: React.ReactNode; wide?: boolean }) {
  return <label className={`block text-xs text-neutral-600 ${wide ? "md:col-span-2" : ""}`}>{l}<div className="mt-1">{children}</div></label>;
}

export default function ProductForm({ p, categories, brands }: { p?: Product | null; categories: Category[]; brands: Brand[] }) {
  const router = useRouter();
  const { call, msg, busy } = useApi();
  const [f, setF] = useState({
    sku: p?.sku ?? "", name: p?.name ?? "", category_id: p?.category_id ?? categories[0]?.id ?? "", brand_id: p?.brand_id ?? "",
    model_no: p?.model_no ?? "", consumer_price: p?.consumer_price ?? "", price: p?.price ?? "", salon_price: p?.salon_price ?? "",
    stock: p?.stock ?? 0, summary: p?.summary ?? "", description: p?.description ?? "", thumbnail_url: p?.thumbnail_url ?? "",
    status: p?.status && p.status !== "cancelled" ? p.status : "draft", is_best: p?.is_best ?? false, is_new: p?.is_new ?? false, is_timesale: p?.is_timesale ?? false, vip_only: p?.vip_only ?? false,
  });
  const set = (k: string, v: unknown) => setF({ ...f, [k]: v });
  const inp = "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white";

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await call(p ? `/api/admin/products/${p.id}` : "/api/admin/products", p ? "PATCH" : "POST", { ...f, brand_id: f.brand_id || null });
    if (r.ok && !p && !r.data.mock) router.push(`/admin/products/${r.data.id}`);
  };

  return (
    <form onSubmit={save} className="rounded-xl bg-white border border-neutral-200 p-5 grid gap-4 md:grid-cols-2">
      <L l="상품명 *" wide><input className={inp} required value={f.name} onChange={(e) => set("name", e.target.value)} /></L>
      <L l="상품코드(SKU)"><input className={inp} value={f.sku} onChange={(e) => set("sku", e.target.value)} placeholder="엑셀 대량수정 시 기준" /></L>
      <L l="모델명"><input className={inp} value={f.model_no} onChange={(e) => set("model_no", e.target.value)} /></L>
      <L l="카테고리 *"><select className={inp} value={f.category_id} onChange={(e) => set("category_id", Number(e.target.value))}>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></L>
      <L l="브랜드"><select className={inp} value={f.brand_id} onChange={(e) => set("brand_id", e.target.value ? Number(e.target.value) : "")}><option value="">선택 안 함</option>{brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></L>
      <L l="소비자가"><input className={inp} type="number" value={f.consumer_price} onChange={(e) => set("consumer_price", e.target.value)} /></L>
      <L l="판매가 (일반회원) *"><input className={inp} type="number" required value={f.price} onChange={(e) => set("price", e.target.value)} /></L>
      <L l="미용실회원가"><input className={inp} type="number" value={f.salon_price} onChange={(e) => set("salon_price", e.target.value)} /></L>
      <L l="재고"><input className={inp} type="number" value={f.stock} onChange={(e) => set("stock", e.target.value)} /></L>
      <L l="요약설명" wide><input className={inp} value={f.summary} onChange={(e) => set("summary", e.target.value)} /></L>
      <L l="대표이미지 URL" wide><input className={inp} value={f.thumbnail_url} onChange={(e) => set("thumbnail_url", e.target.value)} placeholder="Supabase Storage 업로드 후 주소" /></L>
      <L l="상세설명" wide><textarea className={inp} rows={4} value={f.description} onChange={(e) => set("description", e.target.value)} /></L>
      <L l="판매상태"><select className={inp} value={f.status} onChange={(e) => set("status", e.target.value)}>
        <option value="draft">임시저장</option><option value="active">판매중</option><option value="soldout">품절</option><option value="hidden">숨김</option></select></L>
      <div className="flex flex-wrap gap-4 items-end text-sm">
        {[["is_best", "BEST"], ["is_new", "NEW"], ["is_timesale", "반짝할인"], ["vip_only", "VIP 전용"]].map(([k, l]) => (
          <label key={k} className="flex items-center gap-1.5"><input type="checkbox" className="accent-brand-600" checked={!!(f as Record<string, unknown>)[k]} onChange={(e) => set(k, e.target.checked)} />{l}</label>
        ))}
      </div>
      <div className="md:col-span-2 flex items-center gap-3">
        <button disabled={busy} className="rounded-lg bg-brand-600 text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-50">{p ? "수정 저장" : "상품 등록"}</button>
        <Msg m={msg} />
      </div>
    </form>
  );
}
