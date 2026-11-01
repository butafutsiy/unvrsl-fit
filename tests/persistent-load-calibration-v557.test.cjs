'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const A=require('../workout-domain.js');
const L=require('../load-calibration-library.js');
const reg=A.registry([]);
const base=()=>({n:'Жим гантелей сидя',exerciseId:'press-db',loadType:'per_dumbbell',method:'STANDARD',
 programWeightMode:'adaptive',equipmentProfileId:'set-a',equipmentProfile:{id:'set-a',weightStep:2},
 set:[{w:0,r:10,ok:false,targetRepMin:8,targetRepMax:12,targetRpeMin:7,targetRpeMax:8},
      {w:0,r:10,ok:false,targetRepMin:8,targetRepMax:12,targetRpeMin:7,targetRpeMax:8}]});
const clone=o=>JSON.parse(JSON.stringify(o));
function probe(e,session,id='cal-1'){
 const attempt={id:'p1',weight:20,reps:'10',rir:2,technique:true,pain:false,targetRepMin:8,targetRepMax:12};
 return A.calibrationSession(e,e.set[0],[attempt],session,reg,{id,now:session.started+120000});
}
test('first-time three-field strength probe becomes reusable e1RM for a later workout',()=>{
 const e=base(),current={id:'first',userId:'athlete',date:'2026-11-01',started:1761980400000,ex:[e]};
 const evidence=probe(e,current),state={accountOwnerId:'athlete',sessions:[],exerciseLoadCalibrations:[]};
 assert.ok(evidence?.isLoadCalibration);
 assert.equal(L.record(state,evidence,'athlete').ok,true);
 const next={id:'second',userId:'athlete',date:'2026-11-02',started:1762066800000,ex:[clone(e)]};
 const sessions=A.recommendationSessions(L.sessions(state,[],next,'athlete'),next);
 const result=A.recommend(next.ex[0],next.ex[0].set[0],next,sessions,reg);
 assert.ok(result.strength.estimate>0);
 assert.ok(A.recommendationWeight(result)>0);
 assert.equal(state.sessions.length,0,'calibration must not produce a fake workout');
 assert.equal(L.stored(state,'athlete').length,1);
});
test('test results match only the correct account and equipment, including same exercise name',()=>{
 const e=base(),cur={id:'c',userId:'owner',date:'2026-11-01',started:1761980400000,ex:[e]};
 const state={accountOwnerId:'owner'};
 L.record(state,probe(e,cur),'owner');
 assert.equal(L.sessions(state,[],null,'other').length,0,'other user must not get this calibration');
 const next={id:'later',userId:'owner',date:'2026-11-02',started:1762066800000,ex:[clone(e)]};
 next.ex[0].equipmentProfileId='machine-b';next.ex[0].equipmentProfile={id:'machine-b',weightStep:2};
 const recommendation=A.recommend(next.ex[0],next.ex[0].set[0],next,L.sessions(state,[],next,'owner'),reg);
 assert.equal(recommendation.strength.estimate,null);
});
test('same probe cannot be double counted inside parent workout and permanent library',()=>{
 const e=base(),parent={id:'first',userId:'owner',date:'2026-11-01',started:1761980400000,ex:[e]};
 const ev=probe(e,parent);parent.calibrationSessions=[ev];const state={accountOwnerId:'owner',sessions:[parent]};
 L.record(state,ev,'owner');const sessions=A.recommendationSessions(L.sessions(state,[parent],parent,'owner'),parent);
 assert.equal(sessions.filter(x=>x.id===ev.id).length,1);
 assert.equal(state.sessions.length,1);
});
test('invalid or unassessed efforts are never treated as strength anchors',()=>{
 const e=base(),parent={id:'first',userId:'owner',date:'2026-11-01',started:1761980400000,ex:[e]};
 const ev=probe(e,parent),state={accountOwnerId:'owner'};
 const bad=clone(ev);bad.id='bad';delete bad.ex[0].set[0].actualRir;delete bad.ex[0].set[0].rir;
 assert.equal(L.record(state,bad,'owner').ok,false);
 const missing=clone(ev);missing.id='missing';missing.ex[0].set[0].w=0;
 assert.equal(L.record(state,missing,'owner').ok,false);
 assert.equal(L.record(state,ev,'owner').ok,true);
 assert.equal(L.record(state,ev,'owner').added,false);
 assert.equal(L.stored(state,'owner').length,1);
});
test('manual planned weights cannot be changed by calibration store',()=>{
 const e=base(),parent={id:'first',userId:'owner',date:'2026-11-01',started:1761980400000,ex:[e]};
 const state={accountOwnerId:'owner'};L.record(state,probe(e,parent),'owner');
 const planned={...e.set[0],w:42,manualOverride:true,weightSource:'manual'};
 const copy=clone(planned);const sessions=L.sessions(state,[],null,'owner');
 const r=A.recommend(e,planned,{id:'future',userId:'owner',date:'2026-11-02',started:1762066800000,ex:[e]},sessions,reg);
 assert.equal(A.applyAuto(planned,r),false);assert.deepEqual(planned,copy);
});
