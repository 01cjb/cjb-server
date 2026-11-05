import { NextResponse } from "next/server";
import { adminEnabled, authEnabled } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createForOrder, issueById } from "@/lib/admin/invoice-actions";

// POST {order_no} — 회원이 구매내역에서 세금계산서 발행 요청 → 생성 후 자동 발행
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  if (!b.order_no) return NextResponse.json({ error: "주문번호가 필요합니다." }, { status: 400 });
  if (!authEnabled() || !adminEnabled()) return NextResponse.json({ ok: true, mock: true, message: "목업 모드: 발행 요청이 접수된 것으로 표시됩니다." });
  const sb = await createClient();
  const { data: o } = await sb.from("orders").select("id").eq("order_no", b.order_no).maybeSingle(); // RLS: 본인 주문만
  if (!o) return NextResponse.json({ error: "주문을 찾을 수 없습니다." }, { status: 404 });
  const c = await createForOrder(o.id);
  if (!c.ok) return NextResponse.json({ error: c.error }, { status: 400 });
  const r = await issueById(c.id!);
  return NextResponse.json({ ok: true, id: c.id, issued: r.ok, error: r.ok ? undefined : r.error });
}
