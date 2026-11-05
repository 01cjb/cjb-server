import "server-only";
import { createClient } from "@supabase/supabase-js";
import * as mock from "./mock";
import type { Banner, Brand, Category, Product, ProductQuery } from "./types";

// Supabase 환경변수가 있으면 실제 DB, 없으면 목업 데이터 사용
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const useDb = !!(url && anon && process.env.USE_MOCK !== "1");
const db = () => createClient(url!, anon!, { auth: { persistSession: false } });

export async function getCategories(): Promise<Category[]> {
  if (!useDb) return mock.categories;
  const { data } = await db().from("categories").select("*").is("parent_id", null).order("sort");
  return (data as Category[]) ?? [];
}

export async function getBrands(): Promise<Brand[]> {
  if (!useDb) return mock.brands;
  const { data } = await db().from("brands").select("*").order("sort");
  return (data as Brand[]) ?? [];
}

export async function getBanners(): Promise<Banner[]> {
  if (!useDb) return mock.banners;
  const { data } = await db().from("banners").select("*").eq("active", true).order("sort");
  return (data as Banner[]) ?? [];
}

export async function getProducts(q: ProductQuery = {}): Promise<Product[]> {
  const cats = await getCategories();
  const catId = q.category ? cats.find((c) => c.slug === q.category)?.id : undefined;
  const brandId = q.brand ? (await getBrands()).find((x) => x.slug === q.brand)?.id : undefined;

  if (!useDb) {
    let list = mock.products.filter((p) => p.status !== "hidden");
    if (catId) list = list.filter((p) => p.category_id === catId);
    if (brandId) list = list.filter((p) => p.brand_id === brandId);
    if (q.flag === "best") list = list.filter((p) => p.is_best);
    if (q.flag === "new") list = list.filter((p) => p.is_new);
    if (q.flag === "timesale") list = list.filter((p) => p.is_timesale);
    if (q.flag === "vip") list = list.filter((p) => p.vip_only);
    if (q.q) list = list.filter((p) => p.name.toLowerCase().includes(q.q!.toLowerCase()));
    list = sortList(list, q.sort);
    return q.limit ? list.slice(0, q.limit) : list;
  }

  let query = db().from("products").select("*").neq("status", "hidden");
  if (catId) query = query.eq("category_id", catId);
  if (brandId) query = query.eq("brand_id", brandId);
  if (q.flag === "best") query = query.eq("is_best", true);
  if (q.flag === "new") query = query.eq("is_new", true);
  if (q.flag === "timesale") query = query.eq("is_timesale", true);
  if (q.flag === "vip") query = query.eq("vip_only", true);
  if (q.q) query = query.ilike("name", `%${q.q}%`);
  const [col, asc] =
    q.sort === "price_asc" ? ["price", true] : q.sort === "price_desc" ? ["price", false] : q.sort === "name" ? ["name", true] : ["created_at", false];
  query = query.order(col as string, { ascending: asc as boolean });
  if (q.limit) query = query.limit(q.limit);
  const { data } = await query;
  return (data as Product[]) ?? [];
}

export async function getProduct(id: number): Promise<Product | null> {
  if (!useDb) return mock.products.find((p) => p.id === id) ?? null;
  const { data } = await db().from("products").select("*").eq("id", id).maybeSingle();
  return (data as Product) ?? null;
}

export async function getProductsByIds(ids: number[]): Promise<Product[]> {
  if (!ids.length) return [];
  if (!useDb) return mock.products.filter((p) => ids.includes(p.id));
  const { data } = await db().from("products").select("*").in("id", ids);
  return (data as Product[]) ?? [];
}

function sortList(list: Product[], sort?: ProductQuery["sort"]) {
  const l = [...list];
  if (sort === "price_asc") l.sort((a, b) => a.price - b.price);
  else if (sort === "price_desc") l.sort((a, b) => b.price - a.price);
  else if (sort === "name") l.sort((a, b) => a.name.localeCompare(b.name, "ko"));
  else l.sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
  return l;
}

export const won = (n?: number | null) => (n == null ? "" : n.toLocaleString("ko-KR") + "원");
