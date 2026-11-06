import "server-only";

// 네이버 로그인 (Supabase 기본 미지원 → 서버에서 직접 OAuth 처리)
// 필요한 환경변수: NAVER_CLIENT_ID, NAVER_CLIENT_SECRET
export const naverEnabled = () => !!(process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET);

export const NAVER_COOKIE = "naver_oauth";

export function naverAuthorizeUrl(state: string, redirectUri: string) {
  const u = new URL("https://nid.naver.com/oauth2.0/authorize");
  u.searchParams.set("response_type", "code");
  u.searchParams.set("client_id", process.env.NAVER_CLIENT_ID!);
  u.searchParams.set("redirect_uri", redirectUri);
  u.searchParams.set("state", state);
  return u.toString();
}

export async function naverToken(code: string, state: string): Promise<string | null> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: process.env.NAVER_CLIENT_ID!,
    client_secret: process.env.NAVER_CLIENT_SECRET!,
    code,
    state,
  });
  const r = await fetch("https://nid.naver.com/oauth2.0/token", { method: "POST", body, cache: "no-store" });
  const j = await r.json().catch(() => null);
  return j?.access_token ?? null;
}

export type NaverProfile = { id: string; email?: string; name?: string; nickname?: string; mobile?: string };

export async function naverProfile(accessToken: string): Promise<NaverProfile | null> {
  const r = await fetch("https://openapi.naver.com/v1/nid/me", { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
  const j = await r.json().catch(() => null);
  return j?.resultcode === "00" && j.response?.id ? (j.response as NaverProfile) : null;
}

// 외부 주소로 튕기지 않도록 내부 경로만 허용
export const safeNext = (n: string | null | undefined) => (n && n.startsWith("/") && !n.startsWith("//") ? n : "/mypage");
