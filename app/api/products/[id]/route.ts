import { NextResponse } from "next/server";
import { getProduct } from "@/lib/data";
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const p = await getProduct(Number((await params).id));
  return p ? NextResponse.json(p) : NextResponse.json({ error: "not found" }, { status: 404 });
}
