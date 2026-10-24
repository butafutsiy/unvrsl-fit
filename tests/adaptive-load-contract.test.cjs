"use strict";
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const engine = require('../adaptive-load');
const base = {weight:100, actualReps:9, actualRir:0, targetRepMin:10,
  targetRepMax:10, targetRirMin:2, targetRirMax:2, step:2.5};
const adjust = changes => engine.adjust({...base,...changes});


test('pain takes priority over missing and invalid numeric data', () => {
  for (const input of [{}, {weight:null}, {actualReps:null}, {targetRirMin:null}])
    assert.equal(engine.adjust({...input,pain:true}).action,'stop');
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
