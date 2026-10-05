'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const A=require('../strength-analytics'),D=require('../workout-domain');
const reg=D.registry([{id:'bench',n:'Жим лёжа',bp:'chest',loadType:'external_total'}]);
const set=(w,r,extra={})=>({w,r,ok:true,...extra});
const session=(id,date,sets,extra={},ex={})=>({id,date,ended:1,ex:[{n:'Жим лёжа',set:sets,...ex}],...extra});
const build=(s,opts={})=>A.build(s,reg,[],D,{now:new Date('2026-10-04T12:00:00'),...opts});
test('period includes 28 calendar days, removes deleted, duplicate, unfinished and future sessions',()=>{
 const a=session('a','2026-09-07',[set(100,5)]);
 const rows=build([a,a,session('old','2026-09-06',[set(90,5)]),session('future','2026-10-05',[set(200,5)]),session('del','2026-10-01',[set(200,5)]),session('draft','2026-10-02',[set(200,5)],{ended:null}),session('new','2026-10-04',[set(110,5)])],{deleted:['del']});
 assert.equal(rows[0].workouts,2);assert.equal(rows[0].bestWeight,110);assert.ok(rows[0].growth>0);
});
test('actual weights retain high reps and method stages without false 1RM estimates',()=>{
 const [x]=build([session('a','2026-10-01',[set(42,15)]),session('b','2026-10-02',[set(30,8,{method:'DS'})])]);
 assert.equal(x.sets,2);assert.equal(x.bestWeight,42);assert.equal(x.points[0].e1,null);assert.equal(x.growth,null);
});
test('equipment is isolated, missing effort does not block estimates; latest decline is not lifetime peak',()=>{
 const rows=build([session('a','2026-09-07',[set(100,5)]),session('b','2026-09-14',[set(120,5)]),session('c','2026-10-01',[set(90,5)]),session('d','2026-10-02',[set(300,5,{equipmentProfileId:'machine'})])]);
 assert.equal(rows.length,2);const x=rows.find(x=>!x.equipment);assert.ok(x.growth<0);assert.equal(x.bestWeight,120);assert.equal(rows.find(x=>x.equipment).growth,null);
});
test('zero added weight remains visible, body mass used for estimate, malformed and warmup sets excluded',()=>{
 const [x]=build([session('a','2026-10-01',[set(0,8),set(5,''),set(50,5,{warmup:true})],{bodyWeight:90},{n:'Подтягивания',loadType:'bodyweight_added'})]);
 assert.equal(x.sets,1);assert.equal(x.last.maxWeight,0);assert.equal(x.last.e1,114);
});
test('deload is visible but excluded from growth; muscle filters and load types isolate series',()=>{
 const s=[session('a','2026-09-07',[set(100,5)]),session('b','2026-10-01',[set(70,5)],{w:6,c:'B'})];
 assert.equal(build(s)[0].growth,null);assert.equal(build(s)[0].points.length,2);assert.equal(build(s,{group:'back'}).length,0);
 assert.equal(A.muscle({n:'Сгибание ног лёжа',tg:'hamstrings'}),'legs');
 assert.equal(build([...s,session('d','2026-10-02',[set(30,8)],{},{loadType:'per_dumbbell'})]).length,2);
});
test('muscle group uses canonical target before posture words and ambiguous names',()=>{
 assert.equal(A.muscle({n:'Французский жим с EZ-штангой лёжа',bp:'chest'},{tg:'triceps',bp:'upper arms'}),'arms');
 assert.equal(A.muscle({n:'Французский жим лёжа'}),'arms');
 assert.equal(A.muscle({n:'Тяга штанги в наклоне'}),'back');
 assert.equal(A.muscle({n:'Жим гантелей на наклонной'}),'chest');
 assert.equal(A.muscle({n:'Подъём ног в упоре'}),'core');
});
