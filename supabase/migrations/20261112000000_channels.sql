-- 외부 판매채널(카페24 등) 주문 수집
-- 서버(service role) 전용. RLS 켜고 정책 없음 = 브라우저 접근 차단

-- 채널 연결 정보 (OAuth 토큰). 카페24 refresh token은 1회용이라 갱신 시 반드시 저장
create table if not exists public.channel_connections (
  channel             text primary key,               -- 'cafe24'
  mall_id             text not null,
  access_token        text,
  access_expires_at   timestamptz,
  refresh_token       text,
  refresh_expires_at  timestamptz,
  scopes              text[],
  refreshing_until    timestamptz,                    -- 동시 갱신 방지 잠금
  connected_by        uuid references public.work_users(id) on delete set null,
  connected_at        timestamptz,
  last_sync_at        timestamptz,
  last_sync_ok        boolean,
  last_sync_count     int,
  last_error          text,
  updated_at          timestamptz not null default now()
);

-- 채널 주문 (채널+주문번호 기준으로 덮어쓰기)
create table if not exists public.channel_orders (
  id                 bigint generated always as identity primary key,
  channel            text not null,
  external_order_id  text not null,
  shop_no            int,                             -- 카페24 멀티쇼핑몰 번호 (뷰티웰 = 5)
  order_place        text,                            -- 카페24 주문경로 (PC/모바일/네이버페이 등)
  ordered_at         timestamptz,
  paid_at            timestamptz,
  paid               boolean,
  canceled           boolean,
  status             text not null,                   -- 통합 상태: pending/paid/preparing/shipped/delivered/cancelled/returned/exchanged
  status_code        text,                            -- 채널 원래 상태코드 (카페24 N00 등)
  buyer_name         text,
  buyer_phone        text,
  buyer_email        text,
  member_id          text,
  receiver_name      text,
  receiver_phone     text,
  zipcode            text,
  address            text,
  shipping_message   text,
  total_amount       numeric(14,2),
  shipping_fee       numeric(14,2),
  items              jsonb not null default '[]'::jsonb,  -- [{name, option, qty, price, status_code, status_text, carrier, tracking_no}]
  raw                jsonb,
  synced_at          timestamptz not null default now(),
  created_at         timestamptz not null default now(),
  unique (channel, external_order_id)
);
create index if not exists channel_orders_ordered_idx on public.channel_orders (ordered_at desc);
create index if not exists channel_orders_status_idx on public.channel_orders (channel, status);

alter table public.channel_connections enable row level security;
alter table public.channel_orders      enable row level security;
revoke all on public.channel_connections, public.channel_orders from anon, authenticated;
grant all on public.channel_connections, public.channel_orders to service_role;
grant usage, select on all sequences in schema public to service_role;
