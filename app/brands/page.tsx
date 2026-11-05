import Link from "next/link";
import ProductGrid from "@/components/ProductGrid";
import { getBrands, getCategories, getProducts } from "@/lib/data";
export default async function Brands({ searchParams }: { searchParams: Promise<{ b?: string }> }) {
  const { b } = await searchParams;
  const [brands, categories] = await Promise.all([getBrands(), getCategories()]);
  const cur = brands.find((x) => x.slug === b);
  const items = cur ? await getProducts({ brand: cur.slug }) : [];
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-5">브랜드관</h1>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 mb-8">
        {brands.map((x) => (
          <Link key={x.id} href={`/brands?b=${x.slug}`} className={`rounded-xl border px-2 py-4 text-center text-sm ${x.slug === b ? "border-brand-600 bg-brand-50 text-brand-700 font-semibold" : "border-neutral-200"}`}>{x.name}</Link>
        ))}
      </div>
      {cur && (<><h2 className="text-lg font-bold mb-4">{cur.name} <span className="text-neutral-400 text-sm">{items.length}</span></h2><ProductGrid items={items} brands={brands} categories={categories} /></>)}
    </div>
  );
}
