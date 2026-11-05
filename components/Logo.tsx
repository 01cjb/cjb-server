import Link from "next/link";
export default function Logo({ small = false }: { small?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="뷰티웰 홈">
      <span className={`grid place-items-center rounded-full bg-brand-600 text-white font-serif italic font-bold ${small ? "size-8 text-lg" : "size-10 text-2xl"}`}>W</span>
      <span className="leading-tight">
        <span className={`block font-serif italic font-bold text-brand-700 ${small ? "text-lg" : "text-2xl"}`}>Beauty Well</span>
        {!small && <span className="block text-[10px] text-brand-500">뷰티/헤어디자이너의 월급을 책임집니다</span>}
      </span>
    </Link>
  );
}
