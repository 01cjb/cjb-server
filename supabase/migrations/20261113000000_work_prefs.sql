-- 업무 시스템 직원별 화면 설정 (왼쪽 메뉴 순서 등). 서버 전용
create table if not exists public.work_user_prefs (
  user_id     uuid primary key references public.work_users(id) on delete cascade,
  menu_order  text[],                         -- 'team:mgmt', 'tax' … 순서대로. 없는 키는 기본 순서로 뒤에 붙음
  updated_at  timestamptz not null default now()
);
alter table public.work_user_prefs enable row level security;
revoke all on public.work_user_prefs from anon, authenticated;
grant all on public.work_user_prefs to service_role;
