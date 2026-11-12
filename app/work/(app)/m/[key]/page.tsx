import { notFound } from "next/navigation";
import { H1 } from "@/components/admin/Table";
import { Soon, VIEWS } from "@/components/work/views";
import { canSee, getWorkMe } from "@/lib/work/auth";
import { MENU_BY_KEY, teamLabel } from "@/lib/work/menus";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  return { title: MENU_BY_KEY[key]?.label ?? "메뉴" };
}

export default async function MenuPage({ params, searchParams }: { params: Promise<{ key: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const [{ key }, q, me] = await Promise.all([params, searchParams, getWorkMe()]);
  const menu = MENU_BY_KEY[key];
  if (!menu || !me) notFound();
  if (!canSee(me, key)) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center">
        <p className="font-semibold">이 메뉴 권한이 없습니다.</p>
        <p className="mt-1 text-sm text-neutral-500">필요하면 대표에게 「{menu.label}」 메뉴 권한을 요청하세요.</p>
      </div>
    );
  }
  const View = VIEWS[key] ?? Soon;
  return (
    <>
      <p className="mb-1 text-xs text-neutral-500">{teamLabel(menu.team)}</p>
      <H1 right={menu.source ? <span className="text-xs text-neutral-400">{menu.source}</span> : null}>{menu.label}</H1>
      {await View({ menu, q, me })}
    </>
  );
}
