import Link from "next/link";
import type { Category } from "@/lib/types";
export default function CategoryGrid({ categories, title = "카테고리 모아보기" }: { categories: Category[]; title?: string }) {
  return (
    <div>
      <h3 className="font-bold mb-3">{title}</h3>
      <ul className="grid grid-cols-4 gap-3">
        {categories.map((c) => (
          <li key={c.id}>
            <Link href={`/category/${c.slug}`} className="flex flex-col items-center gap-1.5 group">
              <span className="size-14 md:size-16 rounded-2xl bg-neutral-100 grid place-items-center text-2xl group-hover:bg-brand-100 transition-colors">{c.icon}</span>
              <span className="text-[11px] md:text-xs text-center leading-tight">{c.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
