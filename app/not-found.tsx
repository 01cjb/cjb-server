import Link from "next/link";
export default function NotFound() {
  return <div className="py-24 text-center"><p className="text-5xl font-bold text-brand-200">404</p><p className="mt-3 text-neutral-500">페이지를 찾을 수 없습니다.</p><Link href="/" className="inline-block mt-6 rounded-full bg-brand-600 text-white px-6 py-2.5 text-sm">홈으로</Link></div>;
}
