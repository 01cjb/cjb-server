"use client";
import { useRouter } from "next/navigation";
import { useStore } from "@/components/Store";

// 지난 주문 상품을 장바구니에 담고 장바구니로 이동
export default function AddToCartButton({ items, children, className }: { items: { id: number; qty: number }[]; children: React.ReactNode; className?: string }) {
  const { addToCart } = useStore();
  const router = useRouter();
  return (
    <button type="button" className={className} disabled={!items.length}
      onClick={() => { items.forEach((i) => addToCart(i.id, i.qty)); router.push("/cart"); }}>
      {children}
    </button>
  );
}
