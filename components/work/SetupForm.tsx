"use client";
import { useState } from "react";
import { digits, fmtPhone } from "@/lib/work/format";

export default function SetupForm() {
  const [f, setF] = useState({ name: "", phone: "", pin: "" });
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    const r = await fetch("/api/work/setup", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(f) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return setErr(j.error ?? "만들지 못했습니다.");
    setDone(true);
  }
  if (done) return <p className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">대표 계정을 만들었습니다. <a href="/work/login" className="font-semibold underline">로그인하기 →</a></p>;
  const input = "w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-3 outline-none focus:border-brand-500";
  return (
    <form onSubmit={submit} className="space-y-3">
      <input className={input} placeholder="대표 이름" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required />
      <input className={input} placeholder="연락처 010-0000-0000" value={fmtPhone(f.phone)} onChange={(e) => setF({ ...f, phone: digits(e.target.value).slice(0, 11) })} inputMode="tel" />
      <input className={input} placeholder="PIN 6자리 숫자" value={f.pin} onChange={(e) => setF({ ...f, pin: digits(e.target.value).slice(0, 6) })} type="password" inputMode="numeric" required minLength={6} />
      {err && <p className="text-sm text-rose-700">{err}</p>}
      <button className="w-full rounded-lg bg-brand-600 py-3 font-semibold text-white">대표 계정 만들기</button>
    </form>
  );
}
