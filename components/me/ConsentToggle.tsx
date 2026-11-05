"use client";
import { useState } from "react";
export default function ConsentToggle({ init }: { init: { agreed: boolean; ch_email: boolean; ch_sms: boolean; ch_push: boolean } }) {
  const [f, setF] = useState(init);
  const [m, setM] = useState<string | null>(null);
  const save = async (next: typeof f) => {
    setF(next);
    const r = await fetch("/api/me/consents", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ marketing: next.agreed, ...next }) });
    const d = await r.json();
    setM(r.ok ? `${new Date().toLocaleString("ko-KR")} ${next.agreed ? "수신 동의" : "수신 거부"} 처리되었습니다.${d.mock ? " (목업)" : ""}` : d.error);
  };
  return (
    <div className="rounded-xl border border-neutral-200 p-4 text-sm space-y-3">
      <label className="flex items-center justify-between"><span><b>마케팅 정보 수신</b><br /><span className="text-xs text-neutral-500">이벤트·할인·신상품 소식</span></span>
        <input type="checkbox" className="accent-brand-600 size-5" checked={f.agreed} onChange={(e) => save({ ...f, agreed: e.target.checked, ...(e.target.checked ? { ch_email: true, ch_sms: true, ch_push: true } : {}) })} /></label>
      <div className={`flex gap-4 ${f.agreed ? "" : "opacity-40 pointer-events-none"}`}>
        {(["ch_email", "ch_sms", "ch_push"] as const).map((k) => <label key={k} className="flex items-center gap-1.5"><input type="checkbox" checked={f[k]} onChange={(e) => save({ ...f, [k]: e.target.checked })} />{{ ch_email: "이메일", ch_sms: "문자", ch_push: "앱푸시" }[k]}</label>)}
      </div>
      {m && <p className="text-xs text-brand-700">{m}</p>}
    </div>
  );
}
