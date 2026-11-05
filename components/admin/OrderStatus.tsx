"use client";
import Act from "./Act";
const NEXT: Record<string, [string, string][]> = {
  pending: [["paid", "결제확인"], ["cancelled", "주문취소"]], paid: [["preparing", "배송준비"], ["cancelled", "주문취소"]],
  preparing: [["shipped", "출고처리"], ["cancelled", "주문취소"]], shipped: [["delivered", "배송완료"]], delivered: [], cancelled: [],
};
export default function OrderStatus({ id, status }: { id: number; status: string }) {
  return <div className="flex flex-wrap gap-2">{NEXT[status]?.map(([s, l]) => <Act key={s} url={`/api/admin/orders/${id}`} method="PATCH" body={{ status: s }} label={l} tone={s === "cancelled" ? "danger" : "primary"} ask={s === "cancelled" ? "취소 사유" : undefined} small={false} />)}</div>;
}
