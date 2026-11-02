'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const D=require('../workout-domain');
const S=require('../strength-analytics');

const reg=D.registry([{id:'bench',n:'Жим штанги',type:'compound',loadType:'external_total'}]);
const evidence=(values)=>values.map((estimate,i)=>({
  sessionId:'day-'+i,date:`2026-10-${String(2+i*5).padStart(2,'0')}`,
  estimate,confidenceWeight:1,tier:'heavy'
}));
const rolling=values=>D.currentStrengthEstimate(evidence(values),{nowMs:Date.parse('2026-10-31')});

test('two credible strong workouts resist two anomalous drops without locking a historic peak',()=>{
  const x=rolling([150,151,139,137]);
  assert.equal(x.sessionCount,3,'the current 1RM uses three recent days; older days only confirm stability');
  assert.equal(x.stabilityFloorApplied,true);
  assert.ok(x.estimate>=147&&x.estimate<151);
  assert.equal(x.declineConfirmed,false);
  assert.ok(x.trainingMax>0&&x.trainingMax<x.estimate);
});

test('three consecutive comparable poor workouts release the strength guard',()=>{
  const x=rolling([150,151,139,137,136]);
  assert.equal(x.declineConfirmed,true);
  assert.equal(x.stabilityFloor,null);
  assert.equal(x.stabilityFloorApplied,false);
  assert.ok(x.estimate<147);
});

test('an older low estimate must not downgrade a confirmed single from 90% TM to 85%',()=>{
  const dates=['2026-09-12','2026-09-21','2026-10-07','2026-10-21'];
  const values=[82.3,93.3,110,98.7];
  const x=D.currentStrengthEstimate(values.map((estimate,i)=>({
    sessionId:'s'+i,date:dates[i],estimate,confidenceWeight:1,tier:'heavy',
    confirmedSingle:i===2?100:null
  })),{nowMs:Date.parse('2026-11-02')});
  assert.equal(x.estimate,100);
  assert.equal(x.trainingMax,90);
  assert.equal(x.confidence,'средняя');
});

test('one isolated peak cannot establish a strong-day protection floor',()=>{
  const x=rolling([150,166,145,144]);
  assert.ok(x.stabilityFloor==null||x.stabilityFloor<145);
  assert.ok(x.estimate<155);
});

test('light/auxiliary evidence never updates a calibrated full-strength baseline',()=>{
  const full=evidence([150,151]);
  const aux={sessionId:'recovery',date:'2026-10-20',estimate:110,confidenceWeight:.2,tier:'auxiliary'};
  const a=D.currentStrengthEstimate(full,{nowMs:Date.parse('2026-10-31')});
  const b=D.currentStrengthEstimate([...full,aux],{nowMs:Date.parse('2026-10-31')});
  assert.equal(a.estimate,b.estimate);
});

function set(weight=80,reps=9,rpe=8,extra={}){
  return {w:weight,r:reps,rpe,ok:true,targetRepMin:8,targetRepMax:10,targetRpeMin:7,targetRpeMax:8,...extra};
}
function ex(sets){return {exerciseId:'bench',n:'Жим штанги',type:'compound',loadType:'external_total',set:sets};}
function prior(day,reps=5,rpe=10){
  const date=`2026-09-${String(day).padStart(2,'0')}`;
  return {id:'past-'+day,date,started:Date.parse(date+'T10:00:00Z'),
    ended:Date.parse(date+'T11:00:00Z'),ex:[ex([set(80,reps,rpe),set(80,reps,rpe),set(80,reps,rpe)])]};
}
function now(){
  return {id:'current',date:'2026-10-01',started:Date.parse('2026-10-01T10:00:00Z'),
    ex:[ex([set(80,'','',{ok:false}),set(80,'','',{ok:false}),set(80,'','',{ok:false})])]};
}
test('a single failed session holds next-session weight, two failures lower by just one step',()=>{
  let c=now(),r=D.recommend(c.ex[0],c.ex[0].set[0],c,[prior(20)],reg);
  assert.equal(r.weight,80);
  assert.ok(r.reasonCodes.includes('UNCONFIRMED_DECLINE'));
  c=now();r=D.recommend(c.ex[0],c.ex[0].set[0],c,[prior(20),prior(10)],reg);
  assert.equal(r.weight,77.5);
  assert.ok(r.reasonCodes.includes('REPEATED_WEAK_SERIES'));
});

test('technique failure, pain and incompatible RPE/RIR cannot influence strength evidence',()=>{
  const x=ex([
    set(80,5,8),
    set(250,5,8,{techniqueFailed:true}),
    set(200,5,8,{painReported:true}),
    set(180,5,9,{rir:5}),
  ]);
  const sess={id:'s',date:'2026-10-01',ended:1,ex:[x]};
  const r=D.strengthEstimate(x,x.set.map(s=>({exercise:x,set:s,session:sess})),reg);
  assert.equal(r.points.length,1);
  assert.ok(r.estimate<100);
  const [history]=S.build([sess],reg,[],D,{now:new Date('2026-10-03T12:00:00Z')});
  assert.equal(history.strengthEvidenceCount,1);
  assert.equal(history.points[0].sets,4,'unsafe results remain visible in the historical chart');
});

test('manual weight is preserved even if the guard suggests a change',()=>{
  const c=now(),rec=D.recommend(c.ex[0],c.ex[0].set[0],c,[prior(20),prior(10)],reg);
  const value=c.ex[0].set[0];value.manualOverride=true;
  assert.equal(D.applyAuto(value,rec),false);
  assert.equal(value.w,80);
});
