"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import ProductThumb from "@/components/ProductThumb";
import Price from "@/components/Price";
import WishButton from "@/components/WishButton";
import { useStore } from "@/components/Store";
import type { Product } from "@/lib/types";

export default function Wishlist() {
  const { wish } = useStore();
  const [items, setItems] = useState<Product[]>([]);
  useEffect(() => {
    if (!wish.length) { setItems([]); return; }
    fetch(`/api/products?ids=${wish.join(",")}`).then((r) => r.json()).then(setItems).catch(() => {});
  }, [wish]);
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">찜리스트 <span className="text-brand-600">{wish.length}</span></h1>
      {!wish.length ? <p className="py-20 text-center text-neutral-400">찜한 상품이 없습니다.</p> : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-6">
          {items.map((p) => (
            <Link key={p.id} href={`/product/${p.id}`} className="block">
              <div className="relative aspect-square rounded-xl overflow-hidden"><ProductThumb id={p.id} src={p.thumbnail_url} />
                <div className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5"><WishButton id={p.id} /></div></div>
              <div className="mt-2 text-sm line-clamp-2">{p.name}</div><Price p={p} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
