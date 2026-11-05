import { notFound } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";
import Act from "@/components/admin/Act";
import Pill from "@/components/admin/Pill";
import { H1 } from "@/components/admin/Table";
import { getBrands, getCategories } from "@/lib/data";
import { getAdminProduct } from "@/lib/admin/repo";
import { PRODUCT_STATUS } from "@/lib/admin/types";

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const p = await getAdminProduct(Number((await params).id));
  if (!p) notFound();
  const [c, b] = await Promise.all([getCategories(), getBrands()]);
  return (
    <>
      <H1 right={<div className="flex items-center gap-2"><Pill s={p.status} label={PRODUCT_STATUS[p.status]} />
        {p.status === "cancelled" ? <Act url={`/api/admin/products/${p.id}`} body={{ action: "restore", to: "hidden" }} label="복구" small={false} />
          : <Act url={`/api/admin/products/${p.id}`} body={{ action: "cancel" }} ask="등록취소 사유" label="등록취소" tone="danger" small={false} />}
        <a href={`/product/${p.id}`} target="_blank" className="text-sm text-neutral-500 underline">쇼핑몰에서 보기</a></div>}>상품 수정 #{p.id}</H1>
      <ProductForm p={p} categories={c} brands={b} />
    </>
  );
}
