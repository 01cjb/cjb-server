import { listAdminProducts, listCarriers, listContracts, listCustomers, listInvoices, listOrders, listShipments } from "@/lib/admin/repo";
import { CONTRACT_TYPE, GRADE_NAME, INVOICE_STATUS, ORDER_STATUS, PRODUCT_STATUS, SHIP_STATUS, type OrderStatus, type ShipStatus } from "@/lib/admin/types";
import { adminEnabled } from "@/lib/auth";
import { day, dt, trackUrl, won } from "@/lib/fmt";
import type { Menu } from "@/lib/work/menus";
import type { WorkMe } from "@/lib/work/auth";
import { CHANNELS, STATUS_LABEL, unifiedOrders } from "@/lib/channels/orders";
import { cafe24Config, getConnection, syncIfStale } from "@/lib/channels/cafe24";
import SyncButton from "./SyncButton";
import LogenPanel from "./LogenPanel";
import LogenExcel from "./LogenExcel";
import { dayCounts, waybillDay } from "@/lib/carriers/logen-excel";
import { listWaybills, logenConfig, waybillTargets } from "@/lib/carriers/logen";
import Pill from "@/components/admin/Pill";
import { Table, Tabs } from "@/components/admin/Table";

// 메뉴별 화면 — 기존 쇼핑몰 DB를 조회 전용으로 보여줌 (수정은 이후 단계에서 메뉴별로 추가)
type P = { menu: Menu; q: Record<string, string | undefined>; me: WorkMe };

export const Low = 5; // 재고 부족 기준

function Note({ children }: { children: React.ReactNode }) {
  return <p className="mb-4 rounded-lg border border-dashed border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-500">{children}</p>;
}

export async function Tax({ q }: P) {
  const s = q.s ?? "all";
  const all = await listInvoices();
  const list = s === "all" ? all : all.filter((i) => i.status === s);
  return (
    <>
      <Note>쇼핑몰 주문에서 생성된 세금계산서입니다. 매입 세금계산서·부가세 신고 자료는 이카운트 연동 후 추가됩니다.</Note>
      <Tabs cur={s} items={[{ key: "all", label: "전체", href: "?s=all", count: all.length }, ...Object.entries(INVOICE_STATUS).map(([k, l]) => ({ key: k, label: l, href: `?s=${k}`, count: all.filter((i) => i.status === k).length }))]} />
      <Table head={["계산서번호", "주문", "공급받는자", "공급가액", "세액", "합계", "상태", "작성일"]} empty={!list.length}>
        {list.map((i) => (
          <tr key={i.id}><td className="font-mono text-xs">{i.invoice_no}</td><td className="font-mono text-xs">{i.order_no ?? "-"}</td><td>{i.buyer_company}<span className="block text-xs text-neutral-400">{i.buyer_biz_no}</span></td>
            <td className="tabular-nums">{won(i.supply_amount)}</td><td className="tabular-nums">{won(i.vat_amount)}</td><td className="tabular-nums font-medium">{won(i.total_amount)}</td>
            <td><Pill s={i.status} label={INVOICE_STATUS[i.status]} /></td><td className="text-xs text-neutral-500">{day(i.issue_date)}</td></tr>
        ))}
      </Table>
    </>
  );
}

export async function Revenue() {
  const orders = (await listOrders()).filter((o) => o.status !== "pending" && o.status !== "cancelled");
  const by: Record<string, { n: number; sum: number; ship: number }> = {};
  for (const o of orders) {
    const m = new Date(o.created_at).toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" }).slice(0, 7);
    const r = (by[m] ??= { n: 0, sum: 0, ship: 0 });
    r.n++; r.sum += o.total; r.ship += o.shipping_fee;
  }
  const rows = Object.entries(by).sort(([a], [b]) => b.localeCompare(a));
  return (
    <>
      <Note>쇼핑몰 주문(결제완료 이후, 취소 제외) 기준 월별 매출입니다. 오프라인·도매 매출과 매출 전표는 이카운트 연동 후 합산됩니다.</Note>
      <Table head={["월", "주문 수", "매출(배송비 포함)", "배송비", "상품 매출"]} empty={!rows.length}>
        {rows.map(([m, r]) => <tr key={m}><td className="font-medium">{m}</td><td className="tabular-nums">{r.n}</td><td className="tabular-nums font-medium">{won(r.sum)}</td><td className="tabular-nums">{won(r.ship)}</td><td className="tabular-nums">{won(r.sum - r.ship)}</td></tr>)}
      </Table>
    </>
  );
}

export async function Clients({ q }: P) {
  const [customers, contracts] = await Promise.all([listCustomers(q.q), listContracts()]);
  const biz = customers.filter((c) => c.role === "customer");
  return (
    <>
      <form className="mb-4 flex gap-2"><input name="q" defaultValue={q.q} placeholder="이름·상호·사업자번호 검색" className="w-72 max-w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm" /><button className="rounded-lg bg-neutral-900 px-3 text-sm text-white">검색</button></form>
      <h2 className="mb-2 text-sm font-semibold">고객사 ({biz.length})</h2>
      <Table head={["이름", "상호", "사업자번호", "등급", "주문", "누적 금액", "가입일"]} empty={!biz.length}>
        {biz.map((c) => (
          <tr key={c.id}><td className="font-medium">{c.name}<span className="block text-xs text-neutral-400">{c.phone ?? ""}</span></td><td>{c.company_name ?? c.salon_name ?? "-"}</td><td className="font-mono text-xs">{c.business_no ?? "-"}</td>
            <td><Pill s={c.grade_id} label={GRADE_NAME[c.grade_id]} /></td><td className="tabular-nums">{c.order_count ?? 0}</td><td className="tabular-nums">{won(c.order_total ?? 0)}</td><td className="text-xs text-neutral-500">{day(c.created_at)}</td></tr>
        ))}
      </Table>
      <h2 className="mb-2 mt-8 text-sm font-semibold">계약 ({contracts.length})</h2>
      <Table head={["계약번호", "상호", "유형", "기간", "할인율", "결제조건", "상태"]} empty={!contracts.length}>
        {contracts.map((c) => {
          const soon = c.end_date && c.status === "active" && new Date(c.end_date).getTime() - Date.now() < 30 * 86400_000;
          return (
            <tr key={c.id}><td className="font-mono text-xs">{c.contract_no}</td><td>{c.company_name}</td><td>{CONTRACT_TYPE[c.contract_type]}</td>
              <td className="text-xs">{day(c.start_date)} ~ {c.end_date ? day(c.end_date) : "무기한"}{soon && <span className="ml-1 text-rose-600">만료 임박</span>}</td>
              <td className="tabular-nums">{c.discount_rate}%</td><td className="text-xs">{c.payment_terms ?? "-"}</td><td><Pill s={c.status} /></td></tr>
          );
        })}
      </Table>
    </>
  );
}

export async function Store({ q }: P) {
  const s = q.s ?? "all";
  const all = await listAdminProducts();
  const list = (s === "all" ? all : all.filter((p) => p.status === s)).filter((p) => !q.q || p.name.includes(q.q));
  return (
    <>
      <Tabs cur={s} items={[{ key: "all", label: "전체", href: "?s=all", count: all.length }, ...Object.entries(PRODUCT_STATUS).map(([k, l]) => ({ key: k, label: l, href: `?s=${k}`, count: all.filter((p) => p.status === k).length }))]} />
      <Table head={["상품", "판매가", "미용실회원가", "재고", "표시", "상태"]} empty={!list.length}>
        {list.map((p) => (
          <tr key={p.id}><td className="font-medium">{p.name}<span className="block font-mono text-[11px] text-neutral-400">{p.sku ?? p.model_no ?? `#${p.id}`}</span></td>
            <td className="tabular-nums">{won(p.price)}</td><td className="tabular-nums">{won(p.salon_price)}</td><td className={`tabular-nums ${p.stock <= Low ? "font-semibold text-rose-600" : ""}`}>{p.stock}</td>
            <td className="text-xs text-neutral-500">{[p.is_best && "BEST", p.is_new && "NEW", p.is_timesale && "반짝", p.vip_only && "VIP"].filter(Boolean).join(" · ") || "-"}</td>
            <td><Pill s={p.status} label={PRODUCT_STATUS[p.status]} /></td></tr>
        ))}
      </Table>
    </>
  );
}

export async function Inventory() {
  const list = (await listAdminProducts()).filter((p) => p.status !== "cancelled").sort((a, b) => a.stock - b.stock);
  const low = list.filter((p) => p.stock <= Low).length;
  return (
    <>
      <Note>쇼핑몰 상품 재고(products.stock) 기준입니다. 창고·채널별 재고는 사방넷 연동 후 표시됩니다. 재고 {Low}개 이하 <b className="text-rose-600">{low}건</b></Note>
      <Table head={["상품", "재고", "상태"]} empty={!list.length}>
        {list.map((p) => (
          <tr key={p.id} className={p.stock <= Low ? "bg-rose-50/50" : ""}><td>{p.name}</td><td className={`tabular-nums font-semibold ${p.stock <= Low ? "text-rose-600" : ""}`}>{p.stock}</td><td><Pill s={p.status} label={PRODUCT_STATUS[p.status]} /></td></tr>
        ))}
      </Table>
    </>
  );
}

export async function Orders({ q }: P) {
  await syncIfStale(5); // 카페24: 마지막 수집 5분 지났으면 화면 열 때 자동 수집
  const s = q.s ?? "all", c = q.c ?? "all";
  const all = await unifiedOrders();
  const byCh = c === "all" ? all : all.filter((o) => o.channel === c);
  const list = s === "all" ? byCh : byCh.filter((o) => o.status === s);
  const qs = (k: string, v: string) => { const p = new URLSearchParams({ c, s }); p.set(k, v); return `?${p}`; };
  const conn = await getConnection();
  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {[["all", "전체 채널"], ...Object.entries(CHANNELS)].map(([k, l]) => (
          <a key={k} href={qs("c", k)} className={`rounded-full px-3 py-1 text-sm ${c === k ? "bg-neutral-900 text-white" : "bg-white text-neutral-600 ring-1 ring-neutral-200"}`}>
            {l} <span className="text-xs opacity-60">{k === "all" ? all.length : all.filter((o) => o.channel === k).length}</span>
          </a>
        ))}
        <span className="ml-auto text-xs text-neutral-400">{conn ? `카페24 마지막 수집 ${dt(conn.last_sync_at)}${conn.last_sync_ok === false ? " · 실패" : ""}` : "카페24 미연결 — 판매채널 연동 메뉴에서 연결"}</span>
      </div>
      <Tabs cur={s} items={[{ key: "all", label: "전체", href: qs("s", "all"), count: byCh.length }, ...Object.entries(STATUS_LABEL).map(([k, l]) => ({ key: k, label: l, href: qs("s", k), count: byCh.filter((o) => o.status === k).length })).filter((t) => t.count || ["pending", "paid", "preparing", "shipped", "delivered", "cancelled"].includes(t.key))]} />
      <Table head={["채널", "주문번호", "주문자", "받는 분", "상품", "금액", "상태", "주문일시"]} empty={!list.length}>
        {list.map((o) => (
          <tr key={o.key}>
            <td className="whitespace-nowrap"><span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${o.channel === "cafe24" ? "bg-sky-50 text-sky-700" : "bg-brand-50 text-brand-700"}`}>{CHANNELS[o.channel] ?? o.channel}</span><span className="block text-[11px] text-neutral-400">{o.place ?? ""}</span></td>
            <td className="font-mono text-xs">{o.orderNo}</td><td>{o.buyer ?? "-"}</td><td>{o.receiver ?? "-"}<span className="block text-xs text-neutral-400">{o.receiverPhone ?? ""}</span></td>
            <td className="max-w-[240px] text-xs">{o.items.length ? `${o.items[0].name}${o.items[0].option ? ` (${o.items[0].option})` : ""} × ${o.items[0].qty}${o.items.length > 1 ? ` 외 ${o.items.length - 1}건` : ""}` : "-"}</td>
            <td className="tabular-nums">{won(o.total)}</td>
            <td><Pill s={o.status} label={STATUS_LABEL[o.status] ?? o.status} />{o.statusText && o.channel !== "beautywell" && <span className="block text-[11px] text-neutral-400">{o.statusText}</span>}</td>
            <td className="text-xs text-neutral-500">{dt(o.orderedAt)}</td>
          </tr>
        ))}
      </Table>
    </>
  );
}

export async function Channels({ q, me }: P) {
  const cfg = !!cafe24Config(), conn = await getConnection(), live = adminEnabled();
  const refreshLeft = conn?.refresh_expires_at ? Math.round((new Date(conn.refresh_expires_at).getTime() - Date.now()) / 86400_000) : null;
  return (
    <div className="space-y-4">
      {q.error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{q.error}</p>}
      {q.connected && !q.error && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">카페24 연결 완료 · 최근 90일 주문 {q.count ?? 0}건을 가져왔습니다.</p>}
      <section className="rounded-xl border border-neutral-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">카페24 <span className="text-xs font-normal text-neutral-500">{process.env.CAFE24_MALL_ID ?? ""}</span></h2>
            <p className="mt-1 text-sm text-neutral-600">
              {!live ? "목업 모드 — 예시 주문 2건만 표시됩니다." : !cfg ? "카페24 앱 정보가 아직 등록되지 않았습니다." : conn?.connected_at ? <>연결됨 · {dt(conn.connected_at)}{refreshLeft != null && <span className="text-neutral-400"> · 자동 유지 {refreshLeft}일 남음(매일 갱신)</span>}</> : "앱 정보는 있음 · 아직 연결 전"}
            </p>
            {conn?.last_sync_at && <p className="mt-1 text-xs text-neutral-500">마지막 수집 {dt(conn.last_sync_at)} · {conn.last_sync_ok ? `${conn.last_sync_count ?? 0}건` : <span className="text-rose-600">실패: {conn.last_error}</span>}</p>}
          </div>
          <div className="flex gap-2">
            {cfg && me.is_owner && <a href="/api/integrations/cafe24/connect" className="rounded-lg border border-neutral-300 px-3 py-2 text-sm">{conn?.connected_at ? "다시 연결" : "카페24 연결"}</a>}
            {cfg && conn?.connected_at && <SyncButton />}
          </div>
        </div>
      </section>
      <section className="rounded-xl border border-dashed border-neutral-300 bg-white p-5 text-sm text-neutral-600">
        <h3 className="mb-2 font-semibold text-neutral-800">동작 방식</h3>
        <ul className="list-disc space-y-1 pl-5">
          <li>카페24 주문은 <b>읽기 전용</b>으로 가져옵니다. 카페24 쪽 데이터는 바뀌지 않습니다.</li>
          <li>「주문」 화면을 열 때 마지막 수집이 5분 지났으면 자동으로 최근 14일 주문을 다시 가져와 상태 변경도 반영합니다. 매일 09:30에도 자동 수집합니다.</li>
          <li>처음 연결할 때 최근 90일 주문을 가져옵니다.</li>
          <li>스마트스토어·쿠팡 등은 사방넷 연동 후 같은 화면에 추가됩니다.</li>
        </ul>
      </section>
    </div>
  );
}

export async function Shipping({ q }: P) {
  const s = q.s ?? "all";
  const all = await listShipments();
  const list = s === "all" ? all : all.filter((x) => x.status === s);
  return (
    <>
      <Tabs cur={s} items={[{ key: "all", label: "전체", href: "?s=all", count: all.length }, ...(Object.keys(SHIP_STATUS) as ShipStatus[]).map((k) => ({ key: k, label: SHIP_STATUS[k], href: `?s=${k}`, count: all.filter((x) => x.status === k).length }))]} />
      <Table head={["주문번호", "받는 분", "상태", "출고", "배송완료"]} empty={!list.length}>
        {list.map((x) => <tr key={x.id}><td className="font-mono text-xs">{x.order_no ?? "-"}</td><td>{x.receiver_name ?? "-"}</td><td><Pill s={x.status} label={SHIP_STATUS[x.status]} /></td><td className="text-xs">{dt(x.shipped_at)}</td><td className="text-xs">{dt(x.delivered_at)}</td></tr>)}
      </Table>
    </>
  );
}

export async function Waybill({ q }: P) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(q.d ?? "") ? q.d! : new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
  const [list, carriers, targets, rows, day] = await Promise.all([listShipments(), listCarriers(), waybillTargets(), listWaybills(), waybillDay(date)]);
  const lc = logenConfig();
  const cname = (c: string | null) => carriers.find((x) => x.code === c);
  const missing = list.filter((x) => !x.tracking_no).length;
  return (
    <>
      <LogenExcel date={date} counts={dayCounts(day)} />
      <LogenPanel ready={lc.ready} missing={lc.missing} env={lc.env} mock={!adminEnabled()} rows={rows}
        targets={targets.map((o) => ({ key: o.key, channel: o.channel, orderNo: o.orderNo, receiver: o.receiver ?? o.buyer, address: o.address ?? null,
          item: o.items.length > 1 ? `${o.items[0]?.name} 외 ${o.items.length - 1}건` : o.items[0]?.name ?? "", orderedAt: o.orderedAt }))} />
      <h2 className="mb-2 text-base font-bold">뷰티웰 배송 송장</h2>
      <Note>송장번호 미입력 <b className="text-rose-600">{missing}건</b>.</Note>
      <Table head={["주문번호", "받는 분", "택배사", "송장번호", "조회", "상태"]} empty={!list.length}>
        {list.map((x) => {
          const c = cname(x.carrier_code), url = trackUrl(c?.tracking_url, x.tracking_no);
          return (
            <tr key={x.id}><td className="font-mono text-xs">{x.order_no ?? "-"}</td><td>{x.receiver_name ?? "-"}</td><td>{c?.name ?? "-"}</td>
              <td className="font-mono text-xs">{x.tracking_no ?? <span className="text-rose-600">미입력</span>}</td>
              <td>{url ? <a href={url} target="_blank" rel="noreferrer" className="text-xs text-brand-700 underline">조회</a> : "-"}</td><td><Pill s={x.status} label={SHIP_STATUS[x.status]} /></td></tr>
          );
        })}
      </Table>
    </>
  );
}

function Links({ items }: { items: [string, string, string][] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(([t, d, h]) => (
        <a key={h} href={h} target="_blank" rel="noreferrer" className="rounded-xl border border-neutral-200 bg-white p-4 hover:border-brand-300">
          <p className="font-semibold">{t} ↗</p><p className="mt-1 text-xs text-neutral-500">{d}</p>
        </a>
      ))}
    </div>
  );
}

export function Frontend() {
  return (
    <>
      <Note>Next.js 15 + Tailwind 4 · Vercel(서울 icn1) 배포 · PWA/Capacitor 하이브리드 앱</Note>
      <Links items={[
        ["운영 사이트", "cjb-server.vercel.app", "https://cjb-server.vercel.app"],
        ["Vercel 배포 기록", "배포·미리보기·로그", "https://vercel.com/cjb10/cjb-server"],
        ["GitHub 저장소", "01cjb/cjb-server", "https://github.com/01cjb/cjb-server"],
      ]} />
    </>
  );
}

export async function Backend() {
  const env = [
    ["Supabase URL", !!process.env.NEXT_PUBLIC_SUPABASE_URL], ["Supabase anon 키", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY],
    ["Supabase 서버 키", !!process.env.SUPABASE_SERVICE_ROLE_KEY], ["Claude API", !!process.env.ANTHROPIC_API_KEY], ["Gemini API", !!process.env.GEMINI_API_KEY], ["Cron 보호키", !!process.env.CRON_SECRET],
  ] as const;
  return (
    <>
      <Note>DB 모드: {adminEnabled() ? "운영 DB 연결" : "목업(키 없음)"} · DB 변경은 supabase/migrations 파일 → PR → 머지 시 자동 적용</Note>
      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {env.map(([k, ok]) => <div key={k} className="rounded-lg border border-neutral-200 bg-white p-3"><p className="text-xs text-neutral-500">{k}</p><p className={`mt-1 text-sm font-semibold ${ok ? "text-emerald-600" : "text-rose-600"}`}>{ok ? "설정됨" : "없음"}</p></div>)}
      </div>
      <Links items={[
        ["GitHub Actions", "점검 → DB 마이그레이션 → 배포 파이프라인", "https://github.com/01cjb/cjb-server/actions"],
        ["Supabase 대시보드", "beauty_well_project", "https://supabase.com/dashboard/project/sforkxsrudzidwdjoisw"],
        ["DB 마이그레이션 기록", "적용된 migrations", "https://supabase.com/dashboard/project/sforkxsrudzidwdjoisw/database/migrations"],
        ["상태 점검 API", "/api/health", "/api/health"],
      ]} />
    </>
  );
}

const PLANS: Record<string, string[]> = {
  accounting: ["전표 조회(일반·매입·매출)", "계정과목별 잔액", "월 결산 요약"],
  hr: ["인사카드(입사일·부서·직책·연락처)", "입·퇴사 이력", "근태·휴가"],
  labor: ["월 급여 대장", "4대보험 취득·상실", "근로계약서 보관"],
  purchase: ["매입처 목록", "매입 전표·세금계산서", "지급 예정·완료"],
  ledger: ["거래처별 원장(잔액·미수·미지급)", "계정별 원장", "기간별 조회·엑셀 내보내기"],
  design: ["메인 배너·기획전 관리", "상세페이지 이미지 자산", "디자인 요청·작업 현황"],
  marketing: ["프로모션·쿠폰", "채널별 수신동의 현황", "캠페인 성과"],
};

export function Soon({ menu }: P) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6">
      <p className="text-sm text-neutral-600">{menu.desc}</p>
      {menu.source && <p className="mt-2 inline-block rounded-full bg-indigo-50 px-2.5 py-1 text-xs text-indigo-700">데이터 원천: {menu.source} — 보고서 정리 후 연동</p>}
      <h2 className="mt-6 mb-2 text-sm font-semibold">예정 기능</h2>
      <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-700">{(PLANS[menu.key] ?? []).map((t) => <li key={t}>{t}</li>)}</ul>
    </div>
  );
}

export const VIEWS: Record<string, (p: P) => React.ReactNode | Promise<React.ReactNode>> = {
  tax: Tax, revenue: Revenue, clients: Clients, store: Store, inventory: Inventory, orders: Orders, shipping: Shipping, waybill: Waybill, frontend: Frontend, backend: Backend, channels: Channels,
};
