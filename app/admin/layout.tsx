import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";
export const metadata = { title: "관리자", robots: { index: false } };

const nav = [
  ["/admin", "대시보드"], ["/admin/products", "상품관리"], ["/admin/products/import", "엑셀 대량등록"],
  ["/admin/customers", "고객정보"], ["/admin/orders", "주문관리"], ["/admin/shipments", "배송추적"],
  ["/admin/salon", "미용실 인증"], ["/admin/contracts", "계약정보"], ["/admin/invoices", "세금계산서"], ["/admin/consents", "약관·동의"], ["/admin/staff", "관리자 계정"],
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const a = await getAdmin();
  if (!a.ok) redirect(a.reason === "login required" ? "/login?next=/admin" : "/");
  return (
    <div className="bg-neutral-50 min-h-screen">
      {a.mock && <div className="bg-amber-100 text-amber-900 text-xs text-center py-1.5 px-4">목업 모드 — 예시 데이터이며 저장되지 않습니다. Supabase 키 설정 후 관리자 계정으로만 접근할 수 있습니다.</div>}
      <div className="max-w-7xl mx-auto md:flex gap-6 px-4 py-6">
        <aside className="md:w-48 shrink-0 mb-4 md:mb-0">
          <p className="text-xs font-semibold text-neutral-400 mb-2 px-2">뷰티웰 관리자</p>
          <nav className="flex md:flex-col gap-1 overflow-x-auto no-scrollbar">
            {nav.map(([h, l]) => <Link key={h} href={h} className="px-3 py-2 rounded-lg text-sm whitespace-nowrap hover:bg-white hover:shadow-sm">{l}</Link>)}
          </nav>
        </aside>
        <section className="flex-1 min-w-0">{children}</section>
      </div>
    </div>
  );
}
