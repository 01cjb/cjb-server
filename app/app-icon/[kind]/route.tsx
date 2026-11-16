import { ImageResponse } from "next/og";
import { LOGO_PNG } from "@/lib/brand-logo";

// 뷰티웰 쇼핑몰 앱 아이콘 (원형 W 마크). /app-icon/192 · 512 · maskable · apple
const SIZES: Record<string, { size: number; mark: number }> = {
  "192": { size: 192, mark: 0.7 },
  "512": { size: 512, mark: 0.7 },
  maskable: { size: 512, mark: 0.56 }, // 안드로이드가 모서리를 잘라도 마크가 남도록 작게
  apple: { size: 180, mark: 0.7 },
};

export const dynamic = "force-static";
export function generateStaticParams() { return Object.keys(SIZES).map((kind) => ({ kind })); }

export async function GET(_: Request, { params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  const s = SIZES[kind] ?? SIZES["512"];
  const n = s.size, m = Math.round(n * s.mark);
  return new ImageResponse(
    (
      <div style={{ width: n, height: n, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(145deg, #ffffff 0%, #f1e9f8 100%)" }}>
        <div style={{ width: m, height: m, display: "flex", overflow: "hidden", borderRadius: m }}>
          {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
          <img src={`data:image/png;base64,${LOGO_PNG["full.png"]}`} width={Math.round((m * 464) / 111)} height={Math.round((m * 112) / 111)} style={{ marginTop: -Math.round(m * 0.005) }} />
        </div>
      </div>
    ),
    { width: n, height: n, headers: { "cache-control": "public, max-age=604800, immutable" } },
  );
}
