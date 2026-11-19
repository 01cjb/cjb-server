import Link from "next/link";
import ScrollRow from "@/components/ScrollRow";
import HeroSlider from "@/components/HeroSlider";
import Section from "@/components/Section";
import ProductGrid from "@/components/ProductGrid";
import ProductCard from "@/components/ProductCard";
import AddToCartButton from "@/components/home/AddToCartButton";
import ShopInstall from "@/components/ShopInstall";
import { IconFlame, IconGift, IconHeadset, IconRepeat, IconStar, IconTag, IconTicket, IconTruck } from "@/components/Icons";
import { getBanners, getBrands, getCategories, getProducts, getProductsByIds } from "@/lib/data";
import { getMe, myOrder, myOrders } from "@/lib/me";
import { won } from "@/lib/fmt";
import type { Order } from "@/lib/admin/types";

const ACTIVE = ["pending", "paid", "preparing", "shipped"];
const STEPS = ["결제완료", "배송준비", "배송중", "배송완료"];
const STEP_OF: Record<string, number> = { pending: 0, paid: 0, preparing: 1, shipped: 2, delivered: 3 };
const HEAD: Record<string, string> = { pending: "입금 확인을 기다려요", paid: "결제가 완료됐어요", preparing: "출고 준비 중이에요", shipped: "배송 중이에요" };
const PILL: Record<string, string> = { pending: "입금대기", paid: "결제완료", preparing: "배송준비", shipped: "배송중" };
const kstMonth = (iso: string) => new Date(new Date(iso).getTime() + 9 * 3600e3).toISOString().slice(0, 7);

const MENU = [
  { href: "/mypage/orders", label: "주문·배송", Icon: IconTruck, dot: "ship" },
  { href: "/reorder", label: "재주문", Icon: IconRepeat },
  { href: "/brands", label: "브랜드관", Icon: IconTag },
  { href: "/category/best", label: "BEST", Icon: IconFlame },
  { href: "/category/vip", label: "VIP 전용관", Icon: IconStar },
  { href: "/events", label: "이벤트", Icon: IconGift },
  { href: "/benefits", label: "쿠폰·포인트", Icon: IconTicket },
  { href: "/cs", label: "고객센터", Icon: IconHeadset },
];

function Steps({ n }: { n: number }) {
  return (
    <div className="flex items-center mt-4 mb-1">
      {STEPS.map((s, i) => (
        <div key={s} className="contents">
          <div className="flex flex-col items-center gap-1.5 text-[11px] w-16 shrink-0">
            <span className={`grid size-[22px] place-items-center rounded-full border-2 text-[11px] ${i < n || n === 3 ? "border-gold bg-gold text-plum" : i === n ? "border-gold shadow-[0_0_0_4px_rgba(244,201,93,.25)]" : "border-white/35"}`}>
              {i < n || n === 3 ? "✓" : i === n ? <span className="size-2 rounded-full bg-gold" /> : null}
            </span>{s}
          </div>
          {i < 3 && <div className={`h-0.5 flex-1 mb-5 ${i < n ? "bg-gold" : "bg-white/25"}`} />}
        </div>
      ))}
    </div>
  );
}

export default async function Home() {
  const [me, banners, categories, brands, best, fresh, sale] = await Promise.all([
    getMe(), getBanners(), getCategories(), getBrands(),
    getProducts({ flag: "best", limit: 8 }), getProducts({ flag: "new", limit: 8 }), getProducts({ flag: "timesale", limit: 4 }),
  ]);
  const ctx = { brands, categories };
  const user = me.user;
  const orders: Order[] = user ? await myOrders() : [];
  const live = orders.filter((o) => o.status !== "cancelled");
  const active = live.find((o) => ACTIVE.includes(o.status)) ?? null;
  const detail = active ? await myOrder(active.order_no) : null;
  const ship = detail?.shipments.find((s) => s.tracking_no) ?? null;
  const carrier = ship ? detail?.carriers.find((c) => c.code === ship.carrier_code)?.name ?? "택배" : null;

  // 자주 산 상품 (주문 횟수 순)
  const count = new Map<number, number>();
  for (const o of live) for (const it of o.items ?? []) if (it.product_id) count.set(it.product_id, (count.get(it.product_id) ?? 0) + 1);
  const freqIds = [...count.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id).slice(0, 8);
  const freq = freqIds.length ? (await getProductsByIds(freqIds)).sort((a, b) => freqIds.indexOf(a.id) - freqIds.indexOf(b.id)) : [];
  const last = live.find((o) => (o.items ?? []).some((i) => i.product_id));
  const lastItems = (last?.items ?? []).filter((i) => i.product_id).map((i) => ({ id: i.product_id as number, qty: i.qty }));
  const lastFirst = last?.items?.find((i) => i.product_id);

  const month = kstMonth(new Date().toISOString());
  const monthOrders = live.filter((o) => kstMonth(o.created_at) === month);
  const monthTotal = monthOrders.reduce((a, o) => a + o.total, 0);
  const who = user ? `${user.salon_name ?? user.company_name ?? user.name ?? ""} 원장님` : "";

  return (
    <>
      {/* 상단 인사 + 주문 현황 */}
      <section className="bg-plum text-white rounded-b-[26px] @3xl:rounded-b-[36px]">
        <div className="max-w-6xl mx-auto px-[18px] pt-3 pb-6 @3xl:pb-10 @3xl:pt-6">
          {user && active ? (
            <div className="@3xl:grid @3xl:grid-cols-[1fr_1.1fr] @3xl:gap-10 @3xl:items-end">
              <div>
                <p className="text-[13px] opacity-80">{who}, 안녕하세요</p>
                <h1 className="text-[22px] @3xl:text-3xl font-extrabold leading-snug mt-1">{active.status === "shipped" || active.status === "preparing" ? "주문하신 상품이" : "최근 주문"}<br /><em className="not-italic inline-block mt-1 rounded-md bg-gold px-2 pt-[5px] pb-[2.5px] leading-none text-plum">{HEAD[active.status]}</em></h1>
                {ship && <p className="text-[13px] opacity-85 mt-1.5">{carrier} · 송장 {ship.tracking_no}</p>}
              </div>
              <Link href={`/mypage/orders/${active.order_no}`} className="block mt-4 @3xl:mt-0 rounded-[18px] bg-plum-2 px-4 py-3.5">
                <div className="flex justify-between items-center text-xs opacity-95">
                  <span className="truncate">주문 {active.order_no} · {active.items?.length ?? 0}개 상품</span>
                  <span className="shrink-0 rounded-full bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 text-[11px]">{PILL[active.status]}</span>
                </div>
                <Steps n={STEP_OF[active.status] ?? 0} />
                <span className="text-xs font-bold text-gold">배송조회 ›</span>
              </Link>
            </div>
          ) : user ? (
            <div>
              <p className="text-[13px] opacity-80">{who}, 안녕하세요</p>
              <h1 className="text-[22px] @3xl:text-3xl font-extrabold leading-snug mt-1">오늘 필요한 재료,<br /><em className="not-italic inline-block mt-1 rounded-md bg-gold px-2 pt-[5px] pb-[2.5px] leading-none text-plum">뷰티웰에서 바로 주문하세요</em></h1>
              <div className="flex gap-2 mt-4"><Link href="/reorder" className="rounded-xl bg-gold text-plum font-bold text-sm px-4 py-2.5">재주문하기</Link><Link href="/categories" className="rounded-xl bg-white/10 font-semibold text-sm px-4 py-2.5">카테고리 보기</Link></div>
            </div>
          ) : (
            <div>
              <p className="text-[13px] opacity-80">이·미용 전문가를 위한 복지몰</p>
              <h1 className="text-[22px] @3xl:text-3xl font-extrabold leading-snug mt-1">원장님 전용 도매가,<br /><em className="not-italic inline-block mt-1 rounded-md bg-gold px-2 pt-[5px] pb-[2.5px] leading-none text-plum">로그인하고 확인하세요</em></h1>
              <div className="flex gap-2 mt-4"><Link href="/login" className="rounded-xl bg-gold text-plum font-bold text-sm px-4 py-2.5">로그인 / 회원가입</Link></div>
            </div>
          )}
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 pt-4 grid grid-cols-[minmax(0,1fr)] gap-3 @3xl:grid-cols-2 @3xl:gap-4">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-3 content-start min-w-0">
          <ShopInstall />
          {lastFirst && (
            <div className="flex items-center gap-3 rounded-[20px] bg-gradient-to-br from-gold-100 to-gold-50 p-4">
              <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white text-2xl">🧴</div>
              <div className="min-w-0 flex-1"><b className="block text-[15px]">지난 주문 상품, 또 필요하세요?</b><p className="text-xs text-gold-ink mt-0.5 line-clamp-2">{lastFirst.product_name}</p></div>
              <AddToCartButton items={[{ id: lastFirst.product_id as number, qty: lastFirst.qty }]} className="shrink-0 rounded-xl bg-plum text-white text-xs font-bold px-3 py-2.5">바로 재주문</AddToCartButton>
            </div>
          )}
          {lastItems.length > 1 && (
            <AddToCartButton items={lastItems} className="w-full rounded-2xl bg-brand-600 text-white font-extrabold text-[15px] py-4">＋ 지난 주문 그대로 다시 담기</AddToCartButton>
          )}
          <div className="rounded-[20px] border border-[#ece6f1] bg-white p-4">
            <div className="grid grid-cols-4 gap-x-1.5 gap-y-4">
              {MENU.map(({ href, label, Icon, dot }) => (
                <Link key={href} href={href} className="flex flex-col items-center gap-1.5 text-[11.5px] text-neutral-700">
                  <span className="relative grid size-[46px] place-items-center rounded-[15px] bg-brand-50 text-brand-600">
                    <Icon className="size-[22px]" />
                    {dot === "ship" && active && <span className="absolute -top-0.5 -right-0.5 size-[9px] rounded-full bg-[#ff5a5f] ring-2 ring-white" />}
                  </span>
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)] gap-3 content-start min-w-0">
          {user ? (
            <div className="rounded-[20px] border border-[#ece6f1] bg-white p-4">
              <div className="flex justify-between items-center mb-3"><h3 className="text-[15px] font-bold">이번 달 구매 현황</h3><span className="text-[11.5px] text-neutral-500">{Number(month.slice(5))}월 1일~오늘</span></div>
              <div className="grid grid-cols-3 gap-2">
                <Link href="/mypage/orders" className="rounded-[14px] bg-plum text-white p-3"><small className="text-[11px] text-gold-100">구매 금액</small><b className="block text-lg mt-1 tabular-nums">{monthTotal >= 10000 ? `${Math.floor(monthTotal / 10000)}만` : won(monthTotal)}<span className="text-xs font-semibold">{monthTotal >= 10000 ? " 원" : ""}</span></b></Link>
                <Link href="/mypage/orders" className="rounded-[14px] bg-[#f6f2f9] p-3"><small className="text-[11px] text-neutral-500">주문</small><b className="block text-lg mt-1 tabular-nums">{monthOrders.length}<span className="text-xs font-semibold"> 건</span></b></Link>
                <Link href="/mypage/orders" className="rounded-[14px] bg-[#f6f2f9] p-3"><small className="text-[11px] text-neutral-500">진행 중</small><b className="block text-lg mt-1 tabular-nums">{live.filter((o) => ACTIVE.includes(o.status)).length}<span className="text-xs font-semibold"> 건</span></b></Link>
              </div>
              {user.grade_id === "general" ? (
                <Link href="/salon-member" className="mt-2.5 flex justify-between border-t border-[#ece6f1] pt-3 text-[12.5px]"><span>미용사 인증하면 <b className="text-gold-ink">VIP가</b>로 구매해요</span><span>›</span></Link>
              ) : (
                <Link href="/category/vip" className="mt-2.5 flex justify-between border-t border-[#ece6f1] pt-3 text-[12.5px]"><span><b className="text-gold-ink">VIP가 적용 중</b> · VIP 전용 상품 보기</span><span>›</span></Link>
              )}
            </div>
          ) : (
            <Link href="/benefits" className="flex items-center justify-between rounded-[20px] bg-plum text-white p-4">
              <div><small className="text-[11.5px] text-gold-100">신규 회원 혜택</small><p className="font-bold">가입하면 2,000원 쿠폰 지급</p></div><span className="text-gold font-extrabold">받기 ›</span>
            </Link>
          )}
          {banners.length > 0 && (
            <div className="rounded-[20px] border border-[#ece6f1] bg-white p-4">
              <div className="flex justify-between items-center mb-3"><h3 className="text-[15px] font-bold">진행 중인 이벤트</h3><Link href="/events" className="text-[11.5px] text-neutral-500">전체보기 ›</Link></div>
              <div className="[&>div]:min-h-0 [&>div]:!aspect-[16/9] [&>div]:!h-auto"><HeroSlider banners={banners} /></div>
            </div>
          )}
        </div>
      </div>

      {freq.length > 0 && (
        <Section title="원장님이 자주 산 상품" sub="지난 주문 기준" more="/reorder">
          <ScrollRow className="flex gap-3">
            {freq.map((p) => (
              <div key={p.id} className="w-36 @3xl:w-44 shrink-0">
                <ProductCard p={p} brand={brands.find((b) => b.id === p.brand_id)?.name} icon={categories.find((c) => c.id === p.category_id)?.icon} />
              </div>
            ))}
          </ScrollRow>
        </Section>
      )}

      <Section title="금주 BEST" sub="원장님들이 가장 많이 찾은 상품" more="/category/best">
        <ProductGrid items={best} ranked {...ctx} />
      </Section>

      <Section title="⚡ 반짝 할인" sub="한정 수량 · 기간 한정 특가" more="/category/timesale" tint>
        <ProductGrid items={sale} {...ctx} />
      </Section>

      <Section title="NEW 신제품" sub="새로 입고된 전문가용 제품" more="/category/new">
        <ProductGrid items={fresh} {...ctx} />
      </Section>
    </>
  );
}
