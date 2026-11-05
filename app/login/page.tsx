"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const enabled = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export default function Login() {
  const router = useRouter();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [f, setF] = useState({ email: "", password: "", name: "" });
  const [msg, setMsg] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg("");
    if (!enabled) { setMsg("목업 모드: Supabase 키를 설정하면 실제 로그인/가입이 동작합니다."); return; }
    const sb = createClient();
    const { error } = mode === "in"
      ? await sb.auth.signInWithPassword({ email: f.email, password: f.password })
      : await sb.auth.signUp({ email: f.email, password: f.password, options: { data: { name: f.name }, emailRedirectTo: `${location.origin}/auth/callback` } });
    if (error) return setMsg(error.message);
    if (mode === "up") return setMsg("가입 확인 메일을 보냈습니다. 메일의 링크를 눌러 주세요.");
    router.push("/mypage"); router.refresh();
  };

  const input = "w-full rounded-lg border border-neutral-300 px-3 py-3 text-sm outline-none focus:border-brand-500";
  return (
    <div className="max-w-sm mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-center">{mode === "in" ? "로그인" : "회원가입"}</h1>
      {mode === "up" && <p className="text-center text-sm text-brand-600 mt-2">가입 즉시 2,000원 쿠폰 지급!</p>}
      <form onSubmit={submit} className="mt-8 space-y-3">
        {mode === "up" && <input className={input} placeholder="이름" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required />}
        <input className={input} type="email" placeholder="이메일" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required />
        <input className={input} type="password" placeholder="비밀번호 (6자 이상)" minLength={6} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required />
        <button className="w-full rounded-xl bg-brand-600 text-white font-semibold py-3">{mode === "in" ? "로그인" : "가입하기"}</button>
      </form>
      {msg && <p className="mt-4 text-sm text-center text-neutral-600">{msg}</p>}
      <div className="mt-6 grid gap-2">
        <button disabled className="w-full rounded-xl bg-[#FEE500] text-neutral-900 font-semibold py-3 disabled:opacity-60">카카오로 시작하기 (연동 예정)</button>
        <button disabled className="w-full rounded-xl bg-[#03C75A] text-white font-semibold py-3 disabled:opacity-60">네이버로 시작하기 (연동 예정)</button>
      </div>
      <p className="mt-6 text-center text-sm text-neutral-500">
        {mode === "in" ? <>아직 회원이 아니신가요? <button className="text-brand-600 font-medium" onClick={() => setMode("up")}>회원가입</button></>
          : <>이미 회원이신가요? <button className="text-brand-600 font-medium" onClick={() => setMode("in")}>로그인</button></>}
      </p>
      <p className="mt-2 text-center text-xs"><Link href="/salon-member" className="text-neutral-400 underline">미용실 원장님이신가요? 미용실회원 인증하기</Link></p>
    </div>
  );
}
