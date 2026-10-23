'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const A=require('../workout-domain.js'),F=require('../focus-flow.js');
const reg=A.registry([]),clone=x=>JSON.parse(JSON.stringify(x));
const {prepareProgramWeights}=require('../program-weight-choice.js');
const {programWeightProfile}=require('../program-weight-policy.js');
const set=(w=0)=>({w,r:'',ok:false,targetRepMin:8,targetRepMax:12,targetRpeMin:7,targetRpeMax:8});
const exercise=(name='Bench')=>({n:name,exerciseId:name,loadType:'external_total',method:'STANDARD',programWeightMode:'adaptive',equipmentProfileId:'machine-a',equipmentProfile:{id:'machine-a',weightStep:2.5},set:[set(),set(),set()]});
const sample=(weight=50,reps=10,rir=2)=>({weight,reps,rir,technique:true,targetReps:reps});
function fixture(){const e=exercise(),current={id:'active',userId:'owner',date:'2026-10-23',started:1000000000000,ex:[e]};return {e,current,target:e.set[0]};}
test('saved constructor supersets expand to distinct exercises and retain their weights and rest',()=>{
 const block={id:'sup',method:'SUPERSET',rounds:3,rpe:8,betweenRest:0,rest:90,items:[{n:'A',sourceId:'a'},{n:'B',sourceId:'b'}],itemSettings:[{w:50,r:12},{w:30,r:8}]};
 const before=JSON.stringify(block),rows=F.programEntries([block]);
 assert.equal(JSON.stringify(block),before);assert.equal(rows.length,2);assert.equal(rows[0].sets.length,3);
 assert.equal(rows[0].sets[0].w,50);assert.equal(rows[1].sets[0].w,30);
 assert.equal(rows[0].transitionSec,0);assert.equal(rows[1].afterGroupRestSec,90);assert.equal(rows[1].method,'STANDARD');
 const p={weeks:[{days:[{ex:[block]}]}]},copy=prepareProgramWeights(p,'auto');
 assert.equal(programWeightProfile(p).mode,'prescribed');assert.equal(programWeightProfile(copy).mode,'autoweight');
 assert.ok(F.programEntries(copy.weeks[0].days[0].ex).every(e=>e.weightMode==='auto'&&e.sets.every(s=>s.w===0)));
 assert.equal(block.itemSettings[0].w,50);
});
test('a superset rotates A1 B1, then A2 B2; a third exercise waits',()=>{
 const s={ex:[{...exercise('A'),superGroup:'pair'},{...exercise('B'),superGroup:'pair'},exercise('C')]};
 assert.deepEqual(F.queue(s).map(F.token),['0:0','1:0','0:1','1:1','0:2','1:2','2:0','2:1','2:2']);
 s.ex[0].set[0].ok=true;assert.equal(F.token(F.next(s)),'1:0');
 s.ex[1].set[0].skipped=true;assert.equal(F.token(F.next(s)),'0:1');
});
test('triset and unequal set counts preserve the real round ending',()=>{
 const s={ex:[{...exercise('A'),superGroup:'tri',transitionSec:10},{...exercise('B'),superGroup:'tri',set:[set()],transitionSec:5},{...exercise('C'),superGroup:'tri',set:[set(),set()],afterGroupRestSec:90}]};
 const rows=F.queue(s);assert.deepEqual(rows.map(F.token),['0:0','1:0','2:0','0:1','2:1','0:2']);
 assert.equal(F.restAfter(s,rows[0],rows[1]).seconds,10);
 assert.equal(F.restAfter(s,rows[2],rows[3]).seconds,90);
 assert.equal(F.restAfter(s,rows.at(-1),null).seconds,90);
});
test('a method group is not mistaken for a superset',()=>{
 const s={ex:[{...exercise('Heavy'),g:'unvrsl'},{...exercise('Light'),g:'unvrsl'}]};
 assert.deepEqual(F.queue(s).map(F.token),['0:0','0:1','0:2','1:0','1:1','1:2']);
});
test('rest values of zero and ranges survive without a generic full-rest fallback',()=>{
 const s={ex:[{...exercise(),rest:90,set:[{...set(),restSeconds:0}]}]};
 assert.equal(F.restAfter(s,F.queue(s)[0]).seconds,0);
 s.ex[0].set[0].restSeconds='60–90';assert.equal(F.restAfter(s,F.queue(s)[0]).seconds,90);
 const pair={ex:[{...exercise('A'),superGroup:'p'},{...exercise('B'),superGroup:'p',rest:90,afterGroupRestSec:0}]};
 assert.equal(F.restAfter(pair,F.queue(pair)[1],F.queue(pair)[2]).seconds,0);
});
test('zero is an unknown load only for empty adaptive resistance, not manual or bodyweight',()=>{
 const {e,target}=fixture();assert.equal(F.needsCalibration(e,target,A,reg),true);
 target.manualOverride=true;assert.equal(F.needsCalibration(e,target,A,reg),false);
 target.manualOverride=false;e.loadType='bodyweight_added';assert.equal(F.needsCalibration(e,target,A,reg),false);
 e.loadType='bodyweight_only';assert.equal(F.needsCalibration(e,target,A,reg),false);
});
test('decimal comma and equal paired weight work; asymmetric pasted pairs are rejected',()=>{
 assert.equal(F.parseWeight('27,5'),27.5);assert.equal(F.parseWeight('25 / 25'),25);
 for(const raw of ['25 / 30','-5','Infinity','','1 / 1 / 1'])assert.equal(F.parseWeight(raw),null);
});
test('calibration rejects missing effort, pain, technique failure and implausible reps',()=>{
 const {e,target,current}=fixture(),attempts=[sample(),{...sample(),rir:''},{...sample(),rir:6},{...sample(),pain:true},{...sample(),technique:false}];
 const ev=A.calibrationSession(e,target,attempts,current,reg,{id:'cal',now:1000000001000});
 assert.equal(ev.ex[0].set.length,1);assert.equal(ev.calibrationAttempts.length,5);
 assert.equal(A.calibrationSession(e,target,[sample(50,21)],current,reg,{id:'invalid'}),null);
});
test('calibration is evidence inside a workout, not extra completed workouts',()=>{
 const {e,target,current}=fixture(),before=JSON.stringify(e);
 const ev=A.calibrationSession(e,target,[sample(),sample(50,9,3)],current,reg,{id:'cal',now:1000000001000});
 current.calibrationSessions=[ev];const sessions=[current],expanded=A.recommendationSessions(sessions,current);
 assert.equal(sessions.length,1);assert.equal(expanded.length,2);
 assert.equal(A.recommendationSessions(expanded,current).length,2);
 assert.equal(JSON.stringify(e),before);assert.equal(ev.ex[0].set[0].equipmentSnapshot.id,'machine-a');
 const restored=clone(current);assert.equal(A.recommendationSessions([restored]).length,2);
});
test('first-session calibration works immediately and does not leak across accounts or equipment',()=>{
 const {e,target,current}=fixture(),ev=A.calibrationSession(e,target,[sample(50,10,2)],current,reg,{id:'cal',now:1000000001000});
 current.calibrationSessions=[ev];const sessions=A.recommendationSessions([],current),r=A.recommend(e,target,current,sessions,reg);
 assert.ok(r.strength.estimate>0);assert.ok(A.recommendationWeight(r)>0);assert.equal(r.series,null);
 assert.equal(A.history(e,sessions,reg,{userId:'other'}).length,0);
 const other={...e,equipmentProfileId:'machine-b',equipmentProfile:{id:'machine-b'}};
 assert.equal(A.recommend(other,target,{...current,ex:[other]},sessions,reg).strength.estimate,null);
});
test('one calibration remains one low-confidence observation across different rep ranges',()=>{
 const {e,target,current}=fixture(),ev=A.calibrationSession(e,target,[sample(),sample(),sample()],current,reg,{id:'cal',now:1000000001000});
 const strength=A.strengthEstimate(e,A.history(e,[ev],reg),reg,[],target);
 assert.equal(strength.sessionCount,1);assert.equal(strength.confidence,'низкая');
 const weights=F.steps.map(n=>{const t={...target,targetRepMin:n,targetRepMax:n,targetRepLabel:String(n)};return A.recommendationWeight(A.recommend(e,t,current,[ev],reg));});
 assert.ok(weights.every(w=>w>0));assert.ok(weights.at(-1)>weights[0]);
});
test('calibration preserves per-leg actual counts and per-dumbbell load units',()=>{
 const {e,target,current}=fixture();Object.assign(e,{n:'Выпады с гантелями',repSide:'leg',loadType:'per_dumbbell',implementCount:2});
 const ev=A.calibrationSession(e,target,[sample(20,'10 / 8',2)],current,reg,{id:'cal',now:1000000001000});
 assert.equal(ev.ex[0].set[0].r,18);assert.equal(A.performedReps(e,ev.ex[0].set[0]),8);
 assert.ok(A.e1rm(e,ev.ex[0].set[0],ev,reg)<40);
});
test('autoweight leaves completed, manually edited and dismissed weights intact',()=>{
 const result={weight:60,canApply:true,proposalKey:'cal'};
 for(const original of [{...set(40),ok:true},{...set(40),manualOverride:true},{...set(40),weightSource:'manual'},{...set(40),dismissedRecommendation:'cal'}]){
  const before=clone(original);assert.equal(A.applyAuto(original,result),false);assert.deepEqual(original,before);
 }
});
