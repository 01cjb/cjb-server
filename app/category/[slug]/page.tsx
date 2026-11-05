import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import ProductGrid from "@/components/ProductGrid";
import SortBar from "@/components/SortBar";
import { getBrands, getCategories, getProducts } from "@/lib/data";
import type { ProductQuery } from "@/lib/types";

const special: Record<string, { title: string; flag: NonNullable<ProductQuery["flag"]> | null }> = {
  best: { title: "BEST 추천상품", flag: "best" },
  new: { title: "NEW 신상품", flag: "new" },
  timesale: { title: "반짝 할인", flag: "timesale" },
  vip: { title: "★ VIP 전용관 ★", flag: "vip" },
  all: { title: "전체상품", flag: null },
};

export default async function CategoryPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ sort?: ProductQuery["sort"] }> }) {
  const { slug } = await params;
  const { sort } = await searchParams;
  const [categories, brands] = await Promise.all([getCategories(), getBrands()]);
  const sp = special[slug];
  const cat = categories.find((c) => c.slug === slug);
  if (!sp && !cat) notFound();

  const items = await getProducts(sp ? { flag: sp.flag ?? undefined, sort } : { category: slug, sort });
  const title = sp?.title ?? cat!.name;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <nav className="text-xs text-neutral-400 mb-3"><Link href="/">홈</Link> › {title}</nav>
      <h1 className="text-2xl font-bold mb-4">{title}</h1>
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
        <Link href="/category/all" className={`shrink-0 rounded-full px-4 py-1.5 text-sm border ${slug === "all" ? "bg-neutral-900 text-white border-neutral-900" : "border-neutral-200"}`}>전체</Link>
        {categories.map((c) => (
          <Link key={c.id} href={`/category/${c.slug}`} className={`shrink-0 rounded-full px-4 py-1.5 text-sm border ${c.slug === slug ? "bg-neutral-900 text-white border-neutral-900" : "border-neutral-200"}`}>{c.name}</Link>
        ))}
      </div>
      <Suspense><SortBar count={items.length} /></Suspense>
      <ProductGrid items={items} brands={brands} categories={categories} ranked={slug === "best"} />
    </div>
  );
}
