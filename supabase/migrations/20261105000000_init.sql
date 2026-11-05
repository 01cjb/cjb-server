-- 초기 마이그레이션: 연결 확인용 테이블
-- 기존 원격 DB에 이미 테이블이 있다면, 먼저 `npm run db:pull` 로 원격 스키마를 받아온 뒤 이 파일을 조정하세요.
create table if not exists public.health_check (
  id bigint generated always as identity primary key,
  note text,
  created_at timestamptz not null default now()
);

alter table public.health_check enable row level security;

drop policy if exists "health_check read" on public.health_check;
create policy "health_check read" on public.health_check
  for select to anon, authenticated using (true);
