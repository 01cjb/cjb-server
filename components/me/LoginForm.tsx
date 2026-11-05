"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { ConsentDoc } from "@/lib/admin/types";

const enabled = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const ORDER = ["age14", "terms", "privacy", "privacy_third", "marketing"];

export default function LoginForm({ docs, already }: { docs: ConsentDoc[]; already: boolean }) {
  const router = useRouter();
  const next = useSearchParams().get("next") || "/mypage";
  const [mode, setMode] = useState<"in" | "up" | "reset">("in");
  const [f, setF] = useState({ email: "", password: "", name: "", phone: "" });
  const [agree, setAgree] = useState<Record<string, boolean>>({});
  const [ch, setCh] = useState({ ch_email: true, ch_sms: true, ch_push: true });
  const [open, setOpen] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const list = [...docs].sort((a, b) => ORDER.indexOf(a.code) - ORDER.indexOf(b.code));
  const allOn = list.every((d) => agree[d.code]);
  const reqOk = list.filter((d) => d.required).every((d) => agree[d.code]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg("");
    if (mode === "up" && !reqOk) return setMsg("필수 약관에 동의해 주세요.");
    if (!enabled) { setMsg("목업 모드: Supabase 키를 설정하면 실제 로그인/가입이 동작합니다."); return; }
    const sb = createClient();
    if (mode === "reset") {
      const { error } = await sb.auth.resetPasswordForEmail(f.email, { redirectTo: `${location.origin}/auth/callback?next=/mypage/profile` });
      return setMsg(error ? error.message : "비밀번호 재설정 메일을 보냈습니다.");
    }
    if (mode === "in") {
      const { error } = await sb.auth.signInWithPassword({ email: f.email, password: f.password });
      if (error) return setMsg(error.message === "Invalid login credentials" ? "이메일 또는 비밀번호가 맞지 않습니다." : error.message);
      router.push(next); router.refresh(); return;
    }
    const consents = { ...Object.fromEntries(list.map((d) => [d.code, !!agree[d.code]])), ...(agree.marketing ? ch : { ch_email: false, ch_sms: false, ch_push: false }) };
    const { error } = await sb.auth.signUp({ email: f.email, password: f.password, options: { data: { name: f.name, phone: f.phone, consents }, emailRedirectTo: `${location.origin}/auth/callback` } });
    setMsg(error ? error.message : "가입 확인 메일을 보냈습니다. 메일의 링크를 누르면 가입이 완료됩니다.");
  };

  const input = "w-full rounded-lg border border-neutral-300 px-3 py-3 text-sm outline-none focus:border-brand-500";
  if (already) return <div className="max-w-sm mx-auto px-4 py-16 text-center"><p>이미 로그인되어 있습니다.</p><Link href="/mypage" className="inline-block mt-4 rounded-full bg-brand-600 text-white px-5 py-2 text-sm">마이페이지</Link></div>;
  return (
    <div className="max-w-sm mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-center">{mode === "in" ? "로그인" : mode === "up" ? "회원가입" : "비밀번호 찾기"}</h1>
      {mode === "up" && <p className="text-center text-sm text-brand-600 mt-2">가입 즉시 2,000원 쿠폰 지급!</p>}
      <form onSubmit={submit} className="mt-8 space-y-3">
        {mode === "up" && <><input className={input} placeholder="이름" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required />
          <input className={input} placeholder="휴대폰 번호" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} required /></>}
        <input className={input} type="email" placeholder="이메일" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required />
        {mode !== "reset" && <input className={input} type="password" placeholder="비밀번호 (8자 이상)" minLength={mode === "up" ? 8 : 6} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required />}

        {mode === "up" && (
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
        )}
        <button className="w-full rounded-xl bg-brand-600 text-white font-semibold py-3 disabled:opacity-50" disabled={mode === "up" && !reqOk}>{mode === "in" ? "로그인" : mode === "up" ? "동의하고 가입하기" : "재설정 메일 받기"}</button>
      </form>
      {msg && <p className="mt-4 text-sm text-center text-neutral-600">{msg}</p>}
      {mode === "in" && <div className="mt-6 grid gap-2">
        <button disabled className="w-full rounded-xl bg-[#FEE500] text-neutral-900 font-semibold py-3 disabled:opacity-60">카카오로 시작하기 (연동 예정)</button>
        <button disabled className="w-full rounded-xl bg-[#03C75A] text-white font-semibold py-3 disabled:opacity-60">네이버로 시작하기 (연동 예정)</button>
      </div>}
      <div className="mt-6 text-center text-sm text-neutral-500 space-x-3">
        {mode !== "in" && <button className="text-brand-600" onClick={() => setMode("in")}>로그인</button>}
        {mode !== "up" && <button className="text-brand-600 font-medium" onClick={() => setMode("up")}>회원가입</button>}
        {mode !== "reset" && <button onClick={() => setMode("reset")}>비밀번호 찾기</button>}
      </div>
      <p className="mt-3 text-center text-xs space-x-3"><Link href="/terms" className="text-neutral-400 underline">이용약관</Link><Link href="/privacy" className="text-neutral-400 underline font-semibold">개인정보처리방침</Link><Link href="/salon-member" className="text-neutral-400 underline">미용실회원 인증</Link></p>
    </div>
  );
}
