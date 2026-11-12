import "server-only";
import { adminEnabled, createServiceClient } from "@/lib/auth";
import * as m from "./mock";
import { products as mockProducts } from "@/lib/mock";
import type { Product } from "@/lib/types";
import type { Carrier, ConsentDoc, Contract, Customer, ImportBatch, Order, SalonVerification, Shipment, TaxInvoice } from "./types";

// 관리자 데이터 접근 (service role) — DB 미연결 시 목업 데이터
const db = () => createServiceClient();
const live = () => adminEnabled();

export async function listAdminProducts(status?: string, q?: string): Promise<Product[]> {
  if (!live()) {
    let l = mockProducts.map((p, i) => ({ ...p, status: (i === 17 ? "cancelled" : i === 14 ? "hidden" : p.status) as Product["status"] }));
    if (status && status !== "all") l = l.filter((p) => p.status === status);
    if (q) l = l.filter((p) => p.name.includes(q));
    return l;
  }
  let query = db().from("products").select("*").order("id", { ascending: false }).limit(500);
  if (status && status !== "all") query = query.eq("status", status);
  if (q) query = query.ilike("name", `%${q}%`);
  const { data } = await query;
  return (data as Product[]) ?? [];
}

export async function productStatusCounts(): Promise<Record<string, number>> {
  const list = live() ? ((await db().from("products").select("status")).data ?? []) : await listAdminProducts();
  const c: Record<string, number> = { all: list.length };
  for (const p of list as { status: string }[]) c[p.status] = (c[p.status] ?? 0) + 1;
  return c;
}

export async function getAdminProduct(id: number): Promise<Product | null> {
  if (!live()) return mockProducts.find((p) => p.id === id) ?? null;
  const { data } = await db().from("products").select("*").eq("id", id).maybeSingle();
  return (data as Product) ?? null;
}

export async function listBatches(): Promise<ImportBatch[]> {
  if (!live()) return m.batches;
  const { data } = await db().from("product_import_batches").select("*").order("id", { ascending: false }).limit(50);
  return (data as ImportBatch[]) ?? [];
}

export async function listCustomers(q?: string, grade?: string): Promise<Customer[]> {
  let list: Customer[];
  if (!live()) list = m.customers;
  else {
    const { data } = await db().from("profiles").select("*").order("created_at", { ascending: false }).limit(500);
    const { data: os } = await db().from("orders").select("user_id,total,status");
    list = ((data as Customer[]) ?? []).map((c) => {
      const mine = (os ?? []).filter((o) => o.user_id === c.id && o.status !== "cancelled");
      return { ...c, order_count: mine.length, order_total: mine.reduce((a, o) => a + o.total, 0) };
    });
  }
  if (grade && grade !== "all") list = list.filter((c) => c.grade_id === grade);
  if (q) list = list.filter((c) => [c.name, c.email, c.phone, c.company_name, c.business_no].some((v) => v?.includes(q)));
  return list;
}

export async function getCustomer(id: string) {
  if (!live()) {
    const c = m.customers.find((x) => x.id === id) ?? null;
    return { customer: c, orders: m.orders.filter((o) => o.user_id === id), contracts: m.contracts.filter((x) => x.user_id === id), consents: c?.id === m.DEMO_USER_ID ? m.demoConsents : [], addresses: [] as { id: number; label: string; receiver_name: string; phone: string; address1: string; address2?: string | null; is_default: boolean }[] };
  }
  const [c, o, k, cs, ad] = await Promise.all([
    db().from("profiles").select("*").eq("id", id).maybeSingle(),
    db().from("orders").select("*").eq("user_id", id).order("created_at", { ascending: false }),
    db().from("contracts").select("*").eq("user_id", id),
    db().from("user_consent_current").select("*").eq("user_id", id),
    db().from("customer_addresses").select("*").eq("user_id", id),
  ]);
  return { customer: c.data as Customer | null, orders: (o.data as Order[]) ?? [], contracts: (k.data as Contract[]) ?? [], consents: cs.data ?? [], addresses: ad.data ?? [] };
}

export async function listOrders(status?: string): Promise<Order[]> {
  let list: Order[];
  if (!live()) list = m.orders.map((o) => ({ ...o, customer_name: m.customers.find((c) => c.id === o.user_id)?.name }));
  else {
    // orders.user_id 는 auth.users 를 가리켜 profiles 와 직접 조인(embed)이 안 됨 → 이름은 따로 조회
    const { data, error } = await db().from("orders").select("*").order("created_at", { ascending: false }).limit(500);
    if (error) console.error("listOrders:", error.message);
    const rows = (data ?? []) as Order[];
    const ids = [...new Set(rows.map((o) => o.user_id).filter((x): x is string => !!x))];
    const names: Record<string, string> = {};
    if (ids.length) {
      const { data: ps } = await db().from("profiles").select("id,name").in("id", ids);
      for (const p of (ps ?? []) as { id: string; name: string }[]) names[p.id] = p.name;
    }
    list = rows.map((o) => ({ ...o, customer_name: (o.user_id && names[o.user_id]) || undefined }));
  }
  return status && status !== "all" ? list.filter((o) => o.status === status) : list;
}

export async function getOrder(id: number): Promise<{ order: Order | null; shipments: Shipment[]; invoice: TaxInvoice | null }> {
  if (!live()) {
    const order = m.orders.find((o) => o.id === id) ?? null;
    return { order, shipments: m.shipments.filter((s) => s.order_id === id), invoice: m.invoices.find((i) => i.order_id === id) ?? null };
  }
  const [o, it, sh, inv] = await Promise.all([
    db().from("orders").select("*").eq("id", id).maybeSingle(),
    db().from("order_items").select("*").eq("order_id", id),
    db().from("shipments").select("*, events:shipment_events(*)").eq("order_id", id).order("id"),
    db().from("tax_invoices").select("*").eq("order_id", id).maybeSingle(),
  ]);
  return { order: o.data ? { ...(o.data as Order), items: it.data ?? [] } : null, shipments: (sh.data as Shipment[]) ?? [], invoice: (inv.data as TaxInvoice) ?? null };
}

export async function listCarriers(): Promise<Carrier[]> {
  if (!live()) return m.carriers;
  const { data } = await db().from("carriers").select("*").order("name");
  return (data as Carrier[]) ?? [];
}

export async function listShipments(status?: string): Promise<Shipment[]> {
  let list: Shipment[];
  if (!live()) list = m.shipments.map((s) => { const o = m.orders.find((x) => x.id === s.order_id); return { ...s, order_no: o?.order_no, receiver_name: o?.receiver_name }; });
  else {
    const { data } = await db().from("shipments").select("*, orders(order_no, receiver_name)").order("id", { ascending: false }).limit(500);
    list = ((data ?? []) as (Shipment & { orders?: { order_no: string; receiver_name: string } })[]).map((s) => ({ ...s, order_no: s.orders?.order_no, receiver_name: s.orders?.receiver_name }));
  }
  return status && status !== "all" ? list.filter((s) => s.status === status) : list;
}

export async function listContracts(): Promise<Contract[]> {
  if (!live()) return m.contracts;
  const { data } = await db().from("contracts").select("*").order("created_at", { ascending: false });
  return (data as Contract[]) ?? [];
}

export async function listInvoices(status?: string): Promise<TaxInvoice[]> {
  let list: TaxInvoice[];
  if (!live()) list = m.invoices.map((i) => ({ ...i, order_no: m.orders.find((o) => o.id === i.order_id)?.order_no }));
  else {
    const { data } = await db().from("tax_invoices").select("*, orders(order_no)").order("id", { ascending: false }).limit(500);
    list = ((data ?? []) as (TaxInvoice & { orders?: { order_no: string } })[]).map((i) => ({ ...i, order_no: i.orders?.order_no }));
  }
  return status && status !== "all" ? list.filter((i) => i.status === status) : list;
}

export async function getInvoice(id: number): Promise<TaxInvoice | null> {
  if (!live()) return m.invoices.find((i) => i.id === id) ?? null;
  const { data } = await db().from("tax_invoices").select("*").eq("id", id).maybeSingle();
  return (data as TaxInvoice) ?? null;
}

export async function listSalonRequests(): Promise<SalonVerification[]> {
  if (!live()) return m.salonRequests;
  const { data } = await db().from("salon_verifications").select("*").order("created_at", { ascending: false });
  return (data as SalonVerification[]) ?? [];
}

export async function listConsentDocs(): Promise<ConsentDoc[]> {
  if (!live()) return m.consentDocs;
  const { data } = await db().from("consent_documents").select("*").order("code").order("effective_at", { ascending: false });
  return (data as ConsentDoc[]) ?? [];
}

export async function consentStats(): Promise<{ code: string; agreed: number; total: number }[]> {
  if (!live()) {
    const total = m.customers.length;
    return m.consentDocs.map((d) => ({ code: d.code, agreed: d.code === "marketing" ? m.customers.filter((c) => c.marketing_agree).length : total, total }));
  }
  const { data } = await db().from("user_consent_current").select("code, agreed");
  const by: Record<string, { agreed: number; total: number }> = {};
  for (const r of data ?? []) { by[r.code] ??= { agreed: 0, total: 0 }; by[r.code].total++; if (r.agreed) by[r.code].agreed++; }
  return Object.entries(by).map(([code, v]) => ({ code, ...v }));
}

export async function dashboard() {
  const [orders, ships, invs, salon, pc] = await Promise.all([listOrders(), listShipments(), listInvoices(), listSalonRequests(), productStatusCounts()]);
  const today = new Date().toISOString().slice(0, 10);
  return {
    todayOrders: orders.filter((o) => o.created_at.slice(0, 10) === today).length,
    pendingPay: orders.filter((o) => o.status === "pending").length,
    toShip: orders.filter((o) => o.status === "paid" || o.status === "preparing").length,
    inTransit: ships.filter((s) => ["picked_up", "in_transit", "out_for_delivery"].includes(s.status)).length,
    invoicePending: invs.filter((i) => i.status === "pending" || i.status === "failed").length,
    salonPending: salon.filter((s) => s.status === "pending").length,
    sales: orders.filter((o) => o.status !== "cancelled" && o.status !== "pending").reduce((a, o) => a + o.total, 0),
    products: pc,
    recentOrders: orders.slice(0, 6),
  };
}

export type StaffRow = { id: string; name: string; email: string; role: "staff" | "admin"; is_test: boolean; status: string; created_at: string; last_login_at?: string | null };
export type AuditRow = { id: number; target_email: string | null; from_role: string | null; to_role: string | null; note: string | null; created_at: string };

export async function listStaff(): Promise<{ staff: StaffRow[]; audit: AuditRow[] }> {
  if (!live()) return {
    staff: [{ id: "00000000-0000-0000-0000-000000000009", name: "관리자(예시)", email: "admin@example.com", role: "admin", is_test: true, status: "active", created_at: "2026-11-01T00:00:00Z" }],
    audit: [{ id: 1, target_email: "admin@example.com", from_role: "customer", to_role: "admin", note: "테스트 관리자 지정", created_at: "2026-11-05T06:00:00Z" }],
  };
  const [s, a] = await Promise.all([
    db().from("profiles").select("id,name,email,role,is_test,status,created_at,last_login_at").in("role", ["staff", "admin"]).order("role").order("created_at"),
    db().from("admin_audit").select("id,target_email,from_role,to_role,note,created_at").order("id", { ascending: false }).limit(30),
  ]);
  return { staff: (s.data as StaffRow[]) ?? [], audit: (a.data as AuditRow[]) ?? [] };
}
