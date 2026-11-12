import { redirect } from "next/navigation";
import Sidebar, { type NavGroup } from "@/components/work/Sidebar";
import { getWorkMe, workLive } from "@/lib/work/auth";
import { MENUS, TEAMS, teamLabel } from "@/lib/work/menus";
import { applyOrder, getMenuOrder } from "@/lib/work/prefs";

export const dynamic = "force-dynamic";

export default async function WorkApp({ children }: { children: React.ReactNode }) {
  const me = await getWorkMe();
  if (!me) redirect("/work/login");
  const order = await getMenuOrder(me.id);
  // 개인별 메뉴 체크에 따라 보이는 메뉴만, 팀 단위로 묶고 개인 순서 적용
  const groups: NavGroup[] = applyOrder(TEAMS, (t) => `team:${t.key}`, order).map((t) => ({
    team: t.key, label: t.label,
    items: applyOrder(MENUS.filter((m) => m.team === t.key && me.menus.includes(m.key)), (m) => m.key, order)
      .map((m) => ({ key: m.key, label: m.label, soon: m.status === "soon" })),
  })).filter((g) => g.items.length);
  return (
    <>
      <Sidebar me={{ name: me.name, position: me.position, teamLabel: teamLabel(me.team), is_owner: me.is_owner }} groups={groups} mock={!workLive()} />
      <div className="md:pl-60">
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">{children}</div>
      </div>
    </>
  );
}
