import "server-only";
import { createServiceClient } from "@/lib/auth";
import { issueTaxInvoice, vatSplit } from "@/lib/invoice";
import { company } from "@/lib/company";
import type { TaxInvoice } from "./types";

export async function issueById(id: number) {
  const db = createServiceClient();
  const { data: inv } = await db.from("tax_invoices").select("*").eq("id", id).single();
  if (!inv) return { ok: false, error: "계산서 없음" };
  if (!["pending", "failed"].includes(inv.status)) return { ok: false, error: `이미 ${inv.status} 상태입니다.` };
  const r = await issueTaxInvoice(inv as TaxInvoice);
  if (r.ok) await db.from("tax_invoices").update({ status: "issued", nts_confirm_no: r.confirmNo, provider: r.provider, issued_at: new Date().toISOString(), error: null }).eq("id", id);
  else await db.from("tax_invoices").update({ status: "failed", error: r.error, provider: r.provider }).eq("id", id);
  return r.ok ? { ok: true, confirmNo: r.confirmNo } : { ok: false, error: r.error };
}

// 주문 → 계산서 생성 (구매자 사업자정보 필요)
export async function createForOrder(orderId: number) {
  const db = createServiceClient();
  const { data: o } = await db.from("orders").select("*").eq("id", orderId).single();
  if (!o) return { ok: false, error: "주문 없음" };
  if (!["paid", "preparing", "shipped", "delivered"].includes(o.status)) return { ok: false, error: "결제완료 이후 주문만 발행할 수 있습니다." };
  const { data: p } = await db.from("profiles").select("*").eq("id", o.user_id).single();
  if (!p?.business_no) return { ok: false, error: "고객 사업자등록번호가 없습니다. 고객정보에서 먼저 입력하세요." };
  const { data: items } = await db.from("order_items").select("product_name, qty, unit_price").eq("order_id", orderId);
  const { supply, vat } = vatSplit(o.total);
  const { data, error } = await db.from("tax_invoices").insert({
    order_id: orderId, user_id: o.user_id, invoice_no: `TI${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${orderId}`,
    supplier: { biz_no: company.bizNo, company: company.name, ceo: company.ceo, address: company.address },
    buyer_biz_no: p.business_no, buyer_company: p.company_name ?? p.salon_name ?? p.name, buyer_ceo: p.ceo_name, buyer_email: p.tax_email ?? p.email,
    supply_amount: supply, vat_amount: vat, total_amount: o.total,
    items: (items ?? []).map((i) => ({ name: i.product_name, qty: i.qty, unit: i.unit_price })),
  }).select("id").single();
  if (error) return { ok: false, error: error.message.includes("duplicate") ? "이미 계산서가 있는 주문입니다." : error.message };
  await db.from("orders").update({ invoice_requested: true }).eq("id", orderId);
  return { ok: true, id: data.id };
}
