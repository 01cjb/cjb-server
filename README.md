# 뷰티웰 (CJB Server) — 하이브리드 웹/앱 쇼핑몰

- **이전 대상:** https://www.icjb.com (Cafe24 뷰티웰)
- **레이아웃 참고:** hairnmi.co.kr (상단 검색 + 카테고리 모아보기 + 배너 + 섹션형 상품)
- **스택:** Next.js 15 + Tailwind 4 (Vercel) · Supabase (cjb Project, 서울) · PWA + Capacitor(앱)

## 지금 상태
- **목업 모드:** Supabase 키가 없으면 `lib/mock.ts` 데이터로 전체 화면이 동작합니다.
- **DB 모드:** `.env.local`에 Supabase 키를 넣으면 같은 화면이 실제 DB를 읽습니다. (`lib/data.ts`가 자동으로 바꿔 줌)

## 화면 (app/)
| 경로 | 내용 |
|---|---|
| `/` | 홈: 메인 배너, 카테고리 모아보기, 금주 BEST, 반짝할인, NEW, 브랜드관 |
| `/category/[slug]` | 카테고리 + best / new / timesale / vip / all, 정렬 |
| `/product/[id]` | 상품상세: 회원등급별 가격, 수량, 장바구니/바로구매, 관련상품 |
| `/cart` → `/checkout` | 장바구니 → 주문 (가격은 서버에서 다시 계산) |
| `/wishlist`, `/search`, `/brands`, `/categories` | 찜, 검색, 브랜드관, 전체 카테고리(앱 탭) |
| `/login`, `/mypage` | Supabase 이메일 로그인/가입, 마이페이지 (목업 등급 미리보기) |
| `/salon-member` | 미용실회원 인증 신청 → 관리자 승인 시 미용실회원가 적용 |

## 백엔드 (app/api/, supabase/)
| API | 기능 |
|---|---|
| `GET /api/products` | 목록 (category, brand, q, flag, sort, limit, ids) |
| `GET /api/products/[id]` | 상세 |
| `GET /api/categories` | 카테고리 + 브랜드 |
| `POST /api/cart/quote` | 서버 기준 금액·배송비 계산 |
| `POST /api/orders` | 주문 생성 (orders / order_items, 결제 연동 전 pending) |
| `POST /api/salon-verification` | 미용실회원 인증 신청 |
| `POST /api/ai/claude`, `/api/ai/gemini` | AI 호출 (상품설명 자동생성 등에 활용) |
| `GET /api/health` | 환경변수·DB 연결 점검 |

**DB 테이블** (`supabase/migrations/20261105010000_shop.sql`):
member_grades, profiles(가입 시 자동 생성, 등급은 관리자만 변경), salon_verifications,
categories, brands, products(소비자가/판매가/미용실회원가), banners, notices,
cart_items, wishlists, orders, order_items, reviews — 전부 RLS 적용.

## 설치 & 실행 (Windows)
```
npm install
copy .env.example .env.local     (Supabase 키 입력)
npm run dev                      → http://localhost:3000
```

## Supabase에 스키마·초기데이터 올리기
```
npx supabase login
npm run db:link                  (cjb Project, DB 비밀번호 입력)
npm run db:push                  (migrations 적용)
npm run db:seed                  (lib/mock.ts → supabase/seed.sql 생성)
```
seed.sql은 Supabase → SQL Editor에 붙여넣어 실행하면 됩니다.

## 하이브리드 앱
- **웹앱(PWA):** `app/manifest.ts` + `public/sw.js` → 휴대폰에서 "홈 화면에 추가"하면 앱처럼 실행
- **스토어 앱(Capacitor):** `capacitor.config.json`의 `server.url`을 Vercel 주소로 바꾼 뒤
  ```
  npm run app:add:android        (Android Studio 필요)
  npm run app:add:ios            (Mac + Xcode 필요)
  npm run app:sync
  npm run app:android
  ```
- 모바일 하단 탭바(홈/카테고리/검색/찜/마이) 내장

## 다음 단계
1. 결제(PG): 토스페이먼츠 등 → `/checkout`에 연결
2. 관리자 화면: 상품 등록, 주문 관리, 미용실 인증 승인
3. Cafe24 상품 데이터 옮기기: 상품 CSV 내보내기 → products로 가져오기
4. 상품 이미지: Supabase Storage → `thumbnail_url`
5. 카카오/네이버 로그인: Supabase Auth Provider 설정
