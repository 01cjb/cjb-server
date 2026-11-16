"use client";
import Link from "next/link";
import LogoWhite from "@/components/LogoWhite";
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

  const input = "mt-2 h-14 w-full rounded-2xl border-0 bg-[#f6f2f9] px-4 text-[16px] font-medium text-neutral-900 outline-none ring-brand-600/40 transition focus:bg-white focus:ring-2 placeholder:font-normal placeholder:tracking-normal placeholder:text-neutral-400";
  const label = "block text-[12.5px] font-semibold tracking-wide text-neutral-500";
  const btn = "h-14 w-full rounded-2xl bg-plum font-bold text-white shadow-[0_10px_24px_-10px_rgba(59,29,90,.7)] transition active:scale-[.99] disabled:opacity-50";

  // 위: 진보라 배경 + 흰 로고 / 아래: 떠 있는 흰 카드
  const Hero = ({ title, sub }: { title: string; sub: React.ReactNode }) => (
    <div className="relative overflow-hidden rounded-b-[36px] bg-gradient-to-br from-plum via-plum-2 to-brand-600 px-6 pb-24 pt-5 text-white">
      <span aria-hidden className="absolute -right-16 -top-16 size-56 rounded-full bg-white/[.06]" />
      <span aria-hidden className="absolute -left-10 bottom-6 size-32 rounded-full bg-gold/10" />
      <Link href="/" className="relative inline-flex items-center gap-1 text-[13px] text-white/70">‹ 홈</Link>
      <div className="relative mt-8"><LogoWhite className="h-10 w-auto" /></div>
      <h1 className="relative mt-7 text-[26px] font-extrabold tracking-tight">{title}</h1>
      <p className="relative mt-1.5 text-[13.5px] leading-relaxed text-white/75">{sub}</p>
    </div>
  );
  const card = "relative z-10 mx-5 -mt-16 space-y-5 rounded-[28px] bg-white p-6 shadow-[0_24px_60px_-24px_rgba(59,29,90,.45)]";

  if (already) return (
    <div className="min-h-dvh">
      <Hero title={`${name ?? "원장"}님, 반가워요`} sub="이미 로그인되어 있어요." />
      <div className={card}>
        <Link href="/" className={`${btn} grid place-items-center`}>홈으로</Link>
        <a href="/logout" className="block text-center text-sm text-neutral-500 underline">로그아웃</a>
      </div>
    </div>
  );

  if (step === "pin") return (
    <div className="min-h-dvh pb-10">
      <Hero title="새 PIN 정하기" sub={<>임시 PIN으로 들어오셨어요.<br />앞으로 쓰실 PIN을 숫자 4~6자리로 정해 주세요.</>} />
      <form onSubmit={setPin} className={card}>
        <label className={label}>새 PIN<input className={`${input} tracking-[.4em]`} type="password" inputMode="numeric" maxLength={6} placeholder="숫자 4~6자리" value={np.a} onChange={(e) => setNp({ ...np, a: e.target.value.replace(/\D/g, "") })} required /></label>
        <label className={label}>새 PIN 한 번 더<input className={`${input} tracking-[.4em]`} type="password" inputMode="numeric" maxLength={6} value={np.b} onChange={(e) => setNp({ ...np, b: e.target.value.replace(/\D/g, "") })} required /></label>
        <button disabled={!!busy} className={btn}>{busy ? "저장 중…" : "PIN 저장하고 시작하기"}</button>
        {msg && <p className="text-center text-sm text-rose-600">{msg}</p>}
      </form>
    </div>
  );

  return (
    <div className="flex min-h-dvh flex-col pb-8">
      <Hero title="로그인" sub={<>담당자에게 받은 매장 코드와<br />가입한 연락처, PIN을 입력해 주세요.</>} />

      <form onSubmit={login} className={card}>
        <label className={label}>매장 코드<input className={`${input} tracking-[.2em]`} inputMode="numeric" maxLength={8} placeholder="8자리 숫자" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.replace(/\D/g, "") })} required /></label>
        <label className={label}>연락처<input className={input} type="tel" inputMode="numeric" placeholder="010-1234-5678" value={f.phone} onChange={(e) => setF({ ...f, phone: fmtPhone(e.target.value) })} required /></label>
        <label className={label}>PIN<input className={`${input} tracking-[.4em]`} type="password" inputMode="numeric" maxLength={6} placeholder="숫자 4~6자리" value={f.pin} onChange={(e) => setF({ ...f, pin: e.target.value.replace(/\D/g, "") })} required /></label>
        <label className="flex items-center gap-2 text-[13px] text-neutral-600"><input type="checkbox" className="size-[18px] rounded accent-brand-600" checked={save} onChange={(e) => setSave(e.target.checked)} />매장 코드·연락처 기억하기</label>
        <button disabled={!!busy} className={btn}>{busy === "login" ? "확인 중…" : "로그인"}</button>
        {msg && <p className="text-center text-sm text-rose-600">{msg}</p>}
        <p className="text-center text-xs leading-relaxed text-neutral-400">처음이시면 받으신 임시 PIN으로 들어와 새 PIN을 정해요.<br />코드·PIN을 모르시면 <a href={`tel:${tel}`} className="font-semibold text-plum">{tel}</a></p>
      </form>

      <div className="mx-5 mt-6 space-y-3">
        {testOn && (
          <button type="button" onClick={testLogin} disabled={!!busy} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-gold/70 bg-gold-50 text-[14px] font-bold text-gold-ink disabled:opacity-50">
            <span className="rounded-md bg-gold px-1.5 py-0.5 text-[10px] font-extrabold text-plum">TEST</span>
            {busy === "test" ? "들어가는 중…" : "테스트 계정으로 둘러보기"}
          </button>
        )}
        <div className="flex items-center justify-center gap-3 pt-2 text-[12.5px] text-neutral-500">
          <Link href={`/login/email?next=${encodeURIComponent(next)}`} className="hover:text-plum">이메일·네이버·카카오</Link>
          <span className="h-3 w-px bg-neutral-300" />
          <Link href="/work/login" className="hover:text-plum">직원 로그인</Link>
        </div>
      </div>
    </div>
  );
}
