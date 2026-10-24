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








test('unknown effort saves facts but cannot change AUTO weight',async()=>{
  const s=current(),h=past(20,[10,10,10],['','','']);s.ex[0].programWeightMode='adaptive';
  const r=rec(s,[h]);assert.equal(r.canApply,false);assert.equal(A.applyAuto(s.ex[0].set[0],r),false);
  const ctx={WorkoutDomain:A,workoutRegistry:reg,st:{current:s,sessions:[h],exerciseWeightProfiles:{}},save(){},window:{addEventListener(){}}};
  vm.runInNewContext(fs.readFileSync(require.resolve('../training-load-model.js'),'utf8'),ctx);
  await Promise.resolve();assert.equal(s.ex[0].set[0].w,80);assert.equal(s.ex[0].set[0].weightSource,undefined);
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
