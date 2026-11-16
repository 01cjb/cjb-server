"use client";
import { usePathname } from "next/navigation";
import Intro from "./Intro";

// 사내 업무 시스템(/work)에서는 쇼핑몰 헤더·푸터·하단탭을 숨김
const isWork = (p: string | null) => !!p && (p === "/work" || p.startsWith("/work/"));
const isAdmin = (p: string | null) => !!p && (p === "/admin" || p.startsWith("/admin/"));
// 로그인 화면은 헤더·푸터·하단탭 없이 앱처럼 꽉 찬 화면
const isBare = (p: string | null) => !!p && (p === "/login" || p.startsWith("/login/"));

export function ShopOnly({ children }: { children: React.ReactNode }) {
  const p = usePathname();
  return isWork(p) || isBare(p) ? null : <>{children}</>;
}

export function MainShell({ children }: { children: React.ReactNode }) {
  const p = usePathname();
  return <main className={isWork(p) || isBare(p) ? "" : "min-h-[60vh] pb-20 @3xl:pb-0"}>{children}</main>;
}

// 쇼핑몰은 PC에서도 휴대폰 화면 폭(480px)으로 가운데에 보여줌. 관리자(/admin)는 넓게, 업무 시스템은 그대로
export function PhoneShell({ children }: { children: React.ReactNode }) {
  const p = usePathname();
  if (isWork(p)) return <>{children}</>;
  if (isAdmin(p)) return <div className="@container">{children}</div>;
  return (
    <div className="min-h-dvh bg-[#e9e2f1]">
      <Intro />
      <div className="@container relative mx-auto min-h-dvh max-w-[480px] bg-cream shadow-[0_0_48px_rgba(59,29,90,.14)]">{children}</div>
    </div>
  );
}
