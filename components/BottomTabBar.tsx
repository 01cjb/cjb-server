"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconCart, IconGrid, IconHome, IconRepeat, IconUser } from "./Icons";
import { useStore } from "./Store";

// 모바일 / 앱(웹뷰) 하단 탭바 — 검색은 상단, 찜은 마이로 이동
const tabs = [
  { href: "/", label: "홈", Icon: IconHome },
  { href: "/categories", label: "카테고리", Icon: IconGrid },
  { href: "/reorder", label: "재주문", Icon: IconRepeat },
  { href: "/cart", label: "장바구니", Icon: IconCart },
  { href: "/mypage", label: "마이", Icon: IconUser },
];

export default function BottomTabBar() {
  const path = usePathname();
  const { cart } = useStore();
  const count = cart.reduce((a, l) => a + l.qty, 0);
  return (
    <nav className="@3xl:hidden fixed bottom-0 inset-x-0 mx-auto max-w-[480px] z-40 bg-white border-t border-neutral-200 safe-bottom">
      <ul className="grid grid-cols-5">
        {tabs.map(({ href, label, Icon }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <li key={href}>
              <Link href={href} className={`relative flex flex-col items-center gap-0.5 py-2 text-[11px] ${active ? "text-brand-600 font-semibold" : "text-neutral-500"}`}>
                <Icon className="size-6" />{label}
                {href === "/cart" && count > 0 && <span className="absolute top-1 right-[calc(50%-18px)] min-w-4 h-4 px-1 rounded-full bg-gold text-plum font-bold text-[10px] grid place-items-center">{count}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
