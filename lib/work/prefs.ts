import "server-only";
import { createServiceClient } from "@/lib/auth";
import { workLive } from "./auth";
import { MENUS, TEAMS } from "./menus";

// 직원별 메뉴 순서. 테이블이 아직 없거나(배포 직후) 오류면 기본 순서로 동작
const g = globalThis as unknown as { __workPrefs?: Record<string, string[]> };
const mem = () => (g.__workPrefs ??= {});

export const ORDER_KEYS = new Set([...TEAMS.map((t) => `team:${t.key}`), ...MENUS.map((m) => m.key)]);

export async function getMenuOrder(userId: string): Promise<string[]> {
  if (!workLive()) return mem()[userId] ?? [];
  const { data, error } = await createServiceClient().from("work_user_prefs").select("menu_order").eq("user_id", userId).maybeSingle();
  if (error) return [];
  return (data?.menu_order as string[] | null) ?? [];
}

export async function setMenuOrder(userId: string, input: unknown) {
  if (!Array.isArray(input)) return { ok: false as const, error: "순서 정보가 올바르지 않습니다." };
  const keys = [...new Set(input.filter((k): k is string => typeof k === "string" && ORDER_KEYS.has(k)))];
  if (!workLive()) { mem()[userId] = keys; return { ok: true as const }; }
  const { error } = await createServiceClient().from("work_user_prefs").upsert({ user_id: userId, menu_order: keys, updated_at: new Date().toISOString() });
  if (error) return { ok: false as const, error: "저장하지 못했습니다: " + error.message };
  return { ok: true as const };
}

// 저장된 순서 적용: 목록에 있는 것 먼저(저장 순서), 없는 것은 기본 순서로 뒤에
export function applyOrder<T>(list: T[], key: (x: T) => string, order: string[]): T[] {
  const pos = new Map(order.map((k, i) => [k, i]));
  return list.map((x, i) => ({ x, i })).sort((a, b) => (pos.get(key(a.x)) ?? 1e6 + a.i) - (pos.get(key(b.x)) ?? 1e6 + b.i)).map((v) => v.x);
}
