export type Grade = "general" | "salon" | "vip";
export type OrderStatus = "pending" | "paid" | "preparing" | "shipped" | "delivered" | "cancelled";
export type ShipStatus = "ready" | "picked_up" | "in_transit" | "out_for_delivery" | "delivered" | "returned" | "failed";

export type Customer = {
  id: string; name: string; email: string; phone: string | null; grade_id: Grade; role: "customer" | "staff" | "admin";
  status: "active" | "dormant" | "blocked" | "withdrawn";
  salon_name?: string | null; company_name?: string | null; business_no?: string | null; ceo_name?: string | null;
  biz_type?: string | null; biz_item?: string | null; biz_address?: string | null; tax_email?: string | null;
  marketing_agree: boolean; memo?: string | null; created_at: string; last_login_at?: string | null;
  order_count?: number; order_total?: number;
};
export type Address = { id: number; user_id: string; label: string; receiver_name: string; phone: string; zipcode?: string | null; address1: string; address2?: string | null; is_default: boolean };
export type OrderItem = { id: number; order_id: number; product_id: number | null; product_name: string; unit_price: number; qty: number };
export type Order = {
  id: number; order_no: string; user_id: string | null; status: OrderStatus; subtotal: number; shipping_fee: number; total: number;
  receiver_name: string; receiver_phone: string; address: string; memo?: string | null; invoice_requested: boolean;
  created_at: string; paid_at?: string | null; items?: OrderItem[]; customer_name?: string;
};
export type Carrier = { code: string; name: string; tracking_url: string };
export type ShipEvent = { id: number; shipment_id: number; status: string; location?: string | null; description?: string | null; occurred_at: string };
export type Shipment = {
  id: number; order_id: number; carrier_code: string | null; tracking_no: string | null; status: ShipStatus;
  shipped_at?: string | null; delivered_at?: string | null; created_at: string; events?: ShipEvent[]; order_no?: string; receiver_name?: string;
};
export type Contract = {
  id: number; contract_no: string; user_id: string | null; company_name: string;
  contract_type: "supply" | "agency" | "vip" | "consignment" | "etc"; start_date: string; end_date?: string | null;
  discount_rate: number; payment_terms?: string | null; credit_limit?: number | null;
  status: "draft" | "active" | "expired" | "terminated"; file_path?: string | null; memo?: string | null; created_at: string;
};
export type TaxInvoice = {
  id: number; order_id: number | null; user_id: string | null; invoice_no: string; issue_date: string;
  supplier: { biz_no: string; company: string; ceo: string; address: string };
  buyer_biz_no: string; buyer_company: string; buyer_ceo?: string | null; buyer_email?: string | null;
  supply_amount: number; vat_amount: number; total_amount: number; items: { name: string; qty: number; unit: number }[];
  status: "pending" | "issued" | "sent" | "failed" | "cancelled"; provider?: string | null; nts_confirm_no?: string | null;
  error?: string | null; created_at: string; issued_at?: string | null; order_no?: string;
};
export type ConsentDoc = { id: number; code: string; version: string; title: string; body: string; required: boolean; effective_at: string };
export type ConsentState = { code: string; version: string; title: string; required: boolean; agreed: boolean; channel_email?: boolean | null; channel_sms?: boolean | null; channel_push?: boolean | null; created_at: string };
export type ImportBatch = { id: number; file_name: string; total_rows: number; success_rows: number; error_rows: number; status: string; created_at: string };
export type SalonVerification = { id: number; user_id: string | null; salon_name: string; owner_name: string; business_no: string; phone: string; status: "pending" | "approved" | "rejected"; memo?: string | null; created_at: string };

export const ORDER_STATUS: Record<OrderStatus, string> = { pending: "입금대기", paid: "결제완료", preparing: "배송준비", shipped: "배송중", delivered: "배송완료", cancelled: "취소" };
export const SHIP_STATUS: Record<ShipStatus, string> = { ready: "출고대기", picked_up: "집화", in_transit: "이동중", out_for_delivery: "배송출발", delivered: "배송완료", returned: "반송", failed: "배송실패" };
export const GRADE_NAME: Record<Grade, string> = { general: "일반회원", salon: "미용실회원", vip: "VIP" };
export const CONTRACT_TYPE: Record<Contract["contract_type"], string> = { supply: "공급계약", agency: "대리점", vip: "VIP 특약", consignment: "위탁판매", etc: "기타" };
export const INVOICE_STATUS: Record<TaxInvoice["status"], string> = { pending: "발행대기", issued: "발행완료", sent: "전송완료", failed: "발행실패", cancelled: "취소" };
export const PRODUCT_STATUS: Record<string, string> = { active: "판매중", soldout: "품절", hidden: "숨김", draft: "임시저장", cancelled: "등록취소" };
