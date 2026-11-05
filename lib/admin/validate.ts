const STATUSES = ["draft", "active", "soldout", "hidden", "cancelled"];
const int = (v: unknown) => (v === "" || v == null ? null : Number.isFinite(Number(v)) ? Math.round(Number(v)) : NaN);

// 관리자 상품 입력값 검증 (허용 필드만 통과)
export function pickProduct(b: Record<string, unknown>, partial = false) {
  const errors: string[] = [];
  const data: Record<string, unknown> = {};
  const has = (k: string) => k in b;
  if (!partial || has("name")) { const n = String(b.name ?? "").trim(); if (!n) errors.push("상품명을 입력하세요"); data.name = n; }
  if (!partial || has("price")) { const p = int(b.price); if (!p || Number.isNaN(p) || p <= 0) errors.push("판매가를 확인하세요"); data.price = p; }
  for (const k of ["consumer_price", "salon_price", "stock", "brand_id", "category_id"]) if (has(k)) { const v = int(b[k]); if (Number.isNaN(v as number)) errors.push(`${k} 숫자 오류`); data[k] = k === "stock" ? v ?? 0 : v; }
  for (const k of ["sku", "model_no", "summary", "description", "thumbnail_url"]) if (has(k)) data[k] = String(b[k] ?? "").trim() || null;
  for (const k of ["is_best", "is_new", "is_timesale", "vip_only"]) if (has(k)) data[k] = !!b[k];
  if (has("status")) { if (!STATUSES.includes(String(b.status))) errors.push("상태 값 오류"); data.status = b.status; }
  if (data.salon_price != null && data.price != null && (data.salon_price as number) > (data.price as number)) errors.push("미용실회원가가 판매가보다 큽니다");
  data.updated_at = new Date().toISOString();
  return { data, errors };
}
