'use strict';
const assert=require('node:assert/strict');
const {make,wait,errors}=require('./runtime-v392.cjs');
(async()=>{
 const dom=make();await wait(2700);const w=dom.window;
 try{
 const result=await w.eval(`(async()=>{
  st.current=session(UNVRSL_ROUTINES.find(r=>r.w===7&&r.c==='B'));
  nav('start');await trainingEngine200Tick();
  const cur=st.current,e=cur.ex[0];cur.ex=[e];
  Object.assign(cur,{date:'2026-10-08',started:Date.parse('2026-10-08'),programWeekIntensityMin:88,programWeekIntensityMax:90,programWeekRpeMin:8,programWeekRpeMax:9,trainingReadinessDone:false});
  e.method='STANDARD';e.programWeightMode='prescribed';
  e.set=Array.from({length:4},()=>({w:135,plannedW:135,programW:135,r:'',ok:false,targetRepMin:3,targetRepMax:5,targetRpeMin:8,targetRpeMax:9}));
  const eq={id:'fractional',name:'Штанга с микроблинами',type:'barbell',loadUnit:'TOTAL',weightStep:2.5,availableLoads:[],implementWeight:20};
  e.equipmentProfileId=eq.id;e.equipmentProfile={...eq};e.set.forEach(s=>{s.equipmentProfileId=eq.id});st.equipmentProfiles={fractional:eq};
  const old=JSON.parse(JSON.stringify(e));old.set=Array.from({length:5},(_,i)=>({w:134.3,r:3,rpe:9,ok:i<3,equipmentProfileId:eq.id}));
  st.sessions=[{id:'heavy',date:'2026-10-02',started:Date.parse('2026-10-02'),ended:Date.parse('2026-10-02')+1000,ex:[old]}];
  const render=async()=>{await trainingLoadModel292.run();startPage();await trainingEngine200Tick();return document.querySelector('#start .te200-rec')};
  let card=await render();const before=card.querySelector('b').textContent;
  const eqKey=encodeURIComponent(workoutRegistry.identity(e)+'@0');
  equipmentEdit405(eqKey,'fractional');document.getElementById('eq405Step').value='0,5';
  equipmentSave405(eqKey,'fractional');card=await render();
  const fractional={title:card.querySelector('b').textContent,step:e.set[0].recommendation.step,planned:e.set[0].w};
  card.querySelector('.te200-rec-apply').click();fractional.applied=e.set[0].w;
  equipmentEdit405(eqKey,'fractional');document.getElementById('eq405Step').value='0.25';document.getElementById('eq405Available').value='130; 135,25; 140';
  equipmentSave405(eqKey,'fractional');card=await render();
  const available={title:card.querySelector('b').textContent,calculated:e.set[0].recommendation.calculatedWeight};
  card.querySelector('.te200-rec-apply').click();available.applied=e.set[0].w;
  return {before,fractional,available,persisted:JSON.parse(JSON.stringify(st.current)).ex[0].set.map(s=>s.w),history:old.set[0].w};
 })()`);
 assert.equal(result.before,'Рекомендация на подход: 135 кг · 3–5 повт.');
 assert.equal(result.fractional.title,'Рекомендация на подход: 135,5 кг · 3–5 повт.');assert.equal(result.fractional.planned,135);assert.equal(result.fractional.applied,135.5);assert.equal(result.fractional.step,.5);
 assert.equal(result.available.title,'Рекомендация на подход: 135,25 кг · 3–5 повт.');assert.equal(result.available.calculated,135.25);assert.equal(result.available.applied,135.25);
 assert.ok(result.persisted.every(x=>x===135.25));assert.equal(result.history,134.3);assert.deepEqual(errors,[]);
 console.log('Equipment edits: fractional step, available loads, display, apply and persistence passed');
 }finally{dom.window.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
