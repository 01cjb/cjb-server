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

-- 연락처로 회원 찾기 (서버 전용). 조회할 번호를 주소(URL)가 아닌 요청 본문으로 보내기 위해 함수로 둔다
-- → 제휴사가 보낸 전화번호가 접속 기록(URL 로그)에 남지 않는다.
create or replace function public.partner_find_member(phones text[])
returns table (id uuid, status text)
language sql stable security definer set search_path = public as $$
  select p.id, p.status from public.profiles p where p.phone = any(phones) limit 3
$$;
revoke all on function public.partner_find_member(text[]) from public, anon, authenticated;
grant execute on function public.partner_find_member(text[]) to service_role;
