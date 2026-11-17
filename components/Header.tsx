"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import LogoWhite from "./LogoWhite";
import ScrollRow from "./ScrollRow";
import { IconCart, IconHeart, IconMenu, IconSearch, IconUser } from "./Icons";
import { useStore } from "./Store";
import type { Category } from "@/lib/types";

const menus = [
  { href: "/category/vip", label: "★VIP 전용관★", cls: "text-gold font-bold" },
  { href: "/category/best", label: "BEST 추천상품", cls: "font-bold" },
  { href: "/category/new", label: "NEW 신상품", cls: "font-bold" },
  { href: "/category/timesale", label: "반짝할인", cls: "" },
  { href: "/brands", label: "브랜드관", cls: "" },
  { href: "/events", label: "이벤트", cls: "" },
];

export default function Header({ categories, session, loggedIn }: { categories: Category[]; session: { mock: boolean; name: string | null; admin: boolean }; loggedIn: boolean }) {
  const { cart, wish } = useStore();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const cartCount = cart.reduce((a, l) => a + l.qty, 0);

  const submit = (e: React.FormEvent) => { e.preventDefault(); if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`); };

  return (
    <header className="sticky top-0 z-40 bg-plum text-white">
      <div className="bg-plum-2 text-gold-100 text-center text-[11px] @3xl:text-xs py-2 px-4 truncate">
        신규 회원 가입 혜택! 가입시 <b>2,000원 쿠폰</b> 지급 <span className="hidden @xl:inline">· </span><Link href="/salon-member" className="underline hidden @xl:inline text-gold">미용사 인증하고 VIP가 받기 →</Link>
      </div>

      <div className="hidden @3xl:flex justify-end gap-4 max-w-6xl mx-auto px-4 pt-2 text-xs text-white/60">
        {loggedIn && !session.mock ? <><span>{session.name ?? "회원"}님</span><a href="/logout">로그아웃</a></> : <Link href="/login">로그인/회원가입</Link>}<Link href="/mypage/orders">주문배송조회</Link>{session.admin && <Link href="/admin" className="text-gold font-medium">관리자</Link>}<Link href="/cs">고객센터</Link>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
        <LogoWhite />
        <form onSubmit={submit} className="hidden @3xl:flex flex-1 max-w-md mx-auto items-center bg-white/10 rounded-full px-4">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="#펌제 #바리깡 #로레알 상품을 검색하세요" className="flex-1 bg-transparent py-2.5 text-sm outline-none placeholder:text-white/50" />
          <button aria-label="검색"><IconSearch className="size-5" /></button>
        </form>
        <nav className="ml-auto flex items-center gap-4 text-white">
          <Link href="/search" className="@3xl:hidden" aria-label="검색"><IconSearch /></Link>
          <Link href="/mypage" className="hidden @3xl:flex flex-col items-center text-[10px]"><IconUser />마이페이지</Link>
          <Link href="/cart" className="relative flex flex-col items-center text-[10px]" aria-label="장바구니">
            <IconCart /><span className="hidden @3xl:block">장바구니</span>
            {cartCount > 0 && <span className="absolute -top-1 -right-2 min-w-4 h-4 px-1 rounded-full bg-gold text-plum font-bold text-[10px] grid place-items-center">{cartCount}</span>}
          </Link>
          <Link href="/wishlist" className="relative hidden @3xl:flex flex-col items-center text-[10px]">
            <IconHeart />찜리스트
            {wish.length > 0 && <span className="absolute -top-1 -right-2 min-w-4 h-4 px-1 rounded-full bg-gold text-plum font-bold text-[10px] grid place-items-center">{wish.length}</span>}
          </Link>
        </nav>
      </div>

      <div className="max-w-6xl mx-auto pl-2 pr-4 flex items-center gap-1 text-sm text-white/85">
        <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-1 py-3 px-2 font-semibold shrink-0" aria-label="전체 메뉴"><IconMenu className="size-5" /><span className="hidden @3xl:inline">전체카테고리</span></button>
        <div className="flex-1 min-w-0">
          <ScrollRow tone="dark" className="flex items-center gap-6 pr-2">
            {menus.map((m) => (
              <Link key={m.href} href={m.href} className={`py-3 shrink-0 whitespace-nowrap ${m.cls}`}>{m.label}</Link>
            ))}
          </ScrollRow>
        </div>
      </div>

      {open && (
        <div className="fixed inset-y-0 inset-x-0 mx-auto max-w-[480px] z-50 bg-black/40 @3xl:absolute @3xl:inset-auto @3xl:left-0 @3xl:right-0 @3xl:top-full @3xl:bg-transparent" onClick={() => setOpen(false)}>
          <div className="bg-white text-neutral-900 h-full w-4/5 max-w-xs p-5 @3xl:h-auto @3xl:w-full @3xl:max-w-6xl @3xl:mx-auto @3xl:shadow-lg @3xl:rounded-b-xl" onClick={(e) => e.stopPropagation()}>
            <p className="font-bold mb-3">바로가기</p>
            <div className="flex flex-wrap gap-2 mb-5">
              {menus.map((m) => (
                <Link key={m.href} href={m.href} onClick={() => setOpen(false)} className="rounded-full border border-neutral-200 px-3 py-1.5 text-[13px] hover:bg-brand-50">{m.label}</Link>
              ))}
            </div>
            <p className="font-bold mb-2">전체 카테고리</p>
            <ul className="grid gap-1 @3xl:grid-cols-4">
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
