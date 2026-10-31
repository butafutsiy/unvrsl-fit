'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const A=require('../workout-domain.js');
const model=require('../program-model.js');

test('week-specific method recipes use the same canonical profiles and allocator',()=>{
  const ordinary={exerciseId:'bench',n:'Жим лёжа',kind:'compound',method:'STANDARD',dayIndices:[1],sets:[{w:110,r:10}]};
  const stages=Array.from({length:3},()=>[{w:130,r:3,role:'heavy'},{w:115,r:9,role:'light'}]).flat();
  stages.push({w:120,r:6,role:'middle'},{w:120,r:6,role:'middle'});
  const special={...ordinary,method:'UNVRSL',sets:stages};
  const isolation={exerciseId:'curl',n:'Бицепс',kind:'isolation',dayIndices:[0,2],sets:[{w:20,r:15}]};
  const cardio={n:'Аэробайк',kind:'cardio',workMode:'timer',durationSec:480,dayIndices:[0],sets:[{w:0,r:0,workSeconds:480}]};
  const recipes=Array.from({length:8},(_,i)=>[i===2||i===4?special:ordinary,isolation,cardio]);
  const p=A.generateCycle({weeks:8,daysPerWeek:5,startDate:'2026-10-11',exercises:recipes[0],weekExercises:recipes});
  for(const [i,w] of p.weeks.entries()){
    assert.deepEqual(w.weeklyLoadProfile,A.cycleProfiles(8)[i]);
    const curlSets=w.days.flatMap(d=>d.ex.filter(e=>e.exerciseId==='curl')).reduce((n,e)=>n+e.sets.length,0);
    assert.equal(curlSets,w.weeklyLoadProfile.isolation.sets*(w.testWeek?0:2));
    assert.equal(w.days[0].ex.find(e=>e.kind==='cardio').sets[0].workSeconds,480);
  }
  assert.deepEqual(p.weeks[2].days[1].ex[0].sets,stages);
  assert.equal(p.weeks[2].days[1].ex[0].reps.mode,'method');
  assert.equal(p.weeks[3].days[1].ex[0].method,'STANDARD');
  assert.equal(p.weeks[7].days[1].ex[0].sets.length,3);
  const snapshot=JSON.stringify(recipes);model.normalizeProgram(p);model.normalizeProgram(p);
  assert.deepEqual(p.weeks[7].days[1].ex[0].sets.map(s=>s.targetRepMin),[2,2,1]);
  assert.equal(JSON.stringify(recipes),snapshot,'authored recipes remain immutable');
});

test('invalid week recipes fail before program creation',()=>{
  assert.throws(()=>A.generateCycle({weeks:8,startDate:'2026-10-11',weekExercises:[[]]}),/каждой недели/);
});

test('legacy reps result type cannot classify isolation as a base movement',()=>{
  const registry={resolve:()=>({type:'compound'})};
  for(const n of ['Французский жим с гантелями лёжа','Сгибание рук на скамье Скотта','Подъём на носки в тренажёре']){
    assert.equal(A.exerciseKind({n,kind:'reps'},registry),'isolation');
  }
  assert.equal(A.exerciseKind({n:'Жим ногами',kind:'reps'},registry),'base');
  assert.equal(A.exerciseKind({n:'Французский жим',kind:'compound'},registry),'base','explicit trainer classification wins');
});
