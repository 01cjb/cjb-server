"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Logo from "./Logo";
import { IconCart, IconHeart, IconMenu, IconSearch, IconUser } from "./Icons";
import { useStore } from "./Store";
import type { Category } from "@/lib/types";

const menus = [
  { href: "/category/best", label: "BEST 추천상품", cls: "text-brand-600 font-bold" },
  { href: "/category/new", label: "NEW 신상품", cls: "text-accent font-bold" },
  { href: "/category/timesale", label: "반짝할인", cls: "" },
  { href: "/brands", label: "브랜드관", cls: "" },
  { href: "/salon-member", label: "미용실회원관", cls: "" },
  { href: "/category/vip", label: "★VIP 전용관★", cls: "text-accent font-bold" },
];

export default function Header({ categories, session, loggedIn }: { categories: Category[]; session: { mock: boolean; name: string | null; admin: boolean }; loggedIn: boolean }) {
  const { cart, wish } = useStore();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const cartCount = cart.reduce((a, l) => a + l.qty, 0);

  const submit = (e: React.FormEvent) => { e.preventDefault(); if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`); };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-neutral-200">
      <div className="bg-brand-700 text-white text-center text-[11px] md:text-xs py-2 px-4 truncate">
        신규 회원 가입 혜택! 가입시 <b>2,000원 쿠폰</b> 지급 <span className="hidden sm:inline">· </span><Link href="/category/vip" className="underline hidden sm:inline">VIP 전용관 혜택 받기 →</Link>
      </div>

      <div className="hidden md:flex justify-end gap-4 max-w-6xl mx-auto px-4 pt-2 text-xs text-neutral-500">
        {loggedIn && !session.mock ? <><span>{session.name ?? "회원"}님</span><a href="/logout">로그아웃</a></> : <Link href="/login">로그인/회원가입</Link>}<Link href="/mypage/orders">주문배송조회</Link>{session.admin && <Link href="/admin" className="text-brand-600 font-medium">관리자</Link>}<Link href="/mypage#cs">고객센터</Link>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
        <button className="md:hidden" onClick={() => setOpen(true)} aria-label="전체 카테고리"><IconMenu /></button>
        <Logo />
        <form onSubmit={submit} className="hidden md:flex flex-1 max-w-md mx-auto items-center bg-neutral-100 rounded-full px-4">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="#펌제 #바리깡 #로레알 상품을 검색하세요" className="flex-1 bg-transparent py-2.5 text-sm outline-none" />
          <button aria-label="검색"><IconSearch className="size-5" /></button>
        </form>
        <nav className="ml-auto flex items-center gap-4 text-neutral-700">
          <Link href="/search" className="md:hidden" aria-label="검색"><IconSearch /></Link>
          <Link href="/mypage" className="hidden md:flex flex-col items-center text-[10px]"><IconUser />마이페이지</Link>
          <Link href="/cart" className="relative flex flex-col items-center text-[10px]" aria-label="장바구니">
            <IconCart /><span className="hidden md:block">장바구니</span>
            {cartCount > 0 && <span className="absolute -top-1 -right-2 min-w-4 h-4 px-1 rounded-full bg-accent text-white text-[10px] grid place-items-center">{cartCount}</span>}
          </Link>
          <Link href="/wishlist" className="relative hidden md:flex flex-col items-center text-[10px]">
            <IconHeart />찜리스트
            {wish.length > 0 && <span className="absolute -top-1 -right-2 min-w-4 h-4 px-1 rounded-full bg-accent text-white text-[10px] grid place-items-center">{wish.length}</span>}
          </Link>
        </nav>
      </div>

      <div className="max-w-6xl mx-auto px-4 flex items-center gap-6 text-sm overflow-x-auto no-scrollbar">
        <button onClick={() => setOpen((v) => !v)} className="hidden md:flex items-center gap-1 py-3 font-semibold shrink-0"><IconMenu className="size-5" />전체카테고리</button>
        {menus.map((m) => (
          <Link key={m.href} href={m.href} className={`py-3 shrink-0 whitespace-nowrap ${m.cls}`}>{m.label}</Link>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 md:absolute md:inset-auto md:left-0 md:right-0 md:top-full md:bg-transparent" onClick={() => setOpen(false)}>
          <div className="bg-white h-full w-4/5 max-w-xs p-5 md:h-auto md:w-full md:max-w-6xl md:mx-auto md:shadow-lg md:rounded-b-xl" onClick={(e) => e.stopPropagation()}>
            <p className="font-bold mb-4 md:hidden">전체 카테고리</p>
            <ul className="grid gap-1 md:grid-cols-4">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link href={`/category/${c.slug}`} onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 hover:bg-brand-50">
                    <span>{c.icon}</span>{c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </header>
  );
}
