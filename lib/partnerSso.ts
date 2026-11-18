import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { createServiceClient } from "./auth";
import { digits } from "./storeLogin";

// 제휴 앱(웰리케어) 자동 로그인
// 1) 웰리케어 서버 → POST /api/partner/wellycare/ticket (비밀키) → 1회용 입장 주소를 받는다
// 2) 앱이 그 주소를 연다 → GET /api/partner/wellycare/enter?ticket=… → 로그인된 상태로 뷰티웰 홈
// 연락처·이름 같은 개인정보는 주소(URL)에 넣지 않는다. 주소에는 뜻 없는 1회용 값만 들어간다.
export const PARTNER = "wellycare";
export const TICKET_SECONDS = 120;
const sha = (s: string) => createHash("sha256").update(s).digest();
export const hashToken = (t: string) => sha(t).toString("hex");

export const partnerSecret = () => process.env.WELLYCARE_SSO_SECRET || "";
// 비밀키 비교 (길이·시간 차이로 새지 않게 해시끼리 비교)
export function secretOk(given: string | null | undefined) {
  const s = partnerSecret();
  if (!s || s.length < 24 || !given) return false;
  return timingSafeEqual(sha(given), sha(s));
}

// 연락처로 회원 찾기 — DB에 010-1234-5678 / 01012345678 어느 쪽으로 들어 있어도 찾는다
export async function findMemberByPhone(phoneRaw: unknown) {
  const d = digits(phoneRaw);
  if (d.length < 9 || d.length > 11) return { status: "bad_phone" as const };
  const forms = [...new Set([d, d.replace(/^(\d{3})(\d{3,4})(\d{4})$/, "$1-$2-$3"), d.replace(/^(\d{2})(\d{3,4})(\d{4})$/, "$1-$2-$3")])];
  const { data } = await createServiceClient().from("profiles").select("id, status").in("phone", forms).limit(3);
  const list = (data ?? []).filter((p) => p.status !== "blocked" && p.status !== "withdrawn");
  if (list.length === 0) return { status: "not_member" as const };
  if (list.length > 1) return { status: "duplicate" as const }; // 같은 번호 회원이 여럿이면 자동 로그인하지 않음
  return { status: "ok" as const, userId: list[0].id as string };
}

export async function issueTicket(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const { error } = await createServiceClient().from("partner_login_tickets").insert({ partner: PARTNER, token_hash: hashToken(token), user_id: userId, expires_at: new Date(Date.now() + TICKET_SECONDS * 1000).toISOString() });
  return error ? null : token;
}

// 입장권 사용 처리 — 안 쓴 것 + 시간 안 지난 것만, 한 번에(동시에 두 번 못 쓰게) 처리
export async function redeemTicket(token: string) {
  if (!/^[A-Za-z0-9_-]{40,50}$/.test(token)) return null;
  const now = new Date().toISOString();
  const { data } = await createServiceClient().from("partner_login_tickets").update({ used_at: now })
    .eq("token_hash", hashToken(token)).eq("partner", PARTNER).is("used_at", null).gt("expires_at", now).select("user_id").maybeSingle();
  return (data?.user_id as string | undefined) ?? null;
}
