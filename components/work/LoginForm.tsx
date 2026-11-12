"use client";
import { useEffect, useState } from "react";
import { fmtPhone, digits } from "@/lib/work/format";

const KEY = "cjb_work_saved"; // 이름·연락처만 저장 (PIN 제외)

export default function LoginForm({ next, demo }: { next: string; demo?: { name: string; phone: string; pin: string } }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [save, setSave] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) ?? "null");
      if (s?.name) { setName(s.name); setPhone(s.phone ?? ""); setSave(true); }
    } catch { /* 저장소 사용 불가 */ }
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      const r = await fetch("/api/work/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, phone, pin }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setErr(j.error ?? "로그인하지 못했습니다."); setPin(""); return; }
      try { save ? localStorage.setItem(KEY, JSON.stringify({ name, phone })) : localStorage.removeItem(KEY); } catch { /* 무시 */ }
      location.href = next;
    } finally { setBusy(false); }
  }

  const input = "w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-3 text-[15px] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";
  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block"><span className="block text-xs text-neutral-600 mb-1.5">이름</span>
        <input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="인사 등록된 이름" autoComplete="name" required maxLength={30} />
      </label>
      <label className="block"><span className="block text-xs text-neutral-600 mb-1.5">연락처</span>
        <input className={input} value={fmtPhone(digits(phone))} onChange={(e) => setPhone(digits(e.target.value).slice(0, 11))} placeholder="010-0000-0000" inputMode="tel" autoComplete="tel" />
      </label>
      <label className="block"><span className="block text-xs text-neutral-600 mb-1.5">개인 PIN (6자리)</span>
        <input className={`${input} tracking-[0.5em]`} value={pin} onChange={(e) => setPin(digits(e.target.value).slice(0, 6))} type="password" inputMode="numeric" autoComplete="current-password" required minLength={6} maxLength={6} />
      </label>
      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input type="checkbox" checked={save} onChange={(e) => setSave(e.target.checked)} className="size-4 accent-brand-600" />
        아이디 저장 <span className="text-xs text-neutral-400">(이름·연락처, 이 기기만 · PIN 제외)</span>
      </label>
      {err && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</p>}
      <button disabled={busy || pin.length !== 6 || !name.trim()} className="w-full rounded-lg bg-gradient-to-r from-brand-600 to-indigo-500 py-3 font-semibold text-white disabled:opacity-50">
        {busy ? "확인 중…" : "입장"}
      </button>
      <p className="text-xs leading-relaxed text-neutral-500">PIN은 대표가 발급합니다. 연락처 미등록 직원은 이름·PIN만으로 입장할 수 있습니다(인사 카드에 연락처 등록 권장). PIN 5회 오류 시 15분간 잠깁니다.</p>
      {demo && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">목업 모드 데모: 이름 <b>{demo.name}</b> · 연락처 <b>{demo.phone}</b> · PIN <b>{demo.pin}</b></p>
      )}
    </form>
  );
}
