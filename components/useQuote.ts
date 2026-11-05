"use client";
import { useEffect, useState } from "react";
import { useStore } from "./Store";

export type Quote = { items: { id: number; name: string; unit: number; qty: number; amount: number; blocked: boolean; thumbnail_url: string | null }[]; subtotal: number; shipping: number; total: number };

export function useQuote() {
  const { cart, grade } = useStore();
  const [q, setQ] = useState<Quote | null>(null);
  useEffect(() => {
    let alive = true;
    fetch("/api/cart/quote", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ lines: cart, grade }) })
      .then((r) => r.json()).then((d) => alive && setQ(d)).catch(() => {});
    return () => { alive = false; };
  }, [cart, grade]);
  return q;
}
export const won = (n: number) => n.toLocaleString("ko-KR") + "원";
