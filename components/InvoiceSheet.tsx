import type { TaxInvoice } from "@/lib/admin/types";
import { INVOICE_STATUS } from "@/lib/admin/types";

// 전자세금계산서 양식 보기 (국세청 표준 항목 요약)
export default function InvoiceSheet({ inv }: { inv: TaxInvoice }) {
  const n = (v: number) => v.toLocaleString("ko-KR");
  const cell = "border border-rose-300 px-2 py-1.5";
  return (
    <div className="bg-white text-[13px] text-neutral-800 rounded-xl border border-neutral-200 p-4 overflow-x-auto">
      <div className="min-w-[640px]">
        <div className="flex items-end justify-between mb-2">
          <h2 className="text-lg font-bold text-rose-700 tracking-widest">전자세금계산서</h2>
          <div className="text-xs text-right"><div>승인번호 <b className="font-mono">{inv.nts_confirm_no ?? "(발행 전)"}</b></div><div>상태 {INVOICE_STATUS[inv.status]} · 작성일자 {inv.issue_date}</div></div>
        </div>
        <table className="w-full border-collapse">
          <tbody>
            <tr><td rowSpan={4} className={`${cell} w-6 text-center text-rose-700 font-semibold`}>공<br />급<br />자</td>
              <td className={`${cell} text-rose-700 w-20`}>등록번호</td><td className={`${cell} font-mono`} colSpan={2}>{inv.supplier.biz_no}</td>
              <td rowSpan={4} className={`${cell} w-6 text-center text-sky-700 font-semibold`}>공<br />급<br />받<br />는<br />자</td>
              <td className={`${cell} text-sky-700 w-20`}>등록번호</td><td className={`${cell} font-mono`} colSpan={2}>{inv.buyer_biz_no}</td></tr>
            <tr><td className={`${cell} text-rose-700`}>상호</td><td className={cell} colSpan={2}>{inv.supplier.company}</td><td className={`${cell} text-sky-700`}>상호</td><td className={cell} colSpan={2}>{inv.buyer_company}</td></tr>
            <tr><td className={`${cell} text-rose-700`}>대표자</td><td className={cell} colSpan={2}>{inv.supplier.ceo}</td><td className={`${cell} text-sky-700`}>대표자</td><td className={cell} colSpan={2}>{inv.buyer_ceo ?? ""}</td></tr>
            <tr><td className={`${cell} text-rose-700`}>주소</td><td className={`${cell} text-xs`} colSpan={2}>{inv.supplier.address}</td><td className={`${cell} text-sky-700`}>이메일</td><td className={cell} colSpan={2}>{inv.buyer_email ?? ""}</td></tr>
          </tbody>
        </table>
        <table className="w-full border-collapse mt-2">
          <thead><tr className="text-rose-700"><td className={cell}>품목</td><td className={`${cell} w-14 text-right`}>수량</td><td className={`${cell} w-28 text-right`}>단가</td><td className={`${cell} w-28 text-right`}>공급가액</td><td className={`${cell} w-24 text-right`}>세액</td></tr></thead>
          <tbody>
            {inv.items.map((it, i) => { const amt = it.unit * it.qty; const sup = Math.round(amt / 1.1); return (
              <tr key={i}><td className={cell}>{it.name}</td><td className={`${cell} text-right tabular-nums`}>{it.qty}</td><td className={`${cell} text-right tabular-nums`}>{n(Math.round(it.unit / 1.1))}</td><td className={`${cell} text-right tabular-nums`}>{n(sup)}</td><td className={`${cell} text-right tabular-nums`}>{n(amt - sup)}</td></tr>); })}
          </tbody>
          <tfoot><tr className="font-semibold"><td className={cell} colSpan={3}>합계금액 {n(inv.total_amount)}원 (이 금액을 영수함)</td><td className={`${cell} text-right tabular-nums`}>{n(inv.supply_amount)}</td><td className={`${cell} text-right tabular-nums`}>{n(inv.vat_amount)}</td></tr></tfoot>
        </table>
        <p className="text-[11px] text-neutral-400 mt-2">품목별 금액은 부가세 포함가 기준으로 나눈 값이며 원 단위 반올림 차이는 합계에서 조정됩니다.</p>
      </div>
    </div>
  );
}
