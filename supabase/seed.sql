-- 자동 생성: scripts/gen-seed.mjs (lib/mock.ts 기반)
insert into public.health_check (note) values ('hello from seed');

insert into public.member_grades (id, name, discount_rate, description, sort) values
  ('general','일반회원',0,'판매가 적용',1),
  ('salon','미용실회원',0,'미용실회원가 적용 (사업자 인증)',2),
  ('vip','VIP',0,'미용실회원가 + VIP 전용관',3)
on conflict (id) do nothing;

insert into public.categories (id, slug, name, icon, sort) overriding system value values
  (1, 'perm-color', '펌제/염색제', '🧪', 1),
  (2, 'exam', '국가고시용', '📝', 2),
  (3, 'appliance', '이·미용가전', '💨', 3),
  (4, 'goods', '이·미용잡화', '🧰', 4),
  (5, 'scissors', '미용가위', '✂️', 5),
  (6, 'haircare', '헤어케어/스타일링', '💆', 6),
  (7, 'skincare', '스킨케어', '🧴', 7),
  (8, 'living', '생활/건강', '🌿', 8)
on conflict (id) do nothing;

insert into public.brands (id, slug, name, sort) overriding system value values
  (1, 'b1', '그레이거', 1),
  (2, 'b2', '로레알 프로페셔널', 2),
  (3, 'b3', '밀본', 3),
  (4, 'b4', '바비리스 프로', 4),
  (5, 'b5', '시세이도', 5),
  (6, 'b6', '파나소닉', 6),
  (7, 'b7', '필립스', 7),
  (8, 'b8', '폴톤', 8),
  (9, 'b9', '코메트', 9),
  (10, 'b10', '핫툴스', 10),
  (11, 'b11', '토야노카지야', 11),
  (12, 'b12', '퓨어라벨', 12),
  (13, 'b13', '도루코', 13),
  (14, 'b14', '더비', 14),
  (15, 'b15', '에이스바이옴', 15),
  (16, 'b16', '휴브론', 16)
on conflict (id) do nothing;

insert into public.products (id, name, brand_id, category_id, model_no, summary, consumer_price, price, salon_price, stock, badges, is_best, is_new, is_timesale, vip_only, status, created_at) overriding system value values
  (1, '[바비리스프로] 건스틸4아티스트 FX8705K 전문가용 헤어클리퍼 + 트리머 세트', 4, 3, 'FX8705K', null, 459000, 389000, 359000, 50, '{}', true, false, false, false, 'active', '2026-10-01T00:00:00.000Z'),
  (2, '[파나소닉] ER-GM40 완전방수 무빙헤드 전동 눈썹바리깡', 6, 3, 'ER-GM40', null, 39000, 29800, 26800, 50, '{}', true, false, false, false, 'active', '2026-10-02T00:00:00.000Z'),
  (3, '[도루코] 안전 면도날 BB20 (20날입)', 13, 4, null, null, 6000, 4500, 3900, 50, '{}', true, false, false, false, 'active', '2026-10-03T00:00:00.000Z'),
  (4, '[그레이거] 클래식 이용도자루 GR-100B 외날용', 1, 4, 'GR-100B', '이용원 전문가용 클래식 도자루', 25000, 18000, 16000, 50, '{}', true, false, false, false, 'active', '2026-10-04T00:00:00.000Z'),
  (5, '[DERBY] 더비 엑스트라 클래식 면도기 양면날 100PCS', 14, 4, null, null, 22000, 15900, 14000, 50, '{}', true, false, false, false, 'active', '2026-10-05T00:00:00.000Z'),
  (6, '[코메트] 오픈형 클리퍼 바리깡 CO-202, 네이비', 9, 3, 'CO-202', null, 89000, 69000, 62000, 50, '{}', false, true, false, false, 'active', '2026-10-06T00:00:00.000Z'),
  (7, '[코메트] 오픈형 클리퍼 바리깡 CO-202, 메탈실버', 9, 3, 'CO-202', null, 89000, 69000, 62000, 50, '{}', false, true, false, false, 'active', '2026-10-07T00:00:00.000Z'),
  (8, '[에이스바이옴] 아나파랙틴 패치', 15, 7, null, null, 32000, 24000, 21000, 50, '{}', false, true, false, false, 'active', '2026-10-08T00:00:00.000Z'),
  (9, '[폴톤] 리바이탈 클리닉 웨이브 펌제 300ml 세트 (1제+2제), 1BOX', 8, 1, null, null, 180000, 138000, 124000, 50, '{}', false, true, false, false, 'active', '2026-10-09T00:00:00.000Z'),
  (10, '[폴톤] 리바이탈 클리닉 웨이브 펌제 300ml 세트 (1제+2제)', 8, 1, null, null, 15000, 11500, 10300, 50, '{}', false, true, false, false, 'active', '2026-10-10T00:00:00.000Z'),
  (11, '[그레이거] 다용도 헤어 비닐캡 (50장)', 1, 4, null, null, 5000, 3500, 2900, 50, '{}', false, false, true, false, 'active', '2026-10-11T00:00:00.000Z'),
  (12, '[로레알] 세리 엑스퍼트 리스 언리미티드 샴푸 500ml', 2, 6, null, '모발·두피 타입별 헤어케어 토탈 솔루션', 42000, 33000, 29700, 50, '{}', true, false, false, false, 'active', '2026-10-12T00:00:00.000Z'),
  (13, '[로레알] 세리 엑스퍼트 프로롱거 마스크 250ml', 2, 6, null, null, 46000, 36000, 32400, 50, '{}', false, false, true, false, 'active', '2026-10-13T00:00:00.000Z'),
  (14, '[밀본] 올디브 염모제 80g', 3, 1, null, null, 12000, 9500, 8500, 50, '{}', false, false, false, false, 'active', '2026-10-14T00:00:00.000Z'),
  (15, '[시세이도] 서브리믹 아데노바이탈 샴푸 250ml', 5, 6, null, null, 38000, 30000, 27000, 50, '{}', false, false, false, false, 'active', '2026-10-15T00:00:00.000Z'),
  (16, '[토야노카지야] 커트 가위 6.0인치', 11, 5, null, null, 420000, 350000, 320000, 50, '{}', false, false, false, true, 'active', '2026-10-16T00:00:00.000Z'),
  (17, '[핫툴스] 프로페셔널 24K 골드 아이롱 32mm', 10, 3, null, null, 99000, 79000, 71000, 50, '{}', false, false, true, false, 'active', '2026-10-17T00:00:00.000Z'),
  (18, '[필립스] 프로페셔널 헤어드라이어 2300W', 7, 3, null, null, 129000, 98000, 89000, 50, '{}', false, false, false, false, 'active', '2026-10-18T00:00:00.000Z'),
  (19, '[그레이거] 국가고시용 커트 연습모 (마네킹)', 1, 2, null, null, 28000, 21000, 19000, 50, '{}', true, false, false, false, 'active', '2026-10-19T00:00:00.000Z'),
  (20, '[퓨어라벨] 데일리 핸드 앤 바디 로션 500ml', 12, 8, null, null, 19000, 13900, 12500, 50, '{}', false, false, false, false, 'active', '2026-10-20T00:00:00.000Z')
on conflict (id) do nothing;

insert into public.banners (id, title, subtitle, link, bg_color, sort) overriding system value values
  (1, 'SERIE EXPERT 3 TYPE', '로레알 프로페셔널 · 모발·두피 타입별 헤어케어 토탈 솔루션', '/category/haircare', '#f9d5e5', 1),
  (2, '신규 회원 2,000원 쿠폰', '가입 즉시 지급 · 미용실회원 인증 시 회원가 적용', '/login', '#e9d5ff', 2),
  (3, '이·미용가전 기획전', '바비리스 프로 · 파나소닉 · 코메트 전문가용 클리퍼', '/category/appliance', '#dbeafe', 3),
  (4, '★ VIP 전용관 ★', 'VIP 회원만을 위한 특별가 상품', '/category/vip', '#fde68a', 4)
on conflict (id) do nothing;

select setval(pg_get_serial_sequence('public.categories','id'), (select max(id) from public.categories));
select setval(pg_get_serial_sequence('public.brands','id'), (select max(id) from public.brands));
select setval(pg_get_serial_sequence('public.products','id'), (select max(id) from public.products));
select setval(pg_get_serial_sequence('public.banners','id'), (select max(id) from public.banners));
