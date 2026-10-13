'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const D=require('../workout-domain'),context={window:{}};
vm.runInNewContext(fs.readFileSync(require.resolve('../exercise-catalog.js'),'utf8'),context);
const reg=D.registry(context.window.UNVRSL_EXERCISES);

test('paired display states each dumbbell and crossover stack without changing stored load',()=>{
 for(const n of ['Жим гантелей сидя','Жим гантелей на наклонной скамье','Сведение рук в кроссовере']){
  const e={n},s={w:25,r:10,ok:true},before=JSON.stringify({e,s});
  assert.equal(D.weightText(e,s.w,reg,s),'25 / 25');
  assert.equal(D.weightText(e,17.5,reg,s),'17,5 / 17,5');
  assert.equal(D.tonnage({ex:[{...e,set:[s]}]},reg),500);
  assert.equal(JSON.stringify({e,s}),before);
 }
});

test('single dumbbells, barbells and total equipment loads keep a single number',()=>{
 for(const e of [
  {n:'Жим штанги лёжа'},
  {n:'Тяга гантели одной рукой',loadType:'per_dumbbell',implementCount:1},
  {n:'Сведение рук в кроссовере',stackCount:1},
  {n:'Сведение рук в кроссовере',equipmentProfile:{loadUnit:'TOTAL'}},
  {n:'Жим ногами',loadType:'per_side',loadedSides:2,implementWeight:20}
 ])assert.equal(D.weightText(e,25,reg),'25');
 assert.equal(D.weightText({n:'Жим гантелей сидя'},'',reg),'');
 assert.equal(D.weightText({n:'Жим гантелей сидя'},0,reg),'0 / 0');
});

test('set equipment snapshots define the display independently of current settings',()=>{
 const e={n:'Жим гантелей сидя',equipmentProfile:{id:'total',loadUnit:'TOTAL'}};
 assert.equal(D.weightText(e,25,reg,{equipmentSnapshot:{id:'pair',loadUnit:'PER_HAND',implementCount:2}}),'25 / 25');
 assert.equal(D.weightText({n:'Сведение рук в кроссовере'},50,reg,{equipmentSnapshot:{loadUnit:'TOTAL'}}),'50');
});
