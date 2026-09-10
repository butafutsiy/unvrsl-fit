alter table public.offline_clients
  add column if not exists target_weight_kg numeric;

do $$
begin
  if not exists (
    select 1 from pg_catalog.pg_constraint
    where conname = 'offline_clients_target_weight_kg_check'
      and conrelid = 'public.offline_clients'::regclass
  ) then
    alter table public.offline_clients
      add constraint offline_clients_target_weight_kg_check
      check (target_weight_kg is null or target_weight_kg between 20 and 400);
  end if;
end
$$;

create or replace function public.get_offline_progress_share_v334(p_token_hash text)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_result jsonb;
  v_target numeric;
begin
  v_result := public.get_offline_progress_share_v333(p_token_hash);
  if v_result is null then return null; end if;

  select c.target_weight_kg into v_target
  from public.offline_progress_shares s
  join public.offline_clients c
    on c.id = s.offline_client_id and c.trainer_id = s.trainer_id
  where s.token_hash = lower(p_token_hash)
    and s.revoked_at is null and s.expires_at > now()
  limit 1;

  v_result := jsonb_set(v_result, '{data,client,targetWeight}', coalesce(to_jsonb(v_target), 'null'::jsonb), true);
  v_result := jsonb_set(v_result, '{data,version}', to_jsonb(334), true);
  return v_result;
end
$$;

create or replace function public.update_offline_progress_profile_v334(
  p_token_hash text,
  p_payload jsonb
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, public
as $$
declare
  v_result jsonb;
  v_share public.offline_progress_shares%rowtype;
  v_target numeric;
  v_now timestamptz := now();
begin
  begin
    v_target := replace(nullif(btrim(p_payload ->> 'targetWeight'), ''), ',', '.')::numeric;
  exception when others then
    raise exception 'Проверь цель по весу' using errcode = '22023';
  end;
  if v_target is not null and (v_target < 20 or v_target > 400) then
    raise exception 'Цель по весу должна быть от 20 до 400 кг' using errcode = '22023';
  end if;
  v_target := round(v_target, 1);

  v_result := public.update_offline_progress_profile_v333(p_token_hash, p_payload);

  select s.* into v_share
  from public.offline_progress_shares s
  where s.token_hash = lower(p_token_hash)
    and s.revoked_at is null and s.expires_at > now()
  limit 1 for update;
  if not found then
    raise exception 'Ссылка недействительна или устарела' using errcode = '22023';
  end if;

  update public.offline_clients
  set target_weight_kg = v_target, updated_at = v_now
  where id = v_share.offline_client_id and trainer_id = v_share.trainer_id;

  v_result := jsonb_set(v_result, '{data,client,targetWeight}', coalesce(to_jsonb(v_target), 'null'::jsonb), true);
  v_result := jsonb_set(v_result, '{data,version}', to_jsonb(334), true);
  update public.offline_progress_shares
  set snapshot = v_result -> 'data', updated_at = v_now
  where id = v_share.id;
  v_result := jsonb_set(v_result, '{updated_at}', to_jsonb(v_now::text), true);
  return v_result;
end
$$;

create or replace function public.delete_offline_progress_measurement_v334(
  p_token_hash text,
  p_entry_id uuid
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, public
as $$
declare
  v_share public.offline_progress_shares%rowtype;
  v_entry public.offline_client_measurements%rowtype;
  v_snapshot jsonb;
  v_entries jsonb;
  v_source text;
  v_target numeric;
  v_now timestamptz := now();
begin
  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' or p_entry_id is null then
    raise exception 'Ссылка или запись недействительна' using errcode = '22023';
  end if;

  select s.* into v_share
  from public.offline_progress_shares s
  where s.token_hash = lower(p_token_hash)
    and s.revoked_at is null and s.expires_at > now()
  limit 1 for update;
  if not found then
    raise exception 'Ссылка недействительна или устарела' using errcode = '22023';
  end if;

  v_source := case when (select auth.uid()) = v_share.trainer_id then 'trainer' else 'client' end;
  select m.* into v_entry
  from public.offline_client_measurements m
  where m.id = p_entry_id
    and m.offline_client_id = v_share.offline_client_id
    and m.trainer_id = v_share.trainer_id
  for update;
  if not found then raise exception 'Запись не найдена' using errcode = 'P0002'; end if;

  if v_source <> 'trainer' and not (
    v_entry.entry_source = 'client' and v_entry.submitted_via_share_id = v_share.id
  ) then
    raise exception 'Клиент может удалять только свои записи' using errcode = '42501';
  end if;

  delete from public.offline_client_measurements where id = v_entry.id;
  select c.target_weight_kg into v_target from public.offline_clients c where c.id = v_share.offline_client_id;
  select coalesce(jsonb_agg(e.value order by e.ordinality), '[]'::jsonb)
  into v_entries
  from jsonb_array_elements(coalesce(v_share.snapshot -> 'measurements', '[]'::jsonb))
    with ordinality as e(value, ordinality)
  where e.value ->> 'id' <> p_entry_id::text;

  v_snapshot := jsonb_set(coalesce(v_share.snapshot, '{}'::jsonb), '{measurements}', v_entries, true);
  v_snapshot := jsonb_set(v_snapshot, '{client,targetWeight}', coalesce(to_jsonb(v_target), 'null'::jsonb), true);
  v_snapshot := jsonb_set(v_snapshot, '{version}', to_jsonb(334), true);
  v_snapshot := jsonb_set(v_snapshot, '{generatedAt}', to_jsonb(v_now::text), true);
  update public.offline_progress_shares set snapshot = v_snapshot, updated_at = v_now where id = v_share.id;
  update public.offline_clients set updated_at = v_now where id = v_share.offline_client_id;

  return jsonb_build_object('data', v_snapshot, 'updated_at', v_now, 'viewer_source', v_source);
end
$$;

revoke all on function public.get_offline_progress_share_v334(text) from public;
revoke all on function public.update_offline_progress_profile_v334(text, jsonb) from public;
revoke all on function public.delete_offline_progress_measurement_v334(text, uuid) from public;
grant execute on function public.get_offline_progress_share_v334(text) to anon, authenticated;
grant execute on function public.update_offline_progress_profile_v334(text, jsonb) to anon, authenticated;
grant execute on function public.delete_offline_progress_measurement_v334(text, uuid) to anon, authenticated;

notify pgrst, 'reload schema';
