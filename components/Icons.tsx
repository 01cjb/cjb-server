type P = { className?: string };
const s = (d: React.ReactNode, className = "size-6") => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>{d}</svg>
);
export const IconSearch = ({ className }: P) => s(<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>, className);
export const IconUser = ({ className }: P) => s(<><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></>, className);
export const IconCart = ({ className }: P) => s(<><path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6" /><circle cx="10" cy="20" r="1.3" /><circle cx="18" cy="20" r="1.3" /></>, className);
export const IconHeart = ({ className, filled }: P & { filled?: boolean }) => (
  <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8} className={className ?? "size-6"} aria-hidden>
    <path d="M12 20s-7-4.4-9.2-9A5 5 0 0 1 12 6a5 5 0 0 1 9.2 5C19 15.6 12 20 12 20Z" />
  </svg>
);
export const IconHome = ({ className }: P) => s(<><path d="M3 11 12 4l9 7" /><path d="M5 10v10h14V10" /></>, className);
export const IconMenu = ({ className }: P) => s(<><path d="M4 6h16M4 12h16M4 18h16" /></>, className);
export const IconGrid = ({ className }: P) => s(<><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></>, className);
export const IconRepeat = ({ className }: P) => s(<><path d="M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5" /></>, className);
export const IconTruck = ({ className }: P) => s(<><path d="M3 7h13v10H3zM16 10h3l2 3v4h-5" /><circle cx="7" cy="18" r="1.6" /><circle cx="17.5" cy="18" r="1.6" /></>, className);
export const IconTicket = ({ className }: P) => s(<><path d="M4 8h16v4a2 2 0 0 0 0 4H4a2 2 0 0 0 0-4z" /><path d="M10 8v8" strokeDasharray="2 2" /></>, className);
export const IconGift = ({ className }: P) => s(<><path d="M4 10h16v10H4zM3 7h18v3H3zM12 7v13M12 7c-2-4-6-3-5 0M12 7c2-4 6-3 5 0" /></>, className);
export const IconStar = ({ className }: P) => s(<><path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6-5.3-3-5.3 3 1.2-6L3.4 9.3l6-.7z" /></>, className);
export const IconShop = ({ className }: P) => s(<><path d="M4 20V9l8-5 8 5v11M9 20v-6h6v6" /></>, className);
export const IconDoc = ({ className }: P) => s(<><path d="M6 3h9l4 4v14H6zM15 3v4h4M9 12h7M9 16h5" /></>, className);
export const IconHeadset = ({ className }: P) => s(<><path d="M4 13a8 8 0 1 1 16 0v4a2 2 0 0 1-2 2h-1v-6h3M4 13h3v6H6a2 2 0 0 1-2-2z" /></>, className);
