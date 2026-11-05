import ProductGrid from "@/components/ProductGrid";
import { getBrands, getCategories, getProducts } from "@/lib/data";

export default async function Search({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const [categories, brands, items] = await Promise.all([getCategories(), getBrands(), q ? getProducts({ q }) : Promise.resolve([])]);
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <form action="/search" className="flex items-center bg-neutral-100 rounded-full px-4 mb-6">
        <input name="q" defaultValue={q} autoFocus placeholder="상품명, 브랜드 검색" className="flex-1 bg-transparent py-3 text-sm outline-none" />
        <button className="text-sm font-semibold text-brand-600">검색</button>
      </form>
      {q ? (<><p className="text-sm mb-4">‘<b>{q}</b>’ 검색결과 {items.length}건</p><ProductGrid items={items} brands={brands} categories={categories} /></>) : (
        <div className="text-sm"><p className="font-semibold mb-3">추천 검색어</p>
          <div className="flex flex-wrap gap-2">{["바리깡", "펌제", "로레알", "면도날", "아이롱", "국가고시"].map((k) => <a key={k} href={`/search?q=${k}`} className="rounded-full bg-neutral-100 px-3 py-1.5">#{k}</a>)}</div>
        </div>
      )}
    </div>
  );
}
