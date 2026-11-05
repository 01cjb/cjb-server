import type { Carrier, ConsentDoc, ConsentState, Contract, Customer, ImportBatch, Order, SalonVerification, Shipment, TaxInvoice } from "./types";

// DB 미연결 시 관리자·마이페이지 화면용 예시 데이터 (실제 고객 정보 아님)
export const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";
const d = (day: number, h = 10) => new Date(Date.UTC(2026, 10, day, h)).toISOString();

export const customers: Customer[] = [
  { id: DEMO_USER_ID, name: "김예시", email: "demo-salon@example.com", phone: "010-0000-0001", grade_id: "salon", role: "customer", status: "active", salon_name: "예시헤어 관악점", company_name: "예시헤어", business_no: "000-00-00001", ceo_name: "김예시", biz_type: "서비스", biz_item: "미용업", biz_address: "서울시 관악구 예시로 1", tax_email: "tax-demo@example.com", marketing_agree: true, created_at: d(1), last_login_at: d(5), order_count: 3, order_total: 512600 },
  { id: "00000000-0000-0000-0000-000000000002", name: "이샘플", email: "sample-vip@example.com", phone: "010-0000-0002", grade_id: "vip", role: "customer", status: "active", salon_name: "샘플살롱", company_name: "샘플살롱", business_no: "000-00-00002", ceo_name: "이샘플", tax_email: "sample-tax@example.com", marketing_agree: false, created_at: d(2), order_count: 2, order_total: 712000 },
  { id: "00000000-0000-0000-0000-000000000003", name: "박테스트", email: "test-general@example.com", phone: "010-0000-0003", grade_id: "general", role: "customer", status: "active", marketing_agree: true, created_at: d(3), order_count: 1, order_total: 32800 },
  { id: "00000000-0000-0000-0000-000000000004", name: "최휴면", email: "dormant@example.com", phone: null, grade_id: "general", role: "customer", status: "dormant", marketing_agree: false, created_at: d(1), order_count: 0, order_total: 0 },
  { id: "00000000-0000-0000-0000-000000000009", name: "관리자", email: "admin@example.com", phone: null, grade_id: "vip", role: "admin", status: "active", marketing_agree: false, created_at: d(1), order_count: 0, order_total: 0 },
];

export const orders: Order[] = [
  { id: 1, order_no: "BW261101-A1B2C3", user_id: DEMO_USER_ID, status: "delivered", subtotal: 359000, shipping_fee: 0, total: 359000, receiver_name: "김예시", receiver_phone: "010-0000-0001", address: "서울시 관악구 예시로 1", invoice_requested: true, created_at: d(1), paid_at: d(1, 11),
    items: [{ id: 1, order_id: 1, product_id: 1, product_name: "[바비리스프로] 건스틸4아티스트 FX8705K 전문가용 헤어클리퍼 + 트리머 세트", unit_price: 359000, qty: 1 }] },
  { id: 2, order_no: "BW261103-D4E5F6", user_id: DEMO_USER_ID, status: "shipped", subtotal: 124000, shipping_fee: 0, total: 124000, receiver_name: "김예시", receiver_phone: "010-0000-0001", address: "서울시 관악구 예시로 1", invoice_requested: true, created_at: d(3), paid_at: d(3, 11),
    items: [{ id: 2, order_id: 2, product_id: 9, product_name: "[폴톤] 리바이탈 클리닉 웨이브 펌제 300ml 세트 (1제+2제), 1BOX", unit_price: 124000, qty: 1 }] },
  { id: 3, order_no: "BW261105-G7H8I9", user_id: DEMO_USER_ID, status: "paid", subtotal: 26600, shipping_fee: 3000, total: 29600, receiver_name: "김예시", receiver_phone: "010-0000-0001", address: "서울시 관악구 예시로 1", invoice_requested: false, created_at: d(5), paid_at: d(5, 11),
    items: [{ id: 3, order_id: 3, product_id: 3, product_name: "[도루코] 안전 면도날 BB20 (20날입)", unit_price: 3900, qty: 2 }, { id: 4, order_id: 3, product_id: 4, product_name: "[그레이거] 클래식 이용도자루 GR-100B 외날용", unit_price: 16000, qty: 1 }, { id: 5, order_id: 3, product_id: 11, product_name: "[그레이거] 다용도 헤어 비닐캡 (50장)", unit_price: 2800, qty: 1 }] },
  { id: 4, order_no: "BW261104-J1K2L3", user_id: "00000000-0000-0000-0000-000000000002", status: "preparing", subtotal: 640000, shipping_fee: 0, total: 640000, receiver_name: "이샘플", receiver_phone: "010-0000-0002", address: "서울시 서초구 샘플로 2", invoice_requested: true, created_at: d(4), paid_at: d(4, 12),
    items: [{ id: 6, order_id: 4, product_id: 16, product_name: "[토야노카지야] 커트 가위 6.0인치", unit_price: 320000, qty: 2 }] },
  { id: 5, order_no: "BW261105-M4N5O6", user_id: "00000000-0000-0000-0000-000000000003", status: "pending", subtotal: 29800, shipping_fee: 3000, total: 32800, receiver_name: "박테스트", receiver_phone: "010-0000-0003", address: "경기도 성남시 테스트로 3", invoice_requested: false, created_at: d(5, 14),
    items: [{ id: 7, order_id: 5, product_id: 2, product_name: "[파나소닉] ER-GM40 완전방수 무빙헤드 전동 눈썹바리깡", unit_price: 29800, qty: 1 }] },
];

export const carriers: Carrier[] = [
  { code: "cj", name: "CJ대한통운", tracking_url: "https://trace.cjlogistics.com/next/tracking.html?wblNo={no}" },
  { code: "hanjin", name: "한진택배", tracking_url: "https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&schLang=KR&wblnumText2={no}" },
  { code: "lotte", name: "롯데택배", tracking_url: "https://www.lotteglogis.com/home/reservation/tracking/linkView?InvNo={no}" },
  { code: "epost", name: "우체국택배", tracking_url: "https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm?sid1={no}" },
  { code: "logen", name: "로젠택배", tracking_url: "https://www.ilogen.com/web/personal/trace/{no}" },
];

export const shipments: Shipment[] = [
  { id: 1, order_id: 1, carrier_code: "cj", tracking_no: "000000000001", status: "delivered", shipped_at: d(1, 15), delivered_at: d(2, 13), created_at: d(1, 12),
    events: [
      { id: 1, shipment_id: 1, status: "picked_up", location: "관악 집배점", description: "집화처리", occurred_at: d(1, 15) },
      { id: 2, shipment_id: 1, status: "in_transit", location: "곤지암 Hub", description: "간선상차", occurred_at: d(1, 22) },
      { id: 3, shipment_id: 1, status: "out_for_delivery", location: "관악 서브", description: "배송출발", occurred_at: d(2, 8) },
      { id: 4, shipment_id: 1, status: "delivered", location: "관악구", description: "배송완료", occurred_at: d(2, 13) },
    ] },
  { id: 2, order_id: 2, carrier_code: "hanjin", tracking_no: "000000000002", status: "in_transit", shipped_at: d(4, 9), created_at: d(3, 16),
    events: [
      { id: 5, shipment_id: 2, status: "picked_up", location: "관악 영업소", description: "집화", occurred_at: d(4, 9) },
      { id: 6, shipment_id: 2, status: "in_transit", location: "대전 HUB", description: "이동중", occurred_at: d(4, 20) },
    ] },
  { id: 3, order_id: 4, carrier_code: null, tracking_no: null, status: "ready", created_at: d(4, 13), events: [] },
];

const supplier = { biz_no: "108-86-15698", company: "(주)씨제이비인터내셔널", ceo: "차진붕", address: "서울특별시 관악구 남부순환로 1873 (봉천동) 2층" };
export const invoices: TaxInvoice[] = [
  { id: 1, order_id: 1, user_id: DEMO_USER_ID, invoice_no: "TI20261101-1", issue_date: "2026-11-01", supplier, buyer_biz_no: "000-00-00001", buyer_company: "예시헤어", buyer_ceo: "김예시", buyer_email: "tax-demo@example.com", supply_amount: 326364, vat_amount: 32636, total_amount: 359000, items: [{ name: "[바비리스프로] 건스틸4아티스트 FX8705K", qty: 1, unit: 359000 }], status: "issued", provider: "mock", nts_confirm_no: "MOCK-20261101-0001", created_at: d(1, 11), issued_at: d(1, 11) },
  { id: 2, order_id: 2, user_id: DEMO_USER_ID, invoice_no: "TI20261103-2", issue_date: "2026-11-03", supplier, buyer_biz_no: "000-00-00001", buyer_company: "예시헤어", buyer_ceo: "김예시", buyer_email: "tax-demo@example.com", supply_amount: 112727, vat_amount: 11273, total_amount: 124000, items: [{ name: "[폴톤] 리바이탈 클리닉 웨이브 펌제 300ml 세트, 1BOX", qty: 1, unit: 124000 }], status: "pending", provider: "mock", created_at: d(3, 11) },
  { id: 3, order_id: 4, user_id: "00000000-0000-0000-0000-000000000002", invoice_no: "TI20261104-4", issue_date: "2026-11-04", supplier, buyer_biz_no: "000-00-00002", buyer_company: "샘플살롱", buyer_ceo: "이샘플", buyer_email: "sample-tax@example.com", supply_amount: 581818, vat_amount: 58182, total_amount: 640000, items: [{ name: "[토야노카지야] 커트 가위 6.0인치", qty: 2, unit: 320000 }], status: "failed", provider: "mock", error: "구매자 사업자번호 확인 필요", created_at: d(4, 12) },
];

export const contracts: Contract[] = [
  { id: 1, contract_no: "CT-2026-001", user_id: DEMO_USER_ID, company_name: "예시헤어", contract_type: "supply", start_date: "2026-11-01", end_date: "2027-10-31", discount_rate: 5, payment_terms: "카드/계좌 선결제", credit_limit: null, status: "active", created_at: d(1) },
  { id: 2, contract_no: "CT-2026-002", user_id: "00000000-0000-0000-0000-000000000002", company_name: "샘플살롱", contract_type: "vip", start_date: "2026-11-01", end_date: "2027-10-31", discount_rate: 10, payment_terms: "월말 마감 익월 10일 현금", credit_limit: 3000000, status: "active", created_at: d(2) },
  { id: 3, contract_no: "CT-2025-014", user_id: null, company_name: "예시 대리점(지방)", contract_type: "agency", start_date: "2025-01-01", end_date: "2025-12-31", discount_rate: 15, payment_terms: "월 2회 정산", credit_limit: 10000000, status: "expired", created_at: d(1) },
];

export const batches: ImportBatch[] = [
  { id: 1, file_name: "상품등록_샘플.xlsx", total_rows: 20, success_rows: 20, error_rows: 0, status: "imported", created_at: d(1, 9) },
];

export const salonRequests: SalonVerification[] = [
  { id: 1, user_id: "00000000-0000-0000-0000-000000000003", salon_name: "테스트미용실", owner_name: "박테스트", business_no: "000-00-00003", phone: "010-0000-0003", status: "pending", created_at: d(5, 15) },
  { id: 2, user_id: DEMO_USER_ID, salon_name: "예시헤어 관악점", owner_name: "김예시", business_no: "000-00-00001", phone: "010-0000-0001", status: "approved", created_at: d(1, 9) },
];

export const consentDocs: ConsentDoc[] = [
  { id: 1, code: "terms", version: "1.0", title: "이용약관 동의", body: "뷰티웰 이용약관 전문 (관리자에서 수정)", required: true, effective_at: "2026-11-01" },
  { id: 2, code: "privacy", version: "1.0", title: "개인정보 수집·이용 동의", body: "수집항목: 이름, 연락처, 이메일, 주소 / 목적: 회원관리, 주문·배송 / 보유기간: 회원 탈퇴 시까지(관계 법령에 따라 보존)", required: true, effective_at: "2026-11-01" },
  { id: 3, code: "age14", version: "1.0", title: "만 14세 이상입니다", body: "만 14세 미만은 가입할 수 없습니다.", required: true, effective_at: "2026-11-01" },
  { id: 4, code: "privacy_third", version: "1.0", title: "개인정보 제3자 제공 동의", body: "제공받는 자: 택배사 / 항목: 이름, 연락처, 주소 / 목적: 상품 배송", required: true, effective_at: "2026-11-01" },
  { id: 5, code: "marketing", version: "1.0", title: "마케팅 정보 수신 동의 (선택)", body: "이벤트·할인·신상품 정보를 이메일/문자/앱푸시로 받습니다. 언제든 철회할 수 있습니다.", required: false, effective_at: "2026-11-01" },
];

export const demoConsents: ConsentState[] = consentDocs.map((c) => ({
  code: c.code, version: c.version, title: c.title, required: c.required, agreed: true,
  channel_email: c.code === "marketing" ? true : null, channel_sms: c.code === "marketing" ? false : null, channel_push: c.code === "marketing" ? true : null,
  created_at: d(1),
}));
