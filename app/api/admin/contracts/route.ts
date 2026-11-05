import { NextResponse } from "next/server";
import { mockSaved, requireAdminApi } from "@/lib/admin/guard";
import { createServiceClient } from "@/lib/auth";
import { pickContract } from "@/lib/admin/contract";

export async function POST(req: Request) {
  const { admin, deny } = await requireAdminApi(); if (deny) return deny;
  const r = pickContract(await req.json().catch(() => ({})));
  if (r.errors.length) return NextResponse.json({ error: r.errors.join(", ") }, { status: 400 });
  if (admin.mock) return mockSaved();
  const db = createServiceClient();
  const year = new Date().getFullYear();
  const { count } = await db.from("contracts").select("id", { count: "exact", head: true }).like("contract_no", `CT-${year}-%`);
  const contract_no = `CT-${year}-${String((count ?? 0) + 1).padStart(3, "0")}`;
  const { data, error } = await db.from("contracts").insert({ ...r.data, contract_no }).select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, id: data.id, contract_no });
}
