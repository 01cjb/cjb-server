"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { IconSearch } from "./Icons";

export type BrandCard = { id: number; slug: string; name: string; count: number; cats: string[] };

const CHO = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
const MERGE: Record<string, string> = { ㄲ: "ㄱ", ㄸ: "ㄷ", ㅃ: "ㅂ", ㅆ: "ㅅ", ㅉ: "ㅈ" };
const initial = (name: string) => {
  const c = name.trim().charCodeAt(0);
  if (c >= 0xac00 && c <= 0xd7a3) { const ch = CHO[Math.floor((c - 0xac00) / 588)]; return MERGE[ch] ?? ch; }
  return /[a-z]/i.test(name[0]) ? "A–Z" : "#";
};
// 브랜드마다 고정된 색 (로고 대신 머리글자 표시)
const TONES = ["bg-[#efe7f8] text-[#5b2a8c]", "bg-[#fdf1d2] text-[#7a5a12]", "bg-[#e3f1ee] text-[#1f6b5c]", "bg-[#fde8ea] text-[#a3324a]", "bg-[#e6eefb] text-[#2c4f96]"];
export const tone = (id: number) => TONES[id % TONES.length];

export function Monogram({ id, name, className = "size-11 text-base" }: { id: number; name: string; className?: string }) {
  return <span className={`grid shrink-0 place-items-center rounded-full font-extrabold ${tone(id)} ${className}`}>{name.trim()[0]}</span>;
}

export default function BrandDirectory({ brands }: { brands: BrandCard[] }) {
  const [q, setQ] = useState("");
  const top = useMemo(() => [...brands].filter((b) => b.count > 0).sort((a, b) => b.count - a.count).slice(0, 4), [brands]);
  const groups = useMemo(() => {
    const k = q.trim().toLowerCase();
    const list = brands.filter((b) => !k || b.name.toLowerCase().includes(k)).sort((a, b) => a.name.localeCompare(b.name, "ko"));
    const m = new Map<string, BrandCard[]>();
    for (const b of list) { const i = initial(b.name); m.set(i, [...(m.get(i) ?? []), b]); }
    return [...m.entries()];
  }, [brands, q]);

  return (
    <>
      <label className="flex items-center gap-2 rounded-2xl bg-white px-4 shadow-[0_2px_10px_rgba(59,29,90,.07)] ring-1 ring-[#ece6f1]">
        <IconSearch className="size-5 text-neutral-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="브랜드 이름 검색" className="flex-1 bg-transparent py-3.5 text-[15px] outline-none placeholder:text-neutral-400" />
        {q && <button type="button" onClick={() => setQ("")} className="text-sm text-neutral-400" aria-label="지우기">✕</button>}
      </label>

      {!q && top.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 text-[15px] font-bold">상품이 많은 브랜드</h2>
          <div className="grid grid-cols-2 gap-2.5">
            {top.map((b, i) => (
              <Link key={b.id} href={`/brands?b=${b.slug}`} className={`flex items-center gap-3 rounded-2xl p-3.5 ${i === 0 ? "bg-plum text-white" : "bg-white ring-1 ring-[#ece6f1]"}`}>
                <Monogram id={b.id} name={b.name} className="size-10 text-[15px]" />
                <span className="min-w-0">
                  <span className={`block text-[10px] font-bold tracking-wide ${i === 0 ? "text-gold" : "text-gold-ink"}`}>TOP {i + 1}</span>
                  <b className="block truncate text-sm">{b.name}</b>
                  <span className={`block text-[11px] ${i === 0 ? "text-white/70" : "text-neutral-500"}`}>상품 {b.count}개</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-7">
        <h2 className="mb-1 flex items-baseline justify-between text-[15px] font-bold">{q ? "검색 결과" : "전체 브랜드"}<span className="text-xs font-medium text-neutral-400">가나다순</span></h2>
        {groups.length === 0 && <p className="py-14 text-center text-sm text-neutral-400">‘{q}’ 브랜드를 찾지 못했어요.</p>}
        {groups.map(([ch, list]) => (
          <div key={ch} className="mt-4">
            <div className="mb-1.5 flex items-center gap-2 text-xs font-bold text-plum"><span className="grid h-6 min-w-6 place-items-center rounded-md bg-brand-50 px-1.5">{ch}</span><span className="h-px flex-1 bg-[#ece6f1]" /></div>
            <ul className="overflow-hidden rounded-2xl bg-white ring-1 ring-[#ece6f1] divide-y divide-[#f1edf5]">
              {list.map((b) => (
                <li key={b.id}>
                  <Link href={`/brands?b=${b.slug}`} className="flex items-center gap-3 px-4 py-3 active:bg-brand-50">
                    <Monogram id={b.id} name={b.name} />
                    <span className="min-w-0 flex-1">
                      <b className="block truncate text-[15px]">{b.name}</b>
                      <span className="block truncate text-xs text-neutral-500">{b.cats.length ? b.cats.join(" · ") : "입고 준비 중"}</span>
                    </span>
                    {b.count > 0 && <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-600">{b.count}</span>}
                    <span className="text-neutral-300">›</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </>
  );
}
