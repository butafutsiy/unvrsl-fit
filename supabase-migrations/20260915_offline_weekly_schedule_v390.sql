-- Canonical offline coaching model: weekly slots are templates, session events are facts.

create table if not exists public.offline_membership_blocks (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references auth.users(id) on delete cascade,
  offline_client_id uuid not null references public.offline_clients(id) on delete cascade,
  session_type text not null default 'block' check (session_type in ('block', 'single')),
  total_sessions integer not null check (total_sessions > 0),
  sessions_used integer not null default 0 check (sessions_used >= 0),
  sessions_remaining integer not null check (sessions_remaining >= 0),
  block_price_cents integer not null default 0 check (block_price_cents >= 0),
  session_price_cents integer not null default 0 check (session_price_cents >= 0),
  started_on date not null default current_date,
  ended_on date,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (sessions_used <= total_sessions),
  check (sessions_remaining <= total_sessions)
);

create unique index if not exists offline_membership_blocks_one_active_idx
  on public.offline_membership_blocks(offline_client_id)
  where status = 'active';
create index if not exists offline_membership_blocks_trainer_started_idx
  on public.offline_membership_blocks(trainer_id, started_on desc);

create table if not exists public.offline_weekly_slots (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references auth.users(id) on delete cascade,
  offline_client_id uuid references public.offline_clients(id) on delete set null,
  weekday smallint not null check (weekday between 1 and 7),
  start_time time not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (trainer_id, weekday, start_time)
);

create index if not exists offline_weekly_slots_client_idx
  on public.offline_weekly_slots(offline_client_id, weekday)
  where is_active;
create unique index if not exists offline_weekly_slots_one_client_day_idx
  on public.offline_weekly_slots(offline_client_id, weekday)
  where is_active and offline_client_id is not null;
create index if not exists offline_weekly_slots_trainer_day_idx
  on public.offline_weekly_slots(trainer_id, weekday, start_time)
  where is_active;

create table if not exists public.offline_schedule_exceptions (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references auth.users(id) on delete cascade,
  schedule_slot_id uuid not null references public.offline_weekly_slots(id) on delete cascade,
  original_date date not null,
  exception_type text not null check (exception_type in ('skip', 'move')),
  new_date date,
  new_time time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (schedule_slot_id, original_date),
  check (
    (exception_type = 'skip' and new_date is null and new_time is null)
    or
    (exception_type = 'move' and new_date is not null and new_time is not null)
  )
);

create index if not exists offline_schedule_exceptions_trainer_dates_idx
  on public.offline_schedule_exceptions(trainer_id, original_date, new_date);

create table if not exists public.offline_session_events (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references auth.users(id) on delete cascade,
  offline_client_id uuid not null references public.offline_clients(id) on delete cascade,
  membership_block_id uuid references public.offline_membership_blocks(id) on delete set null,
  schedule_slot_id uuid references public.offline_weekly_slots(id) on delete set null,
  event_type text not null check (event_type in ('completed', 'manual_debit', 'manual_credit')),
  session_date date not null,
  scheduled_time time,
  occurred_at timestamptz not null default now(),
  balance_before integer not null check (balance_before >= 0),
  balance_after integer not null check (balance_after >= 0),
  session_price_cents integer not null default 0 check (session_price_cents >= 0),
  revenue_cents integer not null default 0,
  idempotency_key text not null,
  note text,
  created_at timestamptz not null default now(),
  unique (trainer_id, idempotency_key)
);

create index if not exists offline_session_events_finance_idx
  on public.offline_session_events(trainer_id, session_date desc)
  where event_type = 'completed';
create index if not exists offline_session_events_client_history_idx
  on public.offline_session_events(offline_client_id, occurred_at desc);
create index if not exists offline_session_events_membership_block_idx
  on public.offline_session_events(membership_block_id);
create index if not exists offline_session_events_occurrence_idx
  on public.offline_session_events(schedule_slot_id, session_date)
  where event_type = 'completed' and schedule_slot_id is not null;

alter table public.offline_membership_blocks enable row level security;
alter table public.offline_weekly_slots enable row level security;
alter table public.offline_schedule_exceptions enable row level security;
alter table public.offline_session_events enable row level security;

drop policy if exists "trainer owns offline membership blocks" on public.offline_membership_blocks;
create policy "trainer owns offline membership blocks"
  on public.offline_membership_blocks for all to authenticated
  using ((select auth.uid()) = trainer_id)
  with check (
    (select auth.uid()) = trainer_id
    and exists (
      select 1 from public.offline_clients c
      where c.id = offline_membership_blocks.offline_client_id
        and c.trainer_id = (select auth.uid())
    )
  );

drop policy if exists "trainer owns offline weekly slots" on public.offline_weekly_slots;
create policy "trainer owns offline weekly slots"
  on public.offline_weekly_slots for all to authenticated
  using ((select auth.uid()) = trainer_id)
  with check (
    (select auth.uid()) = trainer_id
    and (
      offline_client_id is null
      or exists (
        select 1 from public.offline_clients c
        where c.id = offline_weekly_slots.offline_client_id
          and c.trainer_id = (select auth.uid())
      )
    )
  );

drop policy if exists "trainer owns offline schedule exceptions" on public.offline_schedule_exceptions;
create policy "trainer owns offline schedule exceptions"
  on public.offline_schedule_exceptions for all to authenticated
  using ((select auth.uid()) = trainer_id)
  with check (
    (select auth.uid()) = trainer_id
    and exists (
      select 1 from public.offline_weekly_slots s
      where s.id = offline_schedule_exceptions.schedule_slot_id
        and s.trainer_id = (select auth.uid())
    )
  );

drop policy if exists "trainer owns offline session events" on public.offline_session_events;
create policy "trainer owns offline session events"
  on public.offline_session_events for all to authenticated
  using ((select auth.uid()) = trainer_id)
  with check (
    (select auth.uid()) = trainer_id
    and exists (
      select 1 from public.offline_clients c
      where c.id = offline_session_events.offline_client_id
        and c.trainer_id = (select auth.uid())
    )
  );

revoke all on table public.offline_membership_blocks from anon;
revoke all on table public.offline_weekly_slots from anon;
revoke all on table public.offline_schedule_exceptions from anon;
revoke all on table public.offline_session_events from anon;
revoke all on table public.offline_membership_blocks from authenticated;
revoke all on table public.offline_weekly_slots from authenticated;
revoke all on table public.offline_schedule_exceptions from authenticated;
revoke all on table public.offline_session_events from authenticated;
grant select, insert, update on table public.offline_membership_blocks to authenticated;
grant select, insert, update, delete on table public.offline_weekly_slots to authenticated;
grant select, insert, update, delete on table public.offline_schedule_exceptions to authenticated;
grant select, insert on table public.offline_session_events to authenticated;
grant select, insert, update, delete on table public.offline_membership_blocks to service_role;
grant select, insert, update, delete on table public.offline_weekly_slots to service_role;
grant select, insert, update, delete on table public.offline_schedule_exceptions to service_role;
grant select, insert, update, delete on table public.offline_session_events to service_role;

insert into public.offline_membership_blocks (
  trainer_id, offline_client_id, session_type, total_sessions, sessions_remaining,
  block_price_cents, session_price_cents, started_on
)
select c.trainer_id, c.id, 'block', c.sessions_remaining, c.sessions_remaining, 0, 0, c.created_at::date
from public.offline_clients c
where c.sessions_remaining > 0
  and not exists (
    select 1 from public.offline_membership_blocks b
    where b.offline_client_id = c.id and b.status = 'active'
  );

create or replace function public.create_offline_client_v390(
  p_profile jsonb,
  p_membership jsonb,
  p_schedule jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_trainer uuid := (select auth.uid());
  v_client uuid;
  v_sessions integer;
  v_price integer;
  v_type text;
  v_slot jsonb;
begin
  if v_trainer is null then raise exception 'Требуется вход в аккаунт'; end if;
  v_sessions := greatest(1, least(200, coalesce((p_membership->>'total_sessions')::integer, 1)));
  v_price := greatest(0, coalesce((p_membership->>'block_price_cents')::integer, 0));
  v_type := case when p_membership->>'session_type' = 'single' then 'single' else 'block' end;

  insert into public.offline_clients (
    trainer_id, display_name, sex, birth_date, height_cm, sessions_remaining, notes, updated_at
  ) values (
    v_trainer,
    left(nullif(btrim(p_profile->>'display_name'), ''), 120),
    case when p_profile->>'sex' in ('female','male','other') then p_profile->>'sex' else 'other' end,
    nullif(p_profile->>'birth_date','')::date,
    nullif(p_profile->>'height_cm','')::numeric,
    v_sessions,
    nullif(left(btrim(coalesce(p_profile->>'notes','')), 4000), ''),
    now()
  ) returning id into v_client;

  if v_client is null then raise exception 'Введи имя клиента'; end if;

  insert into public.offline_membership_blocks (
    trainer_id, offline_client_id, session_type, total_sessions, sessions_remaining,
    block_price_cents, session_price_cents, started_on
  ) values (
    v_trainer, v_client, v_type, v_sessions, v_sessions, v_price,
    round(v_price::numeric / v_sessions)::integer,
    coalesce(nullif(p_membership->>'started_on','')::date, current_date)
  );

  for v_slot in select value from jsonb_array_elements(coalesce(p_schedule, '[]'::jsonb))
  loop
    insert into public.offline_weekly_slots (trainer_id, offline_client_id, weekday, start_time)
    values (v_trainer, v_client, (v_slot->>'weekday')::smallint, (v_slot->>'start_time')::time)
    on conflict (trainer_id, weekday, start_time) do update
      set offline_client_id = case
        when public.offline_weekly_slots.offline_client_id is null then excluded.offline_client_id
        when public.offline_weekly_slots.offline_client_id = excluded.offline_client_id then excluded.offline_client_id
        else public.offline_weekly_slots.offline_client_id
      end,
      is_active = true,
      updated_at = now();
    if not exists (
      select 1 from public.offline_weekly_slots s
      where s.trainer_id = v_trainer
        and s.weekday = (v_slot->>'weekday')::smallint
        and s.start_time = (v_slot->>'start_time')::time
        and s.offline_client_id = v_client
    ) then
      raise exception 'Это время уже занято другим клиентом';
    end if;
  end loop;

  return v_client;
end;
$$;

create or replace function public.replace_offline_client_schedule_v390(
  p_offline_client_id uuid,
  p_schedule jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_trainer uuid := (select auth.uid());
  v_slot jsonb;
begin
  if not exists (
    select 1 from public.offline_clients c
    where c.id = p_offline_client_id and c.trainer_id = v_trainer
  ) then raise exception 'Клиент не найден'; end if;

  update public.offline_weekly_slots
  set offline_client_id = null, updated_at = now()
  where trainer_id = v_trainer and offline_client_id = p_offline_client_id;

  for v_slot in select value from jsonb_array_elements(coalesce(p_schedule, '[]'::jsonb))
  loop
    insert into public.offline_weekly_slots (trainer_id, offline_client_id, weekday, start_time)
    values (v_trainer, p_offline_client_id, (v_slot->>'weekday')::smallint, (v_slot->>'start_time')::time)
    on conflict (trainer_id, weekday, start_time) do update
      set offline_client_id = case
        when public.offline_weekly_slots.offline_client_id is null then excluded.offline_client_id
        when public.offline_weekly_slots.offline_client_id = excluded.offline_client_id then excluded.offline_client_id
        else public.offline_weekly_slots.offline_client_id
      end,
      is_active = true,
      updated_at = now();
    if not exists (
      select 1 from public.offline_weekly_slots s
      where s.trainer_id = v_trainer
        and s.weekday = (v_slot->>'weekday')::smallint
        and s.start_time = (v_slot->>'start_time')::time
        and s.offline_client_id = p_offline_client_id
    ) then
      raise exception 'Это время уже занято другим клиентом';
    end if;
  end loop;
end;
$$;

create or replace function public.start_offline_membership_v390(
  p_offline_client_id uuid,
  p_session_type text,
  p_total_sessions integer,
  p_block_price_cents integer,
  p_started_on date default current_date
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_trainer uuid := (select auth.uid());
  v_block uuid;
  v_sessions integer := greatest(1, least(200, coalesce(p_total_sessions, 1)));
  v_price integer := greatest(0, coalesce(p_block_price_cents, 0));
begin
  perform 1 from public.offline_clients c
  where c.id = p_offline_client_id and c.trainer_id = v_trainer
  for update;
  if not found then raise exception 'Клиент не найден'; end if;

  update public.offline_membership_blocks
  set status = 'archived', ended_on = greatest(started_on, coalesce(p_started_on, current_date)), updated_at = now()
  where trainer_id = v_trainer and offline_client_id = p_offline_client_id and status = 'active';

  insert into public.offline_membership_blocks (
    trainer_id, offline_client_id, session_type, total_sessions, sessions_remaining,
    block_price_cents, session_price_cents, started_on
  ) values (
    v_trainer, p_offline_client_id,
    case when p_session_type = 'single' then 'single' else 'block' end,
    v_sessions, v_sessions, v_price, round(v_price::numeric / v_sessions)::integer,
    coalesce(p_started_on, current_date)
  ) returning id into v_block;

  update public.offline_clients
  set sessions_remaining = v_sessions, updated_at = now()
  where id = p_offline_client_id and trainer_id = v_trainer;
  return v_block;
end;
$$;

create or replace function public.record_offline_session_v390(
  p_offline_client_id uuid,
  p_schedule_slot_id uuid,
  p_session_date date,
  p_scheduled_time time,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_trainer uuid := (select auth.uid());
  v_block public.offline_membership_blocks%rowtype;
  v_event uuid;
  v_before integer;
  v_existing_remaining integer;
begin
  perform 1 from public.offline_clients c
  where c.id = p_offline_client_id and c.trainer_id = v_trainer
  for update;
  if not found then raise exception 'Клиент не найден'; end if;

  select e.balance_after into v_existing_remaining
  from public.offline_session_events e
  where e.trainer_id = v_trainer and e.idempotency_key = left(p_idempotency_key, 200);
  if found then
    return jsonb_build_object('duplicate', true, 'remaining', v_existing_remaining);
  end if;

  select * into v_block from public.offline_membership_blocks b
  where b.trainer_id = v_trainer and b.offline_client_id = p_offline_client_id and b.status = 'active'
  for update;
  if not found or v_block.sessions_remaining <= 0 then raise exception 'В абонементе нет занятий'; end if;
  v_before := v_block.sessions_remaining;

  insert into public.offline_session_events (
    trainer_id, offline_client_id, membership_block_id, schedule_slot_id, event_type,
    session_date, scheduled_time, balance_before, balance_after,
    session_price_cents, revenue_cents, idempotency_key, note
  ) values (
    v_trainer, p_offline_client_id, v_block.id, p_schedule_slot_id, 'completed',
    coalesce(p_session_date, current_date), p_scheduled_time, v_before, v_before - 1,
    v_block.session_price_cents, v_block.session_price_cents, left(p_idempotency_key, 200),
    'Занятие проведено'
  ) on conflict (trainer_id, idempotency_key) do nothing returning id into v_event;

  if v_event is null then
    return jsonb_build_object('duplicate', true, 'remaining', v_before);
  end if;

  update public.offline_membership_blocks
  set sessions_remaining = v_before - 1, sessions_used = sessions_used + 1, updated_at = now()
  where id = v_block.id;
  update public.offline_clients
  set sessions_remaining = v_before - 1, updated_at = now()
  where id = p_offline_client_id and trainer_id = v_trainer;

  return jsonb_build_object('duplicate', false, 'event_id', v_event, 'remaining', v_before - 1);
end;
$$;

create or replace function public.adjust_offline_sessions_v390(
  p_offline_client_id uuid,
  p_delta integer,
  p_note text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_trainer uuid := (select auth.uid());
  v_block public.offline_membership_blocks%rowtype;
  v_before integer;
  v_after integer;
  v_key text := 'manual:' || gen_random_uuid()::text;
begin
  if p_delta not in (-1, 1) then raise exception 'Изменение должно быть −1 или +1'; end if;
  perform 1 from public.offline_clients c
  where c.id = p_offline_client_id and c.trainer_id = v_trainer
  for update;
  if not found then raise exception 'Клиент не найден'; end if;

  select * into v_block from public.offline_membership_blocks b
  where b.trainer_id = v_trainer and b.offline_client_id = p_offline_client_id and b.status = 'active'
  for update;
  if not found then raise exception 'Сначала добавь абонемент'; end if;
  v_before := v_block.sessions_remaining;
  v_after := v_before + p_delta;
  if v_after < 0 then raise exception 'В абонементе нет занятий'; end if;

  insert into public.offline_session_events (
    trainer_id, offline_client_id, membership_block_id, event_type, session_date,
    balance_before, balance_after, session_price_cents, revenue_cents, idempotency_key, note
  ) values (
    v_trainer, p_offline_client_id, v_block.id,
    case when p_delta < 0 then 'manual_debit' else 'manual_credit' end,
    current_date, v_before, v_after, v_block.session_price_cents, 0, v_key,
    coalesce(nullif(left(btrim(p_note), 500), ''), case when p_delta < 0 then 'Занятие списано вручную' else 'Занятие добавлено вручную' end)
  );

  update public.offline_membership_blocks
  set sessions_remaining = v_after,
      total_sessions = greatest(total_sessions, v_after),
      session_price_cents = case
        when v_after > total_sessions then round(block_price_cents::numeric / v_after)::integer
        else session_price_cents
      end,
      updated_at = now()
  where id = v_block.id;
  update public.offline_clients
  set sessions_remaining = v_after, updated_at = now()
  where id = p_offline_client_id and trainer_id = v_trainer;

  return jsonb_build_object('before', v_before, 'after', v_after);
end;
$$;

revoke all on function public.create_offline_client_v390(jsonb, jsonb, jsonb) from public, anon;
revoke all on function public.replace_offline_client_schedule_v390(uuid, jsonb) from public, anon;
revoke all on function public.start_offline_membership_v390(uuid, text, integer, integer, date) from public, anon;
revoke all on function public.record_offline_session_v390(uuid, uuid, date, time, text) from public, anon;
revoke all on function public.adjust_offline_sessions_v390(uuid, integer, text) from public, anon;
grant execute on function public.create_offline_client_v390(jsonb, jsonb, jsonb) to authenticated, service_role;
grant execute on function public.replace_offline_client_schedule_v390(uuid, jsonb) to authenticated, service_role;
grant execute on function public.start_offline_membership_v390(uuid, text, integer, integer, date) to authenticated, service_role;
grant execute on function public.record_offline_session_v390(uuid, uuid, date, time, text) to authenticated, service_role;
grant execute on function public.adjust_offline_sessions_v390(uuid, integer, text) to authenticated, service_role;

notify pgrst, 'reload schema';
