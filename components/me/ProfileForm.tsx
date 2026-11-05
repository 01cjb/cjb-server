"use client";
import { useState } from "react";
import type { Address, Customer } from "@/lib/admin/types";

const inp = "w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm";
function F({ l, children }: { l: string; children: React.ReactNode }) { return <label className="block text-xs text-neutral-600">{l}<div className="mt-1">{children}</div></label>; }

export default function ProfileForm({ u, addresses }: { u: Customer; addresses: Address[] }) {
  const [f, setF] = useState({ name: u.name ?? "", phone: u.phone ?? "", company_name: u.company_name ?? "", business_no: u.business_no ?? "", ceo_name: u.ceo_name ?? "", biz_type: u.biz_type ?? "", biz_item: u.biz_item ?? "", biz_address: u.biz_address ?? "", tax_email: u.tax_email ?? "" });
  const [a, setA] = useState({ label: "매장", receiver_name: "", phone: "", address1: "", address2: "", is_default: true });
  const [msg, setMsg] = useState<string | null>(null);
  const s = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const post = async (url: string, method: string, body?: unknown) => {
    const r = await fetch(url, { method, headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    const d = await r.json(); setMsg(r.ok ? (d.mock ? "목업 모드: 저장되지 않습니다." : "저장했습니다.") : d.error); if (r.ok && !d.mock) location.reload();
  };
  return (
    <div className="space-y-6">
      <form onSubmit={(e) => { e.preventDefault(); post("/api/me", "PATCH", f); }} className="space-y-5">
        <div className="grid gap-3 md:grid-cols-2">
          <F l="이름"><input className={inp} value={f.name} onChange={s("name")} /></F>
          <F l="휴대폰"><input className={inp} value={f.phone} onChange={s("phone")} /></F>
          <F l="이메일 (로그인 ID)"><input className={`${inp} bg-neutral-50`} value={u.email} disabled /></F>
        </div>
        <div>
          <p className="font-semibold text-sm mb-1">사업자 정보</p>
          <p className="text-xs text-neutral-500 mb-3">세금계산서는 이 정보로 발행됩니다. 사업자등록증과 동일하게 입력해 주세요.</p>
          <div className="grid gap-3 md:grid-cols-2">
            <F l="상호"><input className={inp} value={f.company_name} onChange={s("company_name")} /></F>
            <F l="사업자등록번호"><input className={inp} value={f.business_no} onChange={s("business_no")} placeholder="000-00-00000" /></F>
            <F l="대표자"><input className={inp} value={f.ceo_name} onChange={s("ceo_name")} /></F>
            <F l="계산서 받을 이메일"><input className={inp} value={f.tax_email} onChange={s("tax_email")} /></F>
            <F l="업태"><input className={inp} value={f.biz_type} onChange={s("biz_type")} placeholder="서비스" /></F>
            <F l="종목"><input className={inp} value={f.biz_item} onChange={s("biz_item")} placeholder="미용업" /></F>
            <div className="md:col-span-2"><F l="사업장 주소"><input className={inp} value={f.biz_address} onChange={s("biz_address")} /></F></div>
          </div>
        </div>
        <button className="rounded-xl bg-brand-600 text-white font-semibold px-6 py-2.5 text-sm">저장</button>
        {msg && <span className="ml-3 text-sm text-neutral-600">{msg}</span>}
      </form>
      <div>
        <p className="font-semibold text-sm mb-2">배송지</p>
        <ul className="divide-y divide-neutral-200 border-y border-neutral-200 text-sm mb-3">
          {addresses.map((x) => <li key={x.id} className="flex items-center gap-3 py-3"><span className="rounded bg-neutral-100 px-2 py-0.5 text-xs">{x.label}</span><span className="flex-1">{x.receiver_name} · {x.phone}<br /><span className="text-neutral-500">{x.address1} {x.address2}</span></span>{x.is_default && <span className="text-xs text-brand-700">기본</span>}<button onClick={() => post(`/api/me/addresses?id=${x.id}`, "DELETE")} className="text-xs text-neutral-400">삭제</button></li>)}
        </ul>
        <form onSubmit={(e) => { e.preventDefault(); post("/api/me/addresses", "POST", a); }} className="grid gap-2 md:grid-cols-6 text-sm">
          <input className={inp} placeholder="구분" value={a.label} onChange={(e) => setA({ ...a, label: e.target.value })} />
          <input className={inp} placeholder="받는 분" value={a.receiver_name} onChange={(e) => setA({ ...a, receiver_name: e.target.value })} />
          <input className={inp} placeholder="연락처" value={a.phone} onChange={(e) => setA({ ...a, phone: e.target.value })} />
          <input className={`${inp} md:col-span-2`} placeholder="주소" value={a.address1} onChange={(e) => setA({ ...a, address1: e.target.value })} />
          <button className="rounded-lg border border-neutral-300 px-3 py-2">배송지 추가</button>
        </form>
      </div>
    </div>
  );
}
