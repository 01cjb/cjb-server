import { NextResponse } from "next/server";
import { requireWork } from "@/lib/work/auth";
import { resetPin, setUserMenus, unlockUser, updateUser } from "@/lib/work/users";

// action: update | menus | pin | unlock  (대표 전용)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { me, deny } = await requireWork({ owner: true });
  if (deny) return deny;
  const { id } = await params;
  const b = await req.json().catch(() => ({}));
  const r =
    b.action === "menus" ? await setUserMenus(me!.id, id, b.menus)
    : b.action === "pin" ? await resetPin(me!.id, id, b.pin)
    : b.action === "unlock" ? await unlockUser(me!.id, id)
    : b.action === "update" ? await updateUser(me!.id, id, b)
    : { ok: false as const, error: "알 수 없는 작업입니다." };
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
  return NextResponse.json(r);
}
