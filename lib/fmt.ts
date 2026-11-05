export const won = (n?: number | null) => (n == null ? "-" : n.toLocaleString("ko-KR") + "원");
export const dt = (s?: string | null) => (s ? new Date(s).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", year: "2-digit", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "-");
export const day = (s?: string | null) => (s ? new Date(s).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" }) : "-");
export const trackUrl = (tpl?: string, no?: string | null) => (tpl && no ? tpl.replace("{no}", encodeURIComponent(no)) : null);
