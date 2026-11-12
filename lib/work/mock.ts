import "server-only";
import { hashPin } from "./pin";
import type { WorkUser } from "./auth";

// 목업 모드 (Supabase 키 없음) — 메모리에만 저장, 서버 재시작 시 초기화
// 데모 로그인: 이름 "대표" / 연락처 010-0000-0000 / PIN 135790
export const DEMO_LOGIN = { name: "대표", phone: "010-0000-0000", pin: "135790" };

type Row = WorkUser & { pin_hash: string | null; menus: string[] };
const now = "2026-11-10T00:00:00Z";
const base = (p: Partial<Row> & Pick<Row, "id" | "name">): Row => ({
  phone: null, team: "mgmt", position: null, is_owner: false, status: "active", failed_count: 0, locked_until: null,
  pin_set_at: now, memo: null, last_login_at: null, created_at: now, pin_hash: null, menus: [], ...p,
});

const g = globalThis as unknown as { __workMock?: Row[] };
function store(): Row[] {
  if (!g.__workMock) {
    g.__workMock = [
      base({ id: "00000000-0000-0000-0000-0000000000a1", name: "대표", phone: "01000000000", position: "대표", is_owner: true, pin_hash: hashPin(DEMO_LOGIN.pin) }),
      base({ id: "00000000-0000-0000-0000-0000000000a2", name: "경영지원", phone: "01000000001", team: "mgmt", position: "팀장", pin_hash: hashPin("246813"), menus: ["tax", "accounting", "hr", "labor", "purchase", "revenue", "ledger"] }),
      base({ id: "00000000-0000-0000-0000-0000000000a3", name: "물류담당", phone: null, team: "logistics", position: "사원", pin_hash: hashPin("975312"), menus: ["inventory", "orders", "shipping", "waybill"] }),
    ];
  }
  return g.__workMock;
}

const strip = ({ pin_hash: _p, menus: _m, ...u }: Row): WorkUser => u;
export const users = (): WorkUser[] => store().map(strip);
export const menus = (id: string) => store().find((u) => u.id === id)?.menus ?? [];
export const pinHash = (id: string) => store().find((u) => u.id === id)?.pin_hash ?? null;

export function insert(u: Omit<WorkUser, "id" | "created_at" | "failed_count" | "locked_until" | "last_login_at">, pin_hash: string): WorkUser {
  const row = base({ ...u, id: crypto.randomUUID(), pin_hash });
  store().push(row);
  return strip(row);
}
export function update(id: string, patch: Partial<Row>) {
  const r = store().find((u) => u.id === id);
  if (r) Object.assign(r, patch);
}
export function setMenus(id: string, keys: string[]) { update(id, { menus: keys }); }
