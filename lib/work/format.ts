// 클라이언트·서버 공용
export const digits = (s: unknown) => (typeof s === "string" ? s.replace(/\D/g, "") : "");
export const fmtPhone = (s?: string | null) =>
  !s ? "" : s.length === 11 ? `${s.slice(0, 3)}-${s.slice(3, 7)}-${s.slice(7)}` : s.length === 10 ? `${s.slice(0, 3)}-${s.slice(3, 6)}-${s.slice(6)}` : s;
