"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

// 입금 전 주문 취소 버튼 (한 번 더 확인하고 취소)
export default function CancelOrder({ orderNo }: { orderNo: string }) {
  const router = useRouter();
  const [ask, setAsk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [m, setM] = useState<string | null>(null);
  const go = async () => {
    setBusy(true); setM(null);
    const r = await fetch(`/api/me/orders/${encodeURIComponent(orderNo)}/cancel`, { method: "POST" });
    const d = await r.json().catch(() => ({}));
    setBusy(false); setAsk(false);
    setM(r.ok ? (d.mock ? d.message : "주문을 취소했습니다.") : d.error ?? "취소하지 못했습니다.");
    if (r.ok && !d.mock) router.refresh();
  };
  return (
    <div>
      {!ask ? (
        <button onClick={() => setAsk(true)} className="rounded-lg px-4 py-2 text-sm font-semibold text-rose-600 ring-1 ring-rose-200 hover:bg-rose-50">주문 취소</button>
      ) : (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span>이 주문을 취소할까요? 취소하면 되돌릴 수 없습니다.</span>
          <button disabled={busy} onClick={go} className="rounded-lg bg-rose-600 px-4 py-2 font-semibold text-white disabled:opacity-50">{busy ? "취소하는 중…" : "네, 취소합니다"}</button>
          <button disabled={busy} onClick={() => setAsk(false)} className="rounded-lg px-4 py-2 text-neutral-600 ring-1 ring-neutral-200">아니요</button>
        </div>
      )}
      {m && <p className="mt-2 text-xs text-neutral-600">{m}</p>}
    </div>
  );
}
