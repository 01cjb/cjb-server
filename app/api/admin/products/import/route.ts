import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/guard";
import { createServiceClient } from "@/lib/auth";
import { parseProducts } from "@/lib/excel";
import { getBrands, getCategories } from "@/lib/data";

export const runtime = "nodejs";

// POST multipart: file=<xlsx>, mode=validate|import
//  validate: 행별 오류만 돌려줌 / import: 오류 없는 행만 등록(상품코드 같으면 수정)
export async function POST(req: Request) {
  const { admin, deny } = await requireAdminApi(); if (deny) return deny;
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const mode = String(form?.get("mode") ?? "validate");
  if (!(file instanceof File)) return NextResponse.json({ error: "엑셀 파일을 선택하세요." }, { status: 400 });
  if (!/\.xlsx$/i.test(file.name)) return NextResponse.json({ error: ".xlsx 파일만 지원합니다." }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "5MB 이하 파일만 올릴 수 있습니다." }, { status: 400 });

  const [cats, brands] = await Promise.all([getCategories(), getBrands()]);
  let rows;
  try { rows = await parseProducts(await file.arrayBuffer(), cats, brands); }
  catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 400 }); }

  const ok = rows.filter((r) => !r.errors.length);
  const summary = { file: file.name, total: rows.length, valid: ok.length, invalid: rows.length - ok.length };
  if (mode !== "import") return NextResponse.json({ ...summary, rows });
  if (admin.mock) return NextResponse.json({ ...summary, rows, imported: ok.length, mock: true, message: "목업 모드: 검증만 수행되고 저장되지 않습니다." });

  const db = createServiceClient();
  const { data: batch, error: be } = await db.from("product_import_batches").insert({
    file_name: file.name, total_rows: rows.length, error_rows: rows.length - ok.length, actor: admin.userId,
  }).select("id").single();
  if (be) return NextResponse.json({ error: be.message }, { status: 500 });

  let success = 0;
  const failures: { row: number; error: string }[] = [];
  for (const r of ok) {
    const payload = { ...r.data, import_batch_id: batch.id, updated_at: new Date().toISOString() };
    const res = r.data.sku
      ? await db.from("products").upsert(payload, { onConflict: "sku" }).select("id").single()
      : await db.from("products").insert(payload).select("id").single();
    if (res.error) { failures.push({ row: r.row, error: res.error.message }); continue; }
    success++;
    await db.from("product_import_rows").insert({ batch_id: batch.id, row_no: r.row, data: r.data, product_id: res.data.id });
  }
  for (const r of rows.filter((x) => x.errors.length)) await db.from("product_import_rows").insert({ batch_id: batch.id, row_no: r.row, data: r.data, errors: r.errors });

  const status = success === rows.length ? "imported" : success > 0 ? "partially_imported" : "failed";
  await db.from("product_import_batches").update({ success_rows: success, error_rows: rows.length - success, status }).eq("id", batch.id);
  return NextResponse.json({ ...summary, rows, imported: success, failures, batchId: batch.id });
}
