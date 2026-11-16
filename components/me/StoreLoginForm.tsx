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

const LIFT = "shadow-[0_8px_22px_-14px_rgba(59,29,90,.45),0_1px_0_rgba(59,29,90,.05)]";

// PIN 6칸: 실제 입력칸은 투명하게 위에 덮고, 칸에는 점으로 표시
function PinBoxes({ value, onChange, label: aria }: { value: string; onChange: (v: string) => void; label: string }) {
  const [focus, setFocus] = useState(false);
  return (
    <div className="relative flex gap-2">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className={`grid h-[52px] flex-1 place-items-center rounded-[14px] bg-white transition ${focus && i === Math.min(value.length, 5) ? "shadow-[0_0_0_2px_#7b3fa8,0_10px_24px_-12px_rgba(123,63,168,.5)]" : LIFT}`}>
          {i < value.length && <span className="size-2.5 rounded-full bg-[#3b1d5a]" />}
        </div>
      ))}
      <input aria-label={aria} type="password" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={value}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0" required minLength={4} />
    </div>
  );
}

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

  // 연보라 배경 + 흰 칸이 그림자로 살짝 떠 있는 디자인
  const bg = { background: "radial-gradient(420px 260px at 85% -40px, rgba(138,75,192,.18), transparent 70%), radial-gradient(360px 240px at -60px 260px, rgba(244,201,93,.16), transparent 70%), #f1edf7" };
  const field = `flex h-[52px] items-center gap-2.5 rounded-[14px] bg-white px-3.5 ${LIFT} transition focus-within:shadow-[0_0_0_2px_#7b3fa8,0_10px_24px_-12px_rgba(123,63,168,.5)] [&:focus-within_svg]:text-[#7b3fa8]`;
  const inputCls = "h-full min-w-0 flex-1 bg-transparent text-[16px] font-bold text-[#231a2c] outline-none placeholder:font-normal placeholder:tracking-normal placeholder:text-[#b6acc2]";
  const label = "mb-2 block text-[12.5px] font-bold text-[#3d3347]";
  const btn = "h-[54px] w-full rounded-[14px] bg-[#2a1840] text-[16px] font-bold tracking-wide text-white shadow-[0_14px_26px_-12px_rgba(42,24,64,.8)] transition active:scale-[.99] disabled:opacity-50";
  const Ico = ({ d }: { d: string }) => <svg viewBox="0 0 24 24" className="size-[19px] shrink-0 text-[#a99cba] transition" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>;
  const I = {
    store: "M4 10v10h16V10M3 10l2-6h14l2 6M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0",
    phone: "M7 3h10v18H7zM11 18h2",
  };
  const fmtCode = (v: string) => (v.length > 4 ? `${v.slice(0, 4)} ${v.slice(4)}` : v);

  const top = (title: string, sub: React.ReactNode) => (
    <div className="text-center">
      <span aria-hidden className="mx-auto block h-[42px] w-[174px] bg-[url(/logo/full.png)] bg-[length:174px_42px] bg-no-repeat" />
      <h1 className="mt-6 text-[21px] font-extrabold tracking-tight text-[#2a1840]">{title}</h1>
      <p className="mt-2 text-[13px] leading-relaxed text-[#7d7388]">{sub}</p>
    </div>
  );
  const page = (children: React.ReactNode) => (
    <div className="relative min-h-dvh px-[22px] pb-10 pt-14" style={bg}>
      <Link href="/" className="absolute left-5 top-5 text-[13px] font-medium text-[#8f84a3]">‹ 홈</Link>
      {testOn && step === "login" && !already && (
        <button type="button" onClick={testLogin} disabled={!!busy} className="absolute right-4 top-4 flex h-[30px] items-center gap-1.5 rounded-full border border-[#efe2b8] bg-white px-3 text-[12px] font-bold text-gold-ink shadow-[0_4px_10px_-6px_rgba(122,90,18,.4)] disabled:opacity-50">
          <span className="size-[7px] rounded-full bg-gold" />{busy === "test" ? "들어가는 중…" : "테스트 로그인"}
        </button>
      )}
      {children}
    </div>
  );

  if (already) return (
    page(<>
      {top(`${name ?? "원장"}님, 반가워요`, "이미 로그인되어 있어요.")}
      <div className="mt-8 space-y-4 px-1">
        <Link href="/" className={`${btn} grid place-items-center`}>홈으로</Link>
        <a href="/logout" className="block text-center text-[13px] text-[#7d7388] underline underline-offset-4">로그아웃</a>
      </div>
    </>)
  );

  if (step === "pin") return (
    page(<>
      {top("새 PIN 정하기", <>임시 PIN으로 들어오셨어요.<br />앞으로 쓰실 PIN을 숫자 4~6자리로 정해 주세요.</>)}
      <form onSubmit={setPin} className="mt-7 space-y-4 px-1">
        <div><span className={label}>새 PIN</span><PinBoxes label="새 PIN" value={np.a} onChange={(v) => setNp({ ...np, a: v })} /></div>
        <div><span className={label}>새 PIN 한 번 더</span><PinBoxes label="새 PIN 확인" value={np.b} onChange={(v) => setNp({ ...np, b: v })} /></div>
        <div className="pt-2"><button disabled={!!busy} className={btn}>{busy ? "저장 중…" : "PIN 저장하고 시작하기"}</button></div>
        {msg && <p className="text-center text-sm text-rose-600">{msg}</p>}
      </form>
    </>)
  );

  return (
    page(<>
      {top("로그인", <>담당자에게 받은 매장 코드와 가입한 연락처,<br />PIN을 입력해 주세요.</>)}

      <form onSubmit={login} className="mt-6 space-y-4 px-1">
        <div>
          <span className={label}>매장 코드</span>
          <label className={field}><Ico d={I.store} /><input className={`${inputCls} tracking-[.12em]`} inputMode="numeric" maxLength={9} placeholder="담당자에게 받은 8자리" aria-label="매장 코드" value={fmtCode(f.code)} onChange={(e) => setF({ ...f, code: e.target.value.replace(/\D/g, "").slice(0, 8) })} required /></label>
        </div>
        <div>
          <span className={label}>가입한 연락처</span>
          <label className={field}><Ico d={I.phone} /><input className={inputCls} type="tel" inputMode="numeric" placeholder="010-1234-5678" aria-label="연락처" value={f.phone} onChange={(e) => setF({ ...f, phone: fmtPhone(e.target.value) })} required /></label>
        </div>
        <div>
          <span className={label}>PIN 번호</span>
          <PinBoxes label="PIN 번호" value={f.pin} onChange={(v) => setF({ ...f, pin: v })} />
          <p className="mt-2 text-[11.5px] leading-relaxed text-[#968ca3]">처음이시면 받으신 임시 PIN을 넣어 주세요. 들어온 뒤 내 PIN으로 바꿔요.</p>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-[13px] text-[#5d5368]">
          <input type="checkbox" className="peer sr-only" checked={save} onChange={(e) => setSave(e.target.checked)} />
          <span className="grid size-5 place-items-center rounded-md border-[1.5px] border-[#d8cfe2] bg-white text-transparent transition peer-checked:border-[#3b1d5a] peer-checked:bg-[#3b1d5a] peer-checked:text-white">
            <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-10" /></svg>
          </span>
          매장 코드·연락처 저장 <span className="text-[11.5px] text-[#a99cba]">(PIN은 저장 안 해요)</span>
        </label>
        <div className="pt-1"><button disabled={!!busy} className={btn}>{busy === "login" ? "확인 중…" : "로그인"}</button></div>
        {msg && <p className="text-center text-sm text-rose-600">{msg}</p>}
      </form>

      <p className="mt-5 text-center text-[12.5px] text-[#7d7388]">코드나 PIN을 모르시면 <a href={`tel:${tel}`} className="font-bold text-[#3b1d5a]">{tel}</a>로 연락 주세요.</p>
      <div className="mt-3 flex justify-center gap-4 text-[12.5px] font-bold text-brand-600 [&_a]:underline [&_a]:underline-offset-[3px]">
        <Link href={`/login/email?next=${encodeURIComponent(next)}`}>이메일·네이버·카카오 로그인</Link>
        <Link href="/work/login">직원 로그인</Link>
      </div>
    </>)
  );
}
