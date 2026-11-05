const TYPES = ["supply", "agency", "vip", "consignment", "etc"];
const ST = ["draft", "active", "expired", "terminated"];
export function pickContract(b: Record<string, unknown>, partial = false) {
  const errors: string[] = []; const data: Record<string, unknown> = {};
  const has = (k: string) => k in b;
  if (!partial || has("company_name")) { data.company_name = String(b.company_name ?? "").trim(); if (!data.company_name) errors.push("업체명을 입력하세요"); }
  if (!partial || has("start_date")) { data.start_date = b.start_date; if (!/^\d{4}-\d{2}-\d{2}$/.test(String(b.start_date ?? ""))) errors.push("시작일 형식(YYYY-MM-DD)"); }
  if (has("end_date")) { data.end_date = b.end_date || null; if (data.end_date && String(data.end_date) < String(b.start_date ?? data.start_date ?? "")) errors.push("종료일이 시작일보다 빠릅니다"); }
  if (has("contract_type")) { if (!TYPES.includes(String(b.contract_type))) errors.push("계약유형 오류"); data.contract_type = b.contract_type; }
  if (has("status")) { if (!ST.includes(String(b.status))) errors.push("상태 오류"); data.status = b.status; }
  if (has("discount_rate")) { const v = Number(b.discount_rate); if (!(v >= 0 && v <= 100)) errors.push("할인율 0~100"); data.discount_rate = v; }
  if (has("credit_limit")) data.credit_limit = b.credit_limit === "" || b.credit_limit == null ? null : Math.round(Number(b.credit_limit));
  for (const k of ["payment_terms", "memo", "user_id", "file_path"]) if (has(k)) data[k] = String(b[k] ?? "").trim() || null;
  return { data, errors };
}
