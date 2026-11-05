import { requireAdminApi } from "@/lib/admin/guard";
import { buildTemplate } from "@/lib/excel";
import { getBrands, getCategories } from "@/lib/data";
import { listAdminProducts } from "@/lib/admin/repo";

export const runtime = "nodejs";

// GET /api/admin/products/template        → 빈 양식(예시 1행)
// GET /api/admin/products/template?export=1 → 현재 상품 전체 내보내기 (수정 후 재업로드 가능)
export async function GET(req: Request) {
  const { deny } = await requireAdminApi(); if (deny) return deny;
  const exp = new URL(req.url).searchParams.get("export") === "1";
  const [cats, brands] = await Promise.all([getCategories(), getBrands()]);
  const buf = await buildTemplate(cats, brands, exp ? (await listAdminProducts()).filter((p) => p.status !== "cancelled") : undefined);
  const name = exp ? "뷰티웰_상품목록.xlsx" : "뷰티웰_상품등록양식.xlsx";
  return new Response(new Uint8Array(buf), {
    headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(name)}`,
    },
  });
}
