'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=n=>fs.readFileSync(path.join(root,n),'utf8');
function context(extra={}){
  const w={...extra};w.window=w;w.globalThis=w;
  vm.createContext(w);
  vm.runInContext(read('exercise-catalog.js'),w);
  vm.runInContext(read('cardio-training.js'),w);
  return w;
}
test('eleven machines have unique IDs, linked barefoot static illustrations, and safe coaching',()=>{
  const w=context(),rows=Array.from(w.UNVRSL_EXERCISES).filter(x=>x.id.startsWith('cardio:'));
  assert.equal(rows.length,11);
  assert.equal(new Set(rows.map(x=>x.id)).size,13);
  for(const e of rows){
    assert.equal(e.bp,'cardio');assert.equal(e.loadType,'time');
    assert.equal(e.weightProfile.step,0);
    assert.ok(e.coaching.cues.length>=3&&e.coaching.mistakes.length>=3);
    assert.ok(e.cardioMachine.met.moderate>1);
    assert.equal(w.UNVRSLCardio.isCardio(e),true);
    assert.equal(e.image,`assets/cardio-illustrations.svg#${e.cardioMachine.id}`);
    assert.equal(e.gif,'');
  }
  assert.equal(w.UNVRSL_EXERCISES.length,200);
  assert.ok(!w.UNVRSL_EXERCISES.some(e=>['cardio:upper-body-ergometer','cardio:versaclimber'].includes(e.id)));
  const fs=require('node:fs'),asset=fs.readFileSync(require('node:path').join(__dirname,'..','assets','cardio-illustrations.svg'),'utf8');
  assert.ok(asset.includes('data:image/webp;base64,'));
  for(const e of rows)assert.ok(asset.includes(`id="${e.cardioMachine.id}"`));
});
test('gross MET calories require a real body mass and report estimation',()=>{
  const w=context(),ex={n:'Эллиптический тренажёр',cardioMachineId:'elliptical'};
  assert.equal(w.UNVRSLCardio.estimate(ex,{durationMin:40,intensity:'moderate'}).kcal,null);
  const r=w.UNVRSLCardio.estimate(ex,{durationMin:40,intensity:'moderate',weightKg:95});
  assert.equal(r.source,'met');assert.equal(r.kcal,333);assert.equal(r.activeKcal,266);
});
test('treadmill grade and speed alter kcal without calorie guesswork',()=>{
  const w=context(),ex={n:'Беговая дорожка',cardioMachineId:'treadmill'};
  const plain=w.UNVRSLCardio.estimate(ex,{durationMin:40,weightKg:95,speedKmh:6,inclinePct:0});
  const uphill=w.UNVRSLCardio.estimate(ex,{durationMin:40,weightKg:95,speedKmh:6,inclinePct:8});
  assert.equal(plain.source,'met');assert.ok(uphill.kcal>plain.kcal);
  assert.ok(uphill.met>plain.met);
});
test('interval rests contribute separately rather than full-work intensity',()=>{
  const w=context(),ex={n:'Гребной тренажёр',cardioMachineId:'rower'};
  const steady=w.UNVRSLCardio.estimate(ex,{mode:'steady',intensity:'vigorous',weightKg:90,durationMin:9});
  const intervals=w.UNVRSLCardio.estimate(ex,{mode:'interval',intensity:'vigorous',weightKg:90,rounds:5,workSeconds:60,restSeconds:60});
  assert.equal(intervals.minutes,9);assert.ok(intervals.kcal<steady.kcal);
});
test('machine-entered kcal win and history totals count only completed work',()=>{
  const w=context(),ex={n:'Велотренажёр вертикальный',kind:'cardio',cardioMachineId:'upright-bike',cardio:{durationMin:30,intensity:'moderate'},set:[
    {ok:true,workSeconds:1800,reportedKcal:300,weightKg:95},
    {ok:false,workSeconds:1800,reportedKcal:500,weightKg:95}]};
  assert.equal(w.UNVRSLCardio.estimate(ex,{reportedKcal:300,weightKg:95}).source,'machine');
  assert.equal(w.UNVRSLCardio.sessionCalories({ex:[ex]}).kcal,300);
  assert.equal(w.UNVRSLCardio.sessionCalories({ex:[{...ex,set:[{ok:false,workSeconds:1800}]}]}),null);
});
test('existing strength exercises and methods are not reclassified as cardio',()=>{
  const w=context();
  const e=w.UNVRSL_EXERCISES.find(x=>x.id==='canon:bench_press');
  assert.ok(e);
  assert.equal(w.UNVRSLCardio.isCardio(e),false);
});
