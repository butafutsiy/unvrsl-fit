-- UNVRSL FIT cloud schema for Supabase
-- Run in Supabase SQL Editor once per project.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Пользователь',
  role text not null default 'client' check (role in ('trainer','client')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trainer_clients (
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'active' check (status in ('active','paused','archived')),
  created_at timestamptz not null default now(),
  primary key (trainer_id, client_id),
  check (trainer_id <> client_id)
);

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  version integer not null default 1,
  snapshot jsonb not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.plan_versions (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  version integer not null,
  snapshot jsonb not null,
  created_at timestamptz not null default now(),
  unique(plan_id, version)
);

create table if not exists public.plan_invites (
  id uuid primary key default gen_random_uuid(),
  token text unique not null,
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  plan_id uuid not null references public.plans(id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '30 days'),
  max_uses integer not null default 1,
  uses integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.plan_assignments (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  version integer not null,
  snapshot jsonb not null,
  status text not null default 'active' check (status in ('active','completed','archived')),
  assigned_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(plan_id, client_id)
);

create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  trainer_id uuid references public.profiles(id) on delete set null,
  plan_id uuid references public.plans(id) on delete set null,
  external_id text not null,
  workout_date date not null,
  payload jsonb not null,
  avg_rpe numeric,
  completed_sets integer not null default 0,
  total_sets integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, external_id)
);

create table if not exists public.bodyweights (
  user_id uuid not null references public.profiles(id) on delete cascade,
  measure_date date not null,
  weight_kg numeric not null check (weight_kg > 0),
  created_at timestamptz not null default now(),
  primary key(user_id, measure_date)
);

alter table public.profiles enable row level security;
alter table public.trainer_clients enable row level security;
alter table public.plans enable row level security;
alter table public.plan_versions enable row level security;
alter table public.plan_invites enable row level security;
alter table public.plan_assignments enable row level security;
alter table public.workouts enable row level security;
alter table public.bodyweights enable row level security;

-- profiles
create policy "profile own select" on public.profiles for select using (id = auth.uid());
create policy "profile trainer sees clients" on public.profiles for select using (
  exists(select 1 from public.trainer_clients tc where tc.trainer_id = auth.uid() and tc.client_id = profiles.id and tc.status <> 'archived')
);
create policy "profile own insert" on public.profiles for insert with check (id = auth.uid());
create policy "profile own update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- trainer/client relationships
create policy "relations visible to both" on public.trainer_clients for select using (trainer_id = auth.uid() or client_id = auth.uid());
create policy "trainer manages relation" on public.trainer_clients for update using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());

-- plans and versions
create policy "trainer owns plans" on public.plans for all using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());
create policy "client reads assigned plan" on public.plans for select using (
  exists(select 1 from public.plan_assignments pa where pa.plan_id = plans.id and pa.client_id = auth.uid())
);
create policy "trainer owns versions" on public.plan_versions for all using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());

-- invites: trainer can manage, clients accept through RPC only
create policy "trainer owns invites" on public.plan_invites for all using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());

-- assignments
create policy "assignment visible to both" on public.plan_assignments for select using (trainer_id = auth.uid() or client_id = auth.uid());
create policy "trainer manages assignment" on public.plan_assignments for all using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());

-- workouts
create policy "user manages workouts" on public.workouts for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "trainer reads client workouts" on public.workouts for select using (
  exists(select 1 from public.trainer_clients tc where tc.trainer_id = auth.uid() and tc.client_id = workouts.user_id and tc.status <> 'archived')
);

-- bodyweight
create policy "user manages bodyweight" on public.bodyweights for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "trainer reads client bodyweight" on public.bodyweights for select using (
  exists(select 1 from public.trainer_clients tc where tc.trainer_id = auth.uid() and tc.client_id = bodyweights.user_id and tc.status <> 'archived')
);

create or replace function public.preview_plan_invite(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  trainer_name text;
begin
  select i.*, p.title, p.version into r
  from public.plan_invites i
  join public.plans p on p.id = i.plan_id
  where i.token = p_token and i.expires_at > now() and i.uses < i.max_uses;
  if not found then return null; end if;
  select display_name into trainer_name from public.profiles where id = r.trainer_id;
  return jsonb_build_object('title',r.title,'version',r.version,'trainer',coalesce(trainer_name,'Тренер'));
end;
$$;

create or replace function public.accept_plan_invite(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  r record;
  trainer_name text;
begin
  if uid is null then raise exception 'AUTH_REQUIRED'; end if;
  select i.*, p.title, p.version, p.snapshot into r
  from public.plan_invites i
  join public.plans p on p.id = i.plan_id
  where i.token = p_token and i.expires_at > now() and i.uses < i.max_uses
  for update of i;
  if not found then raise exception 'INVITE_INVALID'; end if;
  if uid = r.trainer_id then raise exception 'TRAINER_CANNOT_ACCEPT_OWN_INVITE'; end if;

  insert into public.trainer_clients(trainer_id, client_id, status)
  values(r.trainer_id, uid, 'active')
  on conflict(trainer_id, client_id) do update set status='active';

  insert into public.plan_assignments(plan_id, trainer_id, client_id, version, snapshot, status, updated_at)
  values(r.plan_id, r.trainer_id, uid, r.version, r.snapshot, 'active', now())
  on conflict(plan_id, client_id) do update
  set version=excluded.version, snapshot=excluded.snapshot, status='active', updated_at=now();

  update public.plan_invites set uses=uses+1 where id=r.id;
  select display_name into trainer_name from public.profiles where id=r.trainer_id;
  return jsonb_build_object('plan_id',r.plan_id,'title',r.title,'version',r.version,'trainer_id',r.trainer_id,'trainer',coalesce(trainer_name,'Тренер'),'snapshot',r.snapshot);
end;
$$;

grant execute on function public.preview_plan_invite(text) to anon, authenticated;
grant execute on function public.accept_plan_invite(text) to authenticated;
