-- 업무 시스템: 서류 보관함 · 지시함 (2026-11-24)
-- 서버(service_role)만 읽고 씀. 화면에서는 업무 시스템 로그인(직원)을 거쳐서만 접근

create table if not exists public.work_docs (
  id          bigint generated always as identity primary key,
  box         text not null check (box in ('mgmt','sales','design','logistics','tech')),  -- 업무별 보관함 (tech = 기술 AI)
  title       text not null,
  body        text,
  link_url    text,
  file_path   text,          -- Storage(work-docs) 안의 경로
  file_name   text,
  file_size   integer,
  created_by  uuid references public.work_users(id) on delete set null,
  created_by_name text,
  created_at  timestamptz not null default now(),
  deleted_at  timestamptz
);
create index if not exists work_docs_box_idx on public.work_docs (box, created_at desc) where deleted_at is null;

create table if not exists public.work_directives (
  id          bigint generated always as identity primary key,
  title       text not null,
  body        text,
  from_user   uuid references public.work_users(id) on delete set null,
  from_name   text,
  to_team     text not null check (to_team in ('all','mgmt','sales','design','logistics')),
  to_user     uuid references public.work_users(id) on delete set null,
  to_name     text,
  due_date    date,
  status      text not null default 'open' check (status in ('open','doing','done')),
  result      text,          -- 처리 결과·보고
  done_at     timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists work_directives_idx on public.work_directives (to_team, status, created_at desc);

-- PM 지시함: 대표가 PM(Claude)에게 내리는 지시. 화면에는 나오지 않고 DB에만 둠 (조회·기록은 DB에서 직접)
create table if not exists public.pm_directives (
  id           bigint generated always as identity primary key,
  title        text not null,
  body         text,
  requested_by text,                       -- 지시한 사람
  priority     text not null default 'normal' check (priority in ('low','normal','high')),
  status       text not null default 'open' check (status in ('open','doing','done','hold')),
  result       text,                       -- 처리 결과·보고
  due_date     date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  done_at      timestamptz
);
create index if not exists pm_directives_idx on public.pm_directives (status, created_at desc);
alter table public.pm_directives enable row level security;
revoke all on public.pm_directives from anon, authenticated;
grant all on public.pm_directives to service_role;

alter table public.work_docs enable row level security;
alter table public.work_directives enable row level security;
revoke all on public.work_docs, public.work_directives from anon, authenticated;
grant all on public.work_docs, public.work_directives to service_role;
grant usage, select on all sequences in schema public to service_role;

-- 서류 파일 저장소 (비공개). 내려받기는 서버가 1분짜리 주소를 만들어 줌
insert into storage.buckets (id, name, public, file_size_limit)
values ('work-docs', 'work-docs', false, 4194304)
on conflict (id) do nothing;
