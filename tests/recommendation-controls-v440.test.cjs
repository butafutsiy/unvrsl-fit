'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const A=require('../workout-domain');
const reg=A.registry([{id:'row',n:'Тяга',type:'compound',loadType:'external_total'},{id:'curl',n:'Сгибание',type:'isolation',loadType:'external_total'}]);
const ex=(set,extra={})=>({n:'Тяга',set,...extra});
const set=(w,r,rpe,extra={})=>({w,r,rpe,ok:true,...extra});
const past=(id,date,sets,extra={})=>({id,date,started:Date.parse(date),ended:Date.parse(date)+1000,ex:[ex(sets,extra)]});
const history=[past('a','2026-09-08',[set(102.5,6,7),set(102.5,6,8),set(102.5,6,9),set(102.5,6,10)]),past('b','2026-09-16',[set(82.5,12),set(82.5,12),set(82.5,12)])];

test('authored test attempts and backoffs stay unchanged across preparation and reload',()=>{
 const first={w:100,r:1,plannedReps:1,role:'test_attempt',ok:false};
 const e=ex([first,{w:70,r:5,role:'backoff',ok:false}]),s={id:'test',ex:[e]};
 const before=JSON.stringify(s);assert.equal(A.prepareTestBlocks(s,reg),false);assert.equal(JSON.stringify(s),before);
 Object.assign(first,{ok:true,r:1,rpe:10});const completed=JSON.stringify(s);
 assert.equal(A.prepareTestBlocks(s,reg),false);assert.equal(JSON.stringify(s),completed);
 const restored=JSON.parse(completed);assert.equal(A.prepareTestBlocks(restored,reg),false);assert.equal(JSON.stringify(restored),completed);
});
