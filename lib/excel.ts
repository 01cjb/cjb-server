import "server-only";
import ExcelJS from "exceljs";
import type { Brand, Category, Product } from "./types";

// 상품 대량등록 엑셀 양식 (1행 헤더)
export const COLUMNS = [
  { key: "sku", header: "상품코드(SKU)", width: 16, note: "같은 코드가 있으면 수정, 없으면 신규" },
  { key: "name", header: "상품명*", width: 50 },
  { key: "brand", header: "브랜드", width: 16, note: "브랜드명 (없으면 비워둠)" },
  { key: "category", header: "카테고리*", width: 16, note: "카테고리명 또는 코드" },
  { key: "model_no", header: "모델명", width: 14 },
  { key: "consumer_price", header: "소비자가", width: 12 },
  { key: "price", header: "판매가*", width: 12 },
  { key: "salon_price", header: "미용실회원가", width: 14 },
  { key: "stock", header: "재고", width: 8 },
  { key: "summary", header: "요약설명", width: 30 },
  { key: "status", header: "상태", width: 10, note: "판매중/품절/숨김/임시저장" },
  { key: "is_best", header: "BEST(Y/N)", width: 10 },
  { key: "is_new", header: "NEW(Y/N)", width: 10 },
  { key: "vip_only", header: "VIP전용(Y/N)", width: 12 },
  { key: "thumbnail_url", header: "대표이미지URL", width: 30 },
] as const;

const STATUS_IN: Record<string, Product["status"] | "draft"> = { 판매중: "active", 품절: "soldout", 숨김: "hidden", 임시저장: "draft", active: "active", soldout: "soldout", hidden: "hidden", draft: "draft" };

export type ImportRow = { row: number; data: Partial<Product> & { sku?: string }; errors: string[] };

export async function buildTemplate(categories: Category[], brands: Brand[], sample?: Product[]) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("상품등록");
  ws.columns = COLUMNS.map((c) => ({ header: c.header, key: c.key, width: c.width }));
  ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF6A2F96" } };
  ws.views = [{ state: "frozen", ySplit: 1 }];
  const rows = sample?.length ? sample.map((p) => ({
    sku: (p as Product & { sku?: string }).sku ?? `BW-${String(p.id).padStart(5, "0")}`, name: p.name,
    brand: brands.find((b) => b.id === p.brand_id)?.name ?? "", category: categories.find((c) => c.id === p.category_id)?.name ?? "",
    model_no: p.model_no ?? "", consumer_price: p.consumer_price ?? "", price: p.price, salon_price: p.salon_price ?? "", stock: p.stock,
    summary: p.summary ?? "", status: { active: "판매중", soldout: "품절", hidden: "숨김", draft: "임시저장", cancelled: "등록취소" }[p.status as string] ?? "판매중",
    is_best: p.is_best ? "Y" : "N", is_new: p.is_new ? "Y" : "N", vip_only: p.vip_only ? "Y" : "N", thumbnail_url: p.thumbnail_url ?? "",
  })) : [{ sku: "BW-00001", name: "[브랜드] 예시 상품명 500ml", brand: brands[0]?.name ?? "", category: categories[0]?.name ?? "", model_no: "", consumer_price: 20000, price: 15000, salon_price: 13500, stock: 100, summary: "", status: "판매중", is_best: "N", is_new: "Y", vip_only: "N", thumbnail_url: "" }];
  rows.forEach((r) => ws.addRow(r));

  const ref = wb.addWorksheet("코드표");
  ref.columns = [{ header: "카테고리", key: "c", width: 20 }, { header: "브랜드", key: "b", width: 20 }, { header: "상태", key: "s", width: 12 }];
  const n = Math.max(categories.length, brands.length, 4);
  for (let i = 0; i < n; i++) ref.addRow({ c: categories[i]?.name ?? "", b: brands[i]?.name ?? "", s: ["판매중", "품절", "숨김", "임시저장"][i] ?? "" });
  ref.getRow(1).font = { bold: true };

  // 셀 메모는 일부 엑셀 프로그램 저장 후 읽기 오류가 나서 별도 시트로 안내
  const help = wb.addWorksheet("작성방법");
  help.columns = [{ header: "열", key: "h", width: 18 }, { header: "설명", key: "n", width: 60 }];
  COLUMNS.forEach((c) => help.addRow({ h: c.header, n: ("note" in c ? c.note : "") + (c.header.endsWith("*") ? " (필수)" : "") }));
  help.addRow({}); help.addRow({ h: "참고", n: "첫 번째 시트만 읽습니다. 1행(제목)은 수정하지 마세요. 최대 2,000행." });
  help.getRow(1).font = { bold: true };
  return Buffer.from(await wb.xlsx.writeBuffer());
}

const num = (v: unknown) => {
  if (v == null || v === "") return null;
  const n = Number(String(typeof v === "object" && v && "result" in v ? (v as { result: unknown }).result : v).replace(/[,원\s]/g, ""));
  return Number.isFinite(n) ? Math.round(n) : NaN;
};
const yn = (v: unknown) => ["y", "yes", "o", "1", "true", "예"].includes(String(v ?? "").trim().toLowerCase());
const text = (v: unknown) => {
  if (v == null) return "";
  if (typeof v === "object" && "text" in (v as object)) return String((v as { text: unknown }).text).trim();
  if (typeof v === "object" && "richText" in (v as object)) return (v as { richText: { text: string }[] }).richText.map((r) => r.text).join("").trim();
  return String(v).trim();
};

export async function parseProducts(buf: ArrayBuffer, categories: Category[], brands: Brand[]): Promise<ImportRow[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);
  const ws = wb.worksheets[0];
  if (!ws) throw new Error("시트를 찾을 수 없습니다.");
  const headers = Array.from(ws.getRow(1).values as unknown[], (v) => text(v)); // values는 1번부터 시작하는 희소배열
  const idx = (h: string) => headers.findIndex((x) => x.replace(/\s/g, "") === h.replace(/\s/g, ""));
  const missing = COLUMNS.filter((c) => c.header.endsWith("*") && idx(c.header) < 0).map((c) => c.header);
  if (missing.length) throw new Error(`필수 열이 없습니다: ${missing.join(", ")} — 양식을 내려받아 사용해 주세요.`);

  const out: ImportRow[] = [];
  const seen = new Set<string>();
  ws.eachRow((row, rn) => {
    if (rn === 1) return;
    const get = (key: (typeof COLUMNS)[number]["key"]) => { const c = COLUMNS.find((x) => x.key === key)!; const i = idx(c.header); return i < 0 ? undefined : row.getCell(i).value; };
    const name = text(get("name"));
    if (!name && !text(get("price"))) return; // 빈 줄
    const errors: string[] = [];
    const catTxt = text(get("category"));
    const cat = categories.find((c) => c.name === catTxt || c.slug === catTxt);
    const brTxt = text(get("brand"));
    const br = brTxt ? brands.find((b) => b.name === brTxt) : undefined;
    const price = num(get("price")), consumer = num(get("consumer_price")), salon = num(get("salon_price")), stock = num(get("stock"));
    const stTxt = text(get("status")) || "판매중";
    const sku = text(get("sku")) || undefined;

    if (!name) errors.push("상품명 누락");
    if (name.length > 200) errors.push("상품명 200자 초과");
    if (!cat) errors.push(catTxt ? `카테고리 '${catTxt}' 없음` : "카테고리 누락");
    if (brTxt && !br) errors.push(`브랜드 '${brTxt}' 없음`);
    if (price == null || Number.isNaN(price) || price <= 0) errors.push("판매가 오류");
    if (Number.isNaN(consumer as number)) errors.push("소비자가 숫자 아님");
    if (Number.isNaN(salon as number)) errors.push("미용실회원가 숫자 아님");
    if (salon != null && price != null && salon > price) errors.push("미용실회원가가 판매가보다 큼");
    if (Number.isNaN(stock as number)) errors.push("재고 숫자 아님");
    if (!STATUS_IN[stTxt]) errors.push(`상태 '${stTxt}' 알 수 없음`);
    if (sku) { if (seen.has(sku)) errors.push("파일 내 상품코드 중복"); seen.add(sku); }

    out.push({
      row: rn, errors,
      data: {
        sku, name, category_id: cat?.id ?? null, brand_id: br?.id ?? null, model_no: text(get("model_no")) || null,
        consumer_price: consumer ?? null, price: price ?? 0, salon_price: salon ?? null, stock: stock ?? 0,
        summary: text(get("summary")) || null, status: (STATUS_IN[stTxt] ?? "active") as Product["status"],
        is_best: yn(get("is_best")), is_new: yn(get("is_new")), vip_only: yn(get("vip_only")), thumbnail_url: text(get("thumbnail_url")) || null,
      },
    });
  });
  if (out.length > 2000) throw new Error("한 번에 2,000행까지 등록할 수 있습니다.");
  return out;
}
