"use client";
import { useEffect, useRef, useState } from "react";

// 업무 시스템 AI 비서 「미니」 — 평소엔 오른쪽 아래 동그란 버튼, 누르면 채팅창
// 음성: 브라우저 기본 기능 사용(추가 비용 없음). 말하기(마이크)는 크롬·엣지 위주, 듣기(읽어 주기)는 대부분의 브라우저
type Msg = { role: "user" | "assistant"; content: string; bad?: boolean };
type Rec = { lang: string; interimResults: boolean; continuous: boolean; start: () => void; stop: () => void; onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null; onend: (() => void) | null; onerror: ((e: { error: string }) => void) | null };
const QUICK = ["오늘 업무 보고해 줘", "송장 안 나간 주문 몇 건이야?", "진행 중인 지시 알려 줘"];

export default function Mini({ userName }: { userName: string }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [speak, setSpeak] = useState(false);
  const [listening, setListening] = useState(false);
  const [canHear, setCanHear] = useState(false);
  const [canSpeak, setCanSpeak] = useState(false);
  const [rate, setRate] = useState(0.85);
  const [voices, setVoices] = useState<string[]>([]);
  const [voiceName, setVoiceName] = useState("");
  const [setup, setSetup] = useState(false);
  const rec = useRef<Rec | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec };
    setCanHear(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
    setCanSpeak("speechSynthesis" in window);
    try {
      setSpeak(localStorage.getItem("mini.speak") === "1");
      const r = Number(localStorage.getItem("mini.rate")); if (r >= 0.6 && r <= 1.3) setRate(r);
      setVoiceName(localStorage.getItem("mini.voice") ?? "");
    } catch { /* 저장소를 못 쓰는 환경 */ }
    // 음성 목록은 조금 늦게 준비되는 브라우저가 있어 준비되면 다시 읽음
    const load = () => { try { setVoices(window.speechSynthesis.getVoices().filter((v) => v.lang?.toLowerCase().startsWith("ko")).map((v) => v.name)); } catch { /* 무시 */ } };
    load();
    try { window.speechSynthesis?.addEventListener("voiceschanged", load); } catch { /* 무시 */ }
    return () => { try { window.speechSynthesis?.removeEventListener("voiceschanged", load); window.speechSynthesis?.cancel(); rec.current?.stop(); } catch { /* 무시 */ } };
  }, []);
  useEffect(() => { box.current?.scrollTo({ top: box.current.scrollHeight, behavior: "smooth" }); }, [msgs, busy]);
  useEffect(() => { if (open) setTimeout(() => input.current?.focus(), 50); else { try { window.speechSynthesis?.cancel(); } catch { /* 무시 */ } } }, [open]);

  // 목소리 고르기: 자연스러운 음성(엣지의 Natural/Online, 크롬의 Google 한국어)을 먼저, 없으면 기기 기본 한국어 음성
  function pickVoice(): SpeechSynthesisVoice | undefined {
    const ko = window.speechSynthesis.getVoices().filter((v) => v.lang?.toLowerCase().startsWith("ko"));
    if (voiceName) { const v = ko.find((x) => x.name === voiceName); if (v) return v; }
    return ko.find((v) => /natural|online/i.test(v.name)) ?? ko.find((v) => /google/i.test(v.name)) ?? ko[0];
  }
  function say(t: string) {
    if (!canSpeak) return;
    try {
      const s = window.speechSynthesis; s.cancel();
      // 문장 단위로 끊어 읽어 숨 쉴 틈을 줌
      const parts = t.replace(/[*#_`>]+/g, " ").split(/(?<=[.!?。]|다\.|요\.)\s+|\n+/).map((x) => x.trim()).filter(Boolean);
      const v = pickVoice();
      for (const part of parts) {
        const u = new SpeechSynthesisUtterance(part);
        u.lang = "ko-KR"; u.rate = rate; u.pitch = 1;
        if (v) u.voice = v;
        s.speak(u);
      }
    } catch { /* 음성 없는 기기 */ }
  }
  const save = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* 무시 */ } };
  function toggleSpeak() {
    const n = !speak; setSpeak(n);
    try { localStorage.setItem("mini.speak", n ? "1" : "0"); if (!n) window.speechSynthesis?.cancel(); } catch { /* 무시 */ }
  }

  async function send(q: string, viaVoice = false) {
    const question = q.trim();
    if (!question || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content: question }];
    setMsgs(next); setText(""); setBusy(true);
    try {
      const r = await fetch("/api/work/mini", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages: next.filter((m) => !m.bad).map(({ role, content }) => ({ role, content })) }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) setMsgs([...next, { role: "assistant", content: j.error ?? "미니가 답하지 못했습니다.", bad: true }]);
      else { setMsgs([...next, { role: "assistant", content: j.text }]); if (speak || viaVoice) say(j.text); }
    } catch { setMsgs([...next, { role: "assistant", content: "연결이 끊겼습니다. 다시 시도해 주세요.", bad: true }]); }
    setBusy(false);
  }

  function mic() {
    if (listening) { rec.current?.stop(); return; }
    const w = window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec };
    const C = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!C) return;
    try { window.speechSynthesis?.cancel(); } catch { /* 무시 */ }
    const r = new C(); rec.current = r;
    r.lang = "ko-KR"; r.interimResults = true; r.continuous = false;
    let final = "";
    r.onresult = (e) => {
      let t = "";
      for (let i = 0; i < e.results.length; i++) { t += e.results[i][0].transcript; if (e.results[i].isFinal) final = t; }
      setText(t);
    };
    r.onerror = (e) => { setListening(false); if (e.error === "not-allowed" || e.error === "service-not-allowed") setMsgs((m) => [...m, { role: "assistant", content: "마이크 사용이 막혀 있습니다. 주소창 왼쪽 자물쇠 아이콘에서 마이크를 허용해 주세요.", bad: true }]); };
    r.onend = () => { setListening(false); if (final.trim()) send(final, true); };
    setListening(true); r.start();
  }

  return (
    <>
      {open && (
        <div className="fixed inset-x-3 bottom-24 z-50 flex max-h-[min(70vh,560px)] flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl sm:inset-x-auto sm:right-6 sm:w-[380px]" role="dialog" aria-label="AI 비서 미니">
          <div className="flex items-center gap-2 bg-brand-700 px-4 py-3 text-white">
            <span className="grid size-8 place-items-center rounded-full bg-white/15 text-sm font-bold">M</span>
            <div className="min-w-0 flex-1"><p className="text-sm font-semibold">미니 <span className="font-normal text-white/70">Mini</span></p><p className="text-[11px] text-white/70">CJB 업무 시스템 AI 비서</p></div>
            {canSpeak && <button onClick={toggleSpeak} aria-pressed={speak} title="답변을 소리로 듣기" className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-white/40 ${speak ? "bg-white text-brand-700" : "text-white"}`}>{speak ? "소리 켬" : "소리 끔"}</button>}
            {canSpeak && <button onClick={() => setSetup(!setup)} aria-expanded={setup} aria-label="음성 설정" title="음성 설정" className="grid size-8 place-items-center rounded-full hover:bg-white/15">
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></svg>
            </button>}
            <button onClick={() => setOpen(false)} aria-label="닫기" className="grid size-8 place-items-center rounded-full hover:bg-white/15">✕</button>
          </div>
          {setup && (
            <div className="space-y-2 border-b border-neutral-200 bg-white px-4 py-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-12 shrink-0 text-neutral-500">빠르기</span>
                {([[0.7, "느리게"], [0.85, "조금 느리게"], [1, "보통"], [1.15, "빠르게"]] as const).map(([r, l]) => (
                  <button key={r} onClick={() => { setRate(r); save("mini.rate", String(r)); }} className={`rounded-full px-2.5 py-1 ring-1 ${rate === r ? "bg-brand-600 text-white ring-brand-600" : "text-neutral-600 ring-neutral-200"}`}>{l}</button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="w-12 shrink-0 text-neutral-500">목소리</span>
                <select value={voiceName} onChange={(e) => { setVoiceName(e.target.value); save("mini.voice", e.target.value); }} className="min-w-0 flex-1 rounded-lg border border-neutral-200 px-2 py-1.5">
                  <option value="">자동 (가장 자연스러운 음성)</option>
                  {voices.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
                <button onClick={() => say("안녕하세요, 미니예요. 이 목소리와 빠르기로 읽어 드릴게요.")} className="shrink-0 rounded-full px-2.5 py-1 font-semibold text-brand-700 ring-1 ring-brand-300">들어 보기</button>
              </div>
              <p className="text-neutral-400">목소리는 이 기기에 설치된 것만 고를 수 있어요. 엣지 브라우저에는 더 자연스러운 목소리(이름에 Natural)가 있습니다.</p>
            </div>
          )}
          <div ref={box} className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-neutral-50 p-3 text-sm">
            <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-white px-3 py-2 shadow-sm">안녕하세요 {userName}님, 미니예요. 무엇을 도와드릴까요?</div>
            {!msgs.length && <div className="flex flex-wrap gap-1.5 pt-1">{QUICK.map((q) => <button key={q} onClick={() => send(q)} className="rounded-full bg-white px-3 py-1.5 text-xs text-brand-700 ring-1 ring-brand-200 hover:bg-brand-50">{q}</button>)}</div>}
            {msgs.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
                <div className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-3 py-2 shadow-sm ${m.role === "user" ? "rounded-tr-sm bg-brand-600 text-white" : m.bad ? "rounded-tl-sm bg-red-50 text-red-700" : "rounded-tl-sm bg-white"}`}>
                  {m.content}
                  {m.role === "assistant" && !m.bad && canSpeak && <button onClick={() => say(m.content)} className="ml-2 align-middle text-[11px] text-neutral-400 hover:text-brand-700" aria-label="소리로 듣기">▶ 듣기</button>}
                </div>
              </div>
            ))}
            {busy && <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-white px-3 py-2 text-neutral-400 shadow-sm">생각하는 중…</div>}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); send(text); }} className="flex items-end gap-2 border-t border-neutral-200 bg-white p-2.5">
            {canHear && <button type="button" onClick={mic} aria-pressed={listening} aria-label={listening ? "듣기 멈춤" : "말로 묻기"} className={`grid size-10 shrink-0 place-items-center rounded-full ${listening ? "animate-pulse bg-red-500 text-white" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"}`}>
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
            </button>}
            <textarea ref={input} value={text} onChange={(e) => setText(e.target.value)} rows={1} maxLength={2000} placeholder={listening ? "듣고 있어요…" : "미니에게 물어보세요"}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(text); } }}
              className="max-h-28 min-h-10 flex-1 resize-none rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-brand-400" />
            <button disabled={busy || !text.trim()} className="h-10 shrink-0 rounded-xl bg-brand-600 px-3.5 text-sm font-semibold text-white disabled:opacity-40">보내기</button>
          </form>
          <p className="bg-white px-3 pb-2 text-[10px] text-neutral-400">고객 이름·연락처·주소는 미니에게 전달되지 않습니다. 음성 입력은 브라우저(구글)를 거쳐 글자로 바뀝니다.</p>
        </div>
      )}
      <button onClick={() => setOpen(!open)} aria-label={open ? "미니 닫기" : "AI 비서 미니 열기"} aria-expanded={open}
        className="fixed bottom-6 right-4 z-50 grid size-14 place-items-center rounded-full bg-brand-700 text-white shadow-xl ring-4 ring-white transition hover:scale-105 sm:right-6">
        {open ? <span className="text-xl">✕</span> : <span className="text-center text-[13px] font-bold leading-tight">미니</span>}
      </button>
    </>
  );
}
