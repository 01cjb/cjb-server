-- 원장님 로그인: 매장 코드(8자리) + 가입 연락처 + PIN(4~6자리)
-- 매장 코드·임시 PIN은 관리자가 발급, PIN은 해시로만 저장
alter table public.profiles add column if not exists store_code text unique;
alter table public.profiles add column if not exists pin_hash text;
alter table public.profiles add column if not exists pin_temp boolean not null default false;
alter table public.profiles add column if not exists pin_set_at timestamptz;

-- 매장 코드·PIN은 서버(서비스 키)만 바꿀 수 있음
create or replace function public.prevent_login_secret_change()
returns trigger language plpgsql as $$
begin
  if (new.store_code is distinct from old.store_code
      or new.pin_hash is distinct from old.pin_hash
      or new.pin_temp is distinct from old.pin_temp)
     and coalesce(auth.role(), '') in ('anon', 'authenticated') then
    raise exception 'store_code/pin can only be changed by server';
  end if;
  return new;
end $$;
drop trigger if exists profiles_login_secret_guard on public.profiles;
create trigger profiles_login_secret_guard before update on public.profiles
  for each row execute function public.prevent_login_secret_change();

-- 로그인 시도 기록 (틀린 PIN 연속 시도 차단용, 서버 전용)
create table if not exists public.store_login_attempts (
  id bigint generated always as identity primary key,
  store_code text not null,
  ok boolean not null,
  ip text,
  created_at timestamptz not null default now()
);
create index if not exists store_login_attempts_code_idx on public.store_login_attempts(store_code, created_at desc);
alter table public.store_login_attempts enable row level security;
