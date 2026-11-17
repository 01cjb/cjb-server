import "server-only";
import schema from "./generated/schema.json";
import { company } from "./company";
import { FREE_SHIPPING, SHIPPING_FEE } from "./pricing";
import { LOCK_FAILS, LOCK_MINUTES, TEST, testLoginOn } from "./storeLogin";
import { KAKAO_CHANNEL_NAME, KAKAO_CHANNEL_URL } from "@/components/VipNotice";
import { MENUS, TEAMS } from "./work/menus";
import { CONTRACT_TYPE, GRADE_NAME, INVOICE_STATUS, ORDER_STATUS, PRODUCT_STATUS, SHIP_STATUS } from "./admin/types";
import { listCarriers, listConsentDocs, productStatusCounts } from "./admin/repo";
import { getBrands, getCategories } from "./data";
import { adminEnabled, createServiceClient } from "./auth";

// 뷰티웰 운영규칙 기준문서 (Markdown)
// - DB 구조(마이그레이션) · 프로그램에 들어 있는 기준값 · 지금 DB에 들어 있는 데이터를 읽어서 그때그때 만든다.
// - 그래서 규칙이 바뀌면(코드·DB) 이 문서도 저절로 바뀐다. 손으로 고치지 않는다.

type Schema = { tables: string[]; checks: Record<string, string[]>; triggers: { name: string; when: string; table: string; file: string }[]; migrations: { file: string; date: string; name: string; tables: string[] }[] };
const S = schema as Schema;

const won = (n: number) => n.toLocaleString("ko-KR") + "원";
const table = (head: string[], rows: (string | number)[][]) =>
  [`| ${head.join(" | ")} |`, `| ${head.map(() => "---").join(" | ")} |`, ...rows.map((r) => `| ${r.map((c) => String(c).replace(/\|/g, "\\|")).join(" | ")} |`)].join("\n");

// 상태값 한글 이름 (없는 값은 영문 그대로 나오고 "설명 필요"로 표시 → 새 값이 생겨도 빠지지 않음)
const LABEL: Record<string, Record<string, string>> = {
  "orders.status": ORDER_STATUS,
  "shipments.status": SHIP_STATUS,
  "products.status": PRODUCT_STATUS,
  "tax_invoices.status": INVOICE_STATUS,
  "contracts.contract_type": CONTRACT_TYPE,
  "contracts.status": { draft: "작성중", active: "유효", expired: "만료", terminated: "해지" },
  "salon_verifications.status": { pending: "대기", approved: "승인", rejected: "반려" },
  "profiles.role": { customer: "고객", staff: "직원(관리자 화면 가능)", admin: "관리자(관리자 계정 관리까지)" },
  "profiles.status": { active: "정상", dormant: "휴면", blocked: "이용정지", withdrawn: "탈퇴" },
  "product_import_batches.status": { validated: "검사 완료", imported: "등록 완료", partially_imported: "일부만 등록", failed: "실패", reverted: "등록 취소(되돌림)" },
  "social_accounts.provider": { naver: "네이버", kakao: "카카오" },
  "work_users.team": { dev: "개발(예전 값 · 디자인/마케팅팀으로 통합)", ...Object.fromEntries(TEAMS.map((t) => [t.key, t.label])) },
  "work_users.status": { active: "사용", disabled: "사용 중지" },
};
const TITLE: Record<string, string> = {
  "orders.status": "주문 상태", "shipments.status": "배송 상태", "products.status": "상품 상태", "tax_invoices.status": "세금계산서 상태",
  "contracts.contract_type": "계약 종류", "contracts.status": "계약 상태", "salon_verifications.status": "VIP(미용사) 인증 신청 상태",
  "profiles.role": "계정 권한", "profiles.status": "회원 상태", "product_import_batches.status": "엑셀 대량등록 상태",
  "social_accounts.provider": "간편 로그인 종류", "work_users.team": "업무시스템 팀", "work_users.status": "업무시스템 계정 상태",
};
const values = (key: string) => (S.checks[key] ?? []).map((v) => LABEL[key]?.[v] ? `${LABEL[key][v]}(${v})` : `${v} ⚠️설명 필요`);
// 순서대로 진행되는 값은 →, 취소·반려·실패 같은 예외는 따로 표시
const EXC = new Set(["cancelled", "rejected", "returned", "failed", "reverted"]);
const flow = (key: string) => {
  const all = S.checks[key] ?? []; const name = (v: string) => (LABEL[key]?.[v] ? `${LABEL[key][v]}(${v})` : `${v} ⚠️설명 필요`);
  const main = all.filter((v) => !EXC.has(v)).map(name).join(" → "); const exc = all.filter((v) => EXC.has(v)).map(name).join(", ");
  return exc ? `${main} · 예외: ${exc}` : main;
};

// 자동 처리(트리거) 설명
const TRIGGER: Record<string, string> = {
  on_auth_user_created: "회원가입하면 회원정보(프로필)가 자동으로 만들어진다.",
  profiles_grade_guard: "회원이 자기 등급·권한을 스스로 바꿀 수 없다. (관리자만 변경)",
  profiles_grade_log: "등급이 바뀌면 누가·언제·무엇에서 무엇으로 바꿨는지 이력이 남는다.",
  salon_approval: "VIP(미용사) 인증 신청을 승인하면 해당 회원 등급이 자동으로 VIP가 된다.",
  orders_status: "주문 상태가 바뀌면 이력이 남고, 결제완료가 되면 결제 시각이 기록된다. 세금계산서를 요청한 사업자 회원이면 세금계산서가 '발행대기'로 자동 생성된다.",
  shipments_status: "배송 상태가 바뀌면 배송 이력이 남고, 주문 상태도 맞춰 바뀐다.",
  profiles_login_secret_guard: "회원이 매장코드·PIN 정보를 직접 고칠 수 없다. (서버에서만 변경)",
};
const MIGRATION: Record<string, string> = {
  init: "기본 점검용 표", shop: "쇼핑몰 기본(회원·등급·상품·주문·리뷰)", admin: "관리자(상품 이력·대량등록·배송·약관·계약·세금계산서)",
  grants: "DB 접근 권한 정리", staff: "관리자 계정·권한 변경 이력", social: "네이버·카카오 간편 로그인", work: "CJB 업무시스템(직원 계정·메뉴 권한·접속 기록)",
  channels: "판매 채널 연동(주문 수집)", work_prefs: "업무시스템 개인 설정", logen: "로젠택배 송장", store_login: "매장코드 + PIN 로그인",
};

async function gradesFromDb(): Promise<{ id: string; name: string; discount_rate: number; description: string | null }[] | null> {
  if (!adminEnabled()) return null;
  const { data } = await createServiceClient().from("member_grades").select("id,name,discount_rate,description").order("sort");
  return data ?? null;
}
async function memberCounts(): Promise<Record<string, number> | null> {
  if (!adminEnabled()) return null;
  const { data } = await createServiceClient().from("profiles").select("grade_id");
  if (!data) return null;
  const c: Record<string, number> = {};
  for (const r of data as { grade_id: string }[]) c[r.grade_id] = (c[r.grade_id] ?? 0) + 1;
  return c;
}

export async function buildRulesMd(): Promise<string> {
  const [carriers, consents, pcount, categories, brands, grades, members] = await Promise.all([
    listCarriers(), listConsentDocs(), productStatusCounts(), getCategories(), getBrands(), gradesFromDb(), memberCounts(),
  ]);
  const live = adminEnabled();
  const now = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul", dateStyle: "long", timeStyle: "short" });
  const last = S.migrations[S.migrations.length - 1];
  const liveMenus = MENUS.filter((m) => m.status === "live").length;
  const L: string[] = [];
  const add = (...x: string[]) => L.push(...x, "");

  add(`# 뷰티웰 운영규칙 기준문서`);
  add(`> 이 문서는 **자동으로 만들어집니다.** DB 구조, 프로그램에 설정된 기준값, 지금 DB에 들어 있는 데이터를 읽어서 열 때마다 새로 만들기 때문에, 규칙이 바뀌면 문서도 같이 바뀝니다. 직접 고치지 마세요.`,
    `>`,
    `> - 만든 시각: ${now}`,
    `> - 데이터: ${live ? "실제 DB" : "예시 데이터 (DB 미연결 상태)"}`,
    `> - 마지막 DB 구조 변경: ${last?.date ?? "-"} · ${MIGRATION[last?.name ?? ""] ?? last?.name ?? "-"}`);

  add(`## 1. 회사·고객센터`);
  add(table(["항목", "내용"], [
    ["쇼핑몰", `${company.mall} (${company.mallEn})`], ["상호", company.name], ["대표", company.ceo], ["사업자등록번호", company.bizNo], ["통신판매업", company.mailOrderNo],
    ["주소", company.address], ["전화", company.tel], ["운영시간", company.hours], ["문의 방법", `전화 또는 카카오톡 채널 ‘${KAKAO_CHANNEL_NAME}’ (${KAKAO_CHANNEL_URL}) — 메일 문의는 받지 않음`],
  ]));

  add(`## 2. 회원 등급과 가격 공개`);
  add(`가격은 **서버에서** 보는 사람에 따라 가려서 보냅니다. 볼 수 없는 가격은 화면뿐 아니라 데이터로도 나가지 않습니다.`);
  add(table(["보는 사람", "보이는 가격", "화면 표시"], [
    ["로그인 전", "없음 (기본가·VIP가 모두 비공개, 가격순 정렬도 불가)", "「판매가 회원공개」 · 「로그인하고 가격 보기」"],
    [`${GRADE_NAME.general} (로그인, 미인증)`, "기본가만", "기본가 + 「VIP가 · 미용사 인증 후 공개」"],
    [`${GRADE_NAME.vip} (미용사 인증)`, "VIP가", "VIP가 + 「VIP가 적용」"],
  ]));
  add(`- 등급은 DB에 general / salon / vip 세 가지로 저장되지만, **salon과 vip는 똑같이 VIP로 취급**합니다. (VIP가 적용, VIP 전용 상품 구매 가능)`,
    `- 주문 금액은 항상 서버가 회원 등급을 확인해서 다시 계산합니다. 브라우저가 보낸 등급·가격은 믿지 않습니다.`,
    `- VIP 전용 상품은 ${GRADE_NAME.general}이 주문할 수 없습니다. (장바구니에 담겨 있어도 결제에서 제외·차단)`);
  if (grades) add(`**DB에 등록된 등급**`, "", table(["코드", "이름", "할인율(%)", "설명", "회원 수"], grades.map((g) => [g.id, g.name, g.discount_rate, g.description ?? "", members?.[g.id] ?? 0])));

  add(`## 3. VIP(미용사) 인증`);
  add(`1. 고객이 카카오톡에서 ‘${KAKAO_CHANNEL_NAME}’ 채널을 추가한다. (${KAKAO_CHANNEL_URL})`,
    `2. 채팅으로 미용사 면허증(자격증) 사진을 보낸다. — **사이트에서는 인증을 받지 않음**`,
    `3. 담당자가 확인한 뒤 관리자 화면 → 고객정보에서 회원등급을 VIP로 바꾼다.`,
    `4. 그 회원은 바로 VIP가가 보이고 VIP 전용 상품을 살 수 있다.`);
  add(`- 인증 신청 상태: ${flow("salon_verifications.status")}`, `- 등급을 바꾸면 변경 이력이 자동으로 남습니다.`);

  add(`## 4. 로그인·계정`);
  add(`- **고객 로그인**: 매장코드(숫자 8자리) + 연락처 + PIN(숫자 4~6자리, 발급 시 6자리)`,
    `- 매장코드와 임시 PIN은 관리자 화면 → 고객정보에서 발급합니다. PIN은 암호화해서 저장하며 원래 값은 다시 볼 수 없습니다.`,
    `- **잠금**: 같은 매장코드로 ${LOCK_MINUTES}분 안에 ${LOCK_FAILS}번 틀리면 잠시 로그인이 막힙니다.`,
    `- 간편 로그인: ${values("social_accounts.provider").join(", ") || "-"} · 이메일 로그인도 가능`,
    `- 회원 상태: ${values("profiles.status").join(" / ")}`,
    `- 계정 권한: ${values("profiles.role").join(" / ")}`,
    `- **테스트 로그인 버튼: 현재 ${testLoginOn() ? "켜져 있음 ⚠️ (정식 오픈 전에 Vercel에서 TEST_LOGIN=off 로 꺼야 함)" : "꺼져 있음"}** — 테스트 계정: ${TEST.salon} (매장코드 ${TEST.code})`);

  add(`## 5. 상품`);
  add(`- 상품 상태: ${values("products.status").join(" / ")}`,
    `- 고객에게는 판매중·품절 상품만 보입니다. 숨김·임시저장·등록취소는 보이지 않습니다.`,
    `- 가격은 소비자가 / 기본가(판매가) / VIP가 세 가지이며, VIP가는 기본가보다 클 수 없습니다.`,
    `- 상품을 고치면 변경 이력이 남습니다.`,
    `- 엑셀 대량등록: ${values("product_import_batches.status").join(" / ")} — 잘못 올린 묶음은 통째로 되돌릴 수 있습니다.`);
  add(`**현재 현황**`, "", table(["구분", "수"], [
    ["카테고리", `${categories.length}개 (${categories.map((c) => c.name).join(", ")})`], ["브랜드", `${brands.length}개`],
    ...Object.entries(pcount).filter(([k]) => k !== "all").map(([k, v]) => [`상품 · ${PRODUCT_STATUS[k] ?? k}`, `${v}개`] as [string, string]),
  ]));

  add(`## 6. 주문·결제`);
  add(`- 주문 상태 흐름: ${flow("orders.status")}`,
    `- **배송비 ${won(SHIPPING_FEE)}**, 상품금액 **${won(FREE_SHIPPING)} 이상이면 무료배송**`,
    `- 필수 약관에 동의하지 않은 회원은 주문할 수 없습니다.`,
    `- 주문번호 형식: BW + 날짜(YYMMDD) + 6자리 코드`,
    `- 결제 연동 전이라 새 주문은 「${ORDER_STATUS.pending}」 상태로 들어옵니다. (토스페이먼츠 연동 예정)`,
    `- 주문 상태를 바꾸면 이력이 자동으로 남습니다.`);

  add(`## 7. 배송`);
  add(`- 배송 상태: ${flow("shipments.status")}`, `- 송장을 등록하면 고객 화면에 택배사·송장번호와 배송조회 링크가 보입니다.`);
  add(`**등록된 택배사 (${carriers.length}곳)**`, "", table(["코드", "택배사"], carriers.map((c) => [c.code, c.name])));

  add(`## 8. 세금계산서`);
  add(`- 주문할 때 세금계산서를 요청했고 사업자등록번호가 있는 회원이면, **결제완료가 되는 순간 자동으로 「발행대기」 세금계산서가 만들어집니다.**`,
    `- 공급가액 = 결제금액 ÷ 1.1 (반올림), 부가세 = 결제금액 − 공급가액`,
    `- 상태: ${values("tax_invoices.status").join(" / ")}`,
    `- 고객은 마이페이지 → 세금계산서에서 발행 내역을 봅니다.`);

  add(`## 9. 계약`);
  add(`- 계약 종류: ${values("contracts.contract_type").join(" / ")}`, `- 계약 상태: ${values("contracts.status").join(" / ")}`);

  add(`## 10. 약관·동의`);
  add(table(["약관", "버전", "필수 여부"], consents.map((d) => [d.title, d.version, d.required ? "필수" : "선택"])));
  add(`- 필수 약관에 모두 동의해야 가입·주문할 수 있습니다. 동의 기록은 회원별로 저장됩니다.`);

  add(`## 11. 관리자·업무시스템`);
  add(`- 관리자 화면(/admin): 권한이 직원 또는 관리자인 계정만 들어갈 수 있습니다. 권한 변경은 이력이 남습니다.`,
    `- 업무시스템(/work): 직원 계정으로 로그인하며, 계정마다 볼 수 있는 메뉴를 따로 정합니다. 접속 기록이 남습니다.`,
    `- 팀: ${TEAMS.map((t) => t.label).join(" / ")}`,
    `- 업무 메뉴 ${MENUS.length}개 중 **${liveMenus}개 사용 중**, ${MENUS.length - liveMenus}개 준비 중`);
  add(table(["팀", "메뉴", "상태"], MENUS.map((m) => [TEAMS.find((t) => t.key === m.team)?.short ?? m.team, m.label, m.status === "live" ? "사용 중" : "준비 중"])));

  add(`## 12. 혜택 (화면 안내 문구 기준)`);
  add(`- 신규 회원 가입 쿠폰 2,000원`, `- 구매 금액의 1% 적립`, `- ⚠️ 쿠폰함·적립금 내역 기능은 아직 준비 중입니다. (안내 문구만 있음)`);

  add(`## 13. 자동으로 처리되는 일`);
  add(...S.triggers.map((t) => `- ${TRIGGER[t.name] ?? `${t.table} 표에서 자동 처리 (${t.name}) ⚠️설명 필요`}`));

  add(`## 14. 상태값 전체표`);
  add(table(["구분", "값"], Object.keys(S.checks).map((k) => [TITLE[k] ?? `${k} ⚠️설명 필요`, values(k).join(", ")])));

  add(`## 15. 변경 이력 (DB 구조)`);
  add(table(["날짜", "내용", "새로 생긴 표"], [...S.migrations].reverse().map((m) => [m.date, MIGRATION[m.name] ?? `${m.name} ⚠️설명 필요`, m.tables.length ? `${m.tables.length}개` : "-"])));
  add(`---`, `DB 표 ${S.tables.length}개 · 상태값 ${Object.keys(S.checks).length}종 · 자동 처리 ${S.triggers.length}개 기준으로 작성됨.`);
  return L.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}
