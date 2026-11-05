const tones: Record<string, string> = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200", amber: "bg-amber-50 text-amber-700 ring-amber-200",
  red: "bg-rose-50 text-rose-700 ring-rose-200", blue: "bg-sky-50 text-sky-700 ring-sky-200",
  gray: "bg-neutral-100 text-neutral-600 ring-neutral-200", purple: "bg-brand-50 text-brand-700 ring-brand-200",
};
const map: Record<string, string> = {
  active: "green", delivered: "green", issued: "green", sent: "green", approved: "green", imported: "green", paid: "blue",
  pending: "amber", preparing: "amber", ready: "amber", draft: "gray", soldout: "amber", partially_imported: "amber", dormant: "gray",
  shipped: "blue", in_transit: "blue", picked_up: "blue", out_for_delivery: "blue",
  cancelled: "red", failed: "red", rejected: "red", blocked: "red", returned: "red", terminated: "red", reverted: "gray", expired: "gray", hidden: "gray", withdrawn: "gray",
  vip: "purple", salon: "purple", general: "gray", admin: "purple", staff: "purple",
};
export default function Pill({ s, label }: { s: string; label?: string }) {
  return <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset whitespace-nowrap ${tones[map[s] ?? "gray"]}`}>{label ?? s}</span>;
}
