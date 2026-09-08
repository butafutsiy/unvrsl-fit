create table if not exists public.offline_progress_shares (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references auth.users(id) on delete cascade,
  offline_client_id uuid not null references public.offline_clients(id) on delete cascade,
  token_hash text not null unique
    check (token_hash ~ '^[0-9a-f]{64}$'),
  snapshot jsonb not null
    check (jsonb_typeof(snapshot) = 'object' and octet_length(snapshot::text) <= 524288),
  expires_at timestamptz not null default (now() + interval '180 days'),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (trainer_id, offline_client_id)
);

create index if not exists offline_progress_shares_active_token_idx
  on public.offline_progress_shares(token_hash)
  where revoked_at is null;

alter table public.offline_progress_shares enable row level security;

revoke all on table public.offline_progress_shares from anon, authenticated;
grant select, insert, update, delete on table public.offline_progress_shares to authenticated;
grant select, insert, update, delete on table public.offline_progress_shares to service_role;

drop policy if exists "trainer reads own offline progress shares" on public.offline_progress_shares;
create policy "trainer reads own offline progress shares"
  on public.offline_progress_shares
  for select
  to authenticated
  using ((select auth.uid()) = trainer_id);

drop policy if exists "trainer creates own offline progress shares" on public.offline_progress_shares;
create policy "trainer creates own offline progress shares"
  on public.offline_progress_shares
  for insert
  to authenticated
  with check (
    (select auth.uid()) = trainer_id
    and exists (
      select 1
      from public.offline_clients c
      where c.id = offline_client_id
        and c.trainer_id = (select auth.uid())
    )
  );

drop policy if exists "trainer updates own offline progress shares" on public.offline_progress_shares;
create policy "trainer updates own offline progress shares"
  on public.offline_progress_shares
  for update
  to authenticated
  using ((select auth.uid()) = trainer_id)
  with check (
    (select auth.uid()) = trainer_id
    and exists (
      select 1
      from public.offline_clients c
      where c.id = offline_client_id
        and c.trainer_id = (select auth.uid())
    )
  );

drop policy if exists "trainer deletes own offline progress shares" on public.offline_progress_shares;
create policy "trainer deletes own offline progress shares"
  on public.offline_progress_shares
  for delete
  to authenticated
  using ((select auth.uid()) = trainer_id);

create or replace function public.get_offline_progress_share(p_token_hash text)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select case
    when p_token_hash ~ '^[0-9a-f]{64}$' then (
      select jsonb_build_object(
        'data', s.snapshot,
        'updated_at', s.updated_at,
        'expires_at', s.expires_at
      )
      from public.offline_progress_shares s
      where s.token_hash = lower(p_token_hash)
        and s.revoked_at is null
        and s.expires_at > now()
      limit 1
    )
    else null
  end
$$;

revoke all on function public.get_offline_progress_share(text) from public;
grant execute on function public.get_offline_progress_share(text) to anon, authenticated, service_role;

notify pgrst, 'reload schema';
