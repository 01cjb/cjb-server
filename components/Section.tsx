import Link from "next/link";
export default function Section({ title, sub, more, children, tint = false }: { title: string; sub?: string; more?: string; children: React.ReactNode; tint?: boolean }) {
  return (
    <section className={tint ? "bg-brand-50 py-10 mt-10" : "mt-12"}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-xl md:text-2xl font-bold">{title}</h2>
            {sub && <p className="text-sm text-neutral-500 mt-1">{sub}</p>}
          </div>
          {more && <Link href={more} className="text-sm text-neutral-500 hover:text-brand-600">더보기 ›</Link>}
        </div>
        {children}
      </div>
    </section>
  );
}
