import { NextResponse } from "next/server";
import { requireWork } from "@/lib/work/auth";
import { askMini } from "@/lib/work/mini";

export const maxDuration = 30;

// 미니에게 묻기 — 업무 시스템에 로그인한 직원만. 한 사람이 1분에 12번까지
const hits: Map<string, number[]> = ((globalThis as Record<string, unknown>).__miniHits ??= new Map()) as never;

export async function POST(req: Request) {
  const { me, deny } = await requireWork();
  if (deny) return deny;
  const now = Date.now(), mine = (hits.get(me!.id) ?? []).filter((t) => now - t < 60_000);
  if (mine.length >= 12) return NextResponse.json({ error: "잠시 쉬었다가 다시 물어봐 주세요. (1분에 12번까지)" }, { status: 429 });
  hits.set(me!.id, [...mine, now]);
  const b = await req.json().catch(() => ({}));
  const r = await askMini(me!, Array.isArray(b.messages) ? b.messages : []);
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
  return NextResponse.json({ text: r.text });
}
