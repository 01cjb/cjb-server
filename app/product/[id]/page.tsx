import { notFound } from "next/navigation";
import Link from "next/link";
import ProductThumb from "@/components/ProductThumb";
import Price from "@/components/Price";
import BuyBox from "@/components/BuyBox";
import Section from "@/components/Section";
import ProductGrid from "@/components/ProductGrid";
import { getBrands, getCategories, getProduct, getProducts } from "@/lib/data";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await getProduct(Number(id));
  if (!p) notFound();
  const [categories, brands] = await Promise.all([getCategories(), getBrands()]);
  const cat = categories.find((c) => c.id === p.category_id);
  const brand = brands.find((b) => b.id === p.brand_id);
  const related = (await getProducts({ category: cat?.slug, limit: 5 })).filter((x) => x.id !== p.id).slice(0, 4);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <nav className="text-xs text-neutral-400 mb-4"><Link href="/">홈</Link> › {cat && <Link href={`/category/${cat.slug}`}>{cat.name}</Link>}</nav>
      <div className="grid gap-8 md:grid-cols-2">
        <div className="aspect-square rounded-2xl overflow-hidden border border-neutral-100">
          <ProductThumb id={p.id} src={p.thumbnail_url} label={brand?.name} icon={cat?.icon} />
        </div>
        <div>
          {brand && <Link href={`/brands?b=${brand.slug}`} className="text-sm text-brand-600 font-medium">{brand.name} ›</Link>}
          <h1 className="text-xl md:text-2xl font-bold mt-1 leading-snug">{p.name}</h1>
          {p.summary && <p className="text-sm text-neutral-500 mt-2">{p.summary}</p>}
          <div className="mt-5 pb-5 border-b border-neutral-200"><Price p={p} large /></div>
          <dl className="grid grid-cols-[90px_1fr] gap-y-2 text-sm py-5 border-b border-neutral-200">
            {p.model_no && (<><dt className="text-neutral-500">모델명</dt><dd>{p.model_no}</dd></>)}
            <dt className="text-neutral-500">배송비</dt><dd>3,000원 (50,000원 이상 무료배송)</dd>
            <dt className="text-neutral-500">적립금</dt><dd>구매금액의 1%</dd>
            {p.vip_only && (<><dt className="text-neutral-500">구매조건</dt><dd className="text-accent font-medium">VIP 회원 전용 상품</dd></>)}
          </dl>
          <BuyBox p={p} />
        </div>
      </div>

      <div className="mt-14">
        <div className="flex border-b border-neutral-200 text-sm font-medium">
          <span className="px-5 py-3 border-b-2 border-neutral-900">상세정보</span>
          <span className="px-5 py-3 text-neutral-400">상품후기</span>
          <span className="px-5 py-3 text-neutral-400">상품문의</span>
          <span className="px-5 py-3 text-neutral-400">배송/교환</span>
        </div>
        <div className="py-12 text-center text-neutral-400 text-sm bg-neutral-50 rounded-b-xl">
          {p.description ?? "상세 이미지 영역 (관리자에서 상세페이지 이미지 업로드)"}
        </div>
      </div>

      {related.length > 0 && (
        <Section title="함께 보면 좋은 상품">
          <ProductGrid items={related} brands={brands} categories={categories} />
        </Section>
      )}
    </div>
  );
}
