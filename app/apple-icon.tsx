import { ImageResponse } from "next/og";
import { LOGO_PNG } from "@/lib/brand-logo";

// 아이폰 홈 화면 아이콘: 흰 바탕 + 원형 마크
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  const n = size.width;
  return new ImageResponse(
    (
      <div style={{ width: n, height: n, display: "flex", alignItems: "center", justifyContent: "center", background: "white" }}>
        <div style={{ width: n * 0.8, height: n * 0.8, display: "flex", overflow: "hidden" }}>
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img src={`data:image/png;base64,${LOGO_PNG["full.png"]}`} width={Math.round((n * 0.8 * 464) / 112)} height={n * 0.8} style={{ marginLeft: -1 }} />
        </div>
      </div>
    ),
    size,
  );
}
