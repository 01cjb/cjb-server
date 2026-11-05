import { NextResponse } from "next/server";
import { getProductsByIds } from "@/lib/data";
import { quote, type Grade } from "@/lib/pricing";

// POST { lines: [{id, qty}], grade } → 서버 기준 가격·배송비 계산
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const lines: { id: number; qty: number }[] = Array.isArray(body?.lines) ? body.lines : [];
  const grade: Grade = ["salon", "vip"].includes(body?.grade) ? body.grade : "general";
  const products = await getProductsByIds(lines.map((l) => Number(l.id)));
  return NextResponse.json(quote(products, lines.map((l) => ({ id: Number(l.id), qty: Math.max(1, Number(l.qty) || 1) })), grade));
}
