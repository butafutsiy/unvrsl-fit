"use strict";
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const engine = require('../adaptive-load');
const base = {weight:100, actualReps:9, actualRir:0, targetRepMin:10,
  targetRepMax:10, targetRirMin:2, targetRirMax:2, step:2.5};
const adjust = changes => engine.adjust({...base,...changes});

test('every cell of the specification RIR matrix is reproducible', () => {
  const expected = [[92.5,95,97.5,100,100],[95,97.5,100,100,100],
    [97.5,100,100,100,102.5],[100,100,100,102.5,105],[100,100,102.5,105,105]];
  expected.forEach((row,i)=>row.forEach((weight,rir)=>{
    assert.equal(adjust({actualReps:8+i,actualRir:rir}).weight,weight);
  }));
});
test('pain takes priority over missing and invalid numeric data', () => {
  for (const input of [{}, {weight:null}, {actualReps:null}, {targetRirMin:null}])
    assert.equal(engine.adjust({...input,pain:true}).action,'stop');
});
test('invalid targets cannot request a weight change', () => {
  for (const input of [{targetRirMin:-1}, {targetRepMin:2.5}, {min:-5},
    {actualReps:true}, {weight:'   '}]) {
    assert.equal(adjust(input).action,'hold');
    assert.equal(adjust(input).confidence,'none');
  }
});
test('deload blocks increases, but permits a necessary reduction', () => {
  assert.equal(adjust({actualReps:12,actualRir:4,deload:true}).action,'hold');
  assert.equal(adjust({deload:true}).action,'down');
  assert.equal(adjust({incomplete:true}).action,'hold');
});
test('lever machine transforms effective load back to weight per side', () => {
  const input={weight:40,loadType:'per_side',loadedSides:2,implementWeight:40};
  const r=adjust(input);
  assert.equal(r.weight,37.5);
  assert.ok(Math.abs(r.percentChange-((37.5*2+40)/120-1)*100)<1e-5);
  assert.equal(adjust({...input,loadedSides:null}).action,'hold');
});

function fixture(extra={},setExtra={}) {
  const ctx={console,setTimeout:()=>0,module:{exports:{}}}; ctx.globalThis=ctx;
  for (const name of ['adaptive-load.js','workout-domain.js','performance-control.js']) {
    ctx.module={exports:{}};
    vm.runInNewContext(fs.readFileSync(require.resolve('../'+name),'utf8'),ctx);
    if(name==='workout-domain.js') ctx.WorkoutDomain=ctx.module.exports;
  }
  const pc=ctx.module.exports,domain=ctx.WorkoutDomain;
  const done={w:100,r:9,rpe:10,ok:true,...setExtra};
  const next={w:100,r:'',rpe:'',ok:false,targetRepMin:10,targetRepMax:10,targetRirMin:2,targetRirMax:2};
  const ex={n:'Жим штанги лёжа',loadType:'external_total',programWeightMode:'prescribed',set:[done,next]};
  const session={id:'live',ex:[ex],...extra};
  ctx.st={current:session,exerciseWeightProfiles:{}};
  return {ctx,pc,domain,session,ex,done,next};
}
test('domain and live interface return the same decision for RIR targets',()=>{
  for (const rir of [0,1,2,3,4]) {
    const {pc,domain,session,ex,done,next}=fixture({}, {rpe:'',rir});
    const expected=domain.setDecision(ex,done,session,domain.profile(ex),next);
    const live=pc.liveNextSet(session,ex);
    assert.equal(live.weight,expected.weight);
    assert.equal(live.action,expected.action);
    assert.equal(live.reason,expected.reason);
  }
});
test('latest pain signal cannot be bypassed or applied, even with missing effort',()=>{
  const {pc,session,ex,done,next}=fixture({}, {pain:true,r:'',rpe:''});
  const before=JSON.stringify(session);
  assert.equal(pc.liveNextSet(session,ex).action,'stop');
  pc.applyLive('n:жим штанги лёжа::eq:');
  assert.equal(JSON.stringify(session),before);
  assert.equal(next.w,100);
});
test('applying a valid proposal changes only the pending set',()=>{
  const {pc,session,ex,done,next}=fixture();
  const before=JSON.stringify(done);
  pc.applyLive('n:жим штанги лёжа::eq:');
  assert.equal(next.w,95);
  assert.equal(JSON.stringify(done),before);
  assert.equal(next.manualOverride,true);
});
