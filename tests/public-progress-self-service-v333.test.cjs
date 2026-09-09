const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const publicJs=fs.readFileSync(path.join(root,'public-progress-v321.js'),'utf8');
const offlineJs=fs.readFileSync(path.join(root,'offline-progress-v321.js'),'utf8');
const migration=fs.readFileSync(path.join(root,'supabase-migrations/20260909_offline_progress_self_service_v333.sql'),'utf8');

test('shared progress page uses the active session to identify trainer entries',()=>{
  assert.match(publicJs,/persistSession:true/);
  assert.match(publicJs,/get_offline_progress_share_v333/);
  assert.match(publicJs,/submit_offline_progress_entry_v333/);
  assert.match(publicJs,/sourceBadge\(actorSource\)/);
  assert.match(migration,/auth\.uid\(\)\) = v_share\.trainer_id then 'trainer' else 'client'/);
});

test('client gets the same quick actions and safe profile editor',()=>{
  assert.match(publicJs,/＋ Вес и замеры/);
  assert.match(publicJs,/＋ Силовой показатель/);
  assert.match(publicJs,/publicProgressProfileV333/);
  assert.match(publicJs,/update_offline_progress_profile_v333/);
  assert.match(migration,/set display_name = v_name,[\s\S]*sex = v_sex,[\s\S]*birth_date = v_birth,[\s\S]*height_cm = v_height/);
  assert.doesNotMatch(migration,/set[\s\S]{0,120}sessions_remaining/);
  assert.doesNotMatch(migration,/set[\s\S]{0,120}notes\s*=/);
});

test('newly shared snapshots contain editable profile fields',()=>{
  assert.match(offlineJs,/client:\{name:[\s\S]*sex:[\s\S]*birthDate:[\s\S]*height:/);
  assert.match(offlineJs,/REV=333/);
});

test('new RPCs require a valid private share and are limited to anon and authenticated roles',()=>{
  assert.match(migration,/token_hash = lower\(p_token_hash\)/);
  assert.match(migration,/revoked_at is null/);
  assert.match(migration,/expires_at > now\(\)/);
  assert.match(migration,/revoke all on function public\.update_offline_progress_profile_v333\(text, jsonb\) from public/);
  assert.match(migration,/grant execute on function public\.update_offline_progress_profile_v333\(text, jsonb\) to anon, authenticated/);
});
