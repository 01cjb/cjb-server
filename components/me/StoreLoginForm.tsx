"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// 원장님 로그인: 매장 코드 + 가입한 연락처 + PIN (웰리케어 고객 로그인 방식)
const KEY = "bw.login";
const fmtPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  return d.length < 4 ? d : d.length < 8 ? `${d.slice(0, 3)}-${d.slice(3)}` : `${d.slice(0, 3)}-${d.slice(3, d.length - 4)}-${d.slice(-4)}`;
};

export default function StoreLoginForm({ already, name, testOn, tel }: { already: boolean; name: string | null; testOn: boolean; tel: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const [f, setF] = useState({ code: params.get("code") ?? "", phone: "", pin: "" });
  const [save, setSave] = useState(true);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState<"" | "login" | "test" | "pin">("");
  const [step, setStep] = useState<"login" | "pin">("login");
  const [np, setNp] = useState({ a: "", b: "" });

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) ?? "null");
      if (s) setF((v) => ({ ...v, code: v.code || s.code || "", phone: s.phone || "" }));
    } catch { /* 저장 안 됨 */ }
  }, []);

  const go = () => { router.push(next); router.refresh(); };
  const post = async (url: string, body?: unknown) => {
    const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    return { ok: r.ok, d: await r.json().catch(() => ({})) };
  };

  const login = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg(""); setBusy("login");
    const { ok, d } = await post("/api/auth/store-login", f);
    setBusy("");
    if (!ok) return setMsg(d.error ?? "로그인하지 못했어요.");
    try { if (save) localStorage.setItem(KEY, JSON.stringify({ code: f.code, phone: f.phone })); else localStorage.removeItem(KEY); } catch { /* 무시 */ }
    if (d.mock) return setMsg("목업 모드: 실제 로그인은 운영 사이트에서 동작해요.");
    if (d.changePin) { setStep("pin"); return; }
    go();
  };
  const testLogin = async () => {
    setMsg(""); setBusy("test");
    const { ok, d } = await post("/api/auth/test-login");
    setBusy("");
    if (!ok) return setMsg(d.error ?? "테스트 로그인에 실패했어요.");
    if (d.mock) return setMsg("목업 모드: 예시 회원으로 이미 보이고 있어요.");
    go();
  };
  const setPin = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg("");
    if (np.a !== np.b) return setMsg("두 번 입력한 PIN이 달라요.");
    setBusy("pin");
    const { ok, d } = await post("/api/auth/pin", { pin: np.a });
    setBusy("");
    if (!ok) return setMsg(d.error ?? "PIN을 바꾸지 못했어요.");
    go();
  };

  const input = "mt-1.5 w-full rounded-xl border border-[#ddd5e4] bg-white px-3.5 py-3 text-[15px] outline-none focus:border-brand-600 placeholder:text-neutral-400";
  const label = "block text-[13px] font-semibold text-neutral-700";
  const mark = <span aria-hidden className="mx-auto block size-14 bg-[url(/logo/full.png)] bg-[length:232px_56px] bg-no-repeat" />;

  if (already) return (
    <div className="px-5 py-16 text-center">
      {mark}
      <p className="mt-4 font-semibold">{name ?? "원장"}님, 이미 로그인되어 있어요.</p>
      <div className="mt-5 flex justify-center gap-2"><Link href="/" className="rounded-xl bg-plum px-5 py-2.5 text-sm font-bold text-white">홈으로</Link><a href="/logout" className="rounded-xl border border-[#ece6f1] bg-white px-5 py-2.5 text-sm">로그아웃</a></div>
    </div>
  );

  if (step === "pin") return (
    <div className="px-5 pt-12 pb-10">
      <div className="text-center">{mark}<h1 className="mt-4 text-xl font-extrabold text-plum">새 PIN 정하기</h1><p className="mt-2 text-[13px] leading-relaxed text-neutral-500">임시 PIN으로 들어오셨어요.<br />앞으로 쓰실 PIN을 숫자 4~6자리로 정해 주세요.</p></div>
      <form onSubmit={setPin} className="mt-6 space-y-4 rounded-2xl border border-[#ece6f1] bg-white p-5">
        <label className={label}>새 PIN<input className={input} type="password" inputMode="numeric" maxLength={6} placeholder="숫자 4~6자리" value={np.a} onChange={(e) => setNp({ ...np, a: e.target.value.replace(/\D/g, "") })} required /></label>
        <label className={label}>새 PIN 한 번 더<input className={input} type="password" inputMode="numeric" maxLength={6} value={np.b} onChange={(e) => setNp({ ...np, b: e.target.value.replace(/\D/g, "") })} required /></label>
        <button disabled={!!busy} className="w-full rounded-xl bg-plum py-3.5 font-bold text-white disabled:opacity-50">{busy ? "저장 중…" : "PIN 저장하고 시작하기"}</button>
        {msg && <p className="text-center text-sm text-rose-600">{msg}</p>}
      </form>
    </div>
  );

  return (
    <div className="px-5 pt-12 pb-10">
      <div className="text-center">
        {mark}
        <h1 className="mt-4 text-xl font-extrabold text-plum">원장님 로그인</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">담당자에게 받은 매장 코드와 가입한 연락처,<br />PIN을 입력해 로그인해 주세요.</p>
      </div>

      <form onSubmit={login} className="mt-6 space-y-4 rounded-2xl border border-[#ece6f1] bg-white p-5">
        <label className={label}>매장 코드<input className={input} inputMode="numeric" maxLength={8} placeholder="담당자에게 받은 8자리" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.replace(/\D/g, "") })} required /></label>
        <label className={label}>가입한 연락처<input className={input} type="tel" inputMode="numeric" placeholder="010-1234-5678" value={f.phone} onChange={(e) => setF({ ...f, phone: fmtPhone(e.target.value) })} required /></label>
        <label className={label}>PIN 번호<input className={input} type="password" inputMode="numeric" maxLength={6} placeholder="숫자 4~6자리" value={f.pin} onChange={(e) => setF({ ...f, pin: e.target.value.replace(/\D/g, "") })} required /></label>
        <p className="-mt-1 text-xs leading-relaxed text-neutral-500">처음이시면 뷰티웰에서 보내드린 임시 PIN을 적어 주세요. 들어온 뒤 내 PIN으로 바꿔요.</p>
        <label className="flex items-center gap-2 text-[13px] text-neutral-700"><input type="checkbox" className="size-4 accent-brand-600" checked={save} onChange={(e) => setSave(e.target.checked)} />매장 코드·연락처 저장 <span className="text-xs text-neutral-400">(PIN은 저장 안 해요)</span></label>
        <button disabled={!!busy} className="w-full rounded-xl bg-plum py-3.5 font-bold text-white disabled:opacity-50">{busy === "login" ? "확인 중…" : "로그인"}</button>
        {msg && <p className="text-center text-sm text-rose-600">{msg}</p>}
      </form>

      <p className="mt-4 text-center text-xs leading-relaxed text-neutral-500">매장 코드를 모르시거나 PIN을 잊으셨으면<br /><a href={`tel:${tel}`} className="font-semibold text-plum">{tel}</a>로 연락 주세요.</p>

      {testOn && (
        <div className="mt-6 rounded-2xl border-2 border-dashed border-gold bg-gold-50 p-4 text-center">
          <p className="text-xs font-semibold text-gold-ink">오픈 전 테스트용</p>
          <button type="button" onClick={testLogin} disabled={!!busy} className="mt-2 w-full rounded-xl bg-gold py-3 font-bold text-plum disabled:opacity-50">{busy === "test" ? "들어가는 중…" : "테스트 계정으로 로그인"}</button>
          <p className="mt-1.5 text-[11px] text-gold-ink/80">뷰티웰 테스트 미용실 (미용실회원) 계정으로 들어가요</p>
        </div>
      )}

      <div className="mt-6 grid gap-2 text-center text-[13px]">
        <Link href={`/login/email?next=${encodeURIComponent(next)}`} className="rounded-xl border border-[#ece6f1] bg-white py-3 text-neutral-700">이메일 · 네이버 · 카카오로 로그인</Link>
        <Link href="/work/login" className="py-2 text-neutral-500 underline">직원 로그인 (업무 시스템)</Link>
      </div>
    </div>
  );
}
