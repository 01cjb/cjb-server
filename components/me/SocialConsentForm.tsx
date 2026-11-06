"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { ConsentDoc } from "@/lib/admin/types";

const ORDER = ["age14", "terms", "privacy", "privacy_third", "marketing"];

export default function SocialConsentForm({ docs, name, phone, email }: { docs: ConsentDoc[]; name: string; phone: string; email: string }) {
  const router = useRouter();
  const nextParam = useSearchParams().get("next");
  const next = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/mypage";
  const [f, setF] = useState({ name, phone });
  const [agree, setAgree] = useState<Record<string, boolean>>({});
  const [ch, setCh] = useState({ ch_email: true, ch_sms: true, ch_push: true });
  const [open, setOpen] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const list = [...docs].sort((a, b) => ORDER.indexOf(a.code) - ORDER.indexOf(b.code));
  const allOn = list.every((d) => agree[d.code]);
  const reqOk = list.filter((d) => d.required).every((d) => agree[d.code]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg("");
    if (!reqOk) return setMsg("필수 약관에 동의해 주세요.");
    setBusy(true);
    const r = await fetch("/api/me/signup-consents", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: f.name, phone: f.phone, consents: Object.fromEntries(list.map((d) => [d.code, !!agree[d.code]])), ...(agree.marketing ? ch : { ch_email: false, ch_sms: false, ch_push: false }) }),
    });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setMsg(j.error ?? "저장하지 못했습니다. 다시 시도해 주세요.");
    router.push(next); router.refresh();
  };

  const input = "w-full rounded-lg border border-neutral-300 px-3 py-3 text-sm outline-none focus:border-brand-500";
  return (
    <div className="max-w-sm mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-center">가입 마무리</h1>
      <p className="text-center text-sm text-neutral-500 mt-2">약관에 동의하면 가입이 완료됩니다.</p>
      <form onSubmit={submit} className="mt-8 space-y-3">
        <input className={`${input} bg-neutral-50 text-neutral-500`} value={email} readOnly aria-label="이메일" />
        <input className={input} placeholder="이름" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required />
        <input className={input} placeholder="휴대폰 번호" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} required />
        <div className="rounded-xl border border-neutral-200 p-4 space-y-2 text-sm">
          <label className="flex items-center gap-2 font-semibold pb-2 border-b border-neutral-100">
            <input type="checkbox" className="accent-brand-600 size-4" checked={allOn} onChange={(e) => setAgree(Object.fromEntries(list.map((d) => [d.code, e.target.checked])))} />전체 동의</label>
          {list.map((d) => (
            <div key={d.code}>
              <div className="flex items-center gap-2">
                <input id={`c-${d.code}`} type="checkbox" className="accent-brand-600" checked={!!agree[d.code]} onChange={(e) => setAgree({ ...agree, [d.code]: e.target.checked })} />
                <label htmlFor={`c-${d.code}`} className="flex-1"><span className={d.required ? "text-brand-700" : "text-neutral-400"}>[{d.required ? "필수" : "선택"}]</span> {d.title.replace(" (선택)", "")}</label>
                <button type="button" onClick={() => setOpen(open === d.code ? null : d.code)} className="text-xs text-neutral-400 underline">보기</button>
              </div>
              {open === d.code && <p className="mt-1 ml-6 text-xs text-neutral-500 bg-neutral-50 rounded p-2">{d.body}</p>}
              {d.code === "marketing" && agree.marketing && (
                <div className="ml-6 mt-1 flex gap-3 text-xs text-neutral-600">
                  {(["ch_email", "ch_sms", "ch_push"] as const).map((k) => <label key={k} className="flex items-center gap-1"><input type="checkbox" checked={ch[k]} onChange={(e) => setCh({ ...ch, [k]: e.target.checked })} />{{ ch_email: "이메일", ch_sms: "문자", ch_push: "앱푸시" }[k]}</label>)}
                </div>
              )}
            </div>
          ))}
        </div>
        <button className="w-full rounded-xl bg-brand-600 text-white font-semibold py-3 disabled:opacity-50" disabled={!reqOk || busy}>{busy ? "저장 중…" : "동의하고 시작하기"}</button>
      </form>
      {msg && <p className="mt-4 text-sm text-center text-neutral-600">{msg}</p>}
      <p className="mt-6 text-center text-xs text-neutral-400">동의하지 않으면 <Link href="/logout" className="underline">로그아웃</Link>할 수 있습니다.</p>
    </div>
  );
}
