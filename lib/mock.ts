import type { Banner, Brand, Category, Product } from "./types";

// 현재 icjb.com(뷰티웰) 카테고리 구조 기반 목업 데이터
export const categories: Category[] = [
  { id: 1, slug: "perm-color", name: "펌제/염색제", icon: "🧪", sort: 1 },
  { id: 2, slug: "exam", name: "국가고시용", icon: "📝", sort: 2 },
  { id: 3, slug: "appliance", name: "이·미용가전", icon: "💨", sort: 3 },
  { id: 4, slug: "goods", name: "이·미용잡화", icon: "🧰", sort: 4 },
  { id: 5, slug: "scissors", name: "미용가위", icon: "✂️", sort: 5 },
  { id: 6, slug: "haircare", name: "헤어케어/스타일링", icon: "💆", sort: 6 },
  { id: 7, slug: "skincare", name: "스킨케어", icon: "🧴", sort: 7 },
  { id: 8, slug: "living", name: "생활/건강", icon: "🌿", sort: 8 },
];

export const brands: Brand[] = [
  "그레이거", "로레알 프로페셔널", "밀본", "바비리스 프로", "시세이도", "파나소닉", "필립스", "폴톤",
  "코메트", "핫툴스", "토야노카지야", "퓨어라벨", "도루코", "더비", "에이스바이옴", "휴브론",
].map((name, i) => ({ id: i + 1, slug: `b${i + 1}`, name, sort: i + 1 }));

const b = (name: string) => brands.find((x) => x.name === name)!.id;

type Seed = Omit<Product, "id" | "badges" | "is_best" | "is_new" | "is_timesale" | "vip_only" | "status" | "stock"> &
  Partial<Pick<Product, "badges" | "is_best" | "is_new" | "is_timesale" | "vip_only" | "stock">>;

const seed: Seed[] = [
  { name: "[바비리스프로] 건스틸4아티스트 FX8705K 전문가용 헤어클리퍼 + 트리머 세트", brand_id: b("바비리스 프로"), category_id: 3, model_no: "FX8705K", consumer_price: 459000, price: 389000, salon_price: 359000, is_best: true },
  { name: "[파나소닉] ER-GM40 완전방수 무빙헤드 전동 눈썹바리깡", brand_id: b("파나소닉"), category_id: 3, model_no: "ER-GM40", consumer_price: 39000, price: 29800, salon_price: 26800, is_best: true },
  { name: "[도루코] 안전 면도날 BB20 (20날입)", brand_id: b("도루코"), category_id: 4, consumer_price: 6000, price: 4500, salon_price: 3900, is_best: true },
  { name: "[그레이거] 클래식 이용도자루 GR-100B 외날용", brand_id: b("그레이거"), category_id: 4, model_no: "GR-100B", consumer_price: 25000, price: 18000, salon_price: 16000, is_best: true, summary: "이용원 전문가용 클래식 도자루" },
  { name: "[DERBY] 더비 엑스트라 클래식 면도기 양면날 100PCS", brand_id: b("더비"), category_id: 4, consumer_price: 22000, price: 15900, salon_price: 14000, is_best: true },
  { name: "[코메트] 오픈형 클리퍼 바리깡 CO-202, 네이비", brand_id: b("코메트"), category_id: 3, model_no: "CO-202", consumer_price: 89000, price: 69000, salon_price: 62000, is_new: true },
  { name: "[코메트] 오픈형 클리퍼 바리깡 CO-202, 메탈실버", brand_id: b("코메트"), category_id: 3, model_no: "CO-202", consumer_price: 89000, price: 69000, salon_price: 62000, is_new: true },
  { name: "[에이스바이옴] 아나파랙틴 패치", brand_id: b("에이스바이옴"), category_id: 7, consumer_price: 32000, price: 24000, salon_price: 21000, is_new: true },
  { name: "[폴톤] 리바이탈 클리닉 웨이브 펌제 300ml 세트 (1제+2제), 1BOX", brand_id: b("폴톤"), category_id: 1, consumer_price: 180000, price: 138000, salon_price: 124000, is_new: true },
  { name: "[폴톤] 리바이탈 클리닉 웨이브 펌제 300ml 세트 (1제+2제)", brand_id: b("폴톤"), category_id: 1, consumer_price: 15000, price: 11500, salon_price: 10300, is_new: true },
  { name: "[그레이거] 다용도 헤어 비닐캡 (50장)", brand_id: b("그레이거"), category_id: 4, consumer_price: 5000, price: 3500, salon_price: 2900, is_timesale: true },
  { name: "[로레알] 세리 엑스퍼트 리스 언리미티드 샴푸 500ml", brand_id: b("로레알 프로페셔널"), category_id: 6, consumer_price: 42000, price: 33000, salon_price: 29700, is_best: true, summary: "모발·두피 타입별 헤어케어 토탈 솔루션" },
  { name: "[로레알] 세리 엑스퍼트 프로롱거 마스크 250ml", brand_id: b("로레알 프로페셔널"), category_id: 6, consumer_price: 46000, price: 36000, salon_price: 32400, is_timesale: true },
  { name: "[밀본] 올디브 염모제 80g", brand_id: b("밀본"), category_id: 1, consumer_price: 12000, price: 9500, salon_price: 8500 },
  { name: "[시세이도] 서브리믹 아데노바이탈 샴푸 250ml", brand_id: b("시세이도"), category_id: 6, consumer_price: 38000, price: 30000, salon_price: 27000 },
  { name: "[토야노카지야] 커트 가위 6.0인치", brand_id: b("토야노카지야"), category_id: 5, consumer_price: 420000, price: 350000, salon_price: 320000, vip_only: true },
  { name: "[핫툴스] 프로페셔널 24K 골드 아이롱 32mm", brand_id: b("핫툴스"), category_id: 3, consumer_price: 99000, price: 79000, salon_price: 71000, is_timesale: true },
  { name: "[필립스] 프로페셔널 헤어드라이어 2300W", brand_id: b("필립스"), category_id: 3, consumer_price: 129000, price: 98000, salon_price: 89000 },
  { name: "[그레이거] 국가고시용 커트 연습모 (마네킹)", brand_id: b("그레이거"), category_id: 2, consumer_price: 28000, price: 21000, salon_price: 19000, is_best: true },
  { name: "[퓨어라벨] 데일리 핸드 앤 바디 로션 500ml", brand_id: b("퓨어라벨"), category_id: 8, consumer_price: 19000, price: 13900, salon_price: 12500 },
];

export const products: Product[] = seed.map((p, i) => ({
  id: i + 1,
  stock: 50,
  badges: [],
  is_best: false,
  is_new: false,
  is_timesale: false,
  vip_only: false,
  status: "active",
  created_at: new Date(Date.UTC(2026, 9, 1 + i)).toISOString(),
  ...p,
}));

export const banners: Banner[] = [
  { id: 1, title: "SERIE EXPERT 3 TYPE", subtitle: "로레알 프로페셔널 · 모발·두피 타입별 헤어케어 토탈 솔루션", link: "/category/haircare", bg_color: "#f9d5e5", sort: 1 },
  { id: 2, title: "신규 회원 2,000원 쿠폰", subtitle: "가입 즉시 지급 · 미용실회원 인증 시 회원가 적용", link: "/login", bg_color: "#e9d5ff", sort: 2 },
  { id: 3, title: "이·미용가전 기획전", subtitle: "바비리스 프로 · 파나소닉 · 코메트 전문가용 클리퍼", link: "/category/appliance", bg_color: "#dbeafe", sort: 3 },
  { id: 4, title: "★ VIP 전용관 ★", subtitle: "VIP 회원만을 위한 특별가 상품", link: "/category/vip", bg_color: "#fde68a", sort: 4 },
];
