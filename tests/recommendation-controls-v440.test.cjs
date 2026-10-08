'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const A=require('../workout-domain');
const reg=A.registry([{id:'row',n:'Тяга',type:'compound',loadType:'external_total'},{id:'curl',n:'Сгибание',type:'isolation',loadType:'external_total'}]);
const ex=(set,extra={})=>({n:'Тяга',set,...extra});
const set=(w,r,rpe,extra={})=>({w,r,rpe,ok:true,...extra});
const past=(id,date,sets,extra={})=>({id,date,started:Date.parse(date),ended:Date.parse(date)+1000,ex:[ex(sets,extra)]});
const history=[past('a','2026-09-08',[set(102.5,6,7),set(102.5,6,8),set(102.5,6,9),set(102.5,6,10)]),past('b','2026-09-16',[set(82.5,12),set(82.5,12),set(82.5,12)])];
test('older effort evidence remains usable when latest workout has no RPE',()=>{
 const e=ex([{w:102.5,programW:102.5,r:'',targetRepMin:4,targetRepMax:6}]);
 const s={id:'today',date:'2026-09-27',ex:[e],programWeekIntensityMin:80,programWeekIntensityMax:85,programWeekRpeMin:8,programWeekRpeMax:9};
 const r=A.recommend(e,e.set[0],s,history,reg);
 assert.equal(r.planPreserved,false);assert.ok(r.weight>=82.5*.9&&r.weight<=82.5*1.075);assert.equal(r.strength.setCount,7);
 const buckets=Object.values(r.strength.protocols);const mean=buckets.reduce((n,b)=>n+b.weight*b.estimate,0)/buckets.reduce((n,b)=>n+b.weight,0);
 assert.equal(Number(mean.toFixed(1)),r.strength.estimate);
});
test('three test attempts and matching backoffs survive reload, stop and correction',()=>{
 const first={w:100,r:1,plannedReps:1,role:'test_attempt',ok:false};
 const e=ex([first,{w:70,r:5,role:'backoff',ok:false}]);const s={id:'test',ex:[e]};
 A.prepareTestBlocks(s,reg);assert.equal(e.set.length,6);
 assert.equal(A.prepareTestBlocks(s,reg),false);
 Object.assign(first,{ok:true,r:1,rpe:10});A.prepareTestBlocks(s,reg);
 assert.equal(e.set.filter(x=>!x.testOmitted&&A.setRole(e,x)==='backoff').length,1);
 assert.equal(e.set.filter(x=>x.testOmitted&&A.setRole(e,x)==='test_attempt').length,2);
 first.rpe=8;A.prepareTestBlocks(s,reg);assert.equal(e.set.filter(x=>x.testOmitted).length,0);
 const restored=JSON.parse(JSON.stringify(s));assert.equal(A.prepareTestBlocks(restored,reg),false);
});
test('isolation test checks working range, holds TARGET, and uses actual result for backoffs',()=>{
 const e=ex([{w:40,r:'',targetRepMin:10,targetRepMax:12,plannedReps:12,ok:false}],{n:'Сгибание',type:'isolation',testMode:'isolation'});
 const s={id:'iso',ex:[e]};A.prepareTestBlocks(s,reg);assert.equal(e.set.length,6);
 const h=[{...past('iso-old','2026-09-10',[]),ex:[{...e,set:[set(40,12,8)]}]}];
 const before=A.recommend(e,e.set[0],s,h,reg);assert.equal(before.repRange.lo,10);assert.ok(before.weight<45);
 Object.assign(e.set[0],{w:40,r:12,rpe:8.5,ok:true});
 assert.equal(A.recommend(e,e.set[1],s,h,reg).weight,40);
 const back=A.recommend(e,e.set[3],s,h,reg);assert.equal(back.weight,35);
});
test('dismissal survives serialization and blocks auto until evidence changes; manual protected',()=>{
 const e=ex([{w:100,r:5,targetRpe:8}]);const s={id:'current',ex:[e]};
 const r=A.recommend(e,e.set[0],s,history,reg);e.set[0].dismissedRecommendation=r.proposalKey;
 const restored=JSON.parse(JSON.stringify(s));const rs=restored.ex[0].set[0];
 assert.equal(A.applyAuto(rs,A.recommend(restored.ex[0],rs,restored,history,reg)),false);assert.equal(rs.w,100);
 restored.ex[0].set.unshift(set(100,5,8));const next=A.recommend(restored.ex[0],rs,restored,history,reg);
 assert.notEqual(next.proposalKey,r.proposalKey);assert.equal(A.applyAuto(rs,next),true);
 rs.weightSource='manual';assert.equal(A.applyAuto(rs,{weight:200}),false);
});

test('wellbeing never increases load; actual performance takes priority',()=>{
 const e=ex([{w:100,programW:100,r:5,targetRpe:8}]);
 const s={id:'ready',ex:[e],trainingReadinessDone:true,readinessAdjusted:true,readiness:{factor:1.1,manual:true}};
 const r=A.recommend(e,e.set[0],s,[],reg);assert.equal(r.weight,100);A.applyAuto(e.set[0],r);
 assert.equal(A.recommend(e,e.set[0],s,[],reg).weight,100);
 e.set.unshift(set(100,5,8));const live=A.recommend(e,e.set[1],s,[],reg);
 assert.equal(live.nextSetSuggestion.weight,100);assert.equal(live.wellbeingApplied,false);
});
