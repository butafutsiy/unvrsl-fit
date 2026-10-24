'use strict';
const assert=require('node:assert/strict');
const {make,wait,errors}=require('./runtime-v392.cjs');
(async()=>{
 const dom=make();await wait(2700);const w=dom.window;
 try{
 const result=await w.eval(`(async()=>{
  st.current=session(UNVRSL_ROUTINES.find(r=>r.w===1&&r.c==='B'));
  nav('start');await trainingEngine200Tick();
  const cur=st.current,e=cur.ex[0];cur.ex=[e];
  Object.assign(cur,{date:'2026-10-08',started:Date.parse('2026-10-08'),programWeekIntensityMin:70,programWeekIntensityMax:75,trainingReadinessDone:false});
  e.method='STANDARD';e.programWeightMode='prescribed';e.equipmentProfile={weightStep:2.5,min:20,max:300};
  e.set=Array.from({length:4},()=>({w:110,plannedW:110,programW:110,r:'',ok:false,targetRepMin:8,targetRepMax:10,targetRpeMin:7,targetRpeMax:8}));
  const old=JSON.parse(JSON.stringify(e));old.set=Array.from({length:5},(_,i)=>({w:135,r:3,rpe:9,ok:i<3,targetRepMin:3,targetRepMax:3,targetRpeMin:9,targetRpeMax:9}));
  st.sessions=[{id:'heavy',date:'2026-10-02',started:Date.parse('2026-10-02'),ended:Date.parse('2026-10-02')+1000,ex:[old]}];
  const render=async()=>{trainingLoadModel292.run();startPage();await trainingEngine200Tick();return document.querySelector('#start .te200-rec')};
  let card=await render();const same={title:card.querySelector('b').textContent,comparison:!!card.querySelector('.te406-plan-comparison'),conflict:e.set[0].recommendation.conflict};
  e.set.forEach(s=>Object.assign(s,{w:120,plannedW:120,programW:120,assignedW:120,manualOverride:true,weightSource:'manual'}));
  card=await render();const different={text:card.textContent,weight:e.set[0].w};
  e.set.forEach(s=>{s.recommendedW=135}); // stale cache must not drive the button
  card.querySelector('.te200-rec-apply').click();
  const persisted=JSON.parse(JSON.stringify(st.current));
  st.current=persisted;card=await render();
  const saved={same,different,sets:st.current.ex[0].set.map(s=>({w:s.w,plannedW:s.plannedW,decision:s.recommendationDecision?.weight??null,calculated:s.recommendation.calculatedWeight})),after:card.querySelector('b').textContent};
  Object.assign(st.current,{w:7,programWeekIntensityMin:88,programWeekIntensityMax:90});
  st.current.ex[0].set.forEach(s=>Object.assign(s,{w:135,plannedW:135,programW:135,assignedW:135,targetRepMin:3,targetRepMax:5,targetRpeMin:8,targetRpeMax:9}));
  st.sessions[0].ex[0].set.forEach(s=>{s.w=134.3});
  card=await render();saved.week7={title:card.querySelector('b').textContent,apply:!!card.querySelector('.te200-rec-apply'),conflict:st.current.ex[0].set[0].recommendation.conflict};
  return saved;
 })()`);
 assert.equal(result.same.title,'Смена диапазона: 112,5 кг · 8–10 повт.');
 assert.equal(result.same.comparison,true);assert.equal(result.same.conflict,null);
 assert.match(result.different.text,/Назначено тренером: 120 кг/);assert.match(result.different.text,/Смена диапазона: 112,5 кг · 8–10 повт./);assert.equal(result.different.weight,120);
 assert.deepEqual({...result.sets[0]},{w:112.5,plannedW:120,decision:112.5,calculated:112.5});
 for(const set of result.sets.slice(1))assert.deepEqual({...set},{w:120,plannedW:120,decision:null,calculated:112.5});
 assert.equal(result.after,result.same.title);assert.deepEqual(errors,[]);
 assert.equal(result.week7.title,'Проверь назначение');assert.equal(result.week7.apply,false);assert.ok(result.week7.conflict);
 console.log('Weekly recommendation UI, explicit apply and reload: 110 kg passed');
 }finally{dom.window.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
