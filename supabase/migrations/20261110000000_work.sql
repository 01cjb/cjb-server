-- 사내 업무 시스템 (/work): 직원 계정(이름·연락처·PIN), 개인별 메뉴 권한, 세션, 로그
-- 모든 테이블은 서버(service role)에서만 접근. RLS 켜고 정책 없음 = 브라우저(anon) 접근 차단.

create table if not exists public.work_users (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  phone         text unique,                      -- 숫자만 저장 (01012345678), 미등록 가능
  team          text not null default 'mgmt' check (team in ('mgmt','sales','design','logistics','dev')),
  position      text,                             -- 직책 (대표, 팀장, 사원 …)
  is_owner      boolean not null default false,   -- 대표: 모든 메뉴 + 사용자 관리
  pin_hash      text,                             -- scrypt$salt$hash
  pin_set_at    timestamptz,
  failed_count  int not null default 0,
  locked_until  timestamptz,
  status        text not null default 'active' check (status in ('active','disabled')),
  memo          text,
  last_login_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists work_users_name_idx on public.work_users (name);

-- 개인별 메뉴 체크 (메뉴 목록은 코드 lib/work/menus.ts 에서 관리)
create table if not exists public.work_user_menus (
  user_id    uuid not null references public.work_users(id) on delete cascade,
  menu_key   text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, menu_key)
);

-- 로그인 세션 (쿠키에는 랜덤 토큰, DB에는 sha256 해시만 저장)
create table if not exists public.work_sessions (
  token_hash  text primary key,
  user_id     uuid not null references public.work_users(id) on delete cascade,
  expires_at  timestamptz not null,
  ip          text,
  user_agent  text,
  created_at  timestamptz not null default now()
);
create index if not exists work_sessions_user_idx on public.work_sessions (user_id);

-- 로그인 시도 기록
create table if not exists public.work_login_logs (
  id         bigint generated always as identity primary key,
  user_id    uuid references public.work_users(id) on delete set null,
  name       text,
  phone      text,
  ok         boolean not null,
  reason     text,
  ip         text,
  created_at timestamptz not null default now()
);

-- 관리 작업 기록 (직원 등록·PIN 발급·권한 변경 등)
create table if not exists public.work_audit (
  id         bigint generated always as identity primary key,
  actor_id   uuid references public.work_users(id) on delete set null,
  action     text not null,
  target_id  uuid references public.work_users(id) on delete set null,
  detail     jsonb,
  created_at timestamptz not null default now()
);

alter table public.work_users      enable row level security;
alter table public.work_user_menus enable row level security;
alter table public.work_sessions   enable row level security;
alter table public.work_login_logs enable row level security;
alter table public.work_audit      enable row level security;

revoke all on public.work_users, public.work_user_menus, public.work_sessions, public.work_login_logs, public.work_audit from anon, authenticated;
grant all on public.work_users, public.work_user_menus, public.work_sessions, public.work_login_logs, public.work_audit to service_role;
grant usage, select on all sequences in schema public to service_role;
