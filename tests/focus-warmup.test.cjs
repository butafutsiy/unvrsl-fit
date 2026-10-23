'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const A=require('../workout-domain.js'),F=require('../focus-flow.js'),reg=A.registry([]);
test('warmup loads fit the actual equipment, stay below the working load and never mutate it',()=>{
 const e={n:'Присед со штангой high-bar',loadType:'external_total',eq:'barbell',equipmentProfile:{weightStep:2.5,implementWeight:20},set:[{w:150,r:10}]};
 const original=JSON.stringify(e),plan=F.warmupPlan(e,150,A,reg);
 assert.equal(plan.length,5);assert.equal(plan[0].w,20);assert.ok(plan.every(x=>x.w>=20&&x.w<150&&x.w%2.5===0));
 assert.equal(new Set(plan.map(x=>x.w)).size,plan.length);assert.ok(plan.every(x=>x.warmup&&!x.ok));assert.equal(JSON.stringify(e),original);
});
test('an explicitly lighter implement and a sparse machine stack are respected',()=>{
 const light={n:'Жим штанги',eq:'barbell',loadType:'external_total',equipmentProfile:{implementWeight:15,loadUnit:'TOTAL',weightStep:.5}};
 assert.equal(F.warmupPlan(light,60,A,reg)[0].w,15);
 const machine={n:'Жим в тренажёре',loadType:'machine_stack',equipmentProfile:{availableLoads:[10,25,40,55]}};
 assert.deepEqual(F.warmupPlan(machine,55,A,reg).map(x=>x.w),[10,25,40]);
 assert.deepEqual(F.warmupPlan(machine,10,A,reg),[]);
});
test('no external warmup weights are invented for unknown loads or conditioning',()=>{
 for(const loadType of ['time','distance','bodyweight_only','bodyweight_assisted','repetitions_only'])assert.deepEqual(F.warmupPlan({n:'Exercise',loadType},100,A,reg),[]);
 assert.deepEqual(F.warmupPlan({n:'Bench'},0,A,reg),[]);
});
test('recorded warmups cannot become work volume, records or strength evidence',()=>{
 const e={n:'Bench',loadType:'external_total',warmup:F.warmupPlan({n:'Bench',loadType:'external_total'},100,A,reg),set:[{w:100,r:10,actualReps:10,rpe:8,ok:true}]};
 const session={id:'one',started:1000,ended:2000,ex:[e]},before=A.tonnage(session,reg);
 for(const x of e.warmup){Object.assign(x,{ok:true,actualReps:x.r,rpe:10});assert.equal(A.complete(e,x,reg),false);assert.equal(A.e1rm(e,x,session,reg),null);}
 assert.equal(A.tonnage(session,reg),before);assert.equal(e.set.length,1);
});
