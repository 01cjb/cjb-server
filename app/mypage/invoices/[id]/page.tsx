import { notFound } from "next/navigation";
import { myInvoice } from "@/lib/me";
import InvoiceSheet from "@/components/InvoiceSheet";
export default async function MyInvoice({ params }: { params: Promise<{ id: string }> }) {
  const inv = await myInvoice(Number((await params).id));
  if (!inv) notFound();
  return <div className="space-y-3"><h1 className="text-xl font-bold">세금계산서 {inv.invoice_no}</h1>{inv.status === "pending" && <p className="text-sm text-amber-700">발행 대기 중입니다. 영업일 기준 1일 내 발행됩니다.</p>}<InvoiceSheet inv={inv} /><p className="text-xs text-neutral-400">발행된 계산서는 국세청 홈택스(전자세금계산서 조회)에서도 확인할 수 있습니다.</p></div>;
}
