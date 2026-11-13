import Link from "next/link";

// 뷰티웰 로고 (원본 회사 로고 이미지, 슬로건 포함)
export default function Logo({ small = false }: { small?: boolean }) {
  return (
    <Link href="/" className="flex items-center shrink-0" aria-label="뷰티웰 홈">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo/full.png" alt="Beauty Well 뷰티/헤어디자이너의 일상을 책임집니다" width={464} height={112}
        className={small ? "h-9 w-auto" : "h-10 w-auto md:h-12"} />
    </Link>
  );
}
