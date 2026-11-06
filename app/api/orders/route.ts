import { NextResponse } from "next/server";
import { getProductsByIds } from "@/lib/data";
import { quote, type Grade } from "@/lib/pricing";
import { adminEnabled, createServiceClient, currentUser } from "@/lib/auth";
import { needsConsent } from "@/lib/consent";

// POST /api/orders — 주문 생성 (결제 연동 전: status=pending)
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const lines: { id: number; qty: number }[] = Array.isArray(body?.lines) ? body.lines : [];
  const r = body?.receiver ?? {};
  if (!lines.length) return NextResponse.json({ error: "장바구니가 비어 있습니다." }, { status: 400 });
  if (!r.name || !r.phone || !r.address) return NextResponse.json({ error: "배송 정보를 입력해 주세요." }, { status: 400 });

  const user = await currentUser();
  // DB 미연결(목업) 상태에서는 데모 등급 허용, DB 연결 시에는 DB 등급만 사용
  const grade: Grade = adminEnabled() ? user.grade : (["salon", "vip"].includes(body?.grade) ? body.grade : "general");
  const products = await getProductsByIds(lines.map((l) => Number(l.id)));
  const q = quote(products, lines.map((l) => ({ id: Number(l.id), qty: Math.max(1, Number(l.qty) || 1) })), grade);
  if (q.items.some((i) => i.blocked)) return NextResponse.json({ error: "VIP 전용 상품이 포함되어 있습니다." }, { status: 403 });

  const orderNo = `BW${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  if (!adminEnabled()) return NextResponse.json({ mock: true, orderNo, ...q });

  const db = createServiceClient();
  // 소셜 가입 후 약관 동의를 건너뛴 회원은 주문 불가
  if (user.id && (await needsConsent(db, user.id))) return NextResponse.json({ error: "필수 약관 동의 후 주문할 수 있습니다.", consent: true }, { status: 403 });
  const { data: order, error } = await db.from("orders").insert({
    order_no: orderNo, user_id: user.id, subtotal: q.subtotal, shipping_fee: q.shipping, total: q.total,
    receiver_name: String(r.name), receiver_phone: String(r.phone), address: String(r.address), memo: r.memo ? String(r.memo) : null, invoice_requested: !!body?.invoice,
  }).select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { error: e2 } = await db.from("order_items").insert(
    q.items.map((i) => ({ order_id: order.id, product_id: i.id, product_name: i.name, unit_price: i.unit, qty: i.qty }))
  );
  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });
  return NextResponse.json({ orderNo, ...q });
}
