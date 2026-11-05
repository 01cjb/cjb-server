import { NextResponse } from "next/server";
import { getProducts, getProductsByIds } from "@/lib/data";
import type { ProductQuery } from "@/lib/types";

// GET /api/products?category=&brand=&q=&flag=&sort=&limit=&ids=1,2,3
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const ids = sp.get("ids");
  if (ids) return NextResponse.json(await getProductsByIds(ids.split(",").map(Number).filter(Boolean)));
  const q: ProductQuery = {
    category: sp.get("category") ?? undefined,
    brand: sp.get("brand") ?? undefined,
    q: sp.get("q") ?? undefined,
    flag: (sp.get("flag") as ProductQuery["flag"]) ?? undefined,
    sort: (sp.get("sort") as ProductQuery["sort"]) ?? undefined,
    limit: sp.get("limit") ? Number(sp.get("limit")) : undefined,
  };
  return NextResponse.json(await getProducts(q));
}
