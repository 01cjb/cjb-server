import "server-only";
import type { TaxInvoice } from "./admin/types";

// 세금계산서 발행 어댑터
// 실제 발행은 국세청 연동 ASP(팝빌·바로빌 등) API 키가 필요합니다.
//   INVOICE_PROVIDER=popbill | barobill   (미설정 시 mock — 승인번호만 가짜로 생성)
//   POPBILL_LINK_ID / POPBILL_SECRET_KEY / POPBILL_CORP_NUM  등은 서버 환경변수로만 보관
export type IssueResult = { ok: true; confirmNo: string; provider: string } | { ok: false; error: string; provider: string };

export const vatSplit = (total: number) => { const supply = Math.round(total / 1.1); return { supply, vat: total - supply }; };
export const bizNoValid = (no: string) => {
  const d = no.replace(/\D/g, "");
  if (d.length !== 10) return false;
  const w = [1, 3, 7, 1, 3, 7, 1, 3, 5];
  let s = w.reduce((a, k, i) => a + k * Number(d[i]), 0);
  s += Math.floor((5 * Number(d[8])) / 10);
  return (10 - (s % 10)) % 10 === Number(d[9]);
};

export async function issueTaxInvoice(inv: TaxInvoice): Promise<IssueResult> {
  const provider = process.env.INVOICE_PROVIDER ?? "mock";
  if (!inv.buyer_biz_no || inv.buyer_biz_no.replace(/\D/g, "").length !== 10) return { ok: false, error: "구매자 사업자등록번호가 올바르지 않습니다.", provider };
  if (inv.supply_amount + inv.vat_amount !== inv.total_amount) return { ok: false, error: "공급가액+세액이 합계와 다릅니다.", provider };

  if (provider === "mock") {
    return { ok: true, provider, confirmNo: `MOCK-${inv.issue_date.replace(/-/g, "")}-${String(inv.id).padStart(4, "0")}` };
  }
  // TODO: 팝빌/바로빌 SDK 연동 지점 — 계약 후 API 키 발급받아 구현
  return { ok: false, error: `${provider} 연동이 아직 설정되지 않았습니다.`, provider };
}
