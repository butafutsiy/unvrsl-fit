alter table public.offline_client_measurements
  add column if not exists entry_source text not null default 'trainer',
  add column if not exists submitted_via_share_id uuid references public.offline_progress_shares(id) on delete set null;

alter table public.offline_client_strengths
  add column if not exists entry_source text not null default 'trainer',
  add column if not exists submitted_via_share_id uuid references public.offline_progress_shares(id) on delete set null;

do $$
begin
  if not exists (
    select 1 from pg_catalog.pg_constraint
    where conname = 'offline_client_measurements_entry_source_check'
      and conrelid = 'public.offline_client_measurements'::regclass
  ) then
    alter table public.offline_client_measurements
      add constraint offline_client_measurements_entry_source_check
      check (entry_source in ('trainer', 'client'));
  end if;

  if not exists (
    select 1 from pg_catalog.pg_constraint
    where conname = 'offline_client_strengths_entry_source_check'
      and conrelid = 'public.offline_client_strengths'::regclass
  ) then
    alter table public.offline_client_strengths
      add constraint offline_client_strengths_entry_source_check
      check (entry_source in ('trainer', 'client'));
  end if;
end
$$;

create index if not exists offline_client_measurements_client_entry_idx
  on public.offline_client_measurements(offline_client_id, created_at desc)
  where entry_source = 'client';

create index if not exists offline_client_strengths_client_entry_idx
  on public.offline_client_strengths(offline_client_id, created_at desc)
  where entry_source = 'client';

comment on column public.offline_client_measurements.entry_source is
  'Who recorded the entry: trainer or client through a private progress link.';
comment on column public.offline_client_strengths.entry_source is
  'Who recorded the entry: trainer or client through a private progress link.';

drop policy if exists "trainer owns offline measurements" on public.offline_client_measurements;
create policy "trainer owns offline measurements"
  on public.offline_client_measurements
  for all
  to authenticated
  using ((select auth.uid()) = trainer_id)
  with check ((select auth.uid()) = trainer_id);

drop policy if exists "trainer owns offline strengths" on public.offline_client_strengths;
create policy "trainer owns offline strengths"
  on public.offline_client_strengths
  for all
  to authenticated
  using ((select auth.uid()) = trainer_id)
  with check ((select auth.uid()) = trainer_id);

revoke all on table public.offline_client_measurements from anon;
revoke all on table public.offline_client_strengths from anon;
grant select, insert, update, delete on table public.offline_client_measurements to authenticated, service_role;
grant select, insert, update, delete on table public.offline_client_strengths to authenticated, service_role;

create or replace function public.submit_offline_progress_entry(
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
  v_date date;
  v_note text;
  v_weight numeric;
  v_measurements jsonb := '{}'::jsonb;
  v_key text;
  v_text text;
  v_value numeric;
  v_entry_id uuid;
  v_created_at timestamptz;
  v_entry jsonb;
  v_entries jsonb;
  v_snapshot jsonb;
  v_hour_count integer;
  v_exercise_name text;
  v_exercise_key text;
  v_reps integer;
  v_e1rm numeric;
begin
  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Ссылка недействительна или устарела' using errcode = '22023';
  end if;
  if p_kind not in ('measurement', 'strength') then
    raise exception 'Неизвестный тип записи' using errcode = '22023';
  end if;
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'Проверь данные записи' using errcode = '22023';
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

  select
    (select count(*) from public.offline_client_measurements m
      where m.offline_client_id = v_share.offline_client_id
        and m.entry_source = 'client'
        and m.created_at > now() - interval '1 hour')
    +
    (select count(*) from public.offline_client_strengths st
      where st.offline_client_id = v_share.offline_client_id
        and st.entry_source = 'client'
        and st.created_at > now() - interval '1 hour')
  into v_hour_count;

  if v_hour_count >= 20 then
    raise exception 'Слишком много записей. Попробуй немного позже' using errcode = 'P0001';
  end if;

  begin
    v_date := coalesce(nullif(btrim(p_payload ->> 'date'), ''), current_date::text)::date;
  exception when others then
    raise exception 'Проверь дату' using errcode = '22007';
  end;
  if v_date < current_date - 3650 or v_date > current_date + 1 then
    raise exception 'Дата вне допустимого диапазона' using errcode = '22007';
  end if;

  v_note := nullif(btrim(p_payload ->> 'note'), '');
  if char_length(coalesce(v_note, '')) > 500 then
    raise exception 'Заметка не должна быть длиннее 500 символов' using errcode = '22023';
  end if;

  if p_kind = 'measurement' then
    v_text := nullif(replace(btrim(p_payload ->> 'weight'), ',', '.'), '');
    if v_text is not null then
      if v_text !~ '^[0-9]{1,3}([.][0-9]{1,2})?$' then
        raise exception 'Проверь вес' using errcode = '22023';
      end if;
      v_weight := v_text::numeric;
      if v_weight < 20 or v_weight > 400 then
        raise exception 'Вес должен быть от 20 до 400 кг' using errcode = '22023';
      end if;
      v_weight := round(v_weight, 1);
    end if;

    if p_payload ? 'measurements' and jsonb_typeof(p_payload -> 'measurements') <> 'object' then
      raise exception 'Проверь обхваты' using errcode = '22023';
    end if;

    for v_key, v_text in
      select e.key, replace(btrim(e.value), ',', '.')
      from jsonb_each_text(coalesce(p_payload -> 'measurements', '{}'::jsonb)) as e
    loop
      if not (v_key = any(array['chest','waist','abdomen','hips','thigh','arm','calf'])) then
        raise exception 'Неизвестный обхват' using errcode = '22023';
      end if;
      if v_text !~ '^[0-9]{1,3}([.][0-9]{1,2})?$' then
        raise exception 'Проверь обхваты' using errcode = '22023';
      end if;
      v_value := v_text::numeric;
      if v_value < 10 or v_value > 400 then
        raise exception 'Обхваты должны быть от 10 до 400 см' using errcode = '22023';
      end if;
      v_measurements := v_measurements || jsonb_build_object(v_key, round(v_value, 1));
    end loop;

    if v_weight is null and v_measurements = '{}'::jsonb then
      raise exception 'Добавь вес или хотя бы один обхват' using errcode = '22023';
    end if;

    insert into public.offline_client_measurements (
      offline_client_id, trainer_id, measure_date, weight_kg, measurements, notes,
      entry_source, submitted_via_share_id
    ) values (
      v_share.offline_client_id, v_share.trainer_id, v_date, v_weight, v_measurements, v_note,
      'client', v_share.id
    ) returning id, created_at into v_entry_id, v_created_at;

    v_entry := jsonb_build_object(
      'id', v_entry_id,
      'date', v_date::text,
      'weight', v_weight,
      'measurements', v_measurements,
      'note', v_note,
      'source', 'client',
      'createdAt', v_created_at
    );
    v_entries := case when jsonb_typeof(v_share.snapshot -> 'measurements') = 'array'
      then v_share.snapshot -> 'measurements' else '[]'::jsonb end || jsonb_build_array(v_entry);
    if jsonb_array_length(v_entries) > 160 then
      select coalesce(jsonb_agg(e.value order by e.ordinality), '[]'::jsonb)
      into v_entries
      from jsonb_array_elements(v_entries) with ordinality as e(value, ordinality)
      where e.ordinality > jsonb_array_length(v_entries) - 160;
    end if;
    v_snapshot := jsonb_set(v_share.snapshot, '{measurements}', v_entries, true);
  else
    v_exercise_name := nullif(btrim(p_payload ->> 'exerciseName'), '');
    if v_exercise_name is null or char_length(v_exercise_name) > 120 then
      raise exception 'Выбери упражнение из списка' using errcode = '22023';
    end if;

    v_text := nullif(replace(btrim(p_payload ->> 'weight'), ',', '.'), '');
    if v_text is null or v_text !~ '^[0-9]{1,3}([.][0-9]{1,2})?$' then
      raise exception 'Проверь рабочий вес' using errcode = '22023';
    end if;
    v_weight := round(v_text::numeric, 1);
    if v_weight <= 0 or v_weight > 999 then
      raise exception 'Рабочий вес должен быть от 0,1 до 999 кг' using errcode = '22023';
    end if;

    v_text := nullif(btrim(p_payload ->> 'reps'), '');
    if v_text is null or v_text !~ '^[0-9]{1,2}$' then
      raise exception 'Проверь количество повторений' using errcode = '22023';
    end if;
    v_reps := v_text::integer;
    if v_reps < 1 or v_reps > 30 then
      raise exception 'Для расчёта 1ПМ укажи от 1 до 30 повторений' using errcode = '22023';
    end if;

    select e.value ->> 'key'
    into v_exercise_key
    from jsonb_array_elements(
      case when jsonb_typeof(v_share.snapshot -> 'strengths') = 'array'
        then v_share.snapshot -> 'strengths' else '[]'::jsonb end
    ) as e(value)
    where lower(e.value ->> 'name') = lower(v_exercise_name)
    limit 1;
    v_exercise_key := coalesce(nullif(v_exercise_key, ''), 'client_' || substr(md5(lower(v_exercise_name)), 1, 24));
    v_e1rm := round(case when v_reps = 1 then v_weight else v_weight * (1 + v_reps::numeric / 30) end, 1);

    insert into public.offline_client_strengths (
      offline_client_id, trainer_id, measured_at, exercise_key, exercise_name,
      weight_kg, reps, e1rm, notes, entry_source, submitted_via_share_id
    ) values (
      v_share.offline_client_id, v_share.trainer_id, v_date, v_exercise_key, v_exercise_name,
      v_weight, v_reps, v_e1rm, v_note, 'client', v_share.id
    ) returning id, created_at into v_entry_id, v_created_at;

    v_entry := jsonb_build_object(
      'id', v_entry_id,
      'date', v_date::text,
      'key', v_exercise_key,
      'name', v_exercise_name,
      'weight', v_weight,
      'reps', v_reps,
      'e1rm', v_e1rm,
      'note', v_note,
      'source', 'client',
      'createdAt', v_created_at
    );
    v_entries := case when jsonb_typeof(v_share.snapshot -> 'strengths') = 'array'
      then v_share.snapshot -> 'strengths' else '[]'::jsonb end || jsonb_build_array(v_entry);
    if jsonb_array_length(v_entries) > 300 then
      select coalesce(jsonb_agg(e.value order by e.ordinality), '[]'::jsonb)
      into v_entries
      from jsonb_array_elements(v_entries) with ordinality as e(value, ordinality)
      where e.ordinality > jsonb_array_length(v_entries) - 300;
    end if;
    v_snapshot := jsonb_set(v_share.snapshot, '{strengths}', v_entries, true);
  end if;

  v_snapshot := jsonb_set(v_snapshot, '{version}', to_jsonb(328::integer), true);
  v_snapshot := jsonb_set(v_snapshot, '{generatedAt}', to_jsonb(v_created_at::text), true);

  update public.offline_clients
  set updated_at = v_created_at
  where id = v_share.offline_client_id;

  update public.offline_progress_shares
  set snapshot = v_snapshot,
      updated_at = v_created_at
  where id = v_share.id;

  return jsonb_build_object(
    'data', v_snapshot,
    'updated_at', v_created_at,
    'entry', v_entry
  );
end
$$;

revoke all on function public.submit_offline_progress_entry(text, text, jsonb) from public;
revoke all on function public.submit_offline_progress_entry(text, text, jsonb) from authenticated, service_role;
grant execute on function public.submit_offline_progress_entry(text, text, jsonb) to anon;

notify pgrst, 'reload schema';
