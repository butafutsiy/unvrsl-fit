'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),D=require('../workout-domain');
function legacy(){
 const p=D.generateCycle({weeks:8,daysPerWeek:2,startDate:'2026-10-11',exercises:[{id:'bench',exerciseId:'bench',n:'Жим',kind:'base',dayIndices:[0,1],sets:[{w:0,r:10}]},{id:'curl',exerciseId:'curl',n:'Сгибание рук',kind:'isolation',dayIndices:[0],sets:[{w:'',r:15}]}]});
 for(const i of [3,5]){const w=p.weeks[i];w.deload=w.weeklyLoadProfile.deload=true;w.weeklyLoadProfile.base={pct:w.weeklyLoadProfile.pct,sets:3,reps:[10,12],rpe:[4,6],rir:[4,6]};w.weeklyLoadProfile.isolation={pct:[60,70],sets:2,reps:[15,20],rpe:[4,6],rir:[4,6]};w.rpeMin=4;w.rpeMax=6;for(const d of w.days)for(const e of d.ex)if(e.kind==='isolation')e.sets.forEach(s=>s.w='');}
 return p;
}
test('saved low-percentage weeks migrate once, split the weekly budget and preserve zero/auto weights and IDs',()=>{
 const p=legacy(),before=structuredClone(p);assert.equal(D.upgradePercentageWeeks(p),true);
 for(const i of [3,5]){
  const w=p.weeks[i],base=w.days.flatMap(d=>d.ex.filter(e=>e.exerciseId==='bench'));
  assert.equal(w.deload,false);assert.deepEqual(w.weeklyLoadProfile.base,D.bandPrescription(w.weeklyLoadProfile.pct));
  assert.deepEqual(base.map(e=>e.sets.length),[2,2]);assert.ok(base.every(e=>e.sets.every(s=>s.w===0&&s.targetRpeMin===6&&s.targetRpeMax===8)));
  const iso=w.days[0].ex.find(e=>e.exerciseId==='curl');assert.equal(iso.sets.length,4);assert.ok(iso.sets.every(s=>s.w===''&&s.targetRpeMin===8&&s.targetRpeMax===9));
  assert.equal(base[0].id,before.weeks[i].days[0].ex[0].id);
 }
 assert.deepEqual(p.weeks[0],before.weeks[0]);assert.deepEqual(p.weeks[7],before.weeks[7]);
 const once=structuredClone(p);assert.equal(D.upgradePercentageWeeks(p),false);assert.deepEqual(p,once);
});
test('saved authored method rounds retain their reps/loads and receive the percentage effort target',()=>{
 const p=legacy(),e=p.weeks[3].days[0].ex[0];e.method='SLDR';e.cycleManaged=false;e.reps={mode:'method'};e.sets=Array.from({length:9},(_,i)=>({w:40,r:[12,10,8][i%3],rest:i%3===2?75:15}));
 const before=structuredClone(e.sets);D.upgradePercentageWeeks(p);assert.equal(e.sets.length,9);
 assert.deepEqual(e.sets.map(({w,r,rest})=>({w,r,rest})),before);assert.ok(e.sets.every(s=>s.targetRpeMin===6&&s.targetRpeMax===8));
});
test('manual cycles/weeks and manual exercise effort/reps are retained',()=>{
 const p=legacy();p.cycleOptions.periodizationMode='manual';const before=structuredClone(p);assert.equal(D.upgradePercentageWeeks(p),false);assert.deepEqual(p,before);
 const q=legacy();q.weeks[3].loadProfileManual=true;const week=structuredClone(q.weeks[3]);const e=q.weeks[5].days[0].ex[0];e.parameterOverrides={effort:{mode:'manual'},reps:{mode:'manual'}};e.rpe=9;e.sets.forEach(s=>Object.assign(s,{r:5,targetRpeMin:9,targetRpeMax:9,targetRepMin:5,targetRepMax:5}));
 D.upgradePercentageWeeks(q);assert.deepEqual(q.weeks[3],week);assert.equal(e.rpe,9);assert.ok(e.sets.every(s=>s.r===5&&s.targetRpeMin===9&&s.targetRepMin===5));
});
