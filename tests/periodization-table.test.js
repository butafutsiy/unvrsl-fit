'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const Domain=require('../workout-domain');
const DayEffort=require('../program-day-effort');

const weeks=[
  [[70,75],4,[10,12],[7,8],[70,75],3,[10,12],[8,9]],
  [[75,80],4,[8,10],[7,8],[65,70],3,[12,15],[8,9]],
  [[80,85],3,[6,8],[8,9],[60,65],4,[15,20],[7,8]],
  [[60,65],4,[10,12],[6,8],[80,85],3,[6,8],[8,9]],
  [[85,88],3,[4,6],[8,9],[60,65],4,[15,20],[7,8]],
  [[65,70],4,[10,12],[6,8],[75,80],3,[8,10],[8,9]],
  [[88,90],3,[3,5],[8.5,9.5],[60,65],4,[15,20],[7,8]]
];

test('W1-W7 use one approved base/isolation prescription table',()=>{
  weeks.forEach((expected,i)=>{
    const p=Domain.weekProfiles[i+1];
    assert.deepEqual([
      p.base.pct,p.base.sets,p.base.reps,p.base.rpe,
      p.isolation.pct,p.isolation.sets,p.isolation.reps,p.isolation.rpe
    ],expected,'Week '+(i+1));
  });
  const testWeek=Domain.weekProfiles[8];
  assert.equal(testWeek.test,true);
  assert.equal(testWeek.base.sets,3);
  assert.equal(testWeek.isolation.sets,0);
});

function makeCycle(){
  return Domain.generateCycle({
    weeks:8,daysPerWeek:2,startDate:'2026-11-02',
    exercises:[
      {n:'Армейский жим стоя',kind:'base',dayIndices:[0,1],sets:[{w:25}]},
      {n:'Сгибание рук со штангой',kind:'isolation',dayIndices:[0,1],sets:[{w:10}]}
    ]
  });
}

test('week total is shared across repeated training days',()=>{
  const cycle=makeCycle();
  const days=cycle.weeks[0].days;
  assert.deepEqual(days.map(d=>d.ex.map(e=>e.sets.length)),[[2,2],[2,1]]);
  assert.deepEqual(days.map(d=>d.ex.map(e=>e.weeklySets)),[[4,3],[4,3]]);
  assert.deepEqual(days[0].ex.map(e=>e.sets[0].targetRepMax),[12,12]);
});

test('old automatic programs migrate once without modifying workout history',()=>{
  const program=makeCycle(),week=program.weeks[0];
  week.sessionVolumeRevision=544;
  week.weeklyLoadProfile.base.reps=[12,15];
  week.weeklyLoadProfile.isolation.sets=4;
  for(const day of week.days)for(const e of day.ex){
    e.sets=Array.from({length:4},()=>({
      w:e.kind==='base'?25:10,
      r:e.kind==='base'?12:10,
      targetRepMin:e.kind==='base'?12:10,
      targetRepMax:e.kind==='base'?15:12,
      targetRpeMin:e.kind==='base'?7:8,
      targetRpeMax:e.kind==='base'?8:9
    }));
    e.weeklySets=8;
  }
  program.sessions=[{id:'finished',ex:[{n:'Присед',set:[{ok:true,w:100,r:5}]}]}];
  const history=JSON.stringify(program.sessions);
  assert.equal(Domain.upgradeSessionVolume(program),true);
  assert.deepEqual(week.days.map(d=>d.ex.map(e=>e.sets.length)),[[2,2],[2,1]]);
  assert.deepEqual(week.days[0].ex.map(e=>e.sets[0].targetRepMax),[12,12]);
  assert.equal(week.sessionVolumeRevision,548);
  assert.equal(JSON.stringify(program.sessions),history);
  assert.equal(Domain.upgradeSessionVolume(program),false);
});

test('manual cycles stay unchanged',()=>{
  const program=makeCycle();
  program.cycleOptions.periodizationMode='manual';
  const original=JSON.stringify(program.weeks);
  assert.equal(Domain.upgradeSessionVolume(program),false);
  assert.equal(JSON.stringify(program.weeks),original);
});

test('day cards show compound and isolation RPE separately',()=>{
  const label=DayEffort.summary(Domain.weekProfiles[1],{
    ex:[{n:'Армейский жим стоя',kind:'base'},{n:'Сгибание рук со штангой',kind:'isolation'}]
  });
  assert.equal(label,'База RPE 7–8 · Изоляция RPE 8–9');
});
