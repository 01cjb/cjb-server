import ProductForm from "@/components/admin/ProductForm";
import { H1 } from "@/components/admin/Table";
import { getBrands, getCategories } from "@/lib/data";
export default async function NewProduct() {
  const [c, b] = await Promise.all([getCategories(), getBrands()]);
  return <><H1>상품 등록</H1><ProductForm categories={c} brands={b} /></>;
}
