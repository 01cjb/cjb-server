"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Brand from "./Brand";

export type NavGroup = { team: string; label: string; items: { key: string; label: string; soon: boolean }[] };
type Me = { name: string; position: string | null; teamLabel: string; is_owner: boolean };

export default function Sidebar({ me, groups, mock }: { me: Me; groups: NavGroup[]; mock: boolean }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const link = (href: string, label: string, extra?: React.ReactNode) => {
    const on = href === "/work" ? path === "/work" : path === href || path.startsWith(href + "/");
    return (
      <Link key={href} href={href} onClick={() => setOpen(false)} aria-current={on ? "page" : undefined}
        className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${on ? "bg-brand-600 text-white font-semibold" : "text-neutral-700 hover:bg-brand-50"}`}>
        <span>{label}</span>{extra}
      </Link>
    );
  };
  async function out() {
    await fetch("/api/work/logout", { method: "POST" });
    location.href = "/work/login";
  }
  const nav = (
    <nav className="flex h-full flex-col">
      <div className="px-4 py-4 border-b border-neutral-100"><Link href="/work"><Brand compact /></Link></div>
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        <div className="space-y-0.5">{link("/work", "대시보드")}</div>
        {groups.map((g) => (
          <div key={g.team}>
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">{g.label}</p>
            <div className="space-y-0.5">
              {g.items.map((i) => link(`/work/m/${i.key}`, i.label, i.soon ? <span className="rounded bg-neutral-100 px-1.5 text-[10px] text-neutral-500">준비중</span> : null))}
            </div>
          </div>
        ))}
        {me.is_owner && (
          <div>
            <p className="px-3 pb-1 text-[11px] font-semibold text-neutral-400">관리</p>
            {link("/work/users", "사용자·권한")}
          </div>
        )}
      </div>
      <div className="border-t border-neutral-100 p-4">
        <p className="text-sm font-semibold">{me.name} <span className="font-normal text-neutral-500">{me.position ?? ""}</span></p>
        <p className="text-xs text-neutral-500">{me.is_owner ? "대표 · 전체 권한" : me.teamLabel}</p>
        <button onClick={out} className="mt-2 text-xs text-neutral-500 underline">로그아웃</button>
      </div>
    </nav>
  );
  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-2.5 md:hidden">
        <Link href="/work"><Brand compact /></Link>
        <button onClick={() => setOpen(true)} aria-label="메뉴 열기" className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm">메뉴</button>
      </header>
      {mock && <div className="bg-amber-100 px-4 py-1.5 text-center text-xs text-amber-900 md:ml-60">목업 모드 — 예시 데이터이며, 직원·권한 변경은 서버 재시작 시 초기화됩니다.</div>}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 border-r border-neutral-200 bg-white md:block">{nav}</aside>
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button aria-label="메뉴 닫기" className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-xl">{nav}</aside>
        </div>
      )}
    </>
  );
}
