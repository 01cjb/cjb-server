import "server-only";
import { adminEnabled, createServiceClient } from "@/lib/auth";

// 카페24 Admin API 연동 (주문 읽기 전용)
// 문서: https://apidocs.cafe24.com/docs/admin/get-orders · OAuth: https://apidocs.cafe24.com/docs/guide/oauth2-authentication
// 환경변수: CAFE24_MALL_ID, CAFE24_CLIENT_ID, CAFE24_CLIENT_SECRET, (선택) CAFE24_API_VERSION

export const CHANNEL = "cafe24";
export const SCOPE = "mall.read_order";
const API_VERSION = () => process.env.CAFE24_API_VERSION || "2026-09-01";
const db = () => createServiceClient();

export const cafe24Config = () => {
  const mall = process.env.CAFE24_MALL_ID, id = process.env.CAFE24_CLIENT_ID, secret = process.env.CAFE24_CLIENT_SECRET;
  return mall && id && secret ? { mall, id, secret } : null;
};
export const redirectUri = (origin: string) => `${origin}/api/integrations/cafe24/callback`;

export function authorizeUrl(origin: string, state: string) {
  const c = cafe24Config()!;
  const p = new URLSearchParams({ response_type: "code", client_id: c.id, state, redirect_uri: redirectUri(origin), scope: SCOPE });
  return `https://${c.mall}.cafe24api.com/api/v2/oauth/authorize?${p}`;
}

type TokenRes = { access_token: string; expires_at: string; refresh_token: string; refresh_expires_at: string; scopes?: string[]; mall_id?: string };

// 카페24 시간 문자열(예: 2021-03-01T14:00:00.000)은 한국시간 기준 → +09:00 붙여 저장
const kst = (s?: string) => (s ? (/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? new Date(s) : new Date(s + "+09:00")).toISOString() : null);

async function tokenRequest(body: Record<string, string>): Promise<TokenRes> {
  const c = cafe24Config()!;
  const r = await fetch(`https://${c.mall}.cafe24api.com/api/v2/oauth/token`, {
    method: "POST",
    headers: { Authorization: "Basic " + Buffer.from(`${c.id}:${c.secret}`).toString("base64"), "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body),
    cache: "no-store",
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) throw new Error(`카페24 토큰 요청 실패 (${r.status}): ${j.error_description ?? j.error ?? JSON.stringify(j).slice(0, 200)}`);
  return j as TokenRes;
}

async function saveTokens(t: TokenRes, extra: Record<string, unknown> = {}) {
  const c = cafe24Config()!;
  const { error } = await db().from("channel_connections").upsert({
    channel: CHANNEL, mall_id: c.mall, access_token: t.access_token, access_expires_at: kst(t.expires_at),
    refresh_token: t.refresh_token, refresh_expires_at: kst(t.refresh_expires_at), scopes: t.scopes ?? [SCOPE],
    refreshing_until: null, updated_at: new Date().toISOString(), ...extra,
  });
  if (error) throw new Error("토큰 저장 실패: " + error.message);
}

export async function exchangeCode(origin: string, code: string, userId: string) {
  const t = await tokenRequest({ grant_type: "authorization_code", code, redirect_uri: redirectUri(origin) });
  await saveTokens(t, { connected_by: userId, connected_at: new Date().toISOString(), last_error: null });
}

export type Connection = {
  channel: string; mall_id: string; access_expires_at: string | null; refresh_expires_at: string | null; connected_at: string | null;
  last_sync_at: string | null; last_sync_ok: boolean | null; last_sync_count: number | null; last_error: string | null;
};
export async function getConnection(): Promise<Connection | null> {
  if (!adminEnabled()) return null;
  const { data } = await db().from("channel_connections")
    .select("channel,mall_id,access_expires_at,refresh_expires_at,connected_at,last_sync_at,last_sync_ok,last_sync_count,last_error")
    .eq("channel", CHANNEL).maybeSingle();
  return (data as Connection) ?? null;
}

// 유효한 access token 확보. 만료 5분 전이면 갱신 (refresh token 1회용 → 동시 갱신 잠금)
async function accessToken(): Promise<string> {
  const { data: row } = await db().from("channel_connections").select("access_token,access_expires_at,refresh_token,refresh_expires_at").eq("channel", CHANNEL).maybeSingle();
  if (!row?.refresh_token) throw new Error("카페24가 연결되지 않았습니다. 업무 시스템에서 '카페24 연결'을 먼저 해 주세요.");
  if (row.access_token && row.access_expires_at && new Date(row.access_expires_at).getTime() - Date.now() > 5 * 60_000) return row.access_token;
  if (row.refresh_expires_at && new Date(row.refresh_expires_at) < new Date()) throw new Error("카페24 연결이 만료되었습니다(2주 미사용). '카페24 연결'을 다시 해 주세요.");

  const now = new Date();
  const { data: claimed } = await db().from("channel_connections")
    .update({ refreshing_until: new Date(now.getTime() + 30_000).toISOString() })
    .eq("channel", CHANNEL).or(`refreshing_until.is.null,refreshing_until.lt."${now.toISOString()}"`)
    .select("refresh_token").maybeSingle();
  if (!claimed) {
    // 다른 요청이 갱신 중 → 잠시 기다렸다 새 토큰 사용
    await new Promise((r) => setTimeout(r, 3000));
    const { data: again } = await db().from("channel_connections").select("access_token,access_expires_at").eq("channel", CHANNEL).maybeSingle();
    if (again?.access_token && again.access_expires_at && new Date(again.access_expires_at) > new Date()) return again.access_token;
    throw new Error("카페24 토큰 갱신이 겹쳤습니다. 잠시 후 다시 시도하세요.");
  }
  try {
    const t = await tokenRequest({ grant_type: "refresh_token", refresh_token: claimed.refresh_token });
    await saveTokens(t);
    return t.access_token;
  } catch (e) {
    await db().from("channel_connections").update({ refreshing_until: null, last_error: (e as Error).message }).eq("channel", CHANNEL);
    throw e;
  }
}

// 상태 통합: 카페24 코드 → 업무 시스템 공통 상태
export function unifyStatus(code?: string | null): string {
  if (!code) return "pending";
  if (code === "N00" || code === "N02" || code === "N03") return "pending";
  if (code === "N10") return "paid";
  if (code === "N20" || code === "N21" || code === "N22" || code === "N01") return "preparing";
  if (code === "N30") return "shipped";
  if (code === "N40" || code === "N50") return "delivered";
  if (code.startsWith("C")) return "cancelled";
  if (code.startsWith("R")) return "returned";
  if (code.startsWith("E")) return "exchanged";
  return "pending";
}

type C24Item = { product_name?: string; option_value?: string; quantity?: number; product_price?: string; payment_amount?: string; order_status?: string; status_text?: string; shipping_company_name?: string; tracking_no?: string };
type C24Receiver = { name?: string; phone?: string; cellphone?: string; zipcode?: string; address1?: string; address2?: string; shipping_message?: string };
type C24Order = {
  order_id: string; order_date?: string; payment_date?: string; paid?: string; canceled?: string; order_place_name?: string; member_id?: string;
  billing_name?: string; payment_amount?: string; actual_order_amount?: { payment_amount?: string; shipping_fee?: string; order_price_amount?: string };
  buyer?: { name?: string; cellphone?: string; phone?: string; email?: string }; items?: C24Item[]; receivers?: C24Receiver[];
};

const num = (s?: string | null) => (s == null || s === "" ? null : Number(s));

export function mapOrder(o: C24Order) {
  const items = o.items ?? [];
  // 주문 대표 상태: 진행 중인 품목 우선(취소·반품 아닌 것), 없으면 첫 품목
  const active = items.find((i) => i.order_status && !/^[CRE]/.test(i.order_status)) ?? items[0];
  const code = active?.order_status ?? (o.canceled === "T" ? "C40" : o.paid === "T" ? "N10" : "N00");
  const rc = o.receivers?.[0];
  return {
    channel: CHANNEL, external_order_id: o.order_id, order_place: o.order_place_name ?? null,
    ordered_at: o.order_date ?? null, paid_at: o.payment_date ?? null, paid: o.paid === "T", canceled: o.canceled === "T",
    status: unifyStatus(code), status_code: code,
    buyer_name: o.buyer?.name ?? o.billing_name ?? null, buyer_phone: o.buyer?.cellphone || o.buyer?.phone || null, buyer_email: o.buyer?.email ?? null, member_id: o.member_id ?? null,
    receiver_name: rc?.name ?? null, receiver_phone: rc?.cellphone || rc?.phone || null, zipcode: rc?.zipcode ?? null,
    address: [rc?.address1, rc?.address2].filter(Boolean).join(" ") || null, shipping_message: rc?.shipping_message ?? null,
    total_amount: num(o.actual_order_amount?.payment_amount ?? o.payment_amount), shipping_fee: num(o.actual_order_amount?.shipping_fee),
    items: items.map((i) => ({ name: i.product_name ?? "", option: i.option_value || null, qty: i.quantity ?? 0, price: num(i.product_price), status_code: i.order_status ?? null, status_text: i.status_text ?? null, carrier: i.shipping_company_name || null, tracking_no: i.tracking_no || null })),
    raw: o, synced_at: new Date().toISOString(),
  };
}

const ymd = (d: Date) => d.toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });

async function fetchOrders(token: string, start: Date, end: Date): Promise<C24Order[]> {
  const c = cafe24Config()!;
  const out: C24Order[] = [];
  for (let offset = 0; offset <= 15000; offset += 500) {
    const p = new URLSearchParams({ shop_no: "1", start_date: ymd(start), end_date: ymd(end), date_type: "order_date", embed: "items,receivers,buyer", limit: "500", offset: String(offset) });
    const r = await fetch(`https://${c.mall}.cafe24api.com/api/v2/admin/orders?${p}`, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "X-Cafe24-Api-Version": API_VERSION() }, cache: "no-store",
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(`카페24 주문 조회 실패 (${r.status}): ${j?.error?.message ?? JSON.stringify(j).slice(0, 200)}`);
    const page = (j.orders ?? []) as C24Order[];
    out.push(...page);
    if (page.length < 500) break;
  }
  return out;
}

// 최근 N일 주문을 가져와 덮어쓰기 (상태 변경도 반영). 카페24는 한 번에 3개월까지만 조회 가능
export async function syncCafe24(days = 14): Promise<{ ok: boolean; count: number; error?: string }> {
  if (!adminEnabled() || !cafe24Config()) return { ok: false, count: 0, error: "카페24 설정(환경변수)이 없습니다." };
  try {
    const token = await accessToken();
    const end = new Date(), start = new Date(Date.now() - Math.min(days, 89) * 86400_000);
    const orders = await fetchOrders(token, start, end);
    const rows = orders.map(mapOrder);
    for (let i = 0; i < rows.length; i += 200) {
      const { error } = await db().from("channel_orders").upsert(rows.slice(i, i + 200), { onConflict: "channel,external_order_id" });
      if (error) throw new Error("주문 저장 실패: " + error.message);
    }
    await db().from("channel_connections").update({ last_sync_at: new Date().toISOString(), last_sync_ok: true, last_sync_count: rows.length, last_error: null }).eq("channel", CHANNEL);
    return { ok: true, count: rows.length };
  } catch (e) {
    const msg = (e as Error).message;
    await db().from("channel_connections").update({ last_sync_at: new Date().toISOString(), last_sync_ok: false, last_error: msg }).eq("channel", CHANNEL);
    return { ok: false, count: 0, error: msg };
  }
}

// 화면을 열 때 마지막 수집이 오래됐으면 자동 수집 (기본 5분)
export async function syncIfStale(minutes = 5) {
  if (!adminEnabled() || !cafe24Config()) return;
  const c = await getConnection();
  if (!c?.connected_at) return;
  if (c.last_sync_at && Date.now() - new Date(c.last_sync_at).getTime() < minutes * 60_000) return;
  await syncCafe24(14);
}
