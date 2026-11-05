import Link from "next/link";
import { company } from "@/lib/company";

export default function Footer() {
  return (
    <footer className="bg-neutral-50 border-t border-neutral-200 mt-16 text-xs text-neutral-500">
      <div className="max-w-6xl mx-auto px-4 py-8 grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-1">
          <div className="flex flex-wrap gap-4 text-neutral-700 font-medium mb-3">
            <Link href="/">회사소개</Link><Link href="/terms">이용약관</Link><Link href="/privacy" className="font-bold">개인정보처리방침</Link><Link href="/">이용안내</Link>
          </div>
          <p>법인명(상호) : {company.name} · 대표자 : {company.ceo} · 사업자등록번호 : {company.bizNo}</p>
          <p>통신판매업 신고 {company.mailOrderNo} · 전화 {company.tel} · 팩스 {company.fax}</p>
          <p>주소 : {company.address}</p>
          <p>개인정보보호책임자 : {company.ceo} ({company.email})</p>
          <p className="pt-2">Copyright © 미용인을 위한 복지몰 -{company.mall}-. All rights reserved.</p>
        </div>
        <div>
          <p className="text-neutral-700 font-medium">고객센터</p>
          <p className="text-2xl font-bold text-brand-700 my-1">{company.tel}</p>
          <p>{company.hours}</p>
        </div>
      </div>
    </footer>
  );
}
