export function Table({ head, children, empty }: { head: string[]; children: React.ReactNode; empty?: boolean }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-neutral-50 text-left text-xs text-neutral-500"><tr>{head.map((h) => <th key={h} className="px-3 py-2.5 font-medium whitespace-nowrap">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-neutral-100 [&_td]:px-3 [&_td]:py-2.5 [&_td]:align-middle">{children}</tbody>
      </table>
      {empty && <p className="py-12 text-center text-sm text-neutral-400">데이터가 없습니다.</p>}
    </div>
  );
}
export function H1({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return <div className="flex flex-wrap items-center justify-between gap-3 mb-5"><h1 className="text-xl font-bold">{children}</h1>{right}</div>;
}
export function Tabs({ items, cur }: { items: { key: string; label: string; href: string; count?: number }[]; cur: string }) {
  return (
    <div className="flex gap-1 overflow-x-auto no-scrollbar border-b border-neutral-200 mb-4">
      {items.map((t) => (
        <a key={t.key} href={t.href} className={`px-3 py-2 text-sm whitespace-nowrap border-b-2 -mb-px ${t.key === cur ? "border-brand-600 text-brand-700 font-semibold" : "border-transparent text-neutral-500"}`}>
          {t.label}{t.count != null && <span className="ml-1 text-xs text-neutral-400">{t.count}</span>}
        </a>
      ))}
    </div>
  );
}
