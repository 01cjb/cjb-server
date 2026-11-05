"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconGrid, IconHeart, IconHome, IconSearch, IconUser } from "./Icons";

// 모바일 / 앱(웹뷰) 하단 탭바
const tabs = [
  { href: "/", label: "홈", Icon: IconHome },
  { href: "/categories", label: "카테고리", Icon: IconGrid },
  { href: "/search", label: "검색", Icon: IconSearch },
  { href: "/wishlist", label: "찜", Icon: IconHeart },
  { href: "/mypage", label: "마이", Icon: IconUser },
];

export default function BottomTabBar() {
  const path = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-neutral-200 safe-bottom">
      <ul className="grid grid-cols-5">
        {tabs.map(({ href, label, Icon }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <li key={href}>
              <Link href={href} className={`flex flex-col items-center gap-0.5 py-2 text-[11px] ${active ? "text-brand-600" : "text-neutral-500"}`}>
                <Icon className="size-6" />{label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
