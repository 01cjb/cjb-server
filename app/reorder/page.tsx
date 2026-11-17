import Link from "next/link";
import { redirect } from "next/navigation";
import ReorderList, { type ReorderItem } from "@/components/home/ReorderList";
import { getBrands, getCategories, getProductsByIdsRaw } from "@/lib/data";
import { getMe, myOrders } from "@/lib/me";
import { unitPrice } from "@/lib/pricing";

export const metadata = { title: "재주문" };

const md = (iso: string) => { const d = new Date(new Date(iso).getTime() + 9 * 3600e3); return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`; };

export default async function Reorder() {
  const me = await getMe();
  if (!me.user) redirect("/login?next=/reorder");
  const [orders, brands, categories] = await Promise.all([myOrders(), getBrands(), getCategories()]);
  const stat = new Map<number, { times: number; lastQty: number; lastDate: string }>();
  for (const o of orders.filter((o) => o.status !== "cancelled")) {
    for (const it of o.items ?? []) {
      if (!it.product_id) continue;
      const s = stat.get(it.product_id);
      if (s) s.times++; else stat.set(it.product_id, { times: 1, lastQty: it.qty, lastDate: md(o.created_at) }); // 주문은 최신순
    }
  }
  const ids = [...stat.keys()];
  const products = ids.length ? await getProductsByIdsRaw(ids) : [];
  const items: ReorderItem[] = products.map((p) => ({
    id: p.id, name: p.name, brand: brands.find((b) => b.id === p.brand_id)?.name, icon: categories.find((c) => c.id === p.category_id)?.icon,
    thumb: p.thumbnail_url, price: unitPrice(p, me.user!.grade_id), soldout: p.status !== "active" || p.stock <= 0, ...stat.get(p.id)!,
  })).sort((a, b) => b.times - a.times);

  return (
    <div className="max-w-3xl mx-auto px-4 py-5 grid gap-3 pb-28 @3xl:pb-10">
      <h1 className="text-xl font-bold">재주문</h1>
      <p className="rounded-2xl border border-gold-100 bg-gold-50 px-4 py-3 text-[12.5px] leading-relaxed text-gold-ink">지난번에 주문한 상품을 골라 한 번에 담을 수 있어요. 수량은 지난 주문과 같게 담기고, 장바구니에서 바꿀 수 있어요.</p>
      {items.length ? <ReorderList items={items} /> : (
        <div className="rounded-[20px] border border-[#ece6f1] bg-white py-14 text-center text-sm text-neutral-500">
          아직 주문한 상품이 없어요.<br /><Link href="/category/best" className="mt-4 inline-block rounded-xl bg-plum px-4 py-2.5 font-bold text-white">BEST 상품 보러가기</Link>
        </div>
      )}
    </div>
  );
}
