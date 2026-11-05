-- =========================================================
-- 뷰티웰(CJB) 쇼핑몰 스키마 — 카탈로그 / 회원등급 / 주문
-- =========================================================

-- 회원 등급 ---------------------------------------------------
create table if not exists public.member_grades (
  id text primary key,                 -- general | salon | vip
  name text not null,
  discount_rate numeric(5,2) not null default 0,
  description text,
  sort int not null default 0
);

-- 회원 프로필 (auth.users 1:1) ---------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  phone text,
  grade_id text not null default 'general' references public.member_grades(id),
  salon_name text,
  business_no text,
  marketing_agree boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name) values (new.id, coalesce(new.raw_user_meta_data->>'name', ''))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- 미용실 회원 인증 신청 -----------------------------------------
create table if not exists public.salon_verifications (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  salon_name text not null,
  owner_name text not null,
  business_no text not null,
  phone text not null,
  license_path text,                    -- storage: salon-docs/...
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  memo text,
  created_at timestamptz not null default now()
);

-- 카탈로그 ----------------------------------------------------
create table if not exists public.categories (
  id bigint generated always as identity primary key,
  slug text unique not null,
  name text not null,
  parent_id bigint references public.categories(id) on delete cascade,
  icon text,
  sort int not null default 0
);

create table if not exists public.brands (
  id bigint generated always as identity primary key,
  slug text unique not null,
  name text not null,
  logo_url text,
  sort int not null default 0
);

create table if not exists public.products (
  id bigint generated always as identity primary key,
  name text not null,
  brand_id bigint references public.brands(id) on delete set null,
  category_id bigint references public.categories(id) on delete set null,
  model_no text,
  summary text,
  description text,
  consumer_price int,                  -- 소비자가
  price int not null,                  -- 판매가 (일반회원)
  salon_price int,                     -- 미용실회원가
  stock int not null default 0,
  thumbnail_url text,
  images text[] not null default '{}',
  badges text[] not null default '{}', -- e.g. {'BEST','NEW','SALE'}
  is_best boolean not null default false,
  is_new boolean not null default false,
  is_timesale boolean not null default false,
  vip_only boolean not null default false,
  status text not null default 'active' check (status in ('active','soldout','hidden')),
  created_at timestamptz not null default now()
);
create index if not exists products_category_idx on public.products(category_id);
create index if not exists products_brand_idx on public.products(brand_id);

create table if not exists public.banners (
  id bigint generated always as identity primary key,
  title text not null,
  subtitle text,
  image_url text,
  link text,
  bg_color text default '#f3e8ff',
  sort int not null default 0,
  active boolean not null default true
);

create table if not exists public.notices (
  id bigint generated always as identity primary key,
  title text not null,
  body text,
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);

-- 회원 활동 ---------------------------------------------------
create table if not exists public.cart_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id bigint not null references public.products(id) on delete cascade,
  qty int not null default 1 check (qty > 0),
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table if not exists public.wishlists (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id bigint not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table if not exists public.orders (
  id bigint generated always as identity primary key,
  order_no text unique not null,
  user_id uuid references auth.users(id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending','paid','preparing','shipped','delivered','cancelled')),
  subtotal int not null,
  shipping_fee int not null default 0,
  total int not null,
  receiver_name text not null,
  receiver_phone text not null,
  address text not null,
  memo text,
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id bigint generated always as identity primary key,
  order_id bigint not null references public.orders(id) on delete cascade,
  product_id bigint references public.products(id) on delete set null,
  product_name text not null,
  unit_price int not null,
  qty int not null
);

create table if not exists public.reviews (
  id bigint generated always as identity primary key,
  product_id bigint not null references public.products(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  rating int not null check (rating between 1 and 5),
  content text not null,
  created_at timestamptz not null default now()
);

-- RLS ---------------------------------------------------------
alter table public.member_grades enable row level security;
alter table public.profiles enable row level security;
alter table public.salon_verifications enable row level security;
alter table public.categories enable row level security;
alter table public.brands enable row level security;
alter table public.products enable row level security;
alter table public.banners enable row level security;
alter table public.notices enable row level security;
alter table public.cart_items enable row level security;
alter table public.wishlists enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.reviews enable row level security;

-- 공개 읽기 (카탈로그)
create policy "public read grades"     on public.member_grades for select using (true);
create policy "public read categories" on public.categories    for select using (true);
create policy "public read brands"     on public.brands        for select using (true);
create policy "public read products"   on public.products      for select using (status <> 'hidden');
create policy "public read banners"    on public.banners       for select using (active);
create policy "public read notices"    on public.notices       for select using (true);
create policy "public read reviews"    on public.reviews       for select using (true);

-- 본인 데이터
create policy "own profile read"   on public.profiles for select using (auth.uid() = id);
create policy "own profile update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- 회원 본인은 등급(grade_id)을 바꿀 수 없음 — 관리자(service role)만 변경
create or replace function public.prevent_grade_change()
returns trigger language plpgsql as $$
begin
  if new.grade_id is distinct from old.grade_id
     and coalesce(auth.role(), '') in ('anon', 'authenticated') then
    raise exception 'grade_id can only be changed by admin';
  end if;
  return new;
end $$;
drop trigger if exists profiles_grade_guard on public.profiles;
create trigger profiles_grade_guard before update on public.profiles
  for each row execute function public.prevent_grade_change();

create policy "own cart"     on public.cart_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own wishlist" on public.wishlists  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own orders read" on public.orders for select using (auth.uid() = user_id);
create policy "own order items read" on public.order_items for select
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "own review write" on public.reviews for insert to authenticated with check (auth.uid() = user_id);
create policy "own salon verification read" on public.salon_verifications for select using (auth.uid() = user_id);
-- 주문 생성·인증 신청 저장은 서버(API, service role)에서만 수행
