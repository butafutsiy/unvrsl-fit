const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const publicJs=read('public-progress-v321.js');
const offlineJs=read('offline-progress-v321.js');
const free=read('client-free-workout-v334.js');
const migration=read('supabase-migrations/20260909_offline_weight_goal_history_v334.sql');

test('offline progress exposes a weight goal in both trainer and shared views',()=>{
  assert.match(offlineJs,/targetWeight:N\(data\?\.client\?\.target_weight_kg\)/);
  assert.match(publicJs,/ppProfileTargetWeight/);
  assert.match(publicJs,/update_offline_progress_profile_v334/);
  assert.match(migration,/add column if not exists target_weight_kg numeric/);
});

test('measurement deletion keeps trainer and client ownership boundaries',()=>{
  assert.match(publicJs,/delete_offline_progress_measurement_v334/);
  assert.match(migration,/v_source <> 'trainer'/);
  assert.match(migration,/v_entry\.entry_source = 'client'/);
  assert.match(migration,/v_entry\.submitted_via_share_id = v_share\.id/);
  assert.match(migration,/revoke all on function public\.delete_offline_progress_measurement_v334/);
});

test('online clients can build a free workout from the shared exercise catalog',()=>{
  assert.match(free,/catalogRecords/);
  assert.match(free,/UNVRSL_EXERCISE_PICKER_V331/);
  assert.match(free,/Свободная тренировка/);
  assert.match(free,/beginProgramDay/);
  assert.match(free,/ownerUserId:userId\(\)/);
  assert.match(free,/weightMode:item\.weight>0\?'manual':'auto'/);
});
