'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const D=require('../workout-domain'),context={window:{}};
vm.runInNewContext(fs.readFileSync(require.resolve('../exercise-catalog.js'),'utf8'),context);
const reg=D.registry(context.window.UNVRSL_EXERCISES);
const set=(w,r,extra={})=>({w,r,rpe:8,ok:true,...extra});
const triple=(n,w,r)=>({n,set:Array.from({length:3},()=>set(w,r))});
const fixture=()=>({id:'screenshot',date:'2026-10-13',ended:1,bodyWeight:95,advancedMetrics:{tonnage:7094},ex:[
 triple('Жим штанги лёжа',120,8),triple('Жим гантелей на наклонной скамье',44,8),
 triple('Разведение гантелей лёжа',19,15),triple('Жим гантелей сидя',30,8),
 triple('Махи гантелями в стороны',15,15),
 {n:'Сведение рук в кроссовере',set:[set(20,13),set(17.5,10),set(15,10)]},
 {n:'Отжимания с дополнительным весом',set:[set(19,8),set(19,5),set(19,4)]}
]});

test('screenshot totals 10985 kg everywhere and leaves old session values intact',()=>{
 const s=fixture(),before=JSON.stringify(s);
 assert.deepEqual(s.ex.map(e=>D.tonnage({ex:[e]},reg)),[2880,2112,1710,1440,1350,1170,323]);
 assert.equal(D.tonnage(s,reg),10985);
 assert.equal(D.summary(s,[],reg).volume,10985);
 assert.equal(D.summary(s,[],reg).setCount,21);
 assert.equal(JSON.stringify(s),before);
 assert.equal(D.tonnage({...s,bodyWeight:120},reg),10985);
 assert.equal(D.tonnage(s),10985);
});



test('one dumbbell, one cable stack and total equipment load are not doubled',()=>{
 const db={n:'Тяга гантели одной рукой',loadType:'per_dumbbell',implementCount:1};
 assert.equal(D.tonnage({ex:[{...db,set:[set(30,10)]}]},reg),300);
 assert.equal(D.tonnageLoad({n:'Сведение рук в кроссовере',stackCount:1},set(20,13),reg),20);
 const s=fixture();s.ex[5].equipmentProfile={loadUnit:'TOTAL'};
 assert.equal(D.tonnage(s,reg),10400);
 assert.equal(D.tonnageLoad({n:'Жим гантелей сидя',equipmentProfile:{loadUnit:'TOTAL'}},set(60,8),reg),60);
});

test('completed set equipment snapshot takes precedence over current equipment',()=>{
 const e={n:'Жим гантелей сидя',equipmentProfileId:'current',equipmentProfile:{id:'current',loadUnit:'TOTAL'},implementCount:1};
 const x=set(30,8,{equipmentSnapshot:{id:'original',loadUnit:'PER_HAND',implementCount:2}});
 assert.equal(D.tonnage({ex:[{...e,set:[x]}]},reg),480);
 assert.equal(D.tonnageLoad({n:'Жим ногами',loadType:'per_side'},set(20,10),reg),null);
 assert.equal(D.tonnageLoad({n:'Жим ногами',loadType:'per_side',loadedSides:2,implementWeight:10},set(20,10),reg),50);
});

test('actual reps, legacy weights, warmups, skipped and incomplete sets are handled',()=>{
 const s={advancedMetrics:{tonnage:99999},ex:[{n:'Жим штанги лёжа',set:[
  set(100,10,{actualReps:8}),{weight:'50',reps:10,ok:true},
  set(100,10,{warmup:true}),set(100,10,{skipped:true}),set(100,10,{ok:false}),set(100,0)
 ]},{n:'Кардио',mode:'cardio',set:[set(100,10,{workSeconds:60})]}]};
 assert.equal(D.tonnage(s,reg),1300);
 assert.equal(D.summary(s,[],reg).volume,1300);
 assert.equal(D.tonnage({ex:[],advancedMetrics:{tonnage:999}}),0);
 assert.equal(D.tonnage({advancedMetrics:{tonnage:999}}),999);
 assert.equal(D.tonnage({ex:[{n:'Отжимания',set:[set(0,10)]}],bodyWeight:95},reg),0);
});
