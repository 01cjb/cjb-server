"use client";
import { useState } from "react";

// 원장님 로그인용 매장 코드 + 임시 PIN 발급 (임시 PIN은 발급 직후 한 번만 보임)
export default function StoreLoginIssue({ id, code, temp, setAt, phone }: { id: string; code: string | null; temp: boolean; setAt: string | null; phone: string | null }) {
  const [res, setRes] = useState<{ code: string; pin: string; mock?: boolean } | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const issue = async () => {
    if (code && !confirm("임시 PIN을 새로 만들까요? 원장님이 쓰던 PIN은 더 이상 안 돼요.")) return;
    setBusy(true); setErr("");
    const r = await fetch(`/api/admin/customers/${id}/store-login`, { method: "POST" });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setErr(d.error ?? "발급하지 못했습니다.");
    setRes(d);
  };
  const shown = res?.code ?? code;
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold">원장님 로그인 (매장 코드 + 연락처 + PIN)</p>
          <p className="text-xs text-neutral-500 mt-0.5">
            매장 코드 <b className="font-mono text-neutral-900">{shown ?? "미발급"}</b> · 연락처 {phone ?? "없음"} · PIN {code ? (temp ? "임시 PIN(첫 로그인 때 변경)" : `설정됨${setAt ? ` (${setAt.slice(0, 10)})` : ""}`) : "-"}
          </p>
        </div>
        <button onClick={issue} disabled={busy} className="rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{code ? "임시 PIN 재발급" : "매장 코드·임시 PIN 발급"}</button>
      </div>
      {res && (
        <div className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
          매장 코드 <b className="font-mono text-base">{res.code}</b> · 임시 PIN <b className="font-mono text-base">{res.pin}</b>
          <p className="mt-1">이 화면을 닫으면 임시 PIN은 다시 볼 수 없어요. 원장님께 전달해 주세요. 첫 로그인 때 새 PIN으로 바꾸게 돼요.{res.mock ? " (목업 모드: 저장 안 됨)" : ""}</p>
        </div>
      )}
      {err && <p className="mt-2 text-xs text-rose-600">{err}</p>}
    </div>
  );
}
