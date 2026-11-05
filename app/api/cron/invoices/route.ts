import { NextResponse } from "next/server";
import { adminEnabled, createServiceClient } from "@/lib/auth";
import { issueById } from "@/lib/admin/invoice-actions";

// 세금계산서 자동발행 — Vercel Cron (vercel.json) 이 매일 호출
// 결제완료 + 계산서 요청 주문은 DB 트리거가 'pending' 계산서를 만들고, 여기서 일괄 발행
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!adminEnabled()) return NextResponse.json({ ok: true, mock: true, issued: 0 });
  const { data } = await createServiceClient().from("tax_invoices").select("id").eq("status", "pending").limit(100);
  const results = [];
  for (const r of data ?? []) results.push({ id: r.id, ...(await issueById(r.id)) });
  return NextResponse.json({ ok: true, issued: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok).length, results });
}
