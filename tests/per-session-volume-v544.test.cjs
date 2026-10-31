'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const A = require('../workout-domain.js');

const source = (kind, indices, extra={})=>({
  n:kind==='base'?'Жим штанги':'Сгибание рук',kind,method:'STANDARD',
  dayIndices:indices,sets:[{w:kind==='base'?80:30,r:8}],...extra
});
function plan(){
  return A.generateCycle({weeks:8,daysPerWeek:3,startDate:'2026-10-11',
    exercises:[source('base',[0,1,2]),source('isolation',[0,2])]});
}
test('W1 prescriptions match the agreed percentages and mirrored set volume',()=>{
  assert.deepEqual(A.bandPrescription([70,75]),{pct:[70,75],sets:4,reps:[12,15],rpe:[7,8],rir:[2,3]});
  assert.deepEqual(A.bandPrescription([70,75],true),{pct:[70,75],sets:4,reps:[10,12],rpe:[8,9],rir:[1,2]});
  for(const [pct,sets,reps] of [[[60,65],4,[15,20]],[[75,80],4,[10,12]],[[80,85],3,[8,10]],[[85,88],3,[6,8]],[[88,90],3,[4,6]],[[90,95],2,[2,3]],[[95,100],2,[1,2]]]){
    assert.equal(A.bandPrescription(pct).sets,sets);assert.deepEqual(A.bandPrescription(pct).reps,reps);
    assert.equal(A.bandPrescription(pct,true).sets,sets);
  }
});
test('ordinary exercises receive all sets on each day, not a shared weekly pool',()=>{
  const p=plan(),w=p.weeks[0];
  assert.deepEqual(w.days.map(d=>d.ex.filter(e=>e.kind==='base').map(e=>e.sets.length)),[[4],[4],[4]]);
  assert.deepEqual(w.days.map(d=>d.ex.filter(e=>e.kind==='isolation').map(e=>e.sets.length)),[[4],[],[4]]);
  assert.equal(w.days[0].ex[0].weeklySets,12);
});
test('explicit weekly volume override still splits the specified weekly total',()=>{
  const p=A.generateCycle({weeks:4,daysPerWeek:3,startDate:'2026-10-11',
    exercises:[source('base',[0,1,2],{weeklySetsOverride:4})]});
  assert.deepEqual(p.weeks[0].days.map(d=>d.ex[0].sets.length),[2,1,1]);
});
test('saved automatic split templates migrate once without affecting history or manual weights',()=>{
  const p=plan(),w=p.weeks[0],history={id:'saved',ex:[{n:'Жим штанги',set:[{w:80,r:8,ok:true}]}]};
  w.weeklyLoadProfile.base={...w.weeklyLoadProfile.base,reps:[10,12]};
  w.weeklyLoadProfile.isolation={...w.weeklyLoadProfile.isolation,sets:3};
  const base=w.days.flatMap(d=>d.ex.filter(e=>e.kind==='base'));
  const iso=w.days.flatMap(d=>d.ex.filter(e=>e.kind==='isolation'));
  base.forEach((e,i)=>{e.sets=e.sets.slice(0,[2,1,1][i]);e.weeklySets=4;});
  iso.forEach((e,i)=>{e.sets=e.sets.slice(0,[2,1][i]);e.weeklySets=3;});
  base[0].sets[0].w=97.5;
  p.sessions=[structuredClone(history)];
  assert.equal(A.upgradeSessionVolume(p),true);
  assert.deepEqual(base.map(e=>e.sets.length),[4,4,4]);
  assert.deepEqual(iso.map(e=>e.sets.length),[4,4]);
  assert.equal(base[0].sets[0].w,97.5);
  assert.deepEqual(base[0].sets[0].targetRepMin,12);
  assert.deepEqual(p.sessions,[history]);
  const snapshot=structuredClone(p);
  assert.equal(A.upgradeSessionVolume(p),false);
  assert.deepEqual(p,snapshot);
});
test('authored cycle, custom set count and special method are untouched by migration',()=>{
  const p=plan();
  p.cycleOptions.periodizationMode='manual';
  const before=structuredClone(p);
  assert.equal(A.upgradeSessionVolume(p),false);
  assert.deepEqual(p,before);
  const q=plan();
  const day=q.weeks[0].days[0];
  day.ex[0].sets=[{w:100,r:6}];
  day.ex[0].cycleManaged=false;
  const keep=structuredClone(day.ex[0].sets);
  A.upgradeSessionVolume(q);
  assert.deepEqual(day.ex[0].sets,keep);
});
