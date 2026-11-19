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
// 키 교체용: 새 키를 WELLYCARE_SSO_SECRET_NEXT 에 넣어 두면 옛 키·새 키를 둘 다 받는다.
// 제휴사가 새 키로 바꾼 뒤 WELLYCARE_SSO_SECRET 을 새 키로 바꾸고 _NEXT 를 지우면 교체 끝.
const acceptedSecrets = () => [process.env.WELLYCARE_SSO_SECRET, process.env.WELLYCARE_SSO_SECRET_NEXT].filter((s): s is string => !!s && s.length >= 24);
// 비밀키 비교 (길이·시간 차이로 새지 않게 해시끼리 비교)
export function secretOk(given: string | null | undefined) {
  if (!given) return false;
  const g = sha(given);
  let ok = false;
  for (const s of acceptedSecrets()) if (timingSafeEqual(g, sha(s))) ok = true;
  return ok;
}

// 연락처로 회원 찾기 — DB에 010-1234-5678 / 01012345678 어느 쪽으로 들어 있어도 찾는다
export async function findMemberByPhone(phoneRaw: unknown) {
  const d = digits(phoneRaw);
  if (d.length < 9 || d.length > 11) return { status: "bad_phone" as const };
  const forms = [...new Set([d, d.replace(/^(\d{3})(\d{3,4})(\d{4})$/, "$1-$2-$3"), d.replace(/^(\d{2})(\d{3,4})(\d{4})$/, "$1-$2-$3")])];
  // 번호를 주소(URL)에 싣지 않도록 함수 호출(요청 본문)로 조회 — 전화번호가 접속 기록에 남지 않게. 조회한 번호는 저장하지 않는다.
  const { data } = await createServiceClient().rpc("partner_find_member", { phones: forms });
  const list = ((data ?? []) as { id: string; status: string }[]).filter((p) => p.status !== "blocked" && p.status !== "withdrawn");
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
