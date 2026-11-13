"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";

// 로젠 엑셀 주고받기: 사방넷 엑셀 올리기 + 날짜별 로젠 양식 다운로드
export default function LogenExcel({ date, counts }: { date: string; counts: { channel: string; label: string; count: number }[] }) {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();
  const file = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ t: string; bad?: boolean } | null>(null);
  const total = counts.reduce((n, c) => n + c.count, 0);

  function setDate(d: string) {
    const p = new URLSearchParams(sp.toString()); p.set("d", d);
    router.replace(`${path}?${p}`);
  }
  async function upload() {
    const f = file.current?.files?.[0];
    if (!f) return setMsg({ t: "사방넷에서 받은 「로젠택배 양식」 엑셀을 선택하세요.", bad: true });
    setBusy(true); setMsg(null);
    const fd = new FormData(); fd.set("file", f); fd.set("date", date);
    const r = await fetch("/api/work/waybill/import", { method: "POST", body: fd });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setMsg({ t: j.error ?? "올리기 실패", bad: true });
    if (file.current) file.current.value = "";
    setMsg({ t: `사방넷 주문 ${j.saved}건 저장 (${j.date})${j.skipped ? ` · 건너뜀 ${j.skipped}건` : ""}` });
    router.refresh();
  }

  return (
    <section className="mb-8 rounded-xl border border-neutral-200 bg-white p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-bold">로젠 송장 엑셀</h2>
          <p className="text-xs text-neutral-500">사방넷·카페24·뷰티웰 출고 주문을 사방넷과 같은 로젠 양식으로 내려받아 로젠 사이트에 올리세요.</p>
        </div>
        <label className="text-xs text-neutral-500">출고일
          <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} className="ml-2 rounded-lg border border-neutral-200 px-2 py-1.5 text-sm text-neutral-800" />
        </label>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-lg bg-neutral-50 p-3">
          <p className="text-sm font-semibold">① 사방넷 주문 올리기</p>
          <p className="mt-0.5 text-xs text-neutral-500">사방넷 주문서확인처리 → 다운로드 「로젠택배 양식」 파일. 같은 주문번호는 덮어씁니다.</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input ref={file} type="file" accept=".xlsx" className="max-w-[220px] text-xs" />
            <button onClick={upload} disabled={busy} className="rounded-lg px-3 py-1.5 text-sm font-semibold text-brand-700 ring-1 ring-brand-300 disabled:opacity-40">{busy ? "올리는 중…" : "올리기"}</button>
          </div>
        </div>
        <div className="rounded-lg bg-neutral-50 p-3">
          <p className="text-sm font-semibold">② 로젠 양식 다운로드 <span className="font-normal text-neutral-500">{date}</span></p>
          <p className="mt-0.5 text-xs text-neutral-500">
            {total ? counts.map((c) => `${c.label} ${c.count}건`).join(" · ") : "이 날짜에 출고할 주문이 없습니다 (결제완료·배송준비, 송장번호 없는 주문)"}
          </p>
          <a href={total ? `/api/work/waybill/export?date=${date}` : undefined} aria-disabled={!total}
            className={`mt-2 inline-block rounded-lg px-3 py-1.5 text-sm font-semibold text-white ${total ? "bg-brand-600" : "pointer-events-none bg-neutral-300"}`}>
            엑셀 다운로드 ({total}건)
          </a>
        </div>
      </div>
      {msg && <p className={`mt-3 rounded-lg px-3 py-2 text-sm ${msg.bad ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-800"}`}>{msg.t}</p>}
    </section>
  );
}
