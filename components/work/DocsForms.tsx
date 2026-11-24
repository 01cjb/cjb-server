"use client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

// 서류 보관함 · 지시함에서 쓰는 입력 폼과 버튼
const input = "w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400";
const btn = "rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40";
type Msg = { t: string; bad?: boolean } | null;
const Note = ({ m }: { m: Msg }) => (m ? <p className={`mt-2 text-sm ${m.bad ? "text-red-600" : "text-emerald-700"}`}>{m.t}</p> : null);

export function DocUpload({ box, boxLabel }: { box: string; boxLabel: string }) {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData(form.current!);
    fd.set("box", box);
    const f = fd.get("file");
    if (f instanceof File && f.size > 4 * 1024 * 1024) return setMsg({ t: "파일은 4MB 이하만 올릴 수 있습니다. 큰 파일은 링크로 올려 주세요.", bad: true });
    setBusy(true); setMsg(null);
    const r = await fetch("/api/work/docs", { method: "POST", body: fd });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setMsg({ t: j.error ?? "올리기 실패", bad: true });
    form.current?.reset(); setMsg({ t: "서류를 올렸습니다." }); router.refresh();
  }
  return (
    <form ref={form} onSubmit={submit} className="rounded-xl border border-neutral-200 bg-white p-4">
      <p className="mb-3 text-sm font-semibold">{boxLabel}에 올리기</p>
      <div className="grid gap-2 md:grid-cols-2">
        <input name="title" required maxLength={120} placeholder="제목 (예: 11월 거래처 정산내역)" className={input} />
        <input name="link_url" placeholder="링크 (선택 · 구글시트 등 https://…)" className={input} />
        <textarea name="body" rows={2} maxLength={4000} placeholder="설명 (선택)" className={`${input} md:col-span-2`} />
        <input name="file" type="file" className="text-xs md:col-span-2" />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button disabled={busy} className={btn}>{busy ? "올리는 중…" : "올리기"}</button>
        <span className="text-xs text-neutral-500">파일은 4MB 이하 · 올린 사람과 대표만 지울 수 있습니다</span>
      </div>
      <Note m={msg} />
    </form>
  );
}

export function DocDelete({ id }: { id: number }) {
  const router = useRouter();
  const [ask, setAsk] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!ask) return <button onClick={() => setAsk(true)} className="text-xs text-neutral-400 hover:text-red-600">지우기</button>;
  return (
    <span className="whitespace-nowrap text-xs">
      <button disabled={busy} onClick={async () => { setBusy(true); await fetch(`/api/work/docs/${id}`, { method: "DELETE" }); router.refresh(); }} className="font-semibold text-red-600">지우기 확인</button>
      <button onClick={() => setAsk(false)} className="ml-2 text-neutral-500">취소</button>
    </span>
  );
}

export function DirectiveForm({ teams, users }: { teams: { key: string; label: string }[]; users: { id: string; name: string; team: string }[] }) {
  const router = useRouter();
  const [f, setF] = useState({ title: "", body: "", to_team: teams[0]?.key ?? "all", to_user: "", due_date: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);
  const pick = users.filter((u) => f.to_team === "all" || u.team === f.to_team || (f.to_team === "design" && u.team === "dev"));
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const r = await fetch("/api/work/directives", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(f) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setMsg({ t: j.error ?? "저장 실패", bad: true });
    setF({ ...f, title: "", body: "", to_user: "", due_date: "" }); setMsg({ t: "지시를 등록했습니다." }); router.refresh();
  }
  return (
    <form onSubmit={submit} className="rounded-xl border border-neutral-200 bg-white p-4">
      <p className="mb-3 text-sm font-semibold">지시 내리기</p>
      <div className="grid gap-2 md:grid-cols-4">
        <input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} required maxLength={120} placeholder="무엇을 (예: 로젠 송장 엑셀 양식 수정)" className={`${input} md:col-span-4`} />
        <textarea value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} rows={2} maxLength={4000} placeholder="자세한 내용 (선택)" className={`${input} md:col-span-4`} />
        <select value={f.to_team} onChange={(e) => setF({ ...f, to_team: e.target.value, to_user: "" })} className={input}>{teams.map((t) => <option key={t.key} value={t.key}>받는 곳: {t.label}</option>)}</select>
        <select value={f.to_user} onChange={(e) => setF({ ...f, to_user: e.target.value })} className={input}>
          <option value="">담당자 지정 안 함</option>
          {pick.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <label className="flex items-center gap-2 text-xs text-neutral-500 md:col-span-2">기한 <input type="date" value={f.due_date} onChange={(e) => setF({ ...f, due_date: e.target.value })} className={input} /></label>
      </div>
      <button disabled={busy} className={`${btn} mt-3`}>{busy ? "등록 중…" : "등록"}</button>
      <Note m={msg} />
    </form>
  );
}

export function DirectiveActions({ id, status, result }: { id: number; status: string; result: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(result ?? "");
  const [busy, setBusy] = useState(false);
  async function send(body: Record<string, string>) {
    setBusy(true);
    await fetch(`/api/work/directives/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    setBusy(false); setOpen(false); router.refresh();
  }
  const next = status === "open" ? ["doing", "진행 시작"] : status === "doing" ? ["done", "완료 처리"] : ["open", "다시 열기"];
  return (
    <div className="text-xs">
      <div className="flex flex-wrap gap-2">
        <button disabled={busy} onClick={() => send({ status: next[0] })} className="rounded-md px-2 py-1 font-semibold text-brand-700 ring-1 ring-brand-300 disabled:opacity-40">{next[1]}</button>
        <button onClick={() => setOpen(!open)} className="rounded-md px-2 py-1 text-neutral-600 ring-1 ring-neutral-200">{result ? "보고 수정" : "결과 보고"}</button>
      </div>
      {open && (
        <div className="mt-2">
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={4000} placeholder="처리 결과를 적어 주세요" className={input} />
          <button disabled={busy} onClick={() => send({ result: text })} className="mt-1 rounded-md bg-neutral-800 px-3 py-1 font-semibold text-white disabled:opacity-40">보고 저장</button>
        </div>
      )}
    </div>
  );
}
