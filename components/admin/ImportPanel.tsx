"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Row = { row: number; data: Record<string, unknown>; errors: string[] };
type Res = { file?: string; total?: number; valid?: number; invalid?: number; rows?: Row[]; imported?: number; mock?: boolean; message?: string; error?: string; failures?: { row: number; error: string }[] };

export default function ImportPanel() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [res, setRes] = useState<Res | null>(null);
  const [busy, setBusy] = useState(false);
  const [onlyErr, setOnlyErr] = useState(false);

  const send = async (mode: "validate" | "import") => {
    if (!file) return;
    setBusy(true);
    const fd = new FormData(); fd.append("file", file); fd.append("mode", mode);
    const r = await fetch("/api/admin/products/import", { method: "POST", body: fd });
    const d = (await r.json()) as Res; setBusy(false); setRes(r.ok ? d : { error: d.error });
    if (r.ok && mode === "import" && !d.mock) router.refresh();
  };

  const rows = (res?.rows ?? []).filter((r) => !onlyErr || r.errors.length);
  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-white border border-neutral-200 p-5 space-y-3">
        <ol className="text-sm text-neutral-600 list-decimal pl-5 space-y-1">
          <li><a href="/api/admin/products/template" className="text-brand-700 underline">등록 양식(.xlsx) 내려받기</a> — 두 번째 시트 ‘코드표’에 카테고리·브랜드 이름이 있습니다.</li>
          <li>양식에 상품을 채운 뒤 업로드 → <b>검증</b>으로 오류 행을 확인합니다.</li>
          <li><b>등록 실행</b>: 오류 없는 행만 등록됩니다. 같은 상품코드(SKU)가 있으면 정보가 수정됩니다.</li>
        </ol>
        <div className="flex flex-wrap items-center gap-2">
          <input type="file" accept=".xlsx" onChange={(e) => { setFile(e.target.files?.[0] ?? null); setRes(null); }} className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-100 file:px-3 file:py-2" />
          <button disabled={!file || busy} onClick={() => send("validate")} className="rounded-lg border border-neutral-300 px-4 py-2 text-sm disabled:opacity-40">검증</button>
          <button disabled={!file || busy || !res?.valid} onClick={() => send("import")} className="rounded-lg bg-brand-600 text-white px-4 py-2 text-sm disabled:opacity-40">등록 실행 {res?.valid ? `(${res.valid}건)` : ""}</button>
          {busy && <span className="text-xs text-neutral-500">처리 중…</span>}
        </div>
        {res?.error && <p className="text-sm text-rose-600">{res.error}</p>}
        {res?.total != null && (
          <div className="flex flex-wrap gap-4 text-sm">
            <span>전체 <b className="tabular-nums">{res.total}</b></span><span className="text-emerald-700">정상 <b className="tabular-nums">{res.valid}</b></span>
            <span className="text-rose-600">오류 <b className="tabular-nums">{res.invalid}</b></span>
            {res.imported != null && <span className="text-brand-700">등록 완료 <b>{res.imported}</b>건</span>}
            {res.message && <span className="text-amber-700">{res.message}</span>}
            <label className="flex items-center gap-1 ml-auto"><input type="checkbox" checked={onlyErr} onChange={(e) => setOnlyErr(e.target.checked)} />오류만 보기</label>
          </div>
        )}
      </div>
      {res?.rows && (
        <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white max-h-[480px]">
          <table className="w-full text-xs">
            <thead className="bg-neutral-50 text-left text-neutral-500 sticky top-0"><tr>{["행", "결과", "상품코드", "상품명", "판매가", "회원가", "재고", "상태"].map((h) => <th key={h} className="px-3 py-2 font-medium whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-neutral-100">
              {rows.map((r) => (
                <tr key={r.row} className={r.errors.length ? "bg-rose-50/60" : ""}>
                  <td className="px-3 py-2 tabular-nums">{r.row}</td>
                  <td className="px-3 py-2">{r.errors.length ? <span className="text-rose-600">{r.errors.join(" · ")}</span> : <span className="text-emerald-700">정상</span>}</td>
                  <td className="px-3 py-2">{String(r.data.sku ?? "")}</td>
                  <td className="px-3 py-2 max-w-xs truncate">{String(r.data.name ?? "")}</td>
                  <td className="px-3 py-2 tabular-nums">{Number(r.data.price ?? 0).toLocaleString()}</td>
                  <td className="px-3 py-2 tabular-nums">{r.data.salon_price ? Number(r.data.salon_price).toLocaleString() : "-"}</td>
                  <td className="px-3 py-2 tabular-nums">{String(r.data.stock ?? "")}</td>
                  <td className="px-3 py-2">{String(r.data.status ?? "")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
