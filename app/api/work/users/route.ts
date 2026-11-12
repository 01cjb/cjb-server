import { NextResponse } from "next/server";
import { requireWork } from "@/lib/work/auth";
import { createUser } from "@/lib/work/users";

export async function POST(req: Request) {
  const { me, deny } = await requireWork({ owner: true });
  if (deny) return deny;
  const r = await createUser(me!.id, await req.json().catch(() => ({})));
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
  return NextResponse.json(r);
}
