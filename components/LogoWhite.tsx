"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

// 어두운 헤더용 흰색 로고: 원본(/logo/full.png)의 보라색은 흰색, W 마크 속 흰색은 진보라로 바꿔서 그림
let cached: string | null = null;

export default function LogoWhite({ className = "h-9 w-auto md:h-11" }: { className?: string }) {
  const [src, setSrc] = useState<string | null>(cached);
  useEffect(() => {
    if (cached) return;
    const im = new Image();
    im.onload = () => {
      const c = document.createElement("canvas");
      c.width = im.width; c.height = im.height;
      const x = c.getContext("2d");
      if (!x) return;
      x.drawImage(im, 0, 0);
      const d = x.getImageData(0, 0, c.width, c.height), p = d.data;
      for (let i = 0; i < p.length; i += 4) {
        if (!p[i + 3]) continue;
        if ((p[i] + p[i + 1] + p[i + 2]) / 3 > 200) { p[i] = 59; p[i + 1] = 29; p[i + 2] = 90; } else { p[i] = p[i + 1] = p[i + 2] = 255; }
      }
      x.putImageData(d, 0, 0);
      cached = c.toDataURL();
      setSrc(cached);
    };
    im.src = "/logo/full.png";
  }, []);
  return (
    <Link href="/" className="flex items-center shrink-0" aria-label="뷰티웰 홈">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src ?? "/logo/full.png"} alt="Beauty Well 뷰티/헤어디자이너의 일상을 책임집니다" width={464} height={112}
        className={`${className} transition-opacity ${src ? "opacity-100" : "opacity-0"}`} />
    </Link>
  );
}
