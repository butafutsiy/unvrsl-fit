-- Add optional actual effort and explicit recovery classification to offline strength entries.
-- Older rows remain valid: no fabricated RPE/RIR values or mass updates.
alter table public.offline_client_strengths
  add column if not exists rpe numeric(3,1),
  add column if not exists rir numeric(3,1),
  add column if not exists is_deload boolean not null default false;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid='public.offline_client_strengths'::regclass
      and conname='offline_strength_rpe_range'
  ) then
    alter table public.offline_client_strengths add constraint offline_strength_rpe_range
      check (rpe is null or (rpe between 4 and 10 and mod(rpe * 2, 1) = 0));
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid='public.offline_client_strengths'::regclass
      and conname='offline_strength_rir_range'
  ) then
    alter table public.offline_client_strengths add constraint offline_strength_rir_range
      check (rir is null or (rir between 0 and 6 and mod(rir * 2, 1) = 0));
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid='public.offline_client_strengths'::regclass
      and conname='offline_strength_effort_consistency'
  ) then
    alter table public.offline_client_strengths add constraint offline_strength_effort_consistency
      check (rpe is null or rir is null or abs(rpe + rir - 10) < 0.01);
  end if;
end $$;

comment on column public.offline_client_strengths.rpe is 'Observed RPE, never a prescribed target; optional for legacy rows';
comment on column public.offline_client_strengths.rir is 'Observed reps in reserve; synchronized with observed RPE';
comment on column public.offline_client_strengths.is_deload is 'True for a deliberately reduced or recovery-oriented set, excluded from strength baseline';
