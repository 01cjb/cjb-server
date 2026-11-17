export type Category = { id: number; slug: string; name: string; icon: string; sort: number };
export type Brand = { id: number; slug: string; name: string; sort: number };
export type Product = {
  id: number;
  name: string;
  brand_id: number | null;
  category_id: number | null;
  model_no?: string | null;
  summary?: string | null;
  description?: string | null;
  consumer_price?: number | null;
  price: number;
  salon_price?: number | null;
  price_hidden?: boolean; // 로그인 전: 가격 비공개(서버에서 가격을 지우고 보냄)
  has_vip_price?: boolean; // VIP가가 있지만 숫자는 보내지 않음
  stock: number;
  thumbnail_url?: string | null;
  badges: string[];
  is_best: boolean;
  is_new: boolean;
  is_timesale: boolean;
  vip_only: boolean;
  status: "active" | "soldout" | "hidden" | "draft" | "cancelled";
  sku?: string | null;
  cancel_reason?: string | null;
  cancelled_at?: string | null;
  created_at?: string;
};
export type Banner = { id: number; title: string; subtitle?: string | null; link?: string | null; bg_color?: string | null; image_url?: string | null; sort: number };
export type ProductQuery = { category?: string; brand?: string; q?: string; flag?: "best" | "new" | "timesale" | "vip"; sort?: "new" | "price_asc" | "price_desc" | "name"; limit?: number };
