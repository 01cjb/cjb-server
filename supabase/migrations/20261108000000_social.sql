-- =========================================================
-- 소셜 로그인(네이버·카카오) 계정 연결
--  · 네이버는 Supabase 기본 제공이 아니어서 서버(/auth/naver)가 직접 처리
--  · 네이버 회원 고유번호(provider_uid) ↔ 뷰티웰 회원(user_id) 연결표
-- =========================================================
create table if not exists public.social_accounts (
  provider text not null check (provider in ('naver', 'kakao')),
  provider_uid text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now(),
  last_login_at timestamptz,
  primary key (provider, provider_uid)
);
create index if not exists social_accounts_user_idx on public.social_accounts(user_id);

alter table public.social_accounts enable row level security;
drop policy if exists "own social accounts read" on public.social_accounts;
create policy "own social accounts read" on public.social_accounts
  for select using (auth.uid() = user_id or public.is_admin());

-- 쓰기는 서버(service role)만
revoke insert, update, delete on public.social_accounts from anon, authenticated;
grant select on public.social_accounts to authenticated;
grant all on public.social_accounts to service_role;
