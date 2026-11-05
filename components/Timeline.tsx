import type { ShipEvent } from "@/lib/admin/types";
import { SHIP_STATUS } from "@/lib/admin/types";
import { dt } from "@/lib/fmt";
export default function Timeline({ events }: { events: ShipEvent[] }) {
  const list = [...events].sort((a, b) => b.occurred_at.localeCompare(a.occurred_at));
  if (!list.length) return <p className="text-xs text-neutral-400">추적 정보가 아직 없습니다.</p>;
  return (
    <ol className="relative border-l border-neutral-200 ml-2 space-y-3">
      {list.map((e, i) => (
        <li key={e.id} className="ml-4">
          <span className={`absolute -left-1.5 mt-1 size-3 rounded-full ${i === 0 ? "bg-brand-600" : "bg-neutral-300"}`} />
          <p className={`text-sm ${i === 0 ? "font-semibold" : ""}`}>{SHIP_STATUS[e.status as keyof typeof SHIP_STATUS] ?? e.status}{e.location && <span className="text-neutral-500 font-normal"> · {e.location}</span>}</p>
          <p className="text-xs text-neutral-400">{dt(e.occurred_at)}{e.description && ` · ${e.description}`}</p>
        </li>
      ))}
    </ol>
  );
}
