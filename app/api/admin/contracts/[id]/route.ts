import { NextResponse } from "next/server";
import { mockSaved, requireAdminApi } from "@/lib/admin/guard";
import { createServiceClient } from "@/lib/auth";
import { pickContract } from "@/lib/admin/contract";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { admin, deny } = await requireAdminApi(); if (deny) return deny;
  const r = pickContract(await req.json().catch(() => ({})), true);
  if (r.errors.length) return NextResponse.json({ error: r.errors.join(", ") }, { status: 400 });
  if (admin.mock) return mockSaved();
  const { error } = await createServiceClient().from("contracts").update(r.data).eq("id", Number((await params).id));
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
