import Link from "next/link";
import ProductGrid from "@/components/ProductGrid";
import BrandDirectory, { Monogram, type BrandCard } from "@/components/BrandDirectory";
import { getBrands, getCategories, getProducts } from "@/lib/data";

export const metadata = { title: "브랜드관" };

export default async function Brands({ searchParams }: { searchParams: Promise<{ b?: string }> }) {
  const { b } = await searchParams;
  const [brands, categories, all] = await Promise.all([getBrands(), getCategories(), getProducts()]);
  const cur = brands.find((x) => x.slug === b);

  if (cur) {
    const items = all.filter((p) => p.brand_id === cur.id);
    return (
      <div className="max-w-6xl mx-auto px-4 py-5">
        <Link href="/brands" className="text-[13px] font-semibold text-brand-600">‹ 전체 브랜드</Link>
        <div className="mt-3 mb-5 flex items-center gap-3.5 rounded-2xl bg-white p-4 ring-1 ring-[#ece6f1]">
          <Monogram id={cur.id} name={cur.name} className="size-14 text-xl" />
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold">{cur.name}</h1>
            <p className="text-[13px] text-neutral-500">상품 {items.length}개</p>
          </div>
        </div>
        {items.length ? <ProductGrid items={items} brands={brands} categories={categories} /> : <p className="py-16 text-center text-sm text-neutral-400">곧 상품이 입고될 예정이에요.</p>}
      </div>
    );
  }

  const cards: BrandCard[] = brands.map((x) => {
    const mine = all.filter((p) => p.brand_id === x.id);
    const cats = [...new Set(mine.map((p) => categories.find((c) => c.id === p.category_id)?.name).filter((n): n is string => !!n))].slice(0, 2);
    return { id: x.id, slug: x.slug, name: x.name, count: mine.length, cats };
  });
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold">브랜드관</h1>
      <p className="mt-1 mb-4 text-[13px] text-neutral-500">전문가용 브랜드 <b className="text-plum">{brands.length}곳</b>을 한곳에서 만나보세요</p>
      <BrandDirectory brands={cards} />
    </div>
  );
}
