import "server-only";
import { createServiceClient } from "@/lib/auth";
import { workLive, type WorkMe } from "./auth";
import { USER_TEAMS } from "./menus";

// 서류 보관함 · 지시함 · 조직도
// PM 지시함(pm_directives)은 화면에 내보내지 않는 DB 전용 표라서 여기서 다루지 않습니다.
// 보관함은 업무(부서)별로 나뉘고, 자기 부서 보관함만 봅니다(대표는 전체). tech = 기술 AI 보관함(전 직원 열람)
// settle = 정산 파일 서류(날짜별 하위 폴더). 고객 이름·주소가 든 파일이라 대표와 주문·송장 메뉴 권한자만 봅니다

export const BOXES = [...USER_TEAMS.map((t) => ({ key: t.key as string, label: `${t.short} 서류` })), { key: "tech", label: "기술 AI 서류" }, { key: "settle", label: "정산 파일 서류" }];
export const DATED_BOX = "settle"; // 안에 날짜별 폴더가 있는 보관함
export const BOX_KEYS = new Set(BOXES.map((b) => b.key));
export const TO_TEAMS = [{ key: "all", label: "전체" }, ...USER_TEAMS.map((t) => ({ key: t.key as string, label: t.short }))];
export const TO_KEYS = new Set(TO_TEAMS.map((t) => t.key));
export const DIRECTIVE_STATUS: Record<string, string> = { open: "대기", doing: "진행 중", done: "완료" };
export const MAX_FILE = 4 * 1024 * 1024;
const BUCKET = "work-docs";

export type Doc = { id: number; box: string; folder?: string | null; title: string; body: string | null; link_url: string | null; file_name: string | null; file_size: number | null; created_by: string | null; created_by_name: string | null; created_at: string };
export type Directive = { id: number; title: string; body: string | null; from_user: string | null; from_name: string | null; to_team: string; to_user: string | null; to_name: string | null; due_date: string | null; status: "open" | "doing" | "done"; result: string | null; done_at: string | null; created_at: string };

const db = () => createServiceClient();
const myTeam = (me: WorkMe) => (me.team === "dev" ? "design" : me.team);
export const canBox = (me: WorkMe, box: string) => BOX_KEYS.has(box) && (me.is_owner || box === "tech" || box === myTeam(me) || (box === DATED_BOX && (me.menus.includes("waybill") || me.menus.includes("orders"))));
export const myBoxes = (me: WorkMe) => BOXES.filter((b) => canBox(me, b.key));

// 목업(DB 없이 화면만 볼 때) 저장소
const mem: { docs: (Doc & { file_path?: string | null; deleted_at?: string | null })[]; dirs: Directive[]; seq: number } =
  ((globalThis as Record<string, unknown>).__cjbDocs ??= { docs: [], dirs: [], seq: 1 }) as never;

const DOC_COLS = "id,box,folder,title,body,link_url,file_name,file_size,created_by,created_by_name,created_at";
const DIR_COLS = "id,title,body,from_user,from_name,to_team,to_user,to_name,due_date,status,result,done_at,created_at";

export async function listDocs(me: WorkMe, box: string, folder?: string): Promise<Doc[]> {
  if (!canBox(me, box)) return [];
  if (!workLive()) return mem.docs.filter((d) => d.box === box && !d.deleted_at && (!folder || d.folder === folder)).sort((a, b) => b.id - a.id);
  let q = db().from("work_docs").select(DOC_COLS).eq("box", box).is("deleted_at", null);
  if (folder) q = q.eq("folder", folder);
  const { data } = await q.order("created_at", { ascending: false }).limit(folder ? 300 : 2000);
  return (data as Doc[]) ?? [];
}

// 보관함 안의 하위 폴더 목록 (최근 날짜가 위)
export async function listFolders(me: WorkMe, box: string): Promise<{ folder: string; count: number }[]> {
  const by: Record<string, number> = {};
  for (const d of await listDocs(me, box)) { const f = d.folder || "날짜 없음"; by[f] = (by[f] ?? 0) + 1; }
  return Object.entries(by).map(([folder, count]) => ({ folder, count })).sort((a, b) => b.folder.localeCompare(a.folder));
}
const kstToday = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);

const safeUrl = (u: string) => (/^https?:\/\/[^\s]+$/i.test(u) ? u : null);

export async function createDoc(me: WorkMe, v: { box: string; title: string; body?: string; link_url?: string; file?: File | null; folder?: string }) {
  const title = ((v.title ?? "").trim() || (v.file && v.file.size > 0 ? v.file.name.replace(/\.[A-Za-z0-9]{1,8}$/, "") : "")).slice(0, 120);
  if (!canBox(me, v.box)) return { ok: false as const, error: "이 보관함에 올릴 권한이 없습니다." };
  if (!title) return { ok: false as const, error: "제목을 입력하세요." };
  const link = v.link_url?.trim() ? safeUrl(v.link_url.trim()) : null;
  if (v.link_url?.trim() && !link) return { ok: false as const, error: "링크는 http:// 또는 https:// 로 시작해야 합니다." };
  const f = v.file && v.file.size > 0 ? v.file : null;
  if (f && f.size > MAX_FILE) return { ok: false as const, error: "파일은 4MB 이하만 올릴 수 있습니다." };
  // 날짜별 보관함: 폴더는 날짜(YYYY-MM-DD), 안 주면 오늘. 제목을 비우면 파일 이름을 제목으로
  const folder = v.box === DATED_BOX ? (/^\d{4}-\d{2}-\d{2}$/.test(v.folder ?? "") ? v.folder! : kstToday()) : null;
  const row = { box: v.box, folder, title, body: (v.body ?? "").trim().slice(0, 4000) || null, link_url: link, file_name: f?.name.slice(0, 200) ?? null, file_size: f?.size ?? null, created_by: me.id, created_by_name: me.name };
  if (!workLive()) { mem.docs.push({ id: mem.seq++, ...row, created_at: new Date().toISOString() }); return { ok: true as const }; }
  let file_path: string | null = null;
  if (f) {
    const ext = (f.name.match(/\.[A-Za-z0-9]{1,8}$/)?.[0] ?? "").toLowerCase();
    file_path = `${v.box}/${folder ? folder + "/" : ""}${Date.now()}-${crypto.randomUUID()}${ext}`;
    const up = await db().storage.from(BUCKET).upload(file_path, Buffer.from(await f.arrayBuffer()), { contentType: f.type || "application/octet-stream", upsert: false });
    if (up.error) return { ok: false as const, error: "파일 저장 실패: " + up.error.message };
  }
  const { error } = await db().from("work_docs").insert({ ...row, file_path });
  if (error) return { ok: false as const, error: "저장 실패: " + error.message };
  return { ok: true as const };
}

// 지우기: 올린 사람 또는 대표만. 목록에서만 숨기고 파일은 남겨 둠(복구 가능)
export async function deleteDoc(me: WorkMe, id: number) {
  if (!workLive()) { const d = mem.docs.find((x) => x.id === id); if (d && (me.is_owner || d.created_by === me.id)) d.deleted_at = new Date().toISOString(); return { ok: true as const }; }
  const { data } = await db().from("work_docs").select("id,box,created_by").eq("id", id).is("deleted_at", null).maybeSingle();
  if (!data || !canBox(me, data.box)) return { ok: false as const, error: "서류를 찾을 수 없습니다." };
  if (!me.is_owner && data.created_by !== me.id) return { ok: false as const, error: "올린 사람이나 대표만 지울 수 있습니다." };
  await db().from("work_docs").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  return { ok: true as const };
}

export async function docFileUrl(me: WorkMe, id: number): Promise<string | null> {
  if (!workLive()) return null;
  const { data } = await db().from("work_docs").select("box,file_path,file_name").eq("id", id).is("deleted_at", null).maybeSingle();
  if (!data?.file_path || !canBox(me, data.box)) return null;
  const s = await db().storage.from(BUCKET).createSignedUrl(data.file_path, 60, { download: data.file_name ?? true });
  return s.data?.signedUrl ?? null;
}

// ---------- 지시함 ----------
const mine = (me: WorkMe, d: Directive) => me.is_owner || d.from_user === me.id || d.to_user === me.id || d.to_team === "all" || d.to_team === myTeam(me);

export async function listDirectives(me: WorkMe): Promise<Directive[]> {
  let rows: Directive[];
  if (!workLive()) rows = [...mem.dirs].sort((a, b) => b.id - a.id);
  else rows = ((await db().from("work_directives").select(DIR_COLS).order("created_at", { ascending: false }).limit(300)).data as Directive[]) ?? [];
  return rows.filter((d) => mine(me, d));
}

export async function createDirective(me: WorkMe, v: { title: string; body?: string; to_team: string; to_user?: string; due_date?: string }) {
  const title = (v.title ?? "").trim().slice(0, 120);
  if (!title) return { ok: false as const, error: "지시 제목을 입력하세요." };
  if (!TO_KEYS.has(v.to_team)) return { ok: false as const, error: "받는 곳을 선택하세요." };
  const due = v.due_date && /^\d{4}-\d{2}-\d{2}$/.test(v.due_date) ? v.due_date : null;
  let to_user: string | null = null, to_name: string | null = null;
  if (v.to_user && workLive()) {
    const { data } = await db().from("work_users").select("id,name").eq("id", v.to_user).eq("status", "active").maybeSingle();
    if (data) { to_user = data.id; to_name = data.name; }
  }
  const row = { title, body: (v.body ?? "").trim().slice(0, 4000) || null, from_user: me.id, from_name: me.name, to_team: v.to_team, to_user, to_name, due_date: due, status: "open" as const, result: null, done_at: null };
  if (!workLive()) { mem.dirs.push({ id: mem.seq++, ...row, created_at: new Date().toISOString() }); return { ok: true as const }; }
  const { error } = await db().from("work_directives").insert(row);
  if (error) return { ok: false as const, error: "저장 실패: " + error.message };
  return { ok: true as const };
}

export async function updateDirective(me: WorkMe, id: number, v: { status?: string; result?: string }) {
  if (v.status && !(v.status in DIRECTIVE_STATUS)) return { ok: false as const, error: "상태 값이 올바르지 않습니다." };
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (v.status) { patch.status = v.status; patch.done_at = v.status === "done" ? new Date().toISOString() : null; }
  if (typeof v.result === "string") patch.result = v.result.trim().slice(0, 4000) || null;
  if (!workLive()) { const d = mem.dirs.find((x) => x.id === id); if (d && mine(me, d)) Object.assign(d, patch); return { ok: true as const }; }
  const { data } = await db().from("work_directives").select(DIR_COLS).eq("id", id).maybeSingle();
  const d = data as Directive | null;
  if (!d || !mine(me, d)) return { ok: false as const, error: "지시를 찾을 수 없습니다." };
  await db().from("work_directives").update(patch).eq("id", id);
  return { ok: true as const };
}

// ---------- 조직도 ----------
export type OrgUser = { id: string; name: string; team: string; position: string | null; is_owner: boolean; phone: string | null };
export async function listOrg(): Promise<OrgUser[]> {
  if (!workLive()) {
    const m = await import("./mock");
    return m.users().filter((u) => u.status === "active").map((u) => ({ id: u.id, name: u.name, team: u.team, position: u.position, is_owner: u.is_owner, phone: u.phone }));
  }
  const { data } = await db().from("work_users").select("id,name,team,position,is_owner,phone").eq("status", "active").order("is_owner", { ascending: false }).order("name");
  return (data as OrgUser[]) ?? [];
}
