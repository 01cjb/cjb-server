import Link from "next/link";
import { listAdminProducts, productStatusCounts } from "@/lib/admin/repo";
import { getBrands, getCategories } from "@/lib/data";
import { PRODUCT_STATUS } from "@/lib/admin/types";
import Pill from "@/components/admin/Pill";
import Act from "@/components/admin/Act";
import { H1, Table, Tabs } from "@/components/admin/Table";
import { won, day } from "@/lib/fmt";

export default async function AdminProducts({ searchParams }: { searchParams: Promise<{ s?: string; q?: string }> }) {
  const { s = "all", q } = await searchParams;
  const [items, counts, cats, brands] = await Promise.all([listAdminProducts(s, q), productStatusCounts(), getCategories(), getBrands()]);
  const tabs = [{ key: "all", label: "전체" }, ...Object.entries(PRODUCT_STATUS).map(([key, label]) => ({ key, label }))].map((t) => ({ ...t, href: `/admin/products?s=${t.key}`, count: counts[t.key] ?? 0 }));
  return (
    <>
      <H1 right={<div className="flex gap-2">
        <a href="/api/admin/products/template?export=1" className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm">엑셀 내보내기</a>
        <Link href="/admin/products/import" className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm">엑셀 대량등록</Link>
        <Link href="/admin/products/new" className="rounded-lg bg-brand-600 text-white px-3 py-2 text-sm">+ 상품 등록</Link>
      </div>}>상품관리</H1>
      <Tabs items={tabs} cur={s} />
      <form className="mb-3"><input type="hidden" name="s" value={s} /><input name="q" defaultValue={q} placeholder="상품명 검색" className="rounded-lg border border-neutral-300 px-3 py-2 text-sm w-64" /></form>
      <Table head={["ID", "상품명", "카테고리/브랜드", "판매가", "회원가", "재고", "상태", "관리"]} empty={!items.length}>
        {items.map((p) => (
          <tr key={p.id} className={p.status === "cancelled" ? "bg-rose-50/40" : ""}>
            <td className="text-xs text-neutral-400 tabular-nums">{p.id}</td>
            <td className="max-w-xs"><Link href={`/admin/products/${p.id}`} className="line-clamp-1 hover:text-brand-700">{p.name}</Link>
              {p.status === "cancelled" && <p className="text-[11px] text-rose-600">취소사유: {p.cancel_reason ?? "-"} · {day(p.cancelled_at)}</p>}</td>
            <td className="text-xs text-neutral-500 whitespace-nowrap">{cats.find((c) => c.id === p.category_id)?.name} / {brands.find((b) => b.id === p.brand_id)?.name ?? "-"}</td>
            <td className="tabular-nums whitespace-nowrap">{won(p.price)}</td>
            <td className="tabular-nums whitespace-nowrap text-brand-700">{won(p.salon_price)}</td>
            <td className="tabular-nums">{p.stock}</td>
            <td><Pill s={p.status} label={PRODUCT_STATUS[p.status]} /></td>
            <td className="whitespace-nowrap space-x-1">
              {p.status === "cancelled"
                ? <Act url={`/api/admin/products/${p.id}`} body={{ action: "restore", to: "hidden" }} label="복구(숨김)" />
                : <Act url={`/api/admin/products/${p.id}`} body={{ action: "cancel" }} ask="등록취소 사유" label="등록취소" tone="danger" />}
            </td>
          </tr>
        ))}
      </Table>
      <p className="text-xs text-neutral-400 mt-2">등록취소 상품은 쇼핑몰에서 즉시 사라지며, 주문 이력 보존을 위해 삭제하지 않고 보관합니다. 복구 시 숨김 상태로 돌아옵니다.</p>
    </>
  );
}
