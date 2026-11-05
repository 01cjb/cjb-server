"use client";
import { useState } from "react";
import type { Customer } from "@/lib/admin/types";
import { Msg, useApi } from "./Act";

const inp = "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white";
export default function ContractForm({ customers }: { customers: Pick<Customer, "id" | "name" | "company_name">[] }) {
  const { call, msg, busy } = useApi();
  const today = new Date().toISOString().slice(0, 10);
  const [f, setF] = useState({ company_name: "", user_id: "", contract_type: "supply", start_date: today, end_date: "", discount_rate: 0, payment_terms: "", credit_limit: "", status: "active", memo: "" });
  const s = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <form onSubmit={(e) => { e.preventDefault(); call("/api/admin/contracts", "POST", f); }} className="rounded-xl bg-white border border-neutral-200 p-5 grid gap-3 md:grid-cols-4">
      <label className="text-xs text-neutral-600">거래처(회원)<select className={`${inp} mt-1`} value={f.user_id} onChange={(e) => { const c = customers.find((x) => x.id === e.target.value); setF({ ...f, user_id: e.target.value, company_name: f.company_name || c?.company_name || c?.name || "" }); }}>
        <option value="">비회원 거래처</option>{customers.map((c) => <option key={c.id} value={c.id}>{c.company_name ?? c.name}</option>)}</select></label>
      <label className="text-xs text-neutral-600">업체명 *<input className={`${inp} mt-1`} required value={f.company_name} onChange={s("company_name")} /></label>
      <label className="text-xs text-neutral-600">계약유형<select className={`${inp} mt-1`} value={f.contract_type} onChange={s("contract_type")}><option value="supply">공급계약</option><option value="agency">대리점</option><option value="vip">VIP 특약</option><option value="consignment">위탁판매</option><option value="etc">기타</option></select></label>
      <label className="text-xs text-neutral-600">상태<select className={`${inp} mt-1`} value={f.status} onChange={s("status")}><option value="draft">작성중</option><option value="active">유효</option><option value="expired">만료</option><option value="terminated">해지</option></select></label>
      <label className="text-xs text-neutral-600">시작일 *<input type="date" className={`${inp} mt-1`} value={f.start_date} onChange={s("start_date")} /></label>
      <label className="text-xs text-neutral-600">종료일<input type="date" className={`${inp} mt-1`} value={f.end_date} onChange={s("end_date")} /></label>
      <label className="text-xs text-neutral-600">추가 할인율(%)<input type="number" step="0.5" className={`${inp} mt-1`} value={f.discount_rate} onChange={s("discount_rate")} /></label>
      <label className="text-xs text-neutral-600">외상 한도(원)<input type="number" className={`${inp} mt-1`} value={f.credit_limit} onChange={s("credit_limit")} /></label>
      <label className="text-xs text-neutral-600 md:col-span-2">결제조건<input className={`${inp} mt-1`} value={f.payment_terms} onChange={s("payment_terms")} placeholder="예: 월말 마감, 익월 10일 계좌이체" /></label>
      <label className="text-xs text-neutral-600 md:col-span-2">메모<input className={`${inp} mt-1`} value={f.memo} onChange={s("memo")} /></label>
      <div className="md:col-span-4 flex items-center gap-3"><button disabled={busy} className="rounded-lg bg-brand-600 text-white px-5 py-2 text-sm font-semibold disabled:opacity-50">계약 등록</button><Msg m={msg} />
        <span className="text-xs text-neutral-400 ml-auto">계약서 원본(PDF)은 Supabase Storage ‘contracts’ 버킷 업로드 연동 예정</span></div>
    </form>
  );
}
