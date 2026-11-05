"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Banner } from "@/lib/types";

export default function HeroSlider({ banners }: { banners: Banner[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (banners.length < 2) return;
    const t = setInterval(() => setI((v) => (v + 1) % banners.length), 4500);
    return () => clearInterval(t);
  }, [banners.length]);
  if (!banners.length) return null;
  const b = banners[i];
  return (
    <div className="relative rounded-2xl overflow-hidden aspect-[16/10] md:aspect-auto md:h-full min-h-56" style={{ background: b.bg_color ?? "#ede3f6" }}>
      <Link href={b.link ?? "/"} className="absolute inset-0 p-6 md:p-10 flex flex-col justify-end">
        <span className="text-xs font-semibold tracking-widest text-brand-700/70">BEAUTY WELL PICK</span>
        <h2 className="text-2xl md:text-4xl font-extrabold text-neutral-900 mt-2">{b.title}</h2>
        {b.subtitle && <p className="mt-2 text-sm md:text-base text-neutral-700 max-w-md">{b.subtitle}</p>}
        <span className="mt-5 inline-block self-start rounded-full bg-neutral-900 text-white text-sm px-5 py-2">상품 보러가기</span>
      </Link>
      <span className="absolute top-4 right-4 bg-black/40 text-white text-xs rounded-full px-2.5 py-1">{i + 1} / {banners.length}</span>
      <div className="absolute bottom-4 right-4 flex gap-1.5">
        {banners.map((_, k) => (
          <button key={k} onClick={() => setI(k)} aria-label={`배너 ${k + 1}`} className={`h-1.5 rounded-full transition-all ${k === i ? "w-6 bg-neutral-900" : "w-1.5 bg-neutral-900/30"}`} />
        ))}
      </div>
    </div>
  );
}
