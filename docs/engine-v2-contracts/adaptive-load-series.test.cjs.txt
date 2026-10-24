'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const A=require('../workout-domain');
const reg=A.registry([]);
const set=(w,r=9,rpe=8,extra={})=>({w,r,rpe,ok:true,targetRepMin:8,targetRepMax:10,targetRpeMin:7,targetRpeMax:8,...extra});
const exercise=(sets,extra={})=>({n:'Жим штанги',type:'compound',loadType:'external_total',set:sets,...extra});
const past=(i,reps=[10,9,8],efforts=[8,8,8],w=80,extra={})=>({id:'past-'+i,started:Date.UTC(2026,8,i),ended:Date.UTC(2026,8,i)+3600000,
  ex:[exercise(reps.map((r,j)=>set(w,r,efforts[j])))],...extra});
const current=(count=3,w=80,extra={})=>({id:'current',started:Date.UTC(2026,9,1),ex:[exercise(Array.from({length:count},()=>set(w,'','',{ok:false})))],...extra});
const rec=(s,h,index=0)=>A.recommend(s.ex[0],s.ex[0].set[index],s,h,reg);

test('a full on-target series holds the load and offers one total rep',()=>{
  const r=rec(current(),[past(20)]);
  assert.equal(r.weight,80);assert.equal(r.action,'hold');assert.equal(r.repetitionGoal,28);
  assert.equal(r.analogousSessionId,'past-20');
});
test('one genuinely easy full series can increase through e1RM, without two mastered workouts',()=>{
  const r=rec(current(),[past(20,[10,9,9],[6,6,6])]);
  assert.ok(r.weight>80&&r.weight<=84);assert.equal(r.series.easier,true);
});
test('one late miss holds; repeated complete comparable misses reduce next-session load',()=>{
  const bad=past(20,[10,8,6],[8,8,10]);
  assert.equal(rec(current(),[bad]).weight,80);
  const r=rec(current(),[bad,past(10,[10,8,6],[8,8,10])]);
  assert.equal(r.weight,77.5);assert.ok(r.reasonCodes.includes('REPEATED_SERIES_MISS'));
});
test('an incomplete easy series cannot authorise a heavier start',()=>{
  const h=past(20,[10,10,10],[6,6,6]);h.ex[0].set[2].ok=false;h.ex[0].set[2].skipped=true;
  const r=rec(current(),[h]);assert.equal(r.weight,80);assert.equal(r.series.full,false);
  const before=r.proposalKey;h.ex[0].set[2].ok=true;h.ex[0].set[2].skipped=false;
  assert.notEqual(rec(current(),[h]).proposalKey,before);
});
test('adding planned sets is a changed workload, not proof that a shorter series was mastered',()=>{
  const r=rec(current(4),[past(20,[10,10,10],[6,6,6])]);
  assert.equal(r.weight,80);assert.equal(r.series.expected,4);
});
test('changed rep task still uses e1RM and is not double rewarded',()=>{
  const s=current();s.ex[0].set.forEach(x=>Object.assign(x,{targetRepMin:5,targetRepMax:7,targetRpeMin:8,targetRpeMax:9}));
  const r=rec(s,[past(20,[12,12,12],[8,8,8])]);
  assert.ok(r.weight>80);assert.ok(r.reasonCodes.includes('TARGET_REBASE'));
  assert.ok(r.weight<=105); // The formula changes the task once, rather than adding a bonus step.
});
test('coarse equipment increments cannot turn a slight improvement into a 20% jump',()=>{
  const s=current(3,10),h=past(20,[10,10,10],[6,6,6],10);
  for(const ex of [s.ex[0],h.ex[0]]){ex.loadType='per_dumbbell';ex.weightProfile={available:[10,12,14],step:2};}
  const older=JSON.parse(JSON.stringify(h));older.id='older';older.started-=86400000;
  const r=rec(s,[h,older]);assert.equal(r.weight,10);assert.ok(r.reasonCodes.includes('STEP_LIMIT'));
  s.ex[0].set[0]=set(10,10,5);assert.equal(rec(s,[h],1).nextSetSuggestion.weight,10);
});
test('unknown effort saves facts but cannot change AUTO weight',async()=>{
  const s=current(),h=past(20,[10,10,10],['','','']);s.ex[0].programWeightMode='adaptive';
  const r=rec(s,[h]);assert.equal(r.canApply,false);assert.equal(A.applyAuto(s.ex[0].set[0],r),false);
  const ctx={WorkoutDomain:A,workoutRegistry:reg,st:{current:s,sessions:[h],exerciseWeightProfiles:{}},save(){},window:{addEventListener(){}}};
  vm.runInNewContext(fs.readFileSync(require.resolve('../training-load-model.js'),'utf8'),ctx);
  await Promise.resolve();assert.equal(s.ex[0].set[0].w,80);assert.equal(s.ex[0].set[0].weightSource,undefined);
});
test('unknown live effort does not infer failure effort from repetitions',()=>{
  const s=current();s.ex[0].set[0]=set(80,5,'');
  assert.equal(rec(s,[past(20)],1).nextSetSuggestion.weight,80);
});
test('today performance changes the next set, not the historical strength baseline',()=>{
  const s=current(),h=[past(20)];const before=rec(s,h);
  s.ex[0].set[0]=set(80,5,10);const after=rec(s,h,1);
  assert.equal(after.strength.estimate,before.strength.estimate);
  assert.equal(after.weight,before.weight);assert.ok(after.nextSetSuggestion.weight<80);
});
test('readiness is applied once and survives applying and serializing the recommendation',()=>{
  const s=current(3,80,{trainingReadinessDone:true,readinessAdjusted:true,readiness:{factor:.925}}),h=[past(20)];
  const first=rec(s,h);assert.ok(first.weight<80);A.applyAuto(s.ex[0].set[0],first);
  const restored=JSON.parse(JSON.stringify(s));assert.equal(rec(restored,h).weight,first.weight);
});
test('personal forecast correction requires repeated forward-only evidence and remains bounded',()=>{
  const h=[80,82.5,85,87.5,90].map((w,i)=>past(5+i*4,[9,9,9],[8,8,8],w));
  const s=current(3,90);const before=JSON.stringify(h),r=rec(s,h);
  assert.equal(r.calibration.samples,3);assert.equal(r.calibration.applied,true);
  assert.ok(r.calibration.factor>1&&r.calibration.factor<=1.025);
  assert.equal(rec(s,h.slice(0,4)).calibration.applied,false);
  assert.equal(JSON.stringify(h),before);
  const future=past(31,[9,9,9],[8,8,8],180,{started:Date.UTC(2026,10,1)});
  assert.deepEqual(rec(s,[future,...h]).calibration,r.calibration);
});
test('personal calibration cannot transfer from another equipment profile or method',()=>{
  const h=[80,82.5,85,87.5,90].map((w,i)=>past(5+i*4,[9,9,9],[8,8,8],w));
  h.forEach(x=>x.ex[0].equipmentProfileId='machine-A');
  const s=current();s.ex[0].equipmentProfileId='machine-B';
  assert.equal(rec(s,h).calibration.applied,false);
  delete s.ex[0].equipmentProfileId;h.forEach(x=>{delete x.ex[0].equipmentProfileId;x.ex[0].method='FST-7';});
  assert.equal(rec(s,h).calibration.applied,false);
});
test('lower effort at the same weight and reps is not falsely labelled a plateau',()=>{
  const h=[past(5,[9,9,9],[9,9,9]),past(10,[9,9,9],[8.5,8.5,8.5]),past(15,[9,9,9],[8,8,8]),past(20,[9,9,9],[7.5,7.5,7.5])];
  assert.notEqual(rec(current(),h).trend,'plateau');
});
test('manual values and declined proposals remain protected',()=>{
  const s=current(),r=rec(s,[past(20,[10,10,10],[6,6,6])]);
  s.ex[0].set[0].manualOverride=true;assert.equal(A.applyAuto(s.ex[0].set[0],r),false);
  delete s.ex[0].set[0].manualOverride;s.ex[0].set[0].dismissedRecommendation=r.proposalKey;
  assert.equal(A.applyAuto(s.ex[0].set[0],r),false);
  assert.equal(s.ex[0].set[0].w,80);
});
