'use strict';
const assert=require('node:assert/strict');
const {make,wait,errors}=require('./runtime-v392.cjs');
(async()=>{const dom=make();await wait(2200);try{
 const result=await dom.window.eval(`(async()=>{
  const p=ensureProgramShape(buildBuiltinEngineCycle('2026-10-11',null,true,8));p.engineCycleRevision=502;
  // Recreate the persisted pre-v543 profile before storage/cloud hydration.
  for(const wi of [3,5]){const w=p.weeks[wi];w.deload=w.weeklyLoadProfile.deload=true;w.weeklyLoadProfile.base.rpe=[4,6];w.weeklyLoadProfile.base.sets=3;w.weeklyLoadProfile.isolation={pct:[60,70],sets:2,reps:[15,20],rpe:[4,6],rir:[4,6]};w.rpeMin=4;w.rpeMax=6;}
  st.programs.push(p);if(st.current)workoutStore.discard(st);programBeginDayCoreV382(p.id,3,1);await unvrslTrainingPrescriptionSyncV292(true);const activeId=st.current.id;
  const facts=()=>JSON.stringify(st.current.ex.map(e=>({n:e.n,set:e.set.map(s=>({w:s.w,r:s.r,ok:s.ok}))})));const current=facts(),history=JSON.stringify(st.sessions);
  window.dispatchEvent(new Event('unvrsl:storage-hydrated'));await new Promise(r=>setTimeout(r,100));
  const migrated=p.weeks[3].percentageTableRevision===543;const preserved=st.current.id===activeId&&facts()===current&&JSON.stringify(st.sessions)===history;
  window.dispatchEvent(new Event('unvrsl:history-updated'));await new Promise(r=>setTimeout(r,100));const idempotent=WorkoutDomain.upgradePercentageWeeks(p)===false;
  workoutStore.discard(st);programBeginDayCoreV382(p.id,3,1);await unvrslTrainingPrescriptionSyncV292(true);
  const profile=st.current.weeklyLoadProfile,bench=st.current.ex.filter(e=>e.exerciseId==='canon:bench_press');
  const benchEffort=bench.flatMap(e=>e.set.map(s=>[s.targetRpeMin,s.targetRpeMax]));
  return {migrated,preserved,idempotent,base:profile.base,iso:profile.isolation,deload:st.current.deload,benchEffort};
 })()`);
 assert.ok(result.migrated&&result.preserved&&result.idempotent,JSON.stringify(result));assert.equal(result.deload,false);
 assert.equal(result.base.sets,4);assert.deepEqual(Array.from(result.base.rpe),[6,8]);assert.deepEqual(Array.from(result.iso.pct),[80,85]);assert.equal(result.iso.sets,3);
 assert.ok(result.benchEffort.every(a=>a[0]===6&&a[1]===8));assert.deepEqual(errors,[]);
 console.log('Saved-cycle event migration, idempotence, active/history protection and W4 launch targets passed');
 }finally{dom.window.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
