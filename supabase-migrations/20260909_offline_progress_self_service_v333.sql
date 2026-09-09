create or replace function public.get_offline_progress_share_v333(p_token_hash text)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_share public.offline_progress_shares%rowtype;
  v_client public.offline_clients%rowtype;
  v_snapshot jsonb;
  v_source text;
begin
  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' then
    return null;
  end if;

  select s.* into v_share
  from public.offline_progress_shares s
  where s.token_hash = lower(p_token_hash)
    and s.revoked_at is null
    and s.expires_at > now()
  limit 1;
  if not found then return null; end if;

  select c.* into v_client
  from public.offline_clients c
  where c.id = v_share.offline_client_id
    and c.trainer_id = v_share.trainer_id;
  if not found then return null; end if;

  v_source := case when (select auth.uid()) = v_share.trainer_id then 'trainer' else 'client' end;
  v_snapshot := jsonb_set(
    coalesce(v_share.snapshot, '{}'::jsonb),
    '{client}',
    jsonb_build_object(
      'name', v_client.display_name,
      'sex', v_client.sex,
      'birthDate', v_client.birth_date,
      'height', v_client.height_cm
    ),
    true
  );

  return jsonb_build_object(
    'data', v_snapshot,
    'updated_at', v_share.updated_at,
    'expires_at', v_share.expires_at,
    'viewer_source', v_source
  );
end
$$;

create or replace function public.submit_offline_progress_entry_v333(
  p_token_hash text,
  p_kind text,
  p_payload jsonb
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, public
as $$
declare
  v_share public.offline_progress_shares%rowtype;
  v_result jsonb;
  v_snapshot jsonb;
  v_entries jsonb;
  v_entry_id uuid;
  v_source text;
begin
  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Ссылка недействительна или устарела' using errcode = '22023';
  end if;

  select s.* into v_share
  from public.offline_progress_shares s
  where s.token_hash = lower(p_token_hash)
    and s.revoked_at is null
    and s.expires_at > now()
  limit 1;
  if not found then
    raise exception 'Ссылка недействительна или устарела' using errcode = '22023';
  end if;

  v_source := case when (select auth.uid()) = v_share.trainer_id then 'trainer' else 'client' end;
  v_result := public.submit_offline_progress_entry(p_token_hash, p_kind, p_payload);
  v_entry_id := nullif(v_result #>> '{entry,id}', '')::uuid;
  v_snapshot := v_result -> 'data';

  if v_source = 'trainer' and v_entry_id is not null then
    if p_kind = 'measurement' then
      update public.offline_client_measurements
      set entry_source = 'trainer'
      where id = v_entry_id
        and offline_client_id = v_share.offline_client_id
        and trainer_id = v_share.trainer_id;

      select coalesce(jsonb_agg(
        case when e.value ->> 'id' = v_entry_id::text
          then jsonb_set(e.value, '{source}', to_jsonb(v_source), true)
          else e.value end order by e.ordinality
      ), '[]'::jsonb)
      into v_entries
      from jsonb_array_elements(coalesce(v_snapshot -> 'measurements', '[]'::jsonb))
        with ordinality as e(value, ordinality);
      v_snapshot := jsonb_set(v_snapshot, '{measurements}', v_entries, true);
    else
      update public.offline_client_strengths
      set entry_source = 'trainer'
      where id = v_entry_id
        and offline_client_id = v_share.offline_client_id
        and trainer_id = v_share.trainer_id;

      select coalesce(jsonb_agg(
        case when e.value ->> 'id' = v_entry_id::text
          then jsonb_set(e.value, '{source}', to_jsonb(v_source), true)
          else e.value end order by e.ordinality
      ), '[]'::jsonb)
      into v_entries
      from jsonb_array_elements(coalesce(v_snapshot -> 'strengths', '[]'::jsonb))
        with ordinality as e(value, ordinality);
      v_snapshot := jsonb_set(v_snapshot, '{strengths}', v_entries, true);
    end if;
  end if;

  v_snapshot := jsonb_set(v_snapshot, '{version}', to_jsonb(333), true);
  update public.offline_progress_shares
  set snapshot = v_snapshot
  where id = v_share.id;

  v_result := jsonb_set(v_result, '{data}', v_snapshot, true);
  return jsonb_set(v_result, '{viewer_source}', to_jsonb(v_source), true);
end
$$;

create or replace function public.update_offline_progress_profile_v333(
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
  v_share public.offline_progress_shares%rowtype;
  v_name text;
  v_sex text;
  v_birth date;
  v_height numeric;
  v_snapshot jsonb;
  v_now timestamptz := now();
  v_source text;
begin
  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Ссылка недействительна или устарела' using errcode = '22023';
  end if;
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'Проверь данные профиля' using errcode = '22023';
  end if;

  select s.* into v_share
  from public.offline_progress_shares s
  where s.token_hash = lower(p_token_hash)
    and s.revoked_at is null
    and s.expires_at > now()
  limit 1
  for update;
  if not found then
    raise exception 'Ссылка недействительна или устарела' using errcode = '22023';
  end if;

  v_name := nullif(btrim(p_payload ->> 'name'), '');
  v_sex := nullif(btrim(p_payload ->> 'sex'), '');
  if v_name is null or char_length(v_name) > 100 then
    raise exception 'Укажи имя до 100 символов' using errcode = '22023';
  end if;
  if v_sex not in ('female', 'male', 'other') then
    raise exception 'Проверь пол' using errcode = '22023';
  end if;

  begin
    v_birth := nullif(btrim(p_payload ->> 'birthDate'), '')::date;
  exception when others then
    raise exception 'Проверь дату рождения' using errcode = '22007';
  end;
  if v_birth is not null and (v_birth > current_date - interval '14 years' or v_birth < current_date - interval '100 years') then
    raise exception 'Возраст должен быть от 14 до 100 лет' using errcode = '22023';
  end if;

  begin
    v_height := replace(nullif(btrim(p_payload ->> 'height'), ''), ',', '.')::numeric;
  exception when others then
    raise exception 'Проверь рост' using errcode = '22023';
  end;
  if v_height is not null and (v_height < 100 or v_height > 250) then
    raise exception 'Рост должен быть от 100 до 250 см' using errcode = '22023';
  end if;
  v_height := round(v_height, 1);

  update public.offline_clients
  set display_name = v_name,
      sex = v_sex,
      birth_date = v_birth,
      height_cm = v_height,
      updated_at = v_now
  where id = v_share.offline_client_id
    and trainer_id = v_share.trainer_id;
  if not found then
    raise exception 'Клиент не найден' using errcode = 'P0002';
  end if;

  v_snapshot := jsonb_set(
    coalesce(v_share.snapshot, '{}'::jsonb),
    '{client}',
    jsonb_build_object('name', v_name, 'sex', v_sex, 'birthDate', v_birth, 'height', v_height),
    true
  );
  v_snapshot := jsonb_set(v_snapshot, '{version}', to_jsonb(333), true);
  v_snapshot := jsonb_set(v_snapshot, '{generatedAt}', to_jsonb(v_now::text), true);
  update public.offline_progress_shares
  set snapshot = v_snapshot,
      updated_at = v_now
  where id = v_share.id;

  v_source := case when (select auth.uid()) = v_share.trainer_id then 'trainer' else 'client' end;
  return jsonb_build_object('data', v_snapshot, 'updated_at', v_now, 'viewer_source', v_source);
end
$$;

revoke all on function public.get_offline_progress_share_v333(text) from public;
revoke all on function public.submit_offline_progress_entry_v333(text, text, jsonb) from public;
revoke all on function public.update_offline_progress_profile_v333(text, jsonb) from public;
grant execute on function public.get_offline_progress_share_v333(text) to anon, authenticated;
grant execute on function public.submit_offline_progress_entry_v333(text, text, jsonb) to anon, authenticated;
grant execute on function public.update_offline_progress_profile_v333(text, jsonb) to anon, authenticated;

notify pgrst, 'reload schema';
