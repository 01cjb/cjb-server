"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
export default function RequestInvoice({ orderNo }: { orderNo: string }) {
  const router = useRouter();
  const [m, setM] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const go = async () => {
    setBusy(true);
    const r = await fetch("/api/me/invoices", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ order_no: orderNo }) });
    const d = await r.json(); setBusy(false);
    setM(r.ok ? (d.mock ? d.message : d.issued ? "세금계산서가 발행되었습니다." : `요청 접수 (발행 대기: ${d.error ?? "관리자 확인 중"})`) : d.error);
    if (r.ok && !d.mock) router.refresh();
  };
  return <div><button disabled={busy} onClick={go} className="rounded-lg bg-brand-600 text-white px-4 py-2 text-sm disabled:opacity-50">세금계산서 발행 요청</button>{m && <p className="text-xs mt-2 text-neutral-600">{m}</p>}</div>;
}
