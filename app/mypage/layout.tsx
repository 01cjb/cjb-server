import Link from "next/link";
import { redirect } from "next/navigation";
import { adminEnabled, createServiceClient, currentUser } from "@/lib/auth";
import { needsConsent } from "@/lib/consent";
export const dynamic = "force-dynamic";
const nav = [["/mypage", "홈"], ["/mypage/orders", "구매내역"], ["/mypage/invoices", "세금계산서"], ["/mypage/contracts", "계약정보"], ["/mypage/profile", "회원·사업자정보"], ["/mypage/consents", "수신동의"]];
export default async function MyLayout({ children }: { children: React.ReactNode }) {
  // 소셜 가입 후 필수 약관 동의를 건너뛴 회원은 동의 화면으로
  if (adminEnabled()) {
    const u = await currentUser();
    if (u.id && (await needsConsent(createServiceClient(), u.id))) redirect("/signup/consent?next=/mypage");
  }
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <nav className="flex gap-1 overflow-x-auto no-scrollbar mb-6 -mx-1">{nav.map(([h, l]) => <Link key={h} href={h} className="shrink-0 rounded-full border border-neutral-200 px-3.5 py-1.5 text-sm hover:border-brand-400">{l}</Link>)}</nav>
      {children}
    </div>
  );
}
