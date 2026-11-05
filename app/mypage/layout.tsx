import Link from "next/link";
export const dynamic = "force-dynamic";
const nav = [["/mypage", "홈"], ["/mypage/orders", "구매내역"], ["/mypage/invoices", "세금계산서"], ["/mypage/contracts", "계약정보"], ["/mypage/profile", "회원·사업자정보"], ["/mypage/consents", "수신동의"]];
export default function MyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <nav className="flex gap-1 overflow-x-auto no-scrollbar mb-6 -mx-1">{nav.map(([h, l]) => <Link key={h} href={h} className="shrink-0 rounded-full border border-neutral-200 px-3.5 py-1.5 text-sm hover:border-brand-400">{l}</Link>)}</nav>
      {children}
    </div>
  );
}
