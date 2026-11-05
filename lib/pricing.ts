import type { Product } from "./types";
export type Grade = "general" | "salon" | "vip";
export const FREE_SHIPPING = 50000;
export const SHIPPING_FEE = 3000;

export const unitPrice = (p: Product, grade: Grade) => (grade !== "general" && p.salon_price ? p.salon_price : p.price);

export function quote(products: Product[], lines: { id: number; qty: number }[], grade: Grade) {
  const items = lines
    .map((l) => {
      const p = products.find((x) => x.id === l.id);
      if (!p) return null;
      const unit = unitPrice(p, grade);
      const blocked = p.vip_only && grade !== "vip";
      return { id: p.id, name: p.name, unit, qty: l.qty, amount: unit * l.qty, blocked, thumbnail_url: p.thumbnail_url ?? null, brand_id: p.brand_id, category_id: p.category_id };
    })
    .filter((x): x is NonNullable<typeof x> => !!x);
  const subtotal = items.filter((i) => !i.blocked).reduce((a, i) => a + i.amount, 0);
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING ? 0 : SHIPPING_FEE;
  return { items, subtotal, shipping, total: subtotal + shipping };
}
