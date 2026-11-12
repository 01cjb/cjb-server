// 사내 업무 시스템 메뉴 목록 — 개인별 권한은 이 key로 체크합니다 (work_user_menus.menu_key)
// status: live = 데이터 연결됨 / soon = 화면만 준비 (외부 데이터 연동 예정)

export type TeamKey = "mgmt" | "sales" | "design" | "logistics" | "dev";
export type Menu = { key: string; label: string; team: TeamKey; status: "live" | "soon"; desc: string; source?: string };

export const TEAMS: { key: TeamKey; label: string; short: string }[] = [
  { key: "mgmt", label: "경영 / 경영지원팀", short: "경영지원" },
  { key: "sales", label: "영업 / 영업지원팀", short: "영업" },
  { key: "design", label: "디자인 / 마케팅팀", short: "디자인·마케팅" },
  { key: "logistics", label: "물류 / 물류지원팀", short: "물류" },
  { key: "dev", label: "프론트엔드 / 백엔드", short: "개발" },
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
  // 영업 / 영업지원
  { key: "clients", label: "고객사 관리", team: "sales", status: "live", desc: "회원·사업자 정보·계약" },
  // 디자인 / 마케팅
  { key: "store", label: "온라인 스토어 관리", team: "design", status: "live", desc: "상품 판매 상태·가격" },
  { key: "design", label: "디자인 관리", team: "design", status: "soon", desc: "배너·상세페이지·이미지 자산" },
  { key: "marketing", label: "마케팅 관리", team: "design", status: "soon", desc: "프로모션·수신동의·캠페인" },
  // 물류 / 물류지원 — 사방넷 연동 예정
  { key: "inventory", label: "재고", team: "logistics", status: "live", desc: "상품별 재고 수량", source: "사방넷 연동 예정" },
  { key: "orders", label: "주문", team: "logistics", status: "live", desc: "뷰티웰·카페24 주문 통합 현황" },
  { key: "shipping", label: "배송", team: "logistics", status: "live", desc: "배송 진행 상태", source: "사방넷 연동 예정" },
  { key: "waybill", label: "송장", team: "logistics", status: "live", desc: "택배사·송장번호", source: "사방넷 연동 예정" },
  { key: "channels", label: "판매채널 연동", team: "logistics", status: "live", desc: "카페24 등 외부 쇼핑몰 주문 수집" },
  // 프론트엔드 / 백엔드
  { key: "frontend", label: "프론트엔드", team: "dev", status: "live", desc: "화면·배포 상태" },
  { key: "backend", label: "백엔드", team: "dev", status: "live", desc: "DB·API·파이프라인 상태" },
];

export const MENU_BY_KEY = Object.fromEntries(MENUS.map((m) => [m.key, m])) as Record<string, Menu>;
export const teamLabel = (t: string) => TEAMS.find((x) => x.key === t)?.label ?? t;
export const teamShort = (t: string) => TEAMS.find((x) => x.key === t)?.short ?? t;
