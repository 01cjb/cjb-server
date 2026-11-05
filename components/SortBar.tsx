"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
const opts = [["new", "신상품순"], ["price_asc", "낮은가격순"], ["price_desc", "높은가격순"], ["name", "상품명순"]] as const;
export default function SortBar({ count }: { count: number }) {
  const router = useRouter(); const path = usePathname(); const sp = useSearchParams();
  const cur = sp.get("sort") ?? "new";
  return (
    <div className="flex items-center justify-between border-y border-neutral-200 py-3 mb-6 text-sm">
      <span>총 <b>{count}</b>개 상품</span>
      <div className="flex gap-3">
        {opts.map(([v, l]) => (
          <button key={v} onClick={() => { const n = new URLSearchParams(sp); n.set("sort", v); router.push(`${path}?${n}`); }}
            className={cur === v ? "font-bold text-brand-600" : "text-neutral-500"}>{l}</button>
        ))}
      </div>
    </div>
  );
}
