'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),D=require('../workout-domain');
const e={n:'Выпады назад с гантелями',loadType:'per_dumbbell',implementCount:2};
test('legacy totals are shown as left/right counts without changing volume',()=>{
 const s={w:26,r:24,ok:true,rpe:7},before=JSON.stringify(s);
 assert.equal(D.repsText(e,s.r,false,s),'12 / 12');
 assert.equal(D.repsText(e,23),'11 / 12');
 assert.equal(D.tonnage({ex:[{...e,set:[s]}]},D.registry([])),1248);
 assert.equal(JSON.stringify(s),before);
 assert.match(D.setLabel(e,s,D.registry([])),/12 \/ 12/);
});
test('single input is per leg, slash input can record unequal sides',()=>{
 assert.deepEqual(D.parseReps(e,'12'),{total:24,left:12,right:12});
 assert.deepEqual(D.parseReps(e,'12 / 10'),{total:22,left:12,right:10});
 assert.equal(D.performedReps(e,{r:22,repsLeft:12,repsRight:10}),10);
 assert.equal(D.repsText(e,22,false,{repsLeft:12,repsRight:10}),'12 / 10');
 for(const v of ['12/','12/0/12','-1','12a','1.5','1e2','Infinity'])assert.equal(D.parseReps(e,v),null,v);
 assert.equal(D.parseReps(e,'').total,'');
});
test('leg counting does not affect bilateral presses, squats or dumbbell weight display',()=>{
 for(const n of ['Жим ногами','Присед со штангой','Сгибание ног лёжа','Жим гантелей сидя']){
  assert.equal(D.legReps({n}),false,n);assert.equal(D.repsText({n},12),'12');
 }
 for(const n of ['Зашагивания на платформу с гантелями','Болгарские приседания','Жим одной ногой'])assert.equal(D.legReps({n}),true,n);
 assert.equal(D.repsText({...e,repSide:'none'},24),'24');
});
test('strength estimates use repetitions per leg rather than the combined total',()=>{
 const reg=D.registry([]),s={w:26,r:24,ok:true,rpe:7};
 assert.equal(D.performedReps(e,s),12);
 assert.equal(D.e1rm(e,s,{},reg),39);
 assert.deepEqual(D.repRange(e,{r:24}),{lo:12,hi:12});
 assert.deepEqual(D.repRange(e,{r:24,targetRepMin:10,targetRepMax:12}),{lo:10,hi:12});
 assert.equal(D.repRangeText(e,{lo:10,hi:12}),'10–12 / 10–12');
});
