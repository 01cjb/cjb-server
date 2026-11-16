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

  // 뉴모피즘: 같은 색 배경 위에 빛(왼쪽 위)·그림자(오른쪽 아래)로 튀어나오고 들어간 느낌
  const BG = "bg-[#ece7f3]";
  const raised = "shadow-[10px_10px_24px_#d0c7dd,-10px_-10px_24px_#ffffff]";
  const inset = "shadow-[inset_5px_5px_10px_#d2c9de,inset_-5px_-5px_10px_#ffffff]";
  const field = `flex h-14 items-center gap-3 rounded-2xl ${BG} ${inset} px-4 transition focus-within:shadow-[inset_6px_6px_12px_#cbc1d9,inset_-6px_-6px_12px_#ffffff,0_0_0_2px_rgba(106,47,150,.25)]`;
  const inputCls = "h-full min-w-0 flex-1 bg-transparent text-[16px] font-semibold text-plum outline-none placeholder:font-normal placeholder:tracking-normal placeholder:text-[#a59bb3]";
  const btn = "h-14 w-full rounded-2xl bg-gradient-to-br from-brand-600 to-plum font-bold tracking-wide text-white shadow-[8px_8px_18px_#cbc1d9,-8px_-8px_18px_#ffffff] transition active:shadow-[inset_4px_4px_10px_rgba(0,0,0,.35)] disabled:opacity-50";
  const Ico = ({ d }: { d: string }) => <svg viewBox="0 0 24 24" className="size-5 shrink-0 text-[#9a8fb0]" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>;
  const I = {
    store: "M4 10v10h16V10M3 10l2-6h14l2 6M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M10 20v-5h4v5",
    phone: "M7 3h10v18H7zM11 18h2",
    lock: "M6 11h12v10H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3M12 15v2",
  };

  // 위: 입체 로고 / 아래: 떠 있는 패널
  const Top = ({ title, sub }: { title: string; sub: React.ReactNode }) => (
    <div className="px-6 pt-5 text-center">
      <div className="text-left"><Link href="/" className="text-[13px] font-medium text-[#8f84a3]">‹ 홈</Link></div>
      <div className={`mx-auto mt-6 grid size-24 place-items-center rounded-full ${BG} ${raised}`}>
        <div className={`grid size-[74px] place-items-center rounded-full ${BG} ${inset}`}>
          <span aria-hidden className="block size-14 bg-[url(/logo/full.png)] bg-[length:232px_56px] bg-no-repeat" />
        </div>
      </div>
      <span aria-hidden className="mx-auto mt-5 block h-8 w-[136px] bg-[url(/logo/full.png)] bg-[length:142px_34px] bg-[position:-42px_0] bg-no-repeat" />
      <h1 className="mt-4 text-[24px] font-extrabold tracking-tight text-plum">{title}</h1>
      <p className="mt-1.5 text-[13px] leading-relaxed text-[#8f84a3]">{sub}</p>
    </div>
  );
  const panel = `mx-5 mt-7 space-y-4 rounded-[30px] ${BG} ${raised} p-6`;

  if (already) return (
    <div className={`min-h-dvh ${BG} pb-10`}>
      <Top title={`${name ?? "원장"}님, 반가워요`} sub="이미 로그인되어 있어요." />
      <div className={panel}>
        <Link href="/" className={`${btn} grid place-items-center`}>홈으로</Link>
        <a href="/logout" className="block text-center text-sm text-[#8f84a3] underline">로그아웃</a>
      </div>
    </div>
  );

  if (step === "pin") return (
    <div className={`min-h-dvh ${BG} pb-10`}>
      <Top title="새 PIN 정하기" sub={<>임시 PIN으로 들어오셨어요.<br />앞으로 쓰실 PIN을 숫자 4~6자리로 정해 주세요.</>} />
      <form onSubmit={setPin} className={panel}>
        <div className={field}><Ico d={I.lock} /><input className={`${inputCls} tracking-[.4em]`} type="password" inputMode="numeric" maxLength={6} placeholder="새 PIN (숫자 4~6자리)" value={np.a} onChange={(e) => setNp({ ...np, a: e.target.value.replace(/\D/g, "") })} required /></div>
        <div className={field}><Ico d={I.lock} /><input className={`${inputCls} tracking-[.4em]`} type="password" inputMode="numeric" maxLength={6} placeholder="새 PIN 한 번 더" value={np.b} onChange={(e) => setNp({ ...np, b: e.target.value.replace(/\D/g, "") })} required /></div>
        <button disabled={!!busy} className={btn}>{busy ? "저장 중…" : "PIN 저장하고 시작하기"}</button>
        {msg && <p className="text-center text-sm text-rose-600">{msg}</p>}
      </form>
    </div>
  );

  return (
    <div className={`flex min-h-dvh flex-col ${BG} pb-8`}>
      <Top title="로그인" sub={<>담당자에게 받은 매장 코드와<br />가입한 연락처, PIN을 입력해 주세요.</>} />

      <form onSubmit={login} className={panel}>
        <label className={field}><Ico d={I.store} /><input className={`${inputCls} tracking-[.18em]`} inputMode="numeric" maxLength={8} placeholder="매장 코드 8자리" aria-label="매장 코드" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.replace(/\D/g, "") })} required /></label>
        <label className={field}><Ico d={I.phone} /><input className={inputCls} type="tel" inputMode="numeric" placeholder="연락처 010-1234-5678" aria-label="연락처" value={f.phone} onChange={(e) => setF({ ...f, phone: fmtPhone(e.target.value) })} required /></label>
        <label className={field}><Ico d={I.lock} /><input className={`${inputCls} tracking-[.4em]`} type="password" inputMode="numeric" maxLength={6} placeholder="PIN 숫자 4~6자리" aria-label="PIN" value={f.pin} onChange={(e) => setF({ ...f, pin: e.target.value.replace(/\D/g, "") })} required /></label>
        <label className="flex cursor-pointer items-center justify-between px-1 pt-1 text-[13px] text-[#6f6584]">
          매장 코드·연락처 기억하기
          <input type="checkbox" className="peer sr-only" checked={save} onChange={(e) => setSave(e.target.checked)} />
          <span className={`relative h-7 w-12 rounded-full ${BG} ${inset} transition after:absolute after:left-1 after:top-1 after:size-5 after:rounded-full after:bg-[#ece7f3] after:shadow-[2px_2px_5px_#bfb5ce,-2px_-2px_5px_#ffffff] after:transition peer-checked:bg-brand-600/15 peer-checked:after:translate-x-5 peer-checked:after:bg-brand-600`} />
        </label>
        <div className="pt-1"><button disabled={!!busy} className={btn}>{busy === "login" ? "확인 중…" : "로그인"}</button></div>
        {msg && <p className="text-center text-sm text-rose-600">{msg}</p>}
      </form>

      <p className="mt-5 px-6 text-center text-xs leading-relaxed text-[#9a8fb0]">처음이시면 받으신 임시 PIN으로 들어와 새 PIN을 정해요.<br />코드·PIN을 모르시면 <a href={`tel:${tel}`} className="font-bold text-plum">{tel}</a></p>

      <div className="mx-5 mt-6 space-y-5">
        {testOn && (
          <button type="button" onClick={testLogin} disabled={!!busy} className={`flex h-12 w-full items-center justify-center gap-2 rounded-2xl ${BG} ${raised} text-[14px] font-bold text-plum transition active:shadow-[inset_5px_5px_10px_#d2c9de,inset_-5px_-5px_10px_#ffffff] disabled:opacity-50`}>
            <span className="size-2 rounded-full bg-gold shadow-[0_0_8px_#f4c95d]" />
            {busy === "test" ? "들어가는 중…" : "테스트 계정으로 둘러보기"}
          </button>
        )}
        <div className="flex items-center justify-center gap-3 text-[12.5px] text-[#8f84a3]">
          <Link href={`/login/email?next=${encodeURIComponent(next)}`} className="hover:text-plum">이메일·네이버·카카오</Link>
          <span className="h-3 w-px bg-[#cfc6db]" />
          <Link href="/work/login" className="hover:text-plum">직원 로그인</Link>
        </div>
      </div>
    </div>
  );
}
