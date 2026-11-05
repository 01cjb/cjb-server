"use client";
import { useState } from "react";
import { Msg, useApi } from "./Act";

export default function StaffForm() {
  const { call, msg, busy } = useApi();
  const [f, setF] = useState({ email: "", role: "admin", is_test: false, note: "" });
  return (
    <form onSubmit={(e) => { e.preventDefault(); call("/api/admin/staff", "POST", f); }} className="rounded-xl bg-white border border-neutral-200 p-5 grid gap-3 md:grid-cols-[2fr_1fr_auto_2fr_auto] items-end">
      <label className="text-xs text-neutral-600">가입된 회원 이메일<input required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="admin@회사도메인.com" className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm" /></label>
      <label className="text-xs text-neutral-600">권한<select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm">
        <option value="admin">최고관리자</option><option value="staff">직원</option><option value="customer">권한 해제(일반회원)</option></select></label>
      <label className="flex items-center gap-1.5 text-sm pb-2"><input type="checkbox" className="accent-brand-600" checked={f.is_test} onChange={(e) => setF({ ...f, is_test: e.target.checked })} />테스트 계정</label>
      <label className="text-xs text-neutral-600">메모<input value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="예: 회사 계정 전환" className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm" /></label>
      <button disabled={busy} className="rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-semibold disabled:opacity-50">적용</button>
      <div className="md:col-span-5"><Msg m={msg} /></div>
    </form>
  );
}
