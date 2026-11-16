import Link from "next/link";
import ProductGrid from "@/components/ProductGrid";
import { getBanners, getBrands, getCategories, getProducts } from "@/lib/data";

export const metadata = { title: "이벤트" };

export default async function Events() {
  const [banners, brands, categories, sale] = await Promise.all([getBanners(), getBrands(), getCategories(), getProducts({ flag: "timesale", limit: 8 })]);
  return (
    <div className="max-w-6xl mx-auto px-4 py-5 grid gap-4">
      <h1 className="text-xl font-bold">이벤트·기획전</h1>
      <div className="grid gap-3 @3xl:grid-cols-2">
        {banners.map((b) => (
          <Link key={b.id} href={b.link ?? "/"} className="block overflow-hidden rounded-[18px] border border-[#ece6f1] bg-white">
            <div className="flex h-32 flex-col justify-center px-5" style={{ background: b.bg_color ?? "#ede3f6" }}>
              <b className="text-lg text-neutral-900">{b.title}</b>
              {b.subtitle && <small className="mt-1 text-neutral-700">{b.subtitle}</small>}
            </div>
            <div className="flex justify-between px-4 py-3 text-[12.5px]"><span className="text-neutral-500">진행 중</span><span className="font-bold text-brand-600">자세히 ›</span></div>
          </Link>
        ))}
        {!banners.length && <p className="py-10 text-center text-sm text-neutral-500 @3xl:col-span-2">진행 중인 이벤트가 없어요.</p>}
      </div>
      <div className="mt-4 flex items-end justify-between"><h2 className="text-lg font-bold">⚡ 반짝 할인</h2><Link href="/category/timesale" className="text-sm text-neutral-500">더보기 ›</Link></div>
      <ProductGrid items={sale} brands={brands} categories={categories} />
    </div>
  );
}
