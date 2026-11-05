import CategoryGrid from "@/components/CategoryGrid";
import Link from "next/link";
import { getCategories } from "@/lib/data";
export default async function Categories() {
  const categories = await getCategories();
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
      <CategoryGrid categories={categories} title="전체 카테고리" />
      <div className="grid grid-cols-2 gap-2 text-sm">
        {[["BEST 추천상품", "/category/best"], ["NEW 신상품", "/category/new"], ["반짝할인", "/category/timesale"], ["VIP 전용관", "/category/vip"], ["브랜드관", "/brands"], ["미용실회원관", "/salon-member"]].map(([l, h]) => (
          <Link key={h} href={h} className="rounded-xl bg-neutral-50 px-4 py-3 font-medium">{l}</Link>
        ))}
      </div>
    </div>
  );
}
