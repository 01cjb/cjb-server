import "server-only";
import { randomBytes, randomInt, scryptSync, timingSafeEqual } from "node:crypto";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// 원장님 로그인 (매장 코드 + 연락처 + PIN)
export const digits = (s: unknown) => String(s ?? "").replace(/\D/g, "");
export const validCode = (c: string) => /^\d{8}$/.test(c);
export const validPin = (p: string) => /^\d{4,6}$/.test(p);

export function hashPin(pin: string) {
  const salt = randomBytes(16);
  return `s1$${salt.toString("base64")}$${scryptSync(pin, salt, 32).toString("base64")}`;
}
export function checkPin(pin: string, stored: string | null | undefined) {
  const [v, s, h] = String(stored ?? "").split("$");
  if (v !== "s1" || !s || !h) return false;
  const a = scryptSync(pin, Buffer.from(s, "base64"), 32), b = Buffer.from(h, "base64");
  return a.length === b.length && timingSafeEqual(a, b);
}
export const newPin = () => String(randomInt(0, 1_000_000)).padStart(6, "0");

// 중복 없는 8자리 매장 코드
export async function newStoreCode() {
  const db = createServiceClient();
  for (let i = 0; i < 10; i++) {
    const code = String(randomInt(10_000_000, 100_000_000));
    const { data } = await db.from("profiles").select("id").eq("store_code", code).maybeSingle();
    if (!data) return code;
  }
  throw new Error("매장 코드를 만들지 못했습니다. 다시 시도해 주세요.");
}

// 최근 LOCK_MINUTES분 안에 틀린 시도 LOCK_FAILS번이면 잠시 막음 (운영규칙 문서에도 이 값이 표시됨)
export const LOCK_FAILS = 5;
export const LOCK_MINUTES = 15;
export async function tooManyFails(code: string) {
  const since = new Date(Date.now() - LOCK_MINUTES * 60_000).toISOString();
  const { count } = await createServiceClient().from("store_login_attempts").select("id", { count: "exact", head: true })
    .eq("store_code", code).eq("ok", false).gte("created_at", since);
  return (count ?? 0) >= LOCK_FAILS;
}
export async function logAttempt(code: string, ok: boolean, ip: string | null) {
  await createServiceClient().from("store_login_attempts").insert({ store_code: code, ok, ip });
}

// 이메일 계정으로 로그인 세션(쿠키) 만들기 — 네이버 로그인과 같은 방식
export async function startSession(email: string) {
  const admin = createServiceClient();
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (error || !data.properties?.hashed_token) return false;
  const { error: e2 } = await (await createClient()).auth.verifyOtp({ type: "email", token_hash: data.properties.hashed_token });
  return !e2;
}

// 오픈 전 테스트 계정 (미용실회원)
export const TEST = { email: "test-owner@beautywell.test", name: "테스트 원장", phone: "010-0000-0000", salon: "뷰티웰 테스트 미용실", code: "00000000" };
export const testLoginOn = () => process.env.TEST_LOGIN !== "off";

export async function ensureTestUser() {
  const db = createServiceClient();
  let { data: p } = await db.from("profiles").select("id").eq("store_code", TEST.code).maybeSingle();
  if (!p) {
    const list = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
    let id = list.data?.users.find((u) => u.email === TEST.email)?.id;
    if (!id) {
      const { data, error } = await db.auth.admin.createUser({ email: TEST.email, email_confirm: true, password: randomBytes(24).toString("base64url"), user_metadata: { name: TEST.name } });
      if (error || !data.user) throw new Error("테스트 계정을 만들지 못했습니다: " + (error?.message ?? ""));
      id = data.user.id;
    }
    await db.from("profiles").upsert({ id, name: TEST.name, phone: TEST.phone, salon_name: TEST.salon, grade_id: "salon", store_code: TEST.code });
    // 필수 약관 동의(테스트 계정) — 없으면 마이페이지에서 약관 화면으로 넘어감
    const { data: docs } = await db.from("consent_documents").select("id, code, required");
    const { data: has } = await db.from("user_consents").select("id").eq("user_id", id).limit(1);
    if (!has?.length && docs?.length) await db.from("user_consents").insert(docs.map((d: { id: number; required: boolean }) => ({ user_id: id, document_id: d.id, agreed: d.required, ip: "test-login" })));
    p = { id };
  }
  return TEST.email;
}
