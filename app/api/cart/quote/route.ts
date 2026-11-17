import { NextResponse } from "next/server";
import { getProductsByIdsRaw } from "@/lib/data";
import { quote, type Grade } from "@/lib/pricing";
import { getViewer } from "@/lib/viewer";

// POST { lines: [{id, qty}], grade } → 서버 기준 가격·배송비 계산
// 등급은 서버가 로그인 정보로 판단 (브라우저가 보낸 grade는 목업 데모에서만 사용)
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const lines: { id: number; qty: number }[] = Array.isArray(body?.lines) ? body.lines : [];
  const v = await getViewer();
  const grade: Grade = v === "all" ? (["salon", "vip"].includes(body?.grade) ? body.grade : "general") : v === "guest" ? "general" : v;
  const products = await getProductsByIdsRaw(lines.map((l) => Number(l.id)));
  const q = quote(products, lines.map((l) => ({ id: Number(l.id), qty: Math.max(1, Number(l.qty) || 1) })), grade);
  // 로그인 전: 금액을 보내지 않음
  if (v === "guest") return NextResponse.json({ hidden: true, items: q.items.map((i) => ({ ...i, unit: 0, amount: 0 })), subtotal: 0, shipping: 0, total: 0 });
  return NextResponse.json(q);
}
