-- =========================================================
-- 관리자 백엔드: 상품취소/대량등록, 고객, 배송추적, 권한/등급,
-- 약관·동의, 계약, 세금계산서
-- =========================================================

-- 0. 관리자 권한 --------------------------------------------------
alter table public.profiles add column if not exists role text not null default 'customer'
  check (role in ('customer','staff','admin'));

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('staff','admin'));
$$;

-- 등급·권한은 관리자/서버만 변경 (기존 가드 확장)
create or replace function public.prevent_grade_change()
returns trigger language plpgsql as $$
begin
  if (new.grade_id is distinct from old.grade_id or new.role is distinct from old.role)
     and coalesce(auth.role(), '') in ('anon', 'authenticated')
     and not public.is_admin() then
    raise exception 'grade_id/role can only be changed by admin';
  end if;
  return new;
end $$;

-- 1. 상품: 등록취소 + 대량등록 --------------------------------------
alter table public.products drop constraint if exists products_status_check;
alter table public.products add constraint products_status_check
  check (status in ('draft','active','soldout','hidden','cancelled'));
alter table public.products add column if not exists sku text unique;
alter table public.products add column if not exists cancelled_at timestamptz;
alter table public.products add column if not exists cancel_reason text;
alter table public.products add column if not exists import_batch_id bigint;
alter table public.products add column if not exists updated_at timestamptz not null default now();

drop policy if exists "public read products" on public.products;
create policy "public read products" on public.products
  for select using (status in ('active','soldout'));
create policy "admin all products" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

-- 상품 상태 변경 이력 (등록/취소/복구/가격변경)
create table if not exists public.product_logs (
  id bigint generated always as identity primary key,
  product_id bigint references public.products(id) on delete cascade,
  action text not null,              -- create | update | cancel | restore | import
  before jsonb, after jsonb,
  actor uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 엑셀 대량등록 배치
create table if not exists public.product_import_batches (
  id bigint generated always as identity primary key,
  file_name text not null,
  total_rows int not null default 0,
  success_rows int not null default 0,
  error_rows int not null default 0,
  status text not null default 'validated' check (status in ('validated','imported','partially_imported','failed','reverted')),
  actor uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create table if not exists public.product_import_rows (
  id bigint generated always as identity primary key,
  batch_id bigint not null references public.product_import_batches(id) on delete cascade,
  row_no int not null,
  data jsonb not null,
  errors text[] not null default '{}',
  product_id bigint references public.products(id) on delete set null
);
alter table public.products drop constraint if exists products_import_batch_fk;
alter table public.products add constraint products_import_batch_fk
  foreign key (import_batch_id) references public.product_import_batches(id) on delete set null;

-- 2. 고객 정보 ----------------------------------------------------
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists birth date;
alter table public.profiles add column if not exists company_name text;     -- 상호
alter table public.profiles add column if not exists ceo_name text;         -- 대표자
alter table public.profiles add column if not exists biz_type text;         -- 업태
alter table public.profiles add column if not exists biz_item text;         -- 종목
alter table public.profiles add column if not exists biz_address text;
alter table public.profiles add column if not exists tax_email text;        -- 계산서 수신 메일
alter table public.profiles add column if not exists memo text;             -- 관리자 메모
alter table public.profiles add column if not exists status text not null default 'active'
  check (status in ('active','dormant','blocked','withdrawn'));
alter table public.profiles add column if not exists last_login_at timestamptz;

create table if not exists public.customer_addresses (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  label text default '기본',
  receiver_name text not null,
  phone text not null,
  zipcode text,
  address1 text not null,
  address2 text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.grade_history (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  from_grade text, to_grade text not null,
  reason text,
  actor uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 3. 배송 추적 ----------------------------------------------------
create table if not exists public.carriers (
  code text primary key,                 -- cj, hanjin, lotte, epost, logen
  name text not null,
  tracking_url text not null             -- {no} 치환
);

create table if not exists public.shipments (
  id bigint generated always as identity primary key,
  order_id bigint not null references public.orders(id) on delete cascade,
  carrier_code text references public.carriers(code),
  tracking_no text,
  status text not null default 'ready'
    check (status in ('ready','picked_up','in_transit','out_for_delivery','delivered','returned','failed')),
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists shipments_order_idx on public.shipments(order_id);
create unique index if not exists shipments_tracking_uq on public.shipments(carrier_code, tracking_no) where tracking_no is not null;

create table if not exists public.shipment_events (
  id bigint generated always as identity primary key,
  shipment_id bigint not null references public.shipments(id) on delete cascade,
  status text not null,
  location text,
  description text,
  occurred_at timestamptz not null default now()
);

-- 주문 상태 이력
create table if not exists public.order_status_logs (
  id bigint generated always as identity primary key,
  order_id bigint not null references public.orders(id) on delete cascade,
  from_status text, to_status text not null,
  memo text,
  actor uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.orders add column if not exists paid_at timestamptz;
alter table public.orders add column if not exists invoice_requested boolean not null default false;

-- 5. 약관 / 개인정보 / 마케팅 동의 -----------------------------------
create table if not exists public.consent_documents (
  id bigint generated always as identity primary key,
  code text not null,                    -- terms | privacy | privacy_third | marketing | age14
  version text not null,
  title text not null,
  body text not null,
  required boolean not null default true,
  effective_at date not null default current_date,
  unique (code, version)
);

create table if not exists public.user_consents (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  document_id bigint not null references public.consent_documents(id),
  agreed boolean not null,
  channel_email boolean,                 -- 마케팅 수신 채널
  channel_sms boolean,
  channel_push boolean,
  ip text, user_agent text,
  created_at timestamptz not null default now()     -- 이력(최신 행이 현재 상태)
);
create index if not exists user_consents_user_idx on public.user_consents(user_id, document_id, created_at desc);

create or replace view public.user_consent_current as
  select distinct on (uc.user_id, d.code) uc.user_id, d.code, d.version, d.required, uc.agreed,
         uc.channel_email, uc.channel_sms, uc.channel_push, uc.created_at
  from public.user_consents uc join public.consent_documents d on d.id = uc.document_id
  order by uc.user_id, d.code, uc.created_at desc;

-- 6. 계약 정보 ----------------------------------------------------
create table if not exists public.contracts (
  id bigint generated always as identity primary key,
  contract_no text unique not null,
  user_id uuid references auth.users(id) on delete set null,
  company_name text not null,
  contract_type text not null default 'supply'
    check (contract_type in ('supply','agency','vip','consignment','etc')),  -- 공급/대리점/VIP/위탁
  start_date date not null,
  end_date date,
  discount_rate numeric(5,2) not null default 0,
  payment_terms text,                    -- 예: 월말 마감 익월 10일 현금
  credit_limit int,                      -- 외상 한도
  status text not null default 'active' check (status in ('draft','active','expired','terminated')),
  file_path text,                        -- storage: contracts/...
  memo text,
  created_at timestamptz not null default now()
);

-- 7. 세금계산서 ---------------------------------------------------
create table if not exists public.tax_invoices (
  id bigint generated always as identity primary key,
  order_id bigint unique references public.orders(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  invoice_no text unique not null,
  issue_date date not null default current_date,
  supplier jsonb not null,               -- 공급자 정보 스냅샷
  buyer_biz_no text not null,
  buyer_company text not null,
  buyer_ceo text,
  buyer_email text,
  supply_amount int not null,            -- 공급가액
  vat_amount int not null,               -- 세액
  total_amount int not null,
  items jsonb not null default '[]',
  status text not null default 'pending' check (status in ('pending','issued','sent','failed','cancelled')),
  provider text default 'mock',          -- popbill | barobill | mock
  nts_confirm_no text,                   -- 국세청 승인번호
  error text,
  created_at timestamptz not null default now(),
  issued_at timestamptz
);

-- RLS -------------------------------------------------------------
alter table public.product_logs enable row level security;
alter table public.product_import_batches enable row level security;
alter table public.product_import_rows enable row level security;
alter table public.customer_addresses enable row level security;
alter table public.grade_history enable row level security;
alter table public.carriers enable row level security;
alter table public.shipments enable row level security;
alter table public.shipment_events enable row level security;
alter table public.order_status_logs enable row level security;
alter table public.consent_documents enable row level security;
alter table public.user_consents enable row level security;
alter table public.contracts enable row level security;
alter table public.tax_invoices enable row level security;

create policy "admin product_logs" on public.product_logs for all using (public.is_admin()) with check (public.is_admin());
create policy "admin import batches" on public.product_import_batches for all using (public.is_admin()) with check (public.is_admin());
create policy "admin import rows" on public.product_import_rows for all using (public.is_admin()) with check (public.is_admin());
create policy "admin grade_history" on public.grade_history for all using (public.is_admin()) with check (public.is_admin());
create policy "admin order logs" on public.order_status_logs for all using (public.is_admin()) with check (public.is_admin());

create policy "public carriers" on public.carriers for select using (true);
create policy "public consent docs" on public.consent_documents for select using (true);

create policy "own addresses" on public.customer_addresses for all using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id or public.is_admin());
create policy "own consents read" on public.user_consents for select using (auth.uid() = user_id or public.is_admin());
create policy "own consents insert" on public.user_consents for insert to authenticated with check (auth.uid() = user_id);
create policy "own shipments" on public.shipments for select
  using (public.is_admin() or exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "admin shipments" on public.shipments for all using (public.is_admin()) with check (public.is_admin());
create policy "own shipment events" on public.shipment_events for select
  using (public.is_admin() or exists (select 1 from public.shipments s join public.orders o on o.id = s.order_id where s.id = shipment_id and o.user_id = auth.uid()));
create policy "admin shipment events" on public.shipment_events for all using (public.is_admin()) with check (public.is_admin());
create policy "own contracts" on public.contracts for select using (auth.uid() = user_id or public.is_admin());
create policy "admin contracts" on public.contracts for all using (public.is_admin()) with check (public.is_admin());
create policy "own invoices" on public.tax_invoices for select using (auth.uid() = user_id or public.is_admin());
create policy "admin invoices" on public.tax_invoices for all using (public.is_admin()) with check (public.is_admin());

-- 관리자 전체 조회 정책 (기존 테이블)
create policy "admin read profiles"  on public.profiles for select using (public.is_admin());
create policy "admin update profiles" on public.profiles for update using (public.is_admin());
create policy "admin orders"      on public.orders for all using (public.is_admin()) with check (public.is_admin());
create policy "admin order items" on public.order_items for all using (public.is_admin()) with check (public.is_admin());
create policy "admin salon verifications" on public.salon_verifications for all using (public.is_admin()) with check (public.is_admin());

-- 자동화 트리거 ----------------------------------------------------
-- (a) 등급 변경 이력
create or replace function public.log_grade_change() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.grade_id is distinct from old.grade_id then
    insert into public.grade_history (user_id, from_grade, to_grade, actor) values (new.id, old.grade_id, new.grade_id, auth.uid());
  end if;
  return new;
end $$;
drop trigger if exists profiles_grade_log on public.profiles;
create trigger profiles_grade_log after update on public.profiles for each row execute function public.log_grade_change();

-- (b) 미용실 인증 승인 → 등급 salon 자동 반영
create or replace function public.apply_salon_approval() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'approved' and old.status <> 'approved' and new.user_id is not null then
    update public.profiles set grade_id = case when grade_id = 'vip' then 'vip' else 'salon' end,
           company_name = coalesce(company_name, new.salon_name), business_no = coalesce(business_no, new.business_no)
     where id = new.user_id;
  end if;
  return new;
end $$;
drop trigger if exists salon_approval on public.salon_verifications;
create trigger salon_approval after update on public.salon_verifications for each row execute function public.apply_salon_approval();

-- (c) 주문 상태 이력 + 결제완료 시 세금계산서 자동 생성(pending)
create or replace function public.on_order_status() returns trigger language plpgsql security definer set search_path = public as $$
declare p public.profiles; supply int;
begin
  if new.status is distinct from old.status then
    insert into public.order_status_logs (order_id, from_status, to_status, actor) values (new.id, old.status, new.status, auth.uid());
    if new.status = 'paid' then new.paid_at := coalesce(new.paid_at, now()); end if;
  end if;
  if new.status = 'paid' and old.status is distinct from 'paid' and new.invoice_requested and new.user_id is not null then
    select * into p from public.profiles where id = new.user_id;
    if p.business_no is not null then
      supply := round(new.total / 1.1);
      insert into public.tax_invoices (order_id, user_id, invoice_no, supplier, buyer_biz_no, buyer_company, buyer_ceo, buyer_email,
                                       supply_amount, vat_amount, total_amount, items)
      values (new.id, new.user_id, 'TI' || to_char(now(),'YYYYMMDD') || '-' || new.id,
              jsonb_build_object('biz_no','108-86-15698','company','(주)씨제이비인터내셔널','ceo','차진붕',
                                 'address','서울특별시 관악구 남부순환로 1873 (봉천동) 2층'),
              p.business_no, coalesce(p.company_name, p.salon_name, p.name), p.ceo_name, coalesce(p.tax_email, p.email),
              supply, new.total - supply, new.total,
              (select coalesce(jsonb_agg(jsonb_build_object('name', product_name, 'qty', qty, 'unit', unit_price)), '[]') from public.order_items where order_id = new.id))
      on conflict (order_id) do nothing;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists orders_status on public.orders;
create trigger orders_status before update on public.orders for each row execute function public.on_order_status();

-- (d) 배송 상태 → 주문 상태 동기화
create or replace function public.on_shipment_status() returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  if new.status in ('picked_up','in_transit','out_for_delivery') and new.shipped_at is null then new.shipped_at := now(); end if;
  if new.status = 'delivered' and new.delivered_at is null then new.delivered_at := now(); end if;
  update public.orders set status = case
      when new.status = 'delivered' then 'delivered'
      when new.status in ('picked_up','in_transit','out_for_delivery') then 'shipped'
      else status end
    where id = new.order_id and status not in ('cancelled');
  insert into public.shipment_events (shipment_id, status, description) values (new.id, new.status, '상태 변경');
  return new;
end $$;
drop trigger if exists shipments_status on public.shipments;
create trigger shipments_status before update of status on public.shipments for each row execute function public.on_shipment_status();

-- 기본 데이터 -----------------------------------------------------
insert into public.carriers (code, name, tracking_url) values
  ('cj', 'CJ대한통운', 'https://trace.cjlogistics.com/next/tracking.html?wblNo={no}'),
  ('hanjin', '한진택배', 'https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&schLang=KR&wblnumText2={no}'),
  ('lotte', '롯데택배', 'https://www.lotteglogis.com/home/reservation/tracking/linkView?InvNo={no}'),
  ('epost', '우체국택배', 'https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm?sid1={no}'),
  ('logen', '로젠택배', 'https://www.ilogen.com/web/personal/trace/{no}')
on conflict (code) do nothing;

insert into public.consent_documents (code, version, title, body, required) values
  ('terms', '1.0', '이용약관 동의', '뷰티웰 이용약관 전문 (관리자에서 수정)', true),
  ('privacy', '1.0', '개인정보 수집·이용 동의', '수집항목: 이름, 연락처, 이메일, 주소 / 목적: 회원관리, 주문·배송 / 보유기간: 회원 탈퇴 시까지(관계 법령에 따라 보존)', true),
  ('age14', '1.0', '만 14세 이상입니다', '만 14세 미만은 가입할 수 없습니다.', true),
  ('privacy_third', '1.0', '개인정보 제3자 제공 동의', '제공받는 자: 택배사 / 항목: 이름, 연락처, 주소 / 목적: 상품 배송', true),
  ('marketing', '1.0', '마케팅 정보 수신 동의 (선택)', '이벤트·할인·신상품 정보를 이메일/문자/앱푸시로 받습니다. 언제든 철회할 수 있습니다.', false)
on conflict (code, version) do nothing;

-- 가입 시 프로필 + 동의 이력 자동 저장 (signUp options.data 에 phone, consents 전달)
--   consents 예: {"terms":true,"privacy":true,"age14":true,"privacy_third":true,"marketing":true,"ch_email":true,"ch_sms":false,"ch_push":false}
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare c jsonb := coalesce(new.raw_user_meta_data->'consents', '{}'::jsonb); d record;
begin
  insert into public.profiles (id, name, phone, email, marketing_agree)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''), new.raw_user_meta_data->>'phone', new.email,
          coalesce((c->>'marketing')::boolean, false))
  on conflict (id) do nothing;
  for d in select distinct on (code) id, code from public.consent_documents order by code, effective_at desc, id desc loop
    if c ? d.code then
      insert into public.user_consents (user_id, document_id, agreed, channel_email, channel_sms, channel_push)
      values (new.id, d.id, (c->>d.code)::boolean,
              case when d.code = 'marketing' then (c->>'ch_email')::boolean end,
              case when d.code = 'marketing' then (c->>'ch_sms')::boolean end,
              case when d.code = 'marketing' then (c->>'ch_push')::boolean end);
    end if;
  end loop;
  return new;
end $$;
