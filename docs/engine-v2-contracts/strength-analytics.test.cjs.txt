'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const A=require('../strength-analytics'),D=require('../workout-domain');
const reg=D.registry([{id:'bench',n:'Жим лёжа',bp:'chest',loadType:'external_total'}]);
const set=(w,r,extra={})=>({w,r,ok:true,...extra});
const session=(id,date,sets,extra={},ex={})=>({id,date,ended:1,ex:[{n:'Жим лёжа',set:sets,...ex}],...extra});
const build=(s,opts={})=>A.build(s,reg,[],D,{now:new Date('2026-10-04T12:00:00'),...opts});
test('all history includes old sessions, removes deleted, duplicate, unfinished and future sessions',()=>{
 const a=session('a','2026-09-07',[set(100,5)]);
 const rows=build([a,a,session('old','2026-09-06',[set(90,5)]),session('future','2026-10-05',[set(200,5)]),session('del','2026-10-01',[set(200,5)]),session('draft','2026-10-02',[set(200,5)],{ended:null}),session('new','2026-10-04',[set(110,5)])],{deleted:['del']});
 assert.equal(rows[0].workouts,3);assert.equal(rows[0].bestWeight,110);assert.ok(rows[0].growth>0);
});
test('display estimates include high reps and method stages',()=>{
 const [x]=build([session('a','2026-10-01',[set(42,15)]),session('b','2026-10-02',[set(30,8,{method:'DS'})])]);
 assert.equal(x.sets,2);assert.equal(x.bestWeight,42);assert.equal(x.points[0].e1,63);assert.equal(x.points[1].e1,38);assert.ok(x.growth<0);
});
test('equipment is isolated, missing effort does not block estimates; latest decline is not lifetime peak',()=>{
 const rows=build([session('a','2026-09-07',[set(100,5)]),session('b','2026-09-14',[set(120,5)]),session('c','2026-10-01',[set(90,5)]),session('d','2026-10-02',[set(300,5,{equipmentProfileId:'machine'})])]);
 assert.equal(rows.length,2);const x=rows.find(x=>!x.equipment);assert.ok(x.growth<0);assert.equal(x.bestWeight,120);assert.equal(rows.find(x=>x.equipment).growth,null);
});
test('zero added weight remains zero regardless of body mass, malformed and warmup sets excluded',()=>{
 const [x]=build([session('a','2026-10-01',[set(0,8),set(5,''),set(50,5,{warmup:true})],{bodyWeight:90},{n:'Подтягивания',loadType:'bodyweight_added'})]);
 assert.equal(x.sets,1);assert.equal(x.last.maxWeight,0);assert.equal(x.last.e1,0);
});
test('deload contributes to growth and mean; muscle filters and load types isolate series',()=>{
 const s=[session('a','2026-09-07',[set(100,5)]),session('b','2026-10-01',[set(70,5)],{w:6,c:'B'})];
 assert.ok(build(s)[0].growth<0);assert.equal(build(s)[0].points.length,2);assert.equal(build(s,{group:'back'}).length,0);
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

test('weighted pull-ups use only external load, no body mass or effort adjustment',()=>{
 const exercise={n:'Подтягивания с дополнительным весом',loadType:'bodyweight_added'};
 const [x]=build([session('a','2025-01-01',[set(27.5,3,{actualRpe:6})],{bodyWeight:103.1},exercise),session('b','2026-09-27',[set(27.5,3)],{},exercise)]);
 assert.equal(x.workouts,2);assert.equal(x.last.e1,30.3);assert.equal(x.first.e1,30.3);assert.equal(x.meanE1,30.3);
});
test('mean weights each completed set equally across all sessions and methods',()=>{
 const [x]=build([session('a','2024-01-01',[set(30,1),set(30,10,{method:'SLDR'}),set(30,20,{method:'FST-7'})]),session('b','2026-10-01',[set(30,30,{method:'DS'}),set(999,5,{ok:false}),set(888,5,{skipped:true}),set(777,5,{warmup:true})],{deload:true})]);
 assert.equal(x.meanE1,45);assert.equal(x.estimateCount,4);assert.equal(x.first.meanE1,40);assert.equal(x.last.meanE1,60);assert.equal(x.last.e1,60);
 assert.deepEqual(x.points.flatMap(p=>p.entries.map(e=>e.e1)),[30,40,50,60]);
});
test('display units match entered load for dumbbells, per-side equipment and legacy set fields',()=>{
 const rows=build([session('a','2026-10-01',[{weight:20,reps:6,completed:true}],{}, {loadType:'per_dumbbell',implementCount:2}),session('b','2026-10-02',[set(20,6)],{}, {loadType:'per_side',loadedSides:2,implementWeight:20})]);
 assert.equal(rows.length,2);for(const row of rows){assert.equal(row.last.e1,24);assert.equal(row.last.maxWeight,20)}
});
test('assistance and bodyweight are not presented as external-load 1RM',()=>{
 for(const loadType of ['bodyweight_assisted','bodyweight_only']){
  const [x]=build([session('a','2026-10-01',[set(20,5)],{bodyWeight:90},{loadType})]);
  assert.equal(x.last.e1,null);assert.equal(x.meanE1,null);assert.equal(x.estimateCount,0);
 }
});

test('one exercise family preserves equipment loads and normalizes each baseline independently',()=>{
 const rows=build([
  session('m1','2026-09-01',[set(100,1)],{},{equipmentProfileId:'matrix',equipmentProfile:{id:'matrix',name:'Matrix'}}),
  session('f1','2026-09-02',[set(300,1)],{},{equipmentProfileId:'foreman',equipmentProfile:{id:'foreman',name:'Foreman'}}),
  session('m2','2026-09-03',[set(110,1)],{},{equipmentProfileId:'matrix'}),
  session('f2','2026-09-04',[set(360,1)],{},{equipmentProfileId:'foreman'})
 ]);
 const [family]=A.families(rows);
 assert.equal(family.variants.length,2);assert.equal(family.workouts,4);assert.equal(family.sets,4);
 assert.deepEqual(family.points.map(p=>Math.round(p.indexE1)),[100,100,110,120]);
 assert.ok(Math.abs(family.growth-15)<1e-10);assert.equal(family.comparableEquipment,2);
 assert.equal(family.meanE1,undefined);assert.equal(family.bestWeight,undefined);
 assert.deepEqual(family.points.map(p=>p.maxWeight),[100,300,110,360]);
 assert.equal(rows.find(r=>r.equipment==='matrix').meanE1,105);
});
test('new and unknown equipment remain visible without contributing invented growth',()=>{
 const [family]=A.families(build([
  session('old','2026-09-01',[set(50,1)]),
  session('new','2026-09-02',[set(500,1,{equipmentSnapshot:{id:'new',name:'New'}})])
 ]));
 assert.equal(family.variants.length,2);assert.equal(family.growth,null);
 assert.equal(family.points[0].equipmentName,'Оборудование не указано');
 assert.equal(family.points[1].equipmentName,'New');
 assert.deepEqual(family.points.map(p=>p.indexE1),[100,100]);
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
