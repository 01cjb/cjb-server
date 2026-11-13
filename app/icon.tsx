import { ImageResponse } from "next/og";
import { LOGO_PNG } from "@/lib/brand-logo";

// 파비콘: 뷰티웰 로고의 원형 마크 부분
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  const n = size.width;
  return new ImageResponse(
    (
      <div style={{ width: n, height: n, display: "flex", overflow: "hidden" }}>
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img src={`data:image/png;base64,${LOGO_PNG["full.png"]}`} width={Math.round((n * 464) / 112)} height={n} style={{ marginLeft: -1 }} />
      </div>
    ),
    size,
  );
}
