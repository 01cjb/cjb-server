import "server-only";
import { getMe } from "./me";
import type { Product } from "./types";

// 가격 공개 범위 — 서버에서 결정해서, 볼 수 없는 가격은 브라우저로 아예 보내지 않는다.
//   guest   : 로그인 전 → 가격 전부 비공개 (판매가 회원공개)
//   general : 로그인(미인증) → 기본가만, VIP가 숫자는 보내지 않음
//   salon/vip : 미용사 인증 → VIP가까지
//   all     : 목업(DB 미연결) 데모 — 화면의 등급 미리보기로 전환하므로 전부 보냄
export type Viewer = "guest" | "general" | "salon" | "vip" | "all";

export async function getViewer(): Promise<Viewer> {
  const me = await getMe();
  if (me.mock) {
    const v = process.env.MOCK_VIEWER; // 로컬 테스트용: guest | general
    return v === "guest" || v === "general" ? v : "all";
  }
  if (!me.user) return "guest";
  const g = me.user.grade_id;
  return g === "salon" || g === "vip" ? g : "general";
}

export function maskProduct(p: Product, v: Viewer): Product {
  if (v === "all" || v === "salon" || v === "vip") return p;
  const has_vip_price = !!p.salon_price;
  if (v === "general") return { ...p, salon_price: null, has_vip_price };
  return { ...p, price: 0, consumer_price: null, salon_price: null, has_vip_price, price_hidden: true };
}
export const maskProducts = (list: Product[], v: Viewer) => list.map((p) => maskProduct(p, v));
