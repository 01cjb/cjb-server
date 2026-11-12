"use client";
import { useRouter } from "next/navigation";
import { Fragment, useState } from "react";
import { digits, fmtPhone } from "@/lib/work/format";
import type { Menu, TeamKey } from "@/lib/work/menus";

type U = {
  id: string; name: string; phone: string | null; team: string; position: string | null; is_owner: boolean; status: "active" | "disabled";
  failed_count: number; locked_until: string | null; last_login_at: string | null; menus: string[]; memo: string | null;
};
type Team = { key: TeamKey; label: string; short: string };

const when = (s: string | null) => (s ? new Date(s).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "-");
const input = "rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500";

async function call(url: string, method: string, body: unknown) {
  const r = await fetch(url, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error ?? "처리하지 못했습니다.");
  return j;
}

export default function UsersManager({ users, teams, menus, meId }: { users: U[]; teams: Team[]; menus: Menu[]; meId: string }) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pinShow, setPinShow] = useState<{ name: string; pin: string } | null>(null);
  const [edit, setEdit] = useState<string | null>(null);
  const [checks, setChecks] = useState<Record<string, string[]>>(() => Object.fromEntries(users.map((u) => [u.id, u.menus])));
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const cur = (id: string) => checks[id] ?? users.find((u) => u.id === id)?.menus ?? [];
  const teamName = (k: string) => teams.find((t) => t.key === k)?.short ?? k;

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setMsg(null);
    try { await fn(); setMsg({ ok: true, text: ok }); router.refresh(); } catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
  };

  // ── 직원 등록
  const [f, setF] = useState({ name: "", phone: "", team: "mgmt", position: "", pin: "", is_owner: false, withTeamMenus: true });
  async function create(e: React.FormEvent) {
    e.preventDefault(); setMsg(null);
    try {
      const j = await call("/api/work/users", "POST", { ...f, menus: f.withTeamMenus ? menus.filter((m) => m.team === f.team).map((m) => m.key) : [] });
      setPinShow({ name: f.name, pin: j.pin });
      setF({ ...f, name: "", phone: "", position: "", pin: "", is_owner: false });
      router.refresh();
    } catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
  }

  const toggle = (uid: string, key: string) => {
    setChecks((c) => { const l = c[uid] ?? cur(uid); return { ...c, [uid]: l.includes(key) ? l.filter((k) => k !== key) : [...l, key] }; });
    setDirty((d) => new Set(d).add(uid));
  };
  const setTeam = (uid: string, team: string, on: boolean) => {
    const keys = menus.filter((m) => m.team === team).map((m) => m.key);
    setChecks((c) => { const l = c[uid] ?? cur(uid); return { ...c, [uid]: on ? [...new Set([...l, ...keys])] : l.filter((k) => !keys.includes(k)) }; });
    setDirty((d) => new Set(d).add(uid));
  };
  const saveMenus = (u: U) => run(async () => { await call(`/api/work/users/${u.id}`, "PATCH", { action: "menus", menus: cur(u.id) }); setDirty((d) => { const n = new Set(d); n.delete(u.id); return n; }); }, `${u.name}님의 메뉴 권한을 저장했습니다.`);

  const staff = users.filter((u) => !u.is_owner);

  return (
    <div className="space-y-8">
      {msg && <p role="status" className={`rounded-lg px-3 py-2 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-700"}`}>{msg.text}</p>}
      {pinShow && (
        <div className="rounded-xl border-2 border-brand-300 bg-brand-50 p-4">
          <p className="text-sm">{pinShow.name}님의 PIN — <b>이 화면에서 한 번만</b> 보입니다. 본인에게 직접 전달하세요.</p>
          <p className="mt-2 font-mono text-3xl font-bold tracking-[0.4em] text-brand-700">{pinShow.pin}</p>
          <button onClick={() => setPinShow(null)} className="mt-3 text-xs text-neutral-600 underline">전달 완료 · 닫기</button>
        </div>
      )}

      {/* 직원 등록 */}
      <section className="rounded-xl border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 font-semibold">직원 등록</h2>
        <form onSubmit={create} className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
          <input className={input} placeholder="이름 *" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required maxLength={30} />
          <input className={input} placeholder="연락처 010-0000-0000" value={fmtPhone(f.phone)} onChange={(e) => setF({ ...f, phone: digits(e.target.value).slice(0, 11) })} inputMode="tel" />
          <select className={input} value={f.team} onChange={(e) => setF({ ...f, team: e.target.value })}>{teams.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}</select>
          <input className={input} placeholder="직책 (팀장·사원…)" value={f.position} onChange={(e) => setF({ ...f, position: e.target.value })} maxLength={20} />
          <input className={input} placeholder="PIN (비우면 자동 발급)" value={f.pin} onChange={(e) => setF({ ...f, pin: digits(e.target.value).slice(0, 6) })} inputMode="numeric" />
          <button className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white">등록</button>
          <label className="flex items-center gap-2 text-xs text-neutral-600 sm:col-span-2 lg:col-span-3"><input type="checkbox" className="accent-brand-600" checked={f.withTeamMenus} onChange={(e) => setF({ ...f, withTeamMenus: e.target.checked })} />소속 팀 메뉴를 기본으로 체크</label>
          <label className="flex items-center gap-2 text-xs text-neutral-600 sm:col-span-2 lg:col-span-3"><input type="checkbox" className="accent-brand-600" checked={f.is_owner} onChange={(e) => setF({ ...f, is_owner: e.target.checked })} />대표 권한 (모든 메뉴 + 사용자 관리)</label>
        </form>
      </section>

      {/* 직원 목록 */}
      <section>
        <h2 className="mb-2 font-semibold">직원 ({users.length})</h2>
        <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs text-neutral-500"><tr>{["이름", "연락처", "소속", "직책", "상태", "최근 로그인", ""].map((h) => <th key={h} className="whitespace-nowrap px-3 py-2.5 font-medium">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-neutral-100">
              {users.map((u) => {
                const locked = !!u.locked_until && new Date(u.locked_until) > new Date();
                return edit === u.id ? (
                  <EditRow key={u.id} u={u} teams={teams} onCancel={() => setEdit(null)} onSave={(v) => run(async () => { await call(`/api/work/users/${u.id}`, "PATCH", { action: "update", ...v }); setEdit(null); }, `${v.name}님 정보를 저장했습니다.`)} />
                ) : (
                  <tr key={u.id} className={u.status === "disabled" ? "opacity-50" : ""}>
                    <td className="px-3 py-2.5 font-medium">{u.name}{u.is_owner && <span className="ml-1.5 rounded bg-brand-100 px-1.5 py-0.5 text-[10px] text-brand-700">대표</span>}{u.id === meId && <span className="ml-1 text-[10px] text-neutral-400">(나)</span>}</td>
                    <td className="px-3 py-2.5 tabular-nums">{fmtPhone(u.phone) || <span className="text-neutral-400">미등록</span>}</td>
                    <td className="px-3 py-2.5">{teamName(u.team)}</td>
                    <td className="px-3 py-2.5">{u.position ?? "-"}</td>
                    <td className="px-3 py-2.5 text-xs">{u.status === "disabled" ? "중지" : locked ? <span className="text-rose-600">잠김</span> : u.failed_count ? <span className="text-amber-600">오류 {u.failed_count}회</span> : "정상"}</td>
                    <td className="px-3 py-2.5 text-xs text-neutral-500">{when(u.last_login_at)}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right text-xs">
                      <button className="mr-2 text-brand-700 underline" onClick={() => setEdit(u.id)}>수정</button>
                      <button className="mr-2 text-brand-700 underline" onClick={() => confirm(`${u.name}님의 PIN을 새로 발급할까요? 기존 PIN과 로그인은 바로 끊깁니다.`) && run(async () => { const j = await call(`/api/work/users/${u.id}`, "PATCH", { action: "pin" }); setPinShow({ name: u.name, pin: j.pin }); }, "PIN을 새로 발급했습니다.")}>PIN 재발급</button>
                      {(locked || u.failed_count > 0) && <button className="mr-2 text-brand-700 underline" onClick={() => run(() => call(`/api/work/users/${u.id}`, "PATCH", { action: "unlock" }), `${u.name}님 잠금을 해제했습니다.`)}>잠금 해제</button>}
                      {u.id !== meId && <button className="text-neutral-500 underline" onClick={() => run(() => call(`/api/work/users/${u.id}`, "PATCH", { action: "update", status: u.status === "active" ? "disabled" : "active" }), u.status === "active" ? `${u.name}님 계정을 중지했습니다.` : `${u.name}님 계정을 다시 사용합니다.`)}>{u.status === "active" ? "중지" : "재사용"}</button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 개인별 메뉴 체크 */}
      <section>
        <h2 className="mb-1 font-semibold">사용자별 메뉴 권한</h2>
        <p className="mb-2 text-xs text-neutral-500">체크한 메뉴만 그 직원의 왼쪽 메뉴에 보입니다. 대표는 항상 전체. 각 팀 첫 칸 아래 「전체/해제」로 그 팀 메뉴를 한 번에 켜고 끕니다. 바꾼 뒤 줄 끝의 저장을 누르세요.</p>
        <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
          <table className="text-sm">
            <thead className="text-xs">
              <tr className="bg-neutral-50">
                <th rowSpan={2} className="sticky left-0 z-10 bg-neutral-50 px-3 py-2 text-left font-medium text-neutral-500">직원</th>
                {teams.map((t) => <th key={t.key} colSpan={menus.filter((m) => m.team === t.key).length} className="border-l border-neutral-200 px-2 py-1.5 font-semibold text-neutral-600">{t.short}</th>)}
                <th rowSpan={2} className="border-l border-neutral-200 px-3" />
              </tr>
              <tr className="bg-neutral-50">
                {teams.map((t) => menus.filter((m) => m.team === t.key).map((m, i) => <th key={m.key} className={`whitespace-nowrap px-2 py-1.5 font-normal text-neutral-500 ${i === 0 ? "border-l border-neutral-200" : ""}`}>{m.label}</th>))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {staff.length === 0 && <tr><td colSpan={menus.length + 2} className="py-8 text-center text-neutral-400">등록된 직원이 없습니다.</td></tr>}
              {staff.map((u) => (
                <tr key={u.id} className={u.status === "disabled" ? "opacity-50" : ""}>
                  <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-3 py-2 font-medium">{u.name}<span className="ml-1 text-xs font-normal text-neutral-400">{teamName(u.team)}</span></td>
                  {teams.map((t) => {
                    const tm = menus.filter((m) => m.team === t.key);
                    const all = tm.every((m) => cur(u.id).includes(m.key));
                    return (
                      <Fragment key={t.key}>
                        {tm.map((m, i) => (
                          <td key={m.key} className={`px-2 py-2 text-center ${i === 0 ? "border-l border-neutral-200" : ""}`}>
                            <input type="checkbox" aria-label={`${u.name} ${m.label}`} className="size-4 accent-brand-600" checked={cur(u.id).includes(m.key)} onChange={() => toggle(u.id, m.key)} />
                            {i === 0 && <button type="button" onClick={() => setTeam(u.id, t.key, !all)} title={all ? `${t.short} 메뉴 모두 끄기` : `${t.short} 메뉴 모두 켜기`} className="block w-full whitespace-nowrap text-[10px] text-neutral-400 hover:text-brand-700">{all ? "해제" : "전체"}</button>}
                          </td>
                        ))}
                      </Fragment>
                    );
                  })}
                  <td className="border-l border-neutral-200 px-3 py-2">
                    <button disabled={!dirty.has(u.id)} onClick={() => saveMenus(u)} className="whitespace-nowrap rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white disabled:bg-neutral-200 disabled:text-neutral-400">저장</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function EditRow({ u, teams, onCancel, onSave }: { u: U; teams: Team[]; onCancel: () => void; onSave: (v: { name: string; phone: string; team: string; position: string; is_owner: boolean; memo: string }) => void }) {
  const [v, setV] = useState({ name: u.name, phone: u.phone ?? "", team: u.team, position: u.position ?? "", is_owner: u.is_owner, memo: u.memo ?? "" });
  return (
    <tr className="bg-brand-50/40">
      <td className="px-2 py-2"><input className={`${input} w-28`} value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} /></td>
      <td className="px-2 py-2"><input className={`${input} w-36`} value={fmtPhone(v.phone)} onChange={(e) => setV({ ...v, phone: digits(e.target.value).slice(0, 11) })} placeholder="미등록" /></td>
      <td className="px-2 py-2"><select className={input} value={v.team} onChange={(e) => setV({ ...v, team: e.target.value })}>{teams.map((t) => <option key={t.key} value={t.key}>{t.short}</option>)}</select></td>
      <td className="px-2 py-2"><input className={`${input} w-24`} value={v.position} onChange={(e) => setV({ ...v, position: e.target.value })} /></td>
      <td className="px-2 py-2 text-xs" colSpan={2}><label className="flex items-center gap-1.5"><input type="checkbox" className="accent-brand-600" checked={v.is_owner} onChange={(e) => setV({ ...v, is_owner: e.target.checked })} />대표 권한</label></td>
      <td className="whitespace-nowrap px-3 py-2 text-right text-xs"><button className="mr-2 font-semibold text-brand-700 underline" onClick={() => onSave(v)}>저장</button><button className="text-neutral-500 underline" onClick={onCancel}>취소</button></td>
    </tr>
  );
}
