"use client";
import { createContext, useContext, useEffect, useState } from "react";

// 장바구니·찜 상태 (비로그인: localStorage / 로그인 후 Supabase cart_items·wishlists 로 동기화 예정)
type CartLine = { id: number; qty: number };
type Ctx = {
  cart: CartLine[];
  wish: number[];
  grade: "general" | "salon" | "vip";
  addToCart: (id: number, qty?: number) => void;
  setQty: (id: number, qty: number) => void;
  removeFromCart: (id: number) => void;
  clearCart: () => void;
  toggleWish: (id: number) => void;
  setGrade: (g: Ctx["grade"]) => void;
  serverGrade: Ctx["grade"] | null;
};
const StoreCtx = createContext<Ctx | null>(null);

const load = <T,>(k: string, d: T): T => {
  try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : d; } catch { return d; }
};
const save = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

export function StoreProvider({ children, serverGrade = null }: { children: React.ReactNode; serverGrade?: Ctx["grade"] | null }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wish, setWish] = useState<number[]>([]);
  const [grade, setGradeState] = useState<Ctx["grade"]>("general");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setCart(load("bw_cart", []));
    setWish(load("bw_wish", []));
    setGradeState(serverGrade ?? load("bw_grade", "general"));
    setReady(true);
  }, []);
  useEffect(() => { if (ready) save("bw_cart", cart); }, [cart, ready]);
  useEffect(() => { if (ready) save("bw_wish", wish); }, [wish, ready]);
  useEffect(() => { if (ready) save("bw_grade", grade); }, [grade, ready]);

  const value: Ctx = {
    cart, wish, grade,
    addToCart: (id, qty = 1) =>
      setCart((c) => (c.some((l) => l.id === id) ? c.map((l) => (l.id === id ? { ...l, qty: l.qty + qty } : l)) : [...c, { id, qty }])),
    setQty: (id, qty) => setCart((c) => c.map((l) => (l.id === id ? { ...l, qty: Math.max(1, qty) } : l))),
    removeFromCart: (id) => setCart((c) => c.filter((l) => l.id !== id)),
    clearCart: () => setCart([]),
    toggleWish: (id) => setWish((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id])),
    setGrade: (g) => { if (!serverGrade) setGradeState(g); },
    serverGrade,
  };
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export const useStore = () => {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("StoreProvider missing");
  return c;
};
