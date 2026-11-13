"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Brand from "./Brand";
import InstallApp from "./InstallApp";

export type NavGroup = { team: string; label: string; items: { key: string; label: string; soon: boolean }[] };
type Me = { name: string; position: string | null; teamLabel: string; is_owner: boolean };

const isOn = (path: string, href: string) => (href === "/work" ? path === "/work" : path === href || path.startsWith(href + "/"));
const Chevron = ({ dir = "right" }: { dir?: "right" | "down" }) => (
  <svg viewBox="0 0 20 20" aria-hidden className={`size-4 shrink-0 transition-transform ${dir === "down" ? "rotate-90" : ""}`} fill="currentColor"><path d="M7.2 4.3a1 1 0 0 1 1.4 0l5 5a1 1 0 0 1 0 1.4l-5 5a1 1 0 1 1-1.4-1.4L11.5 10 7.2 5.7a1 1 0 0 1 0-1.4Z" /></svg>
);

export default function Sidebar({ me, groups, mock }: { me: Me; groups: NavGroup[]; mock: boolean }) {
  const path = usePathname();
  const [drawer, setDrawer] = useState(false);
  const [editing, setEditing] = useState(false);
  const activeTeam = groups.find((g) => g.items.some((i) => isOn(path, `/work/m/${i.key}`)))?.team ?? null;
  useEffect(() => setDrawer(false), [path]);

  async function out() {
    await fetch("/api/work/logout", { method: "POST" });
    location.href = "/work/login";
  }

  const shell = (body: React.ReactNode) => (
    <nav className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-4">
        <Link href="/work"><Brand compact /></Link>
        {!editing && (
          <button onClick={() => setEditing(true)} title="내 메뉴 순서 바꾸기" className="rounded-md px-1.5 py-0.5 text-[11px] text-neutral-400 ring-1 ring-neutral-200 hover:text-brand-700 hover:ring-brand-300">편집</button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3">{body}</div>
      <div className="border-t border-neutral-100 p-4">
        <p className="text-sm font-semibold">{me.name} <span className="font-normal text-neutral-500">{me.position ?? ""}</span></p>
        <p className="text-xs text-neutral-500">{me.is_owner ? "대표 · 전체 권한" : me.teamLabel}</p>
        <button onClick={out} className="mt-2 text-xs text-neutral-500 underline">로그아웃</button>
        <InstallApp />
      </div>
    </nav>
  );

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-2.5 md:hidden">
        <Link href="/work"><Brand compact /></Link>
        <button onClick={() => setDrawer(true)} aria-label="메뉴 열기" className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm">메뉴</button>
      </header>
      {mock && <div className="bg-amber-100 px-4 py-1.5 text-center text-xs text-amber-900 md:ml-60">목업 모드 — 예시 데이터이며, 직원·권한 변경은 서버 재시작 시 초기화됩니다.</div>}

      {/* 데스크톱: 팀 이름에 마우스를 올리면 오른쪽에 하위 메뉴 */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 border-r border-neutral-200 bg-white md:block">
        {shell(editing ? <OrderEditor groups={groups} onDone={() => setEditing(false)} /> : (
          <div className="space-y-4">
            <MenuLink href="/work" label="대시보드" path={path} />
            <HoverGroups groups={groups} path={path} activeTeam={activeTeam} />
            {me.is_owner && <div><p className="px-3 pb-1 text-[11px] font-semibold text-neutral-400">관리</p><MenuLink href="/work/users" label="사용자·권한" path={path} /></div>}
          </div>
        ))}
      </aside>

      {/* 모바일: 팀 이름을 누르면 펼침 */}
      {drawer && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button aria-label="메뉴 닫기" className="absolute inset-0 bg-black/30" onClick={() => setDrawer(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-xl">
            {shell(editing ? <OrderEditor groups={groups} onDone={() => setEditing(false)} /> : (
              <div className="space-y-4">
                <MenuLink href="/work" label="대시보드" path={path} />
                <AccordionGroups groups={groups} path={path} activeTeam={activeTeam} />
                {me.is_owner && <div><p className="px-3 pb-1 text-[11px] font-semibold text-neutral-400">관리</p><MenuLink href="/work/users" label="사용자·권한" path={path} /></div>}
              </div>
            ))}
          </aside>
        </div>
      )}
    </>
  );
}

function MenuLink({ href, label, path, soon }: { href: string; label: string; path: string; soon?: boolean }) {
  const on = isOn(path, href);
  return (
    <Link href={href} aria-current={on ? "page" : undefined}
      className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${on ? "bg-brand-600 font-semibold text-white" : "text-neutral-700 hover:bg-brand-50"}`}>
      <span>{label}</span>{soon && <span className={`rounded px-1.5 text-[10px] ${on ? "bg-white/20" : "bg-neutral-100 text-neutral-500"}`}>준비중</span>}
    </Link>
  );
}

function TeamRow({ g, active, open, onClick, onEnter, onLeave, btnRef, chevron }: {
  g: NavGroup; active: boolean; open: boolean; onClick: () => void; onEnter?: () => void; onLeave?: () => void;
  btnRef?: (el: HTMLButtonElement | null) => void; chevron: "right" | "down";
}) {
  return (
    <button ref={btnRef} type="button" onClick={onClick} onMouseEnter={onEnter} onMouseLeave={onLeave} aria-expanded={open}
      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${open ? "bg-brand-50 text-brand-700" : active ? "text-brand-700" : "text-neutral-700 hover:bg-brand-50"}`}>
      <span className="flex min-w-0 items-center gap-2">
        <span className={`size-1.5 shrink-0 rounded-full ${active ? "bg-brand-600" : "bg-neutral-300"}`} />
        <span className="truncate font-medium">{g.label}</span>
        <span className="text-[11px] text-neutral-400">{g.items.length}</span>
      </span>
      <Chevron dir={chevron} />
    </button>
  );
}

// 데스크톱: 마우스를 올린 팀의 메뉴를 사이드바 오른쪽에 띄움 (클릭·키보드로도 열고 닫기)
function HoverGroups({ groups, path, activeTeam }: { groups: NavGroup[]; path: string; activeTeam: string | null }) {
  const [hover, setHover] = useState<{ team: string; top: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const btns = useRef<Record<string, HTMLButtonElement | null>>({});
  const show = (team: string) => {
    if (timer.current) clearTimeout(timer.current);
    const r = btns.current[team]?.getBoundingClientRect();
    setHover({ team, top: Math.max(8, Math.min(r?.top ?? 0, window.innerHeight - 320)) });
  };
  const hide = () => { if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => setHover(null), 180); };
  useEffect(() => setHover(null), [path]);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setHover(null);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, []);
  const cur = groups.find((g) => g.team === hover?.team);
  return (
    <div className="space-y-0.5">
      {groups.map((g) => (
        <TeamRow key={g.team} g={g} active={g.team === activeTeam} open={hover?.team === g.team} chevron="right"
          btnRef={(el) => { btns.current[g.team] = el; }}
          onEnter={() => show(g.team)} onLeave={hide} onClick={() => (hover?.team === g.team ? setHover(null) : show(g.team))} />
      ))}
      {cur && hover && (
        <div role="menu" aria-label={cur.label} onMouseEnter={() => timer.current && clearTimeout(timer.current)} onMouseLeave={hide}
          className="fixed left-60 z-50 ml-1 w-56 rounded-xl border border-neutral-200 bg-white p-2 shadow-lg" style={{ top: hover.top }}>
          <p className="px-2 pb-1.5 pt-1 text-[11px] font-semibold text-neutral-400">{cur.label}</p>
          <div className="space-y-0.5">{cur.items.map((i) => <MenuLink key={i.key} href={`/work/m/${i.key}`} label={i.label} soon={i.soon} path={path} />)}</div>
        </div>
      )}
    </div>
  );
}

// 모바일: 팀 이름을 누르면 아래로 펼침. 지금 보고 있는 팀은 열린 상태로 시작
function AccordionGroups({ groups, path, activeTeam }: { groups: NavGroup[]; path: string; activeTeam: string | null }) {
  const [open, setOpen] = useState<string | null>(activeTeam);
  return (
    <div className="space-y-0.5">
      {groups.map((g) => (
        <div key={g.team}>
          <TeamRow g={g} active={g.team === activeTeam} open={open === g.team} chevron={open === g.team ? "down" : "right"} onClick={() => setOpen(open === g.team ? null : g.team)} />
          {open === g.team && <div className="ml-3 space-y-0.5 border-l border-neutral-100 py-1 pl-2">{g.items.map((i) => <MenuLink key={i.key} href={`/work/m/${i.key}`} label={i.label} soon={i.soon} path={path} />)}</div>}
        </div>
      ))}
    </div>
  );
}

// 내 메뉴 순서 편집: 팀 순서와 팀 안 메뉴 순서를 ▲▼로
function OrderEditor({ groups, onDone }: { groups: NavGroup[]; onDone: () => void }) {
  const router = useRouter();
  const [list, setList] = useState(groups.map((g) => ({ ...g, items: [...g.items] })));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const move = <T,>(arr: T[], i: number, d: number) => { const j = i + d; if (j < 0 || j >= arr.length) return arr; const a = [...arr]; [a[i], a[j]] = [a[j], a[i]]; return a; };
  const btn = "grid size-6 place-items-center rounded text-[11px] text-neutral-500 hover:bg-neutral-100 disabled:opacity-25";
  async function save(order: string[]) {
    setBusy(true); setErr("");
    const r = await fetch("/api/work/me/menu-order", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ order }) });
    setBusy(false);
    if (!r.ok) { setErr((await r.json().catch(() => ({}))).error ?? "저장하지 못했습니다."); return; }
    onDone(); router.refresh();
  }
  return (
    <div>
      <p className="mb-2 px-1 text-xs text-neutral-500">▲▼로 순서를 바꾸고 저장하세요. 나에게만 적용됩니다.</p>
      <div className="space-y-2">
        {list.map((g, gi) => (
          <div key={g.team} className="rounded-lg border border-neutral-200">
            <div className="flex items-center justify-between bg-neutral-50 px-2 py-1.5">
              <span className="truncate text-xs font-semibold text-neutral-700">{g.label}</span>
              <span className="flex">
                <button className={btn} aria-label={`${g.label} 위로`} disabled={gi === 0} onClick={() => setList(move(list, gi, -1))}>▲</button>
                <button className={btn} aria-label={`${g.label} 아래로`} disabled={gi === list.length - 1} onClick={() => setList(move(list, gi, 1))}>▼</button>
              </span>
            </div>
            <ul className="px-1 py-1">
              {g.items.map((it, ii) => (
                <li key={it.key} className="flex items-center justify-between px-1 py-0.5 text-sm">
                  <span className="truncate pl-2 text-neutral-700">{it.label}</span>
                  <span className="flex">
                    <button className={btn} aria-label={`${it.label} 위로`} disabled={ii === 0} onClick={() => setList(list.map((x, k) => (k === gi ? { ...x, items: move(x.items, ii, -1) } : x)))}>▲</button>
                    <button className={btn} aria-label={`${it.label} 아래로`} disabled={ii === g.items.length - 1} onClick={() => setList(list.map((x, k) => (k === gi ? { ...x, items: move(x.items, ii, 1) } : x)))}>▼</button>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {err && <p className="mt-2 text-xs text-rose-600">{err}</p>}
      <div className="mt-3 flex flex-wrap gap-1.5">
        <button disabled={busy} onClick={() => save(list.flatMap((g) => [`team:${g.team}`, ...g.items.map((i) => i.key)]))} className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">저장</button>
        <button disabled={busy} onClick={onDone} className="rounded-lg px-3 py-1.5 text-xs text-neutral-600 ring-1 ring-neutral-200">취소</button>
        <button disabled={busy} onClick={() => save([])} className="ml-auto rounded-lg px-2 py-1.5 text-[11px] text-neutral-400 hover:text-neutral-600">기본 순서로</button>
      </div>
    </div>
  );
}
