import { LOGO_PNG } from "@/lib/brand-logo";

// 뷰티웰 로고 이미지: /logo/full.png · /logo/compact.png · /logo/mark.png
export const dynamic = "force-static";
export function generateStaticParams() { return Object.keys(LOGO_PNG).map((file) => ({ file })); }

export async function GET(_: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const b64 = LOGO_PNG[file];
  if (!b64) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(b64, "base64"), { headers: { "content-type": "image/png", "cache-control": "public, max-age=86400" } });
}
