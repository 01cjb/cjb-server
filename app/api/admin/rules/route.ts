import { requireAdminApi } from "@/lib/admin/guard";
import { buildRulesMd } from "@/lib/rules";

export const dynamic = "force-dynamic";

// GET /api/admin/rules → 운영규칙 기준문서(Markdown). ?download=1 이면 파일로 내려받기
export async function GET(req: Request) {
  const { deny } = await requireAdminApi();
  if (deny) return deny;
  const md = await buildRulesMd();
  const dl = new URL(req.url).searchParams.get("download");
  const name = encodeURIComponent(`뷰티웰_운영규칙_${new Date().toISOString().slice(0, 10)}.md`);
  return new Response(md, { headers: { "content-type": "text/markdown; charset=utf-8", "cache-control": "no-store", ...(dl ? { "content-disposition": `attachment; filename*=UTF-8''${name}` } : {}) } });
}
