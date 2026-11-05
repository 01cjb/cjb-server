"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

// 관리자 API 호출 공용 버튼: 확인 입력(사유 등) → 호출 → 결과 표시 → 새로고침
export function useApi() {
  const router = useRouter();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const call = async (url: string, method: string, body?: unknown) => {
    setBusy(true); setMsg(null);
    try {
      const r = await fetch(url, { method, headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
      const d = await r.json().catch(() => ({}));
      setMsg(r.ok ? { ok: true, text: d.message ?? d.note ?? "저장했습니다." } : { ok: false, text: d.error ?? "처리하지 못했습니다." });
      if (r.ok && !d.mock) router.refresh();
      return { ok: r.ok, data: d };
    } finally { setBusy(false); }
  };
  return { call, msg, busy, setMsg };
}

export function Msg({ m }: { m: { ok: boolean; text: string } | null }) {
  if (!m) return null;
  return <p className={`text-xs mt-1 ${m.ok ? "text-emerald-700" : "text-rose-600"}`}>{m.text}</p>;
}

export default function Act({ url, method = "POST", body, label, ask, tone = "default", small = true }: {
  url: string; method?: string; body?: Record<string, unknown>; label: string; ask?: string; tone?: "default" | "danger" | "primary"; small?: boolean;
}) {
  const { call, msg, busy } = useApi();
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState("");
  const cls = { default: "border border-neutral-300 bg-white", danger: "border border-rose-300 text-rose-700 bg-white", primary: "bg-brand-600 text-white" }[tone];
  const run = async () => { const r = await call(url, method, ask ? { ...body, reason: val, memo: val } : body); if (r.ok) { setOpen(false); setVal(""); } };
  return (
    <span className="inline-flex flex-col">
      {open ? (
        <span className="flex gap-1">
          <input autoFocus value={val} onChange={(e) => setVal(e.target.value)} placeholder={ask} className="border border-neutral-300 rounded px-2 py-1 text-xs w-40" />
          <button disabled={busy || !val.trim()} onClick={run} className={`rounded px-2 py-1 text-xs ${cls} disabled:opacity-40`}>확인</button>
          <button onClick={() => setOpen(false)} className="text-xs text-neutral-400 px-1">취소</button>
        </span>
      ) : (
        <button disabled={busy} onClick={() => (ask ? setOpen(true) : run())} className={`rounded ${small ? "px-2.5 py-1 text-xs" : "px-4 py-2 text-sm"} ${cls} disabled:opacity-40 whitespace-nowrap`}>{busy ? "…" : label}</button>
      )}
      <Msg m={msg} />
    </span>
  );
}
