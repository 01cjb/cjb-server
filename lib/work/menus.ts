// 사내 업무 시스템 메뉴 목록 — 개인별 권한은 이 key로 체크합니다 (work_user_menus.menu_key)
// status: live = 데이터 연결됨 / soon = 화면만 준비 (외부 데이터 연동 예정)

export type TeamKey = "mgmt" | "sales" | "design" | "logistics" | "dev"; // dev: 예전 팀 값(디자인팀으로 통합)
export type Menu = { key: string; label: string; team: TeamKey; status: "live" | "soon"; desc: string; source?: string };

export const TEAMS: { key: TeamKey; label: string; short: string }[] = [
  { key: "mgmt", label: "경영 / 경영지원팀", short: "경영지원" },
  { key: "sales", label: "영업 / 영업지원팀", short: "영업" },
  { key: "design", label: "디자인 / 마케팅팀", short: "디자인·마케팅" },
  { key: "logistics", label: "물류 / 물류지원팀", short: "물류" },
];

export const MENUS: Menu[] = [
  // 경영 / 경영지원 — 이카운트 연동 예정
  { key: "tax", label: "세무", team: "mgmt", status: "live", desc: "세금계산서 발행 현황", source: "이카운트 연동 예정" },
  { key: "accounting", label: "회계", team: "mgmt", status: "soon", desc: "전표·계정과목·결산", source: "이카운트" },
  { key: "hr", label: "인사", team: "mgmt", status: "soon", desc: "인사카드·입퇴사·근태", source: "이카운트" },
  { key: "labor", label: "노무", team: "mgmt", status: "soon", desc: "급여·4대보험·근로계약", source: "이카운트" },
  { key: "purchase", label: "매입", team: "mgmt", status: "soon", desc: "매입처·매입전표·지급", source: "이카운트" },
  { key: "revenue", label: "매출", team: "mgmt", status: "live", desc: "쇼핑몰 주문 기준 매출", source: "이카운트 연동 예정" },
  { key: "ledger", label: "원장", team: "mgmt", status: "soon", desc: "거래처 원장·계정별 원장", source: "이카운트" },
  { key: "payments", label: "결제·환불", team: "mgmt", status: "soon", desc: "뷰티웰 결제 내역·취소·환불 (앱: 장바구니·결제)", source: "토스페이먼츠 연동 예정" },
  // 영업 / 영업지원
  { key: "clients", label: "고객사 관리", team: "sales", status: "live", desc: "회원·사업자 정보·계약" },
  { key: "salon-cert", label: "미용실회원 인증", team: "sales", status: "soon", desc: "사업자·면허 서류 확인 후 승인·반려 (앱: 미용실회원관)" },
  { key: "vip", label: "VIP 인증", team: "sales", status: "soon", desc: "VIP 인증 신청 심사·등급 부여 (앱: VIP 전용관)" },
  { key: "cs", label: "고객 문의", team: "sales", status: "soon", desc: "1:1 문의 답변·FAQ 관리 (앱: 고객센터)" },
  // 디자인 / 마케팅
  { key: "store", label: "온라인 스토어 관리", team: "design", status: "live", desc: "상품 판매 상태·가격" },
  { key: "design", label: "디자인 관리", team: "design", status: "soon", desc: "배너·상세페이지·이미지 자산" },
  { key: "marketing", label: "마케팅 관리", team: "design", status: "soon", desc: "수신동의·알림톡·캠페인" },
  { key: "coupons", label: "쿠폰·포인트", team: "design", status: "soon", desc: "쿠폰 발행·포인트 적립 규칙·사용 내역 (앱: 쿠폰·포인트)" },
  { key: "events", label: "이벤트·기획전", team: "design", status: "soon", desc: "이벤트·기획전 등록과 기간 관리 (앱: 이벤트)" },
  { key: "notices", label: "공지·알림 발송", team: "design", status: "soon", desc: "공지사항 등록·앱 알림 발송 (앱: 알림·공지사항)" },
  { key: "reorder", label: "재주문 알림", team: "design", status: "soon", desc: "상품별 재구매 주기·재주문 알림 대상 (앱: 재주문)" },
  { key: "reviews", label: "리뷰 관리", team: "design", status: "soon", desc: "상품 리뷰 확인·숨김·적립 (앱: 상품 리뷰)" },
  // 물류 / 물류지원 — 사방넷 연동 예정
  { key: "inventory", label: "재고", team: "logistics", status: "live", desc: "상품별 재고 수량", source: "사방넷 연동 예정" },
  { key: "orders", label: "주문", team: "logistics", status: "live", desc: "뷰티웰·카페24 주문 통합 현황" },
  { key: "shipping", label: "배송", team: "logistics", status: "live", desc: "배송 진행 상태", source: "사방넷 연동 예정" },
  { key: "waybill", label: "송장", team: "logistics", status: "live", desc: "로젠택배 송장 출력·송장번호" },
  { key: "channels", label: "판매채널 연동", team: "logistics", status: "live", desc: "카페24 등 외부 쇼핑몰 주문 수집" },
  // 홈페이지 운영 (예전 프론트엔드/백엔드 팀 → 디자인/마케팅팀으로 통합)
  { key: "frontend", label: "프론트엔드", team: "design", status: "live", desc: "화면·배포 상태" },
  { key: "backend", label: "백엔드", team: "design", status: "live", desc: "DB·API·파이프라인 상태" },
];

export const MENU_BY_KEY = Object.fromEntries(MENUS.map((m) => [m.key, m])) as Record<string, Menu>;
const team = (t: string) => TEAMS.find((x) => x.key === (t === "dev" ? "design" : t));
export const teamLabel = (t: string) => team(t)?.label ?? t;
export const teamShort = (t: string) => team(t)?.short ?? t;
