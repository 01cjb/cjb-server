-- 로젠택배 송장: 업무 시스템에서 로젠으로 보낸 주문과 받아온 송장번호. 서버 전용
create table if not exists public.logen_waybills (
  id             bigint generated always as identity primary key,
  order_key      text not null unique,          -- 통합 주문 키 (bw-12, cafe24-34)
  channel        text not null,                  -- beautywell / cafe24
  order_no       text not null,                  -- 쇼핑몰 주문번호
  fix_take_no    text not null unique,           -- 로젠에 보낸 주문번호
  receiver_name  text,
  receiver_phone text,
  address        text,
  item_summary   text,
  qty            int not null default 1,
  env            text not null default 'dev',    -- dev(로젠 테스트서버) / prod
  status         text not null default 'registered', -- registered(출력 대기) / done(송장번호 받음) / error
  slip_no        text,
  result_msg     text,
  registered_by  uuid references public.work_users(id) on delete set null,
  registered_at  timestamptz not null default now(),
  slip_at        timestamptz
);
create index if not exists logen_waybills_status_idx on public.logen_waybills (status, registered_at desc);
alter table public.logen_waybills enable row level security;
revoke all on public.logen_waybills from anon, authenticated;
grant all on public.logen_waybills to service_role;
grant usage, select on all sequences in schema public to service_role;
