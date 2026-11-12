import "server-only";
import { adminEnabled, createServiceClient } from "@/lib/auth";
import { listOrders } from "@/lib/admin/repo";

// 업무 시스템용 통합 주문 목록: 뷰티웰(자사몰) + 외부 채널(카페24 …)

export const CHANNELS: Record<string, string> = { beautywell: "뷰티웰", cafe24: "카페24" };
export const STATUS_LABEL: Record<string, string> = {
  pending: "입금대기", paid: "결제완료", preparing: "배송준비", shipped: "배송중", delivered: "배송완료",
  cancelled: "취소", returned: "반품", exchanged: "교환",
};

export type UOrder = {
  key: string; channel: string; orderNo: string; place: string | null; buyer: string | null; receiver: string | null; receiverPhone: string | null;
  total: number; status: string; statusText: string | null; orderedAt: string; items: { name: string; option?: string | null; qty: number }[];
  invoiceRequested?: boolean; tracking?: { carrier: string | null; no: string | null }[];
};

type Row = {
  id: number; channel: string; external_order_id: string; order_place: string | null; ordered_at: string | null; status: string; status_code: string | null;
  buyer_name: string | null; receiver_name: string | null; receiver_phone: string | null; total_amount: string | number | null;
  items: { name: string; option?: string | null; qty: number; status_text?: string | null; carrier?: string | null; tracking_no?: string | null }[];
};

const MOCK: Row[] = [
  { id: -1, channel: "cafe24", external_order_id: "20261112-0000021", order_place: "PC쇼핑몰", ordered_at: "2026-11-12T01:10:00Z", status: "paid", status_code: "N10", buyer_name: "예시고객A", receiver_name: "예시고객A", receiver_phone: "010-1111-2222", total_amount: 45000, items: [{ name: "(예시) 로레알 세리 엑스퍼트 샴푸 1500ml", qty: 1, status_text: "상품준비중" }] },
  { id: -2, channel: "cafe24", external_order_id: "20261111-0000017", order_place: "네이버페이", ordered_at: "2026-11-11T05:40:00Z", status: "shipped", status_code: "N30", buyer_name: "예시미용실", receiver_name: "예시미용실", receiver_phone: "010-3333-4444", total_amount: 128000, items: [{ name: "(예시) 펌제 세트", qty: 4, status_text: "배송중", carrier: "CJ대한통운", tracking_no: "000000000000" }] },
];

async function channelRows(): Promise<Row[]> {
  if (!adminEnabled()) return MOCK;
  const { data, error } = await createServiceClient().from("channel_orders")
    .select("id,channel,external_order_id,order_place,ordered_at,status,status_code,buyer_name,receiver_name,receiver_phone,total_amount,items")
    .order("ordered_at", { ascending: false }).limit(1000);
  if (error) console.error("channel_orders:", error.message);
  return (data as Row[]) ?? [];
}

export async function unifiedOrders(): Promise<UOrder[]> {
  const [own, ext] = await Promise.all([listOrders(), channelRows()]);
  // 자사몰 주문 상품명 (목업 데이터에는 이미 포함)
  if (adminEnabled() && own.length) {
    const { data: its } = await createServiceClient().from("order_items").select("order_id,product_name,qty").in("order_id", own.map((o) => o.id));
    const by: Record<number, { product_name: string; qty: number }[]> = {};
    for (const i of (its ?? []) as { order_id: number; product_name: string; qty: number }[]) (by[i.order_id] ??= []).push(i);
    for (const o of own) o.items = (by[o.id] ?? []) as typeof o.items;
  }
  const a: UOrder[] = own.map((o) => ({
    key: `bw-${o.id}`, channel: "beautywell", orderNo: o.order_no, place: "자사몰", buyer: o.customer_name ?? null, receiver: o.receiver_name, receiverPhone: o.receiver_phone,
    total: o.total, status: o.status, statusText: null, orderedAt: o.created_at, items: (o.items ?? []).map((i) => ({ name: i.product_name, qty: i.qty })), invoiceRequested: o.invoice_requested,
  }));
  const b: UOrder[] = ext.map((r) => ({
    key: `${r.channel}-${r.id}`, channel: r.channel, orderNo: r.external_order_id, place: r.order_place, buyer: r.buyer_name, receiver: r.receiver_name, receiverPhone: r.receiver_phone,
    total: Number(r.total_amount ?? 0), status: r.status, statusText: r.items?.find((i) => i.status_text)?.status_text ?? r.status_code, orderedAt: r.ordered_at ?? "",
    items: (r.items ?? []).map((i) => ({ name: i.name, option: i.option, qty: i.qty })),
    tracking: (r.items ?? []).filter((i) => i.tracking_no).map((i) => ({ carrier: i.carrier ?? null, no: i.tracking_no ?? null })),
  }));
  return [...a, ...b].sort((x, y) => (y.orderedAt || "").localeCompare(x.orderedAt || ""));
}
