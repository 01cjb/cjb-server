"use client";
import { useState } from "react";

export default function SalonMember() {
  const [f, setF] = useState({ salon_name: "", owner_name: "", business_no: "", phone: "" });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await fetch("/api/salon-verification", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(f) });
    const d = await r.json();
    setMsg(r.ok ? { ok: true, text: `신청이 접수되었습니다. 영업일 기준 1~2일 내 승인됩니다.${d.mock ? " (목업)" : ""}` } : { ok: false, text: d.error });
  };
  const input = "mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-brand-500";
  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="rounded-2xl bg-brand-50 p-6 text-center">
        <div className="text-4xl">💈</div>
        <h1 className="text-2xl font-bold mt-2">미용실회원관</h1>
        <p className="text-sm text-neutral-600 mt-2">미용실·이용원 사업자 인증 시 <b className="text-brand-700">미용실회원가</b>가 적용됩니다.</p>
      </div>
      <div className="grid grid-cols-3 gap-2 my-6 text-center text-xs">
        {[["1", "인증 신청"], ["2", "서류 확인"], ["3", "회원가 적용"]].map(([n, t]) => (
          <div key={n} className="rounded-xl border border-neutral-200 py-3"><b className="block text-brand-600 text-lg">{n}</b>{t}</div>
        ))}
      </div>
      <form onSubmit={submit} className="space-y-3">
        <label className="block text-sm">상호명<input className={input} required value={f.salon_name} onChange={(e) => setF({ ...f, salon_name: e.target.value })} placeholder="뷰티웰 헤어" /></label>
        <label className="block text-sm">대표자명<input className={input} required value={f.owner_name} onChange={(e) => setF({ ...f, owner_name: e.target.value })} /></label>
        <label className="block text-sm">사업자등록번호<input className={input} required value={f.business_no} onChange={(e) => setF({ ...f, business_no: e.target.value })} placeholder="000-00-00000" /></label>
        <label className="block text-sm">연락처<input className={input} required value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="010-0000-0000" /></label>
        <div className="rounded-lg border border-dashed border-neutral-300 p-4 text-xs text-neutral-500">사업자등록증 / 미용사 면허증 업로드 (Supabase Storage 연동 예정)</div>
        <button className="w-full rounded-xl bg-brand-600 text-white font-semibold py-3">인증 신청하기</button>
      </form>
      {msg && <p className={`mt-4 text-sm text-center ${msg.ok ? "text-brand-700" : "text-accent"}`}>{msg.text}</p>}
    </div>
  );
}
