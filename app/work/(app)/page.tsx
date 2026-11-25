import Link from "next/link";
import { dashboard, listAdminProducts, listCustomers } from "@/lib/admin/repo";
import Pill from "@/components/admin/Pill";
import { H1, Table } from "@/components/admin/Table";
import { Low } from "@/components/work/views";
import { canSee, getWorkMe } from "@/lib/work/auth";
import { MENUS, TEAMS } from "@/lib/work/menus";
import { CHANNELS, STATUS_LABEL, channelColor, unifiedOrders } from "@/lib/channels/orders";
import { syncIfStale } from "@/lib/channels/cafe24";
import { dt, won } from "@/lib/fmt";

export const dynamic = "force-dynamic";
export const metadata = { title: "대시보드" };

export default async function WorkHome({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const me = (await getWorkMe())!;
  if (canSee(me, "orders")) await syncIfStale(5);
  const [d, products, customers, uo] = await Promise.all([dashboard(), listAdminProducts(), listCustomers(), unifiedOrders()]);
  const kstDay = (iso: string) => (iso ? new Date(iso).toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" }) : "");
  const today = kstDay(new Date().toISOString());
  const todayN = uo.filter((o) => kstDay(o.orderedAt) === today).length;
  const pendingN = uo.filter((o) => o.status === "pending").length;
  const toShipN = uo.filter((o) => o.status === "paid" || o.status === "preparing").length;
  const shippedN = uo.filter((o) => o.status === "shipped").length;
  // 매출: 취소·반품·입금대기를 뺀 주문 금액 합계 (전 채널). 오늘 = 당일, 이번 달 = 1일부터 오늘까지 누적
  const sold = uo.filter((o) => !["cancelled", "returned", "pending"].includes(o.status));
  const salesToday = sold.filter((o) => kstDay(o.orderedAt) === today).reduce((n, o) => n + (o.total || 0), 0);
  const salesMonth = sold.filter((o) => kstDay(o.orderedAt).slice(0, 7) === today.slice(0, 7)).reduce((n, o) => n + (o.total || 0), 0);

  // 최근 주문: 채널별로 골라 보기. 「전체」에서는 채널마다 최근 3건씩은 꼭 보이게 하고 나머지는 최신순으로 채움
  const chKeys = Object.keys(CHANNELS).filter((k) => uo.some((o) => o.channel === k));
  const ch = sp.ch && chKeys.includes(sp.ch) ? sp.ch : "all";
  const pool = ch === "all" ? uo : uo.filter((o) => o.channel === ch);
  const RECENT = 12;
  let recent = pool.slice(0, RECENT);
  if (ch === "all") {
    const must = new Set(chKeys.flatMap((k) => uo.filter((o) => o.channel === k).slice(0, 3).map((o) => o.key)));
    const rest = uo.filter((o) => !must.has(o.key)).slice(0, Math.max(0, RECENT - must.size));
    const keep = new Set([...must, ...rest.map((o) => o.key)]);
    recent = uo.filter((o) => keep.has(o.key));
  }
  const chTabs: [string, string, number][] = [["all", "전체", uo.length], ...chKeys.map((k) => [k, CHANNELS[k], uo.filter((o) => o.channel === k).length] as [string, string, number])];

  // [라벨, 값, 링크, 필요한 메뉴, 강조]
  const cards: [string, string | number, string, string, boolean][] = [
    ["오늘 주문 (전 채널)", todayN, "/work/m/orders", "orders", false],
    ["입금 대기", pendingN, "/work/m/orders?s=pending", "orders", pendingN > 0],
    ["출고 필요", toShipN, "/work/m/orders?s=paid", "orders", toShipN > 0],
    ["배송중", shippedN, "/work/m/orders?s=shipped", "orders", false],
    ["재고 부족", products.filter((p) => p.status !== "cancelled" && p.stock <= Low).length, "/work/m/inventory", "inventory", true],
    ["오늘 매출", won(salesToday), "/work/m/revenue", "revenue", false],
    [`${Number(today.slice(5, 7))}월 누적 매출`, won(salesMonth), "/work/m/revenue", "revenue", false],
    ["계산서 처리", d.invoicePending, "/work/m/tax?s=pending", "tax", d.invoicePending > 0],
    ["고객사", customers.filter((c) => c.role === "customer").length, "/work/m/clients", "clients", false],
    ["판매중 상품", d.products.active ?? 0, "/work/m/store?s=active", "store", false],
  ];
  const mine = cards.filter((c) => canSee(me, c[3]));
  const myMenus = MENUS.filter((m) => canSee(me, m.key));

  return (
    <>
      <H1 right={<span className="text-sm text-neutral-500">{today}</span>}>대시보드</H1>
      {mine.length ? (
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {mine.map(([l, v, h, , hot]) => (
            <Link key={l} href={h} className={`rounded-xl border bg-white p-4 hover:border-brand-300 ${hot && v !== 0 ? "border-rose-200" : "border-neutral-200"}`}>
              <p className="text-xs text-neutral-500">{l}</p>
              <p className={`mt-1 text-2xl font-bold tabular-nums ${hot && v !== 0 ? "text-rose-600" : v === 0 ? "text-neutral-300" : ""}`}>{v}</p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="mb-8 rounded-xl border border-dashed border-neutral-300 bg-white p-6 text-sm text-neutral-500">아직 배정된 메뉴가 없습니다. 대표에게 메뉴 권한을 요청하세요.</p>
      )}

      {canSee(me, "orders") && (
        <section className="mb-8">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">최근 주문 <span className="font-normal text-neutral-400">전체 {uo.length}건</span></h2>
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {chTabs.map(([k, l, n]) => (
                <Link key={k} href={k === "all" ? "/work" : `/work?ch=${k}`} className={`rounded-full px-2.5 py-1 ring-1 ${ch === k ? "ring-2 font-bold" : ""} ${k === "all" ? (ch === k ? "bg-neutral-900 text-white ring-neutral-900" : "bg-white text-neutral-600 ring-neutral-200") : channelColor(k)}`}>{l} <span className="opacity-60">{n}</span></Link>
              ))}
            </div>
          </div>
          <Table head={["채널", "주문번호", "주문자", "금액", "상태", "일시"]} empty={!recent.length}>
            {recent.map((o) => <tr key={o.key}><td className="whitespace-nowrap text-xs"><span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ring-1 ${channelColor(o.channel)}`}>{CHANNELS[o.channel] ?? o.channel}</span>{o.place && o.place.includes("·") && <span className="ml-1.5 text-neutral-500">{o.place.split("·").slice(1).join("·").trim()}</span>}</td><td className="font-mono text-xs">{o.orderNo}</td><td>{o.buyer ?? o.receiver ?? "-"}</td><td className="tabular-nums">{o.total ? won(o.total) : <span className="text-neutral-300">-</span>}</td><td><Pill s={o.status} label={STATUS_LABEL[o.status] ?? o.status} /></td><td className="text-xs text-neutral-500">{dt(o.orderedAt)}</td></tr>)}
          </Table>
          <div className="mt-2 text-right">
            <Link href={ch === "all" ? "/work/m/orders" : `/work/m/orders?c=${ch}`} className="inline-block rounded-lg px-3 py-1.5 text-sm font-semibold text-brand-700 ring-1 ring-brand-300 hover:bg-brand-50">더보기 ({ch === "all" ? uo.length : pool.length}건 전체 보기) →</Link>
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold">내 메뉴</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TEAMS.map((t) => {
            const items = myMenus.filter((m) => m.team === t.key);
            if (!items.length) return null;
            return (
              <div key={t.key} className="rounded-xl border border-neutral-200 bg-white p-4">
                <p className="mb-2 text-xs font-semibold text-neutral-500">{t.label}</p>
                <div className="flex flex-wrap gap-1.5">
                  {items.map((m) => <Link key={m.key} href={`/work/m/${m.key}`} className={`rounded-full px-3 py-1 text-sm ${m.status === "soon" ? "bg-neutral-100 text-neutral-500" : "bg-brand-50 text-brand-700"}`}>{m.label}</Link>)}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
