-- 제휴 앱(웰리케어) → 뷰티웰 자동 로그인용 1회용 입장권
-- 제휴사 서버가 비밀키로 입장권을 발급받고, 앱이 그 주소를 열면 로그인된 상태로 들어온다.
-- 입장권 원본은 저장하지 않고(해시만 저장), 2분 안에 한 번만 쓸 수 있다. 서버 전용 표(정책 없음).
create table if not exists public.partner_login_tickets (
  id bigint generated always as identity primary key,
  partner text not null,
  token_hash text not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists partner_login_tickets_user_idx on public.partner_login_tickets(user_id, created_at desc);
alter table public.partner_login_tickets enable row level security;
