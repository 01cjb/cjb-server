import { NextResponse } from "next/server";
import { requireWork } from "@/lib/work/auth";
import { updatePm } from "@/lib/work/pm";

// PM 지시 상태·결과 기록 — 대표 계정만
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { deny } = await requireWork({ owner: true });
  if (deny) return deny;
  const b = await req.json().catch(() => ({}));
  const r = await updatePm(Number((await params).id), { status: typeof b.status === "string" ? b.status : undefined, result: typeof b.result === "string" ? b.result : undefined });
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
