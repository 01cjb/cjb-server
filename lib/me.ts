import "server-only";
import { authEnabled } from "./auth";
import { createClient } from "./supabase/server";
import * as m from "./admin/mock";
import type { ConsentState, Contract, Customer, Order, Shipment, TaxInvoice, Carrier, Address } from "./admin/types";

// 로그인 회원 본인 데이터 (RLS 적용 클라이언트) — 목업 모드는 데모 회원
export type Me = { mock: boolean; user: Customer | null };

export async function getMe(): Promise<Me> {
  if (!authEnabled()) return { mock: true, user: m.customers[0] };
  const sb = await createClient();
  const { data } = await sb.auth.getUser();
  if (!data.user) return { mock: false, user: null };
  const { data: p } = await sb.from("profiles").select("*").eq("id", data.user.id).maybeSingle();
  return { mock: false, user: p ? ({ ...p, email: p.email ?? data.user.email } as Customer) : null };
}

export async function myOrders(): Promise<Order[]> {
  if (!authEnabled()) return m.orders.filter((o) => o.user_id === m.DEMO_USER_ID);
  const sb = await createClient();
  const { data } = await sb.from("orders").select("*, items:order_items(*)").order("created_at", { ascending: false });
  return (data as Order[]) ?? [];
}

export async function myOrder(orderNo: string): Promise<{ order: Order | null; shipments: Shipment[]; invoice: TaxInvoice | null; carriers: Carrier[] }> {
  if (!authEnabled()) {
    const order = m.orders.find((o) => o.order_no === orderNo && o.user_id === m.DEMO_USER_ID) ?? null;
    return { order, shipments: order ? m.shipments.filter((s) => s.order_id === order.id) : [], invoice: order ? m.invoices.find((i) => i.order_id === order.id) ?? null : null, carriers: m.carriers };
  }
  const sb = await createClient();
  const { data: o } = await sb.from("orders").select("*, items:order_items(*)").eq("order_no", orderNo).maybeSingle();
  if (!o) return { order: null, shipments: [], invoice: null, carriers: [] };
  const [s, i, c] = await Promise.all([
    sb.from("shipments").select("*, events:shipment_events(*)").eq("order_id", o.id),
    sb.from("tax_invoices").select("*").eq("order_id", o.id).maybeSingle(),
    sb.from("carriers").select("*"),
  ]);
  return { order: o as Order, shipments: (s.data as Shipment[]) ?? [], invoice: (i.data as TaxInvoice) ?? null, carriers: (c.data as Carrier[]) ?? [] };
}

export async function myInvoices(): Promise<TaxInvoice[]> {
  if (!authEnabled()) return m.invoices.filter((i) => i.user_id === m.DEMO_USER_ID).map((i) => ({ ...i, order_no: m.orders.find((o) => o.id === i.order_id)?.order_no }));
  const sb = await createClient();
  const { data } = await sb.from("tax_invoices").select("*, orders(order_no)").order("id", { ascending: false });
  return ((data ?? []) as (TaxInvoice & { orders?: { order_no: string } })[]).map((i) => ({ ...i, order_no: i.orders?.order_no }));
}

export async function myInvoice(id: number): Promise<TaxInvoice | null> {
  if (!authEnabled()) return m.invoices.find((i) => i.id === id && i.user_id === m.DEMO_USER_ID) ?? null;
  const sb = await createClient();
  const { data } = await sb.from("tax_invoices").select("*").eq("id", id).maybeSingle();
  return (data as TaxInvoice) ?? null;
}

export async function myContracts(): Promise<Contract[]> {
  if (!authEnabled()) return m.contracts.filter((c) => c.user_id === m.DEMO_USER_ID);
  const sb = await createClient();
  const { data } = await sb.from("contracts").select("*").order("start_date", { ascending: false });
  return (data as Contract[]) ?? [];
}

export async function myConsents(): Promise<{ current: ConsentState[]; history: (ConsentState & { id?: number })[] }> {
  if (!authEnabled()) return { current: m.demoConsents, history: m.demoConsents };
  const sb = await createClient();
  const { data: u } = await sb.auth.getUser();
  const { data: docs } = await sb.from("consent_documents").select("*");
  const { data: rows } = await sb.from("user_consents").select("*").eq("user_id", u.user?.id ?? "").order("created_at", { ascending: false });
  const hist = (rows ?? []).map((r) => { const d = (docs ?? []).find((x) => x.id === r.document_id); return { code: d?.code, version: d?.version, title: d?.title, required: d?.required, agreed: r.agreed, channel_email: r.channel_email, channel_sms: r.channel_sms, channel_push: r.channel_push, created_at: r.created_at } as ConsentState; });
  const seen = new Set<string>(); const current: ConsentState[] = [];
  for (const h of hist) if (!seen.has(h.code)) { seen.add(h.code); current.push(h); }
  for (const d of docs ?? []) if (!seen.has(d.code)) { seen.add(d.code); current.push({ code: d.code, version: d.version, title: d.title, required: d.required, agreed: false, created_at: "" }); }
  return { current, history: hist };
}

export async function myAddresses(): Promise<Address[]> {
  if (!authEnabled()) return [{ id: 1, user_id: m.DEMO_USER_ID, label: "매장", receiver_name: "김예시", phone: "010-0000-0001", zipcode: "08700", address1: "서울시 관악구 예시로 1", address2: "1층", is_default: true }];
  const sb = await createClient();
  const { data } = await sb.from("customer_addresses").select("*").order("is_default", { ascending: false });
  return (data as Address[]) ?? [];
}
