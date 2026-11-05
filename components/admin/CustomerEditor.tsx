"use client";
import { useState } from "react";
import type { Customer } from "@/lib/admin/types";
import { Msg, useApi } from "./Act";

const inp = "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white";
function F({ l, children }: { l: string; children: React.ReactNode }) { return <label className="block text-xs text-neutral-600">{l}<div className="mt-1">{children}</div></label>; }

export default function CustomerEditor({ c }: { c: Customer }) {
  const { call, msg, busy } = useApi();
  const [f, setF] = useState({
    name: c.name ?? "", phone: c.phone ?? "", grade_id: c.grade_id, status: c.status, memo: c.memo ?? "", reason: "",
    company_name: c.company_name ?? "", business_no: c.business_no ?? "", ceo_name: c.ceo_name ?? "", biz_type: c.biz_type ?? "", biz_item: c.biz_item ?? "", biz_address: c.biz_address ?? "", tax_email: c.tax_email ?? "",
  });
  const s = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <form onSubmit={(e) => { e.preventDefault(); call(`/api/admin/customers/${c.id}`, "PATCH", f); }} className="rounded-xl bg-white border border-neutral-200 p-5 space-y-5">
      <div className="grid gap-3 md:grid-cols-4">
        <F l="이름"><input className={inp} value={f.name} onChange={s("name")} /></F>
        <F l="연락처"><input className={inp} value={f.phone} onChange={s("phone")} /></F>
        <F l="회원등급"><select className={inp} value={f.grade_id} onChange={s("grade_id")}><option value="general">일반회원</option><option value="salon">미용실회원</option><option value="vip">VIP</option></select></F>
        <F l="계정상태"><select className={inp} value={f.status} onChange={s("status")}><option value="active">정상</option><option value="dormant">휴면</option><option value="blocked">정지</option><option value="withdrawn">탈퇴</option></select></F>
        {f.grade_id !== c.grade_id && <div className="md:col-span-4"><F l="등급 변경 사유 (이력에 기록)"><input className={inp} value={f.reason} onChange={s("reason")} placeholder="예: 사업자 인증 완료, 연 매출 기준 VIP 승급" /></F></div>}
      </div>
      <div>
        <p className="text-xs font-semibold text-neutral-500 mb-2">사업자 정보 (세금계산서 발행용)</p>
        <div className="grid gap-3 md:grid-cols-4">
          <F l="상호"><input className={inp} value={f.company_name} onChange={s("company_name")} /></F>
          <F l="사업자등록번호"><input className={inp} value={f.business_no} onChange={s("business_no")} placeholder="000-00-00000" /></F>
          <F l="대표자"><input className={inp} value={f.ceo_name} onChange={s("ceo_name")} /></F>
          <F l="계산서 수신 이메일"><input className={inp} value={f.tax_email} onChange={s("tax_email")} /></F>
          <F l="업태"><input className={inp} value={f.biz_type} onChange={s("biz_type")} /></F>
          <F l="종목"><input className={inp} value={f.biz_item} onChange={s("biz_item")} /></F>
          <div className="md:col-span-2"><F l="사업장 주소"><input className={inp} value={f.biz_address} onChange={s("biz_address")} /></F></div>
        </div>
      </div>
      <F l="관리자 메모 (고객에게 보이지 않음)"><textarea className={inp} rows={2} value={f.memo} onChange={s("memo")} /></F>
      <div className="flex items-center gap-3"><button disabled={busy} className="rounded-lg bg-brand-600 text-white px-5 py-2 text-sm font-semibold disabled:opacity-50">저장</button><Msg m={msg} /></div>
    </form>
  );
}
