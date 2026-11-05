import Link from "next/link";
import type { Product } from "@/lib/types";
import ProductThumb from "./ProductThumb";
import Price from "./Price";
import WishButton from "./WishButton";

export default function ProductCard({ p, brand, icon, rank }: { p: Product; brand?: string; icon?: string; rank?: number }) {
  return (
    <Link href={`/product/${p.id}`} className="group block">
      <div className="relative aspect-square rounded-xl overflow-hidden border border-neutral-100">
        <ProductThumb id={p.id} src={p.thumbnail_url} label={brand} icon={icon} className="group-hover:scale-105 transition-transform" />
        {rank && <span className="absolute top-0 left-0 bg-neutral-900 text-white text-xs font-bold px-2 py-1 rounded-br-lg">{rank}</span>}
        <div className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5"><WishButton id={p.id} /></div>
        <div className="absolute bottom-2 left-2 flex gap-1">
          {p.is_new && <span className="bg-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded">NEW</span>}
          {p.is_best && <span className="bg-brand-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">BEST</span>}
          {p.is_timesale && <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">반짝할인</span>}
          {p.vip_only && <span className="bg-neutral-900 text-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded">VIP</span>}
        </div>
      </div>
      <div className="mt-2.5 space-y-1">
        {brand && <div className="text-[11px] text-neutral-500">{brand}</div>}
        <div className="text-sm leading-snug line-clamp-2 min-h-[2.5em]">{p.name}</div>
        <Price p={p} />
      </div>
    </Link>
  );
}
