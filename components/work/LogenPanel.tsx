"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Target = { key: string; channel: string; orderNo: string; receiver: string | null; address: string | null; item: string; orderedAt: string };
type Row = { order_key: string; channel: string; order_no: string; receiver_name: string | null; item_summary: string | null; status: string; slip_no: string | null; result_msg: string | null; registered_at: string; env: string };

const CH: Record<string, string> = { beautywell: "뷰티웰", cafe24: "카페24" };
const ST: Record<string, [string, string]> = {
  registered: ["출력 대기", "bg-amber-50 text-amber-700 ring-amber-200"],
  done: ["송장 완료", "bg-emerald-50 text-emerald-700 ring-emerald-200"],
  error: ["오류", "bg-rose-50 text-rose-700 ring-rose-200"],
};
const when = (s: string) => new Date(s).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });

export default function LogenPanel({ targets, rows, ready, missing, env, mock }: {
  targets: Target[]; rows: Row[]; ready: boolean; missing: string[]; env: string; mock: boolean;
}) {
  const router = useRouter();
  const [sel, setSel] = useState<string[]>([]);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState<{ t: string; bad?: boolean } | null>(null);
  const waiting = rows.filter((r) => r.status === "registered").length;
  const can = ready || mock;

  async function post(body: object, label: string) {
    setBusy(label); setMsg(null);
    const r = await fetch("/api/work/logen", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    setBusy("");
    return { ok: r.ok, j };
  }
  async function register() {
    const { ok, j } = await post({ action: "register", keys: sel }, "reg");
    if (!ok) return setMsg({ t: j.error ?? "등록 실패", bad: true });
    setSel([]);
    setMsg({ t: `로젠에 ${j.ok}건 등록${j.fail ? `, ${j.fail}건 실패` : ""}. 로젠 화면에서 송장을 출력한 뒤 「송장번호 가져오기」를 누르세요.`, bad: !!j.fail });
    router.refresh();
  }
  async function slips() {
    const { ok, j } = await post({ action: "slips" }, "slip");
    if (!ok) return setMsg({ t: j.error ?? "가져오기 실패", bad: true });
    setMsg({ t: j.updated ? `송장번호 ${j.updated}건 받아옴${j.waiting ? ` · 아직 출력 안 된 ${j.waiting}건` : ""}` : `아직 출력된 송장이 없습니다 (대기 ${j.waiting ?? 0}건)` });
    router.refresh();
  }
  async function remove(key: string) {
    const { ok, j } = await post({ action: "remove", key }, "rm");
    if (!ok) return setMsg({ t: j.error ?? "삭제 실패", bad: true });
    router.refresh();
  }
  const all = sel.length === targets.length && targets.length > 0;

  return (
    <section className="mb-8 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold">로젠택배 송장 출력</h2>
          <p className="text-xs text-neutral-500">
            ① 주문 선택 → 로젠에 등록 ② 로젠 화면에서 송장 출력 ③ 송장번호 가져오기
            {env === "dev" && !mock && <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-amber-800">로젠 테스트 서버 연결 중</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href="https://logis.ilogen.com" target="_blank" rel="noreferrer" className="rounded-lg px-3 py-2 text-sm ring-1 ring-neutral-200 hover:bg-neutral-50">로젠 출력 화면 열기 ↗</a>
          <button onClick={slips} disabled={!!busy || !waiting} className="rounded-lg px-3 py-2 text-sm font-semibold text-brand-700 ring-1 ring-brand-300 disabled:opacity-40">
            {busy === "slip" ? "가져오는 중…" : `송장번호 가져오기${waiting ? ` (${waiting})` : ""}`}
          </button>
        </div>
      </div>

      {!can && <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">로젠 연결 설정이 필요합니다 (Vercel 환경변수): {missing.join(", ")}</p>}
      {msg && <p className={`rounded-lg px-3 py-2 text-sm ${msg.bad ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-800"}`}>{msg.t}</p>}

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-2.5">
          <p className="text-sm font-semibold">출력할 주문 <span className="text-neutral-400">{targets.length}</span></p>
          <button onClick={register} disabled={!can || !sel.length || !!busy} className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-40">
            {busy === "reg" ? "등록 중…" : `선택 ${sel.length}건 로젠에 등록`}
          </button>
        </div>
        {targets.length ? (
          <div className="max-h-[420px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-neutral-50 text-xs text-neutral-500">
                <tr>
                  <th className="w-10 px-3 py-2"><input type="checkbox" aria-label="전체 선택" checked={all} onChange={() => setSel(all ? [] : targets.map((t) => t.key))} /></th>
                  <th className="px-2 py-2 text-left">채널</th><th className="px-2 py-2 text-left">주문번호</th><th className="px-2 py-2 text-left">받는 분</th>
                  <th className="px-2 py-2 text-left">주소</th><th className="px-2 py-2 text-left">상품</th><th className="px-2 py-2 text-left">주문일</th>
                </tr>
              </thead>
              <tbody>
                {targets.map((t) => (
                  <tr key={t.key} className="border-t border-neutral-100 hover:bg-brand-50/40">
                    <td className="px-3 py-2"><input type="checkbox" aria-label={`${t.orderNo} 선택`} checked={sel.includes(t.key)} onChange={() => setSel(sel.includes(t.key) ? sel.filter((k) => k !== t.key) : [...sel, t.key])} /></td>
                    <td className="px-2 py-2 text-xs">{CH[t.channel] ?? t.channel}</td>
                    <td className="px-2 py-2 font-mono text-xs">{t.orderNo}</td>
                    <td className="px-2 py-2">{t.receiver ?? "-"}</td>
                    <td className="max-w-[260px] truncate px-2 py-2 text-xs text-neutral-600" title={t.address ?? ""}>{t.address || <span className="text-rose-600">주소 없음</span>}</td>
                    <td className="max-w-[220px] truncate px-2 py-2 text-xs" title={t.item}>{t.item}</td>
                    <td className="px-2 py-2 text-xs text-neutral-500">{t.orderedAt ? when(t.orderedAt) : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="px-4 py-8 text-center text-sm text-neutral-400">송장 출력할 주문이 없습니다 (결제완료·배송준비 상태, 송장번호 없는 주문)</p>}
      </div>

      {rows.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <p className="border-b border-neutral-100 px-4 py-2.5 text-sm font-semibold">로젠 등록 내역</p>
          <div className="max-h-[360px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-neutral-50 text-xs text-neutral-500">
                <tr><th className="px-3 py-2 text-left">등록</th><th className="px-2 py-2 text-left">채널</th><th className="px-2 py-2 text-left">주문번호</th><th className="px-2 py-2 text-left">받는 분</th><th className="px-2 py-2 text-left">상태</th><th className="px-2 py-2 text-left">송장번호</th><th /></tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const [l, c] = ST[r.status] ?? [r.status, ""];
                  return (
                    <tr key={r.order_key} className="border-t border-neutral-100">
                      <td className="px-3 py-2 text-xs text-neutral-500">{when(r.registered_at)}{r.env === "dev" && <span className="ml-1 text-[10px] text-amber-700">테스트</span>}</td>
                      <td className="px-2 py-2 text-xs">{CH[r.channel] ?? r.channel}</td>
                      <td className="px-2 py-2 font-mono text-xs">{r.order_no}</td>
                      <td className="px-2 py-2">{r.receiver_name ?? "-"}</td>
                      <td className="px-2 py-2"><span className={`rounded px-1.5 py-0.5 text-[11px] ring-1 ${c}`} title={r.result_msg ?? ""}>{l}</span>{r.result_msg && <p className="mt-0.5 max-w-[240px] truncate text-[11px] text-rose-600" title={r.result_msg}>{r.result_msg}</p>}</td>
                      <td className="px-2 py-2 font-mono text-xs">{r.slip_no ? <a className="text-brand-700 underline" target="_blank" rel="noreferrer" href={`https://www.ilogen.com/web/personal/trace/${r.slip_no}`}>{r.slip_no}</a> : "-"}</td>
                      <td className="px-2 py-2 text-right">{r.status !== "done" && <button onClick={() => remove(r.order_key)} disabled={!!busy} className="text-[11px] text-neutral-400 hover:text-rose-600">지우기</button>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
