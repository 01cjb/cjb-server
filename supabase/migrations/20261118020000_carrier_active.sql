-- 사용하는 택배사만 표시: 로젠택배만 사용 (다른 택배사는 지우지 않고 '사용 안 함'으로 둠 — 예전 송장 조회용)
alter table public.carriers add column if not exists active boolean not null default true;
update public.carriers set active = (code = 'logen');
