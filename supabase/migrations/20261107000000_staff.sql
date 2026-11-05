-- =========================================================
-- 관리자 계정 관리: 테스트(개인) 계정 → 회사 계정 전환 대비
-- =========================================================

-- 테스트 계정 표시 + 관리자 권한 변경 감사 로그
alter table public.profiles add column if not exists is_test boolean not null default false;

create table if not exists public.admin_audit (
  id bigint generated always as identity primary key,
  actor uuid references auth.users(id) on delete set null,
  target uuid references auth.users(id) on delete set null,
  target_email text,
  from_role text, to_role text,
  note text,
  created_at timestamptz not null default now()
);
alter table public.admin_audit enable row level security;
drop policy if exists "admin read audit" on public.admin_audit;
create policy "admin read audit" on public.admin_audit for select using (public.is_admin());
grant select on public.admin_audit to authenticated;
grant all on public.admin_audit to service_role;

-- 권한 변경 함수: 최고관리자(admin) 또는 서버(service role)만 호출 가능
--  · 대상은 먼저 회원가입되어 있어야 함
--  · 마지막 남은 admin은 내릴 수 없음 (잠김 방지)
create or replace function public.set_staff_role(target_email text, new_role text, mark_test boolean default null, note text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare t public.profiles; caller_role text; admins int;
begin
  if new_role not in ('customer','staff','admin') then raise exception 'role must be customer/staff/admin'; end if;
  -- 허용: 서버(service role) 또는 Supabase SQL Editor(postgres 접속) — 첫 관리자 지정용
  if coalesce(auth.role(), '') <> 'service_role' and session_user not in ('postgres', 'supabase_admin') then
    select role into caller_role from public.profiles where id = auth.uid();
    if caller_role is distinct from 'admin' then raise exception '최고관리자만 권한을 바꿀 수 있습니다.'; end if;
  end if;

  select * into t from public.profiles where lower(email) = lower(trim(target_email));
  if t.id is null then raise exception '% 로 가입된 회원이 없습니다. 먼저 회원가입이 필요합니다.', target_email; end if;

  if t.role = 'admin' and new_role <> 'admin' then
    select count(*) into admins from public.profiles where role = 'admin' and status = 'active';
    if admins <= 1 then raise exception '마지막 최고관리자는 해제할 수 없습니다. 다른 관리자를 먼저 지정하세요.'; end if;
  end if;

  update public.profiles set role = new_role, is_test = coalesce(mark_test, is_test) where id = t.id;
  insert into public.admin_audit (actor, target, target_email, from_role, to_role, note)
  values (auth.uid(), t.id, t.email, t.role, new_role, note);
  return jsonb_build_object('ok', true, 'email', t.email, 'from', t.role, 'to', new_role);
end $$;
revoke all on function public.set_staff_role(text, text, boolean, text) from public, anon;
grant execute on function public.set_staff_role(text, text, boolean, text) to authenticated, service_role;
