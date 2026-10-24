'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const A=require('../strength-analytics'),D=require('../workout-domain');
const reg=D.registry([{id:'bench',n:'Жим лёжа',bp:'chest',loadType:'external_total'}]);
const set=(w,r,extra={})=>({w,r,ok:true,...extra});
const session=(id,date,sets,extra={},ex={})=>({id,date,ended:1,ex:[{n:'Жим лёжа',set:sets,...ex}],...extra});
const build=(s,opts={})=>A.build(s,reg,[],D,{now:new Date('2026-10-04T12:00:00'),...opts});





test('muscle group uses canonical target before posture words and ambiguous names',()=>{
 assert.equal(A.muscle({n:'Французский жим с EZ-штангой лёжа',bp:'chest'},{tg:'triceps',bp:'upper arms'}),'arms');
 assert.equal(A.muscle({n:'Французский жим лёжа'}),'arms');
 assert.equal(A.muscle({n:'Тяга штанги в наклоне'}),'back');
 assert.equal(A.muscle({n:'Жим гантелей на наклонной'}),'chest');
 assert.equal(A.muscle({n:'Подъём ног в упоре'}),'core');
});




test('assistance and bodyweight are not presented as external-load 1RM',()=>{
 for(const loadType of ['bodyweight_assisted','bodyweight_only']){
  const [x]=build([session('a','2026-10-01',[set(20,5)],{bodyWeight:90},{loadType})]);
  assert.equal(x.last.e1,null);assert.equal(x.meanE1,null);assert.equal(x.estimateCount,0);
 }
});



test('families never merge incompatible load units and count same-session equipment once',()=>{
 const rows=build([session('mixed','2026-09-01',[set(100,1,{equipmentProfileId:'m'}),set(200,1,{equipmentProfileId:'f'})]),session('db','2026-09-02',[set(20,1)],{},{loadType:'per_dumbbell'})]);
 const families=A.families(rows);assert.equal(families.length,2);
 const family=families.find(f=>f.variants);assert.equal(family.workouts,1);assert.equal(family.points.length,2);assert.equal(family.sets,2);
});
test('set-level equipment names do not inherit a different exercise-level machine',()=>{
 const [row]=build([session('a','2026-09-01',[set(100,1,{equipmentProfileId:'matrix'})],{},{equipmentProfileId:'foreman',equipmentProfile:{id:'foreman',name:'Foreman'}})],{equipmentProfiles:{matrix:{name:'Matrix'}}});
 assert.equal(row.equipment,'matrix');assert.equal(row.equipmentName,'Matrix');
});
