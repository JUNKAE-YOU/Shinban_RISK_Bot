-- =====================================================================
-- 육아일지 (baby-log) 초기 스키마
-- Supabase Dashboard > SQL Editor 에 붙여넣고 실행하세요.
-- (또는 Supabase CLI: `supabase db push`)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) 가족 구성원 허용 목록 (allowlist)
--    여기에 등록된 이메일로 로그인한 사용자만 데이터에 접근할 수 있습니다.
-- ---------------------------------------------------------------------
create table if not exists public.family_members (
  email        text primary key check (email = lower(email)),
  display_name text not null,                 -- 예: '아빠', '엄마'
  created_at   timestamptz not null default now()
);

alter table public.family_members enable row level security;

-- 현재 로그인한 사용자가 가족 구성원인지 확인하는 함수.
-- security definer 로 실행되어 family_members 의 RLS 를 우회해 조회합니다.
create or replace function public.is_family()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.family_members fm
    where fm.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function public.is_family() from public, anon;
grant execute on function public.is_family() to authenticated;

-- 현재 사용자의 표시 이름 ('아빠' / '엄마')
create or replace function public.current_member_name()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select fm.display_name
  from public.family_members fm
  where fm.email = lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

revoke all on function public.current_member_name() from public, anon;
grant execute on function public.current_member_name() to authenticated;

-- 가족 구성원끼리는 서로의 이름을 볼 수 있음 (쓰기는 SQL Editor 에서만)
drop policy if exists "family can read members" on public.family_members;
create policy "family can read members"
  on public.family_members for select
  to authenticated
  using (public.is_family());

-- ---------------------------------------------------------------------
-- 2) 공통 트리거: 작성자 자동 기록 + updated_at 갱신
-- ---------------------------------------------------------------------
create or replace function public.set_author()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.created_by  := auth.uid();
  new.author_name := public.current_member_name();
  return new;
end;
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  -- 작성자 정보는 수정 시 변경 불가
  new.created_by  := old.created_by;
  new.author_name := old.author_name;
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 3) 날짜별 육아 메모
-- ---------------------------------------------------------------------
create table if not exists public.memos (
  id          uuid primary key default gen_random_uuid(),
  memo_date   date not null,
  content     text not null check (char_length(content) between 1 and 5000),
  created_by  uuid references auth.users (id) on delete set null,
  author_name text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists memos_memo_date_idx on public.memos (memo_date desc, created_at desc);

drop trigger if exists memos_set_author on public.memos;
create trigger memos_set_author before insert on public.memos
  for each row execute function public.set_author();

drop trigger if exists memos_touch on public.memos;
create trigger memos_touch before update on public.memos
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- 4) 수유 기록
-- ---------------------------------------------------------------------
create table if not exists public.feedings (
  id          uuid primary key default gen_random_uuid(),
  feed_type   text not null check (feed_type in ('breast', 'formula', 'pumped')),
  breast_side text check (breast_side in ('left', 'right', 'both')),
  amount_ml   integer check (amount_ml between 0 and 500),
  started_at  timestamptz not null default now(),
  ended_at    timestamptz,
  note        text check (char_length(note) <= 500),
  created_by  uuid references auth.users (id) on delete set null,
  author_name text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint feedings_end_after_start check (ended_at is null or ended_at >= started_at)
);

create index if not exists feedings_started_at_idx on public.feedings (started_at desc);

drop trigger if exists feedings_set_author on public.feedings;
create trigger feedings_set_author before insert on public.feedings
  for each row execute function public.set_author();

drop trigger if exists feedings_touch on public.feedings;
create trigger feedings_touch before update on public.feedings
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- 5) Row Level Security: 가족 구성원만 읽기/쓰기 가능
-- ---------------------------------------------------------------------
alter table public.memos    enable row level security;
alter table public.feedings enable row level security;

-- 로그인하지 않은 사용자(anon)는 테이블 자체에 접근 불가
revoke all on public.memos, public.feedings, public.family_members from anon;

do $$
declare
  t text;
begin
  foreach t in array array['memos', 'feedings'] loop
    execute format('drop policy if exists "family select" on public.%I', t);
    execute format('drop policy if exists "family insert" on public.%I', t);
    execute format('drop policy if exists "family update" on public.%I', t);
    execute format('drop policy if exists "family delete" on public.%I', t);

    execute format($p$create policy "family select" on public.%I
      for select to authenticated using ((select public.is_family()))$p$, t);
    execute format($p$create policy "family insert" on public.%I
      for insert to authenticated with check ((select public.is_family()))$p$, t);
    execute format($p$create policy "family update" on public.%I
      for update to authenticated using ((select public.is_family()))
      with check ((select public.is_family()))$p$, t);
    execute format($p$create policy "family delete" on public.%I
      for delete to authenticated using ((select public.is_family()))$p$, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 6) 실시간 동기화 (Realtime) — RLS 가 적용된 상태로 변경사항을 브로드캐스트
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'memos'
  ) then
    alter publication supabase_realtime add table public.memos;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'feedings'
  ) then
    alter publication supabase_realtime add table public.feedings;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 7) 가족 등록 — 아래 이메일을 실제 주소로 바꿔서 실행하세요 (소문자)
-- ---------------------------------------------------------------------
-- insert into public.family_members (email, display_name) values
--   ('dad@example.com', '아빠'),
--   ('mom@example.com', '엄마')
-- on conflict (email) do update set display_name = excluded.display_name;
