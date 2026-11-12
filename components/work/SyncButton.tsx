"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SyncButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  async function run() {
    setBusy(true); setMsg("");
    const r = await fetch("/api/integrations/cafe24/sync", { method: "POST" });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    setMsg(r.ok ? `${j.count}건 가져옴` : j.error ?? "실패");
    router.refresh();
  }
  return (
    <span className="flex items-center gap-2">
      <button onClick={run} disabled={busy} className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? "가져오는 중…" : "지금 가져오기"}</button>
      {msg && <span className="text-xs text-neutral-500">{msg}</span>}
    </span>
  );
}
