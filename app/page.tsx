import Link from "next/link";
import HeroSlider from "@/components/HeroSlider";
import CategoryGrid from "@/components/CategoryGrid";
import Section from "@/components/Section";
import ProductGrid from "@/components/ProductGrid";
import { getBanners, getBrands, getCategories, getProducts } from "@/lib/data";

export default async function Home() {
  const [banners, categories, brands, best, fresh, sale] = await Promise.all([
    getBanners(), getCategories(), getBrands(),
    getProducts({ flag: "best", limit: 8 }), getProducts({ flag: "new", limit: 8 }), getProducts({ flag: "timesale", limit: 4 }),
  ]);
  const ctx = { brands, categories };

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 pt-5 grid gap-6 md:grid-cols-[1.15fr_1fr]">
        <HeroSlider banners={banners} />
        <div className="rounded-2xl border border-neutral-100 p-5">
          <CategoryGrid categories={categories} />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        {[
          ["🎁", "신규가입 2,000원", "/login"],
          ["💈", "미용실회원 인증", "/salon-member"],
          ["📝", "국가고시 준비물", "/category/exam"],
          ["👑", "VIP 전용관", "/category/vip"],
        ].map(([i, t, h]) => (
          <Link key={h} href={h} className="flex items-center gap-3 rounded-xl bg-neutral-50 hover:bg-brand-50 px-4 py-3">
            <span className="text-xl">{i}</span><span className="font-medium">{t}</span>
          </Link>
        ))}
      </div>

      <Section title="금주 BEST" sub="원장님들이 가장 많이 찾은 상품" more="/category/best">
        <ProductGrid items={best} ranked {...ctx} />
      </Section>

      <Section title="⚡ 반짝 할인" sub="한정 수량 · 기간 한정 특가" more="/category/timesale" tint>
        <ProductGrid items={sale} {...ctx} />
      </Section>

      <Section title="NEW 신제품" sub="새로 입고된 전문가용 제품" more="/category/new">
        <ProductGrid items={fresh} {...ctx} />
      </Section>

      <Section title="브랜드관" more="/brands">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {brands.map((b) => (
            <Link key={b.id} href={`/brands?b=${b.slug}`} className="shrink-0 rounded-full border border-neutral-200 px-4 py-2 text-sm hover:border-brand-500 hover:text-brand-600">{b.name}</Link>
          ))}
        </div>
      </Section>
    </>
  );
}
