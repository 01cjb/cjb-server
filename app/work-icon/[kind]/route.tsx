import { ImageResponse } from "next/og";

// 업무 시스템 앱 아이콘 (PNG를 코드로 생성). /work-icon/192 · 512 · maskable · apple
const SIZES: Record<string, { size: number; round: boolean; safe: boolean }> = {
  "192": { size: 192, round: true, safe: false },
  "512": { size: 512, round: true, safe: false },
  maskable: { size: 512, round: false, safe: true },
  apple: { size: 180, round: false, safe: false },
};

export const dynamic = "force-static";
export function generateStaticParams() { return Object.keys(SIZES).map((kind) => ({ kind })); }

export async function GET(_: Request, { params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  const s = SIZES[kind] ?? SIZES["512"];
  const n = s.size, k = s.safe ? 0.83 : 1;
  return new ImageResponse(
    (
      <div style={{ width: n, height: n, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#6a2f96", borderRadius: s.round ? n * 0.22 : 0 }}>
        <div style={{ color: "white", fontSize: n * 0.34 * k, fontWeight: 800, lineHeight: 1, letterSpacing: -n * 0.005 }}>CJB</div>
        <div style={{ color: "#ede3f6", fontSize: n * 0.1 * k, fontWeight: 700, marginTop: n * 0.05 * k, letterSpacing: n * 0.01 }}>WORK</div>
      </div>
    ),
    { width: n, height: n, headers: { "cache-control": "public, max-age=604800, immutable" } },
  );
}
