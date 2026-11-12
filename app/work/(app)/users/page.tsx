import { H1, Table } from "@/components/admin/Table";
import UsersManager from "@/components/work/UsersManager";
import { getWorkMe } from "@/lib/work/auth";
import { MENUS, TEAMS } from "@/lib/work/menus";
import { listLoginLogs, listUsers } from "@/lib/work/users";
import { dt } from "@/lib/fmt";
import { fmtPhone } from "@/lib/work/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "사용자·권한" };

const REASON: Record<string, string> = { ok: "성공", bad_pin: "PIN 오류", pin_locked: "PIN 오류 → 잠김", locked: "잠긴 계정", no_user: "등록되지 않은 이름·연락처" };

export default async function UsersPage() {
  const me = (await getWorkMe())!;
  if (!me.is_owner) {
    return <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center"><p className="font-semibold">대표만 사용할 수 있습니다.</p></div>;
  }
  const [users, logs] = await Promise.all([listUsers(), listLoginLogs()]);
  return (
    <>
      <H1>사용자·권한</H1>
      <UsersManager users={users} teams={TEAMS} menus={MENUS} meId={me.id} />
      <h2 className="mb-2 mt-10 font-semibold">최근 로그인 기록</h2>
      <Table head={["일시", "이름", "연락처", "결과", "IP"]} empty={!logs.length}>
        {logs.map((l) => (
          <tr key={l.id}><td className="text-xs text-neutral-500">{dt(l.created_at)}</td><td>{l.name}</td><td className="tabular-nums">{fmtPhone(l.phone) || "-"}</td>
            <td className={`text-xs ${l.ok ? "text-emerald-600" : "text-rose-600"}`}>{REASON[l.reason ?? ""] ?? l.reason}</td><td className="font-mono text-xs text-neutral-400">{l.ip ?? "-"}</td></tr>
        ))}
      </Table>
    </>
  );
}
