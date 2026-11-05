import { notFound } from "next/navigation";
import { getInvoice } from "@/lib/admin/repo";
import InvoiceSheet from "@/components/InvoiceSheet";
import Act from "@/components/admin/Act";
import { H1 } from "@/components/admin/Table";
export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const inv = await getInvoice(Number((await params).id));
  if (!inv) notFound();
  return (<><H1 right={["pending", "failed"].includes(inv.status) ? <Act url={`/api/admin/invoices/${inv.id}`} body={{ action: "issue" }} label="발행" tone="primary" small={false} /> : null}>세금계산서 {inv.invoice_no}</H1>
    {inv.error && <p className="text-sm text-rose-600 mb-3">발행 오류: {inv.error}</p>}<InvoiceSheet inv={inv} /></>);
}
