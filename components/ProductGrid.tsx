import type { Brand, Category, Product } from "@/lib/types";
import ProductCard from "./ProductCard";

export default function ProductGrid({ items, brands, categories, ranked = false, cols = 4 }: { items: Product[]; brands: Brand[]; categories: Category[]; ranked?: boolean; cols?: 4 | 5 }) {
  if (!items.length) return <p className="py-16 text-center text-neutral-400 text-sm">상품이 없습니다.</p>;
  return (
    <div className={`grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 ${cols === 5 ? "lg:grid-cols-5" : "lg:grid-cols-4"}`}>
      {items.map((p, i) => (
        <ProductCard key={p.id} p={p} rank={ranked ? i + 1 : undefined}
          brand={brands.find((b) => b.id === p.brand_id)?.name}
          icon={categories.find((c) => c.id === p.category_id)?.icon} />
      ))}
    </div>
  );
}
