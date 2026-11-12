"use client";
import { usePathname } from "next/navigation";

// 사내 업무 시스템(/work)에서는 쇼핑몰 헤더·푸터·하단탭을 숨김
const isWork = (p: string | null) => !!p && (p === "/work" || p.startsWith("/work/"));

export function ShopOnly({ children }: { children: React.ReactNode }) {
  return isWork(usePathname()) ? null : <>{children}</>;
}

export function MainShell({ children }: { children: React.ReactNode }) {
  return <main className={isWork(usePathname()) ? "" : "min-h-[60vh] pb-20 md:pb-0"}>{children}</main>;
}
