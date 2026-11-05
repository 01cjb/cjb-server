import { NextResponse } from "next/server";
import { getBrands, getCategories } from "@/lib/data";
export async function GET() {
  const [categories, brands] = await Promise.all([getCategories(), getBrands()]);
  return NextResponse.json({ categories, brands });
}
