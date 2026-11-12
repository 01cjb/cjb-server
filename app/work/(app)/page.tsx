import Link from "next/link";
import { dashboard, listAdminProducts, listContracts, listCustomers } from "@/lib/admin/repo";
import Pill from "@/components/admin/Pill";
import { H1, Table } from "@/components/admin/Table";
import { Low } from "@/components/work/views";
import { canSee, getWorkMe } from "@/lib/work/auth";
import { MENUS, TEAMS } from "@/lib/work/menus";
import { CHANNELS, STATUS_LABEL, unifiedOrders } from "@/lib/channels/orders";
import { syncIfStale } from "@/lib/channels/cafe24";
import { dt, won } from "@/lib/fmt";

export const dynamic = "force-dynamic";
export const metadata = { title: "대시보드" };

export default async function WorkHome() {
  const me = (await getWorkMe())!;
  if (canSee(me, "orders")) await syncIfStale(5);
  const [d, products, contracts, customers, uo] = await Promise.all([dashboard(), listAdminProducts(), listContracts(), listCustomers(), unifiedOrders()]);
  const kstDay = (iso: string) => (iso ? new Date(iso).toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" }) : "");
  const today = kstDay(new Date().toISOString());
  const todayN = uo.filter((o) => kstDay(o.orderedAt) === today).length;
  const pendingN = uo.filter((o) => o.status === "pending").length;
  const toShipN = uo.filter((o) => o.status === "paid" || o.status === "preparing").length;
  const shippedN = uo.filter((o) => o.status === "shipped").length;
  const expiring = contracts.filter((c) => c.status === "active" && c.end_date && new Date(c.end_date).getTime() - Date.now() < 30 * 86400_000).length;

  // [라벨, 값, 링크, 필요한 메뉴, 강조]
  const cards: [string, string | number, string, string, boolean][] = [
    ["오늘 주문 (전 채널)", todayN, "/work/m/orders", "orders", false],
    ["입금 대기", pendingN, "/work/m/orders?s=pending", "orders", pendingN > 0],
    ["출고 필요", toShipN, "/work/m/orders?s=paid", "orders", toShipN > 0],
    ["배송중", shippedN, "/work/m/orders?s=shipped", "orders", false],
    ["재고 부족", products.filter((p) => p.status !== "cancelled" && p.stock <= Low).length, "/work/m/inventory", "inventory", true],
    ["계산서 처리", d.invoicePending, "/work/m/tax?s=pending", "tax", d.invoicePending > 0],
    ["누적 매출", won(d.sales), "/work/m/revenue", "revenue", false],
    ["고객사", customers.filter((c) => c.role === "customer").length, "/work/m/clients", "clients", false],
    ["계약 만료 임박", expiring, "/work/m/clients", "clients", expiring > 0],
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
          <h2 className="mb-2 text-sm font-semibold">최근 주문 (뷰티웰·카페24)</h2>
          <Table head={["채널", "주문번호", "주문자", "금액", "상태", "일시"]} empty={!uo.length}>
            {uo.slice(0, 8).map((o) => <tr key={o.key}><td className="text-xs">{CHANNELS[o.channel] ?? o.channel}</td><td className="font-mono text-xs">{o.orderNo}</td><td>{o.buyer ?? o.receiver ?? "-"}</td><td className="tabular-nums">{won(o.total)}</td><td><Pill s={o.status} label={STATUS_LABEL[o.status] ?? o.status} /></td><td className="text-xs text-neutral-500">{dt(o.orderedAt)}</td></tr>)}
          </Table>
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
