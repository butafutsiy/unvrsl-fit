'use strict';
const assert=require('node:assert/strict');
const {make,wait,errors}=require('./runtime-v392.cjs');
(async()=>{
 const dom=make();const deadline=Date.now()+10000;while(!dom.window.__unvrslStartupComplete&&Date.now()<deadline)await wait(50);
 const W=dom.window;
 try{
  const r=await W.eval(`(async()=>{
   await unvrslWarmDeferredModulesV320();
   const raw=110*120/130;
   const sets=Array.from({length:3},()=>[
    {w:110,programW:130,plannedW:130,r:3,rpe:8,ok:true,role:'heavy',plannedReps:3},
    {w:80,programW:95,plannedW:95,r:9,rpe:8,ok:true,role:'light',plannedReps:9}
   ]).flat();sets[5].ok=false;
   sets.push(...[1,2].map(()=>({w:raw,programW:120,plannedW:raw,baselineW:raw,r:'',plannedReps:6,role:'middle',ok:false,weightSource:'recommendation',recommendationDecision:{status:'applied',weight:raw}})));
   const e={n:'Жим штанги лёжа',method:'UNVRSL',programWeightMode:'prescribed',equipmentProfile:{weightStep:2.5},set:sets};
   st.current={id:'rounding-ui',name:'Округление',w:3,c:'B',date:'2026-10-18',started:Date.parse('2026-10-18'),trainingEngineRevision:295,programWeekRpeMin:8,programWeekRpeMax:9,ex:[e]};
   const past=JSON.parse(JSON.stringify(e));past.set.forEach(s=>{s.w=s.role==='heavy'?150:s.role==='light'?110:130;s.r=s.plannedReps;s.rpe=8;s.ok=true;});
   st.sessions=[{id:'prior',date:'2026-10-17',ended:Date.parse('2026-10-17'),ex:[past]}];
   const oldHistory=JSON.stringify(st.sessions),doneBefore=JSON.stringify(sets.slice(0,5).map(s=>({w:s.w,r:s.r,rpe:s.rpe,ok:s.ok})));
   nav('start');await trainingEngine200Tick();await trainingLoadModel292.run(true);startPage();await trainingEngine200Tick();
   const repaired=e.set.slice(6).map(s=>s.w),shown=e.set.slice(6).map(s=>workoutWeightInput(e,s,0,6)),clean=!document.querySelector('#start').textContent.includes('101,538461');
   const fresh=e.set.slice(6).map(s=>s.recommendation.nextSetSuggestion.weight);
   const reloaded=JSON.parse(JSON.stringify(st.current));st.current=reloaded;startPage();await trainingEngine200Tick();
   const persisted=st.current.ex[0].set.slice(6).map(s=>s.w);
   const newSet=st.current.ex[0].set[6];newSet.w=raw;newSet.manualOverride=true;newSet.weightSource='manual';await trainingEngine200Tick();const manualKept=newSet.w===raw;
   const result={repaired,shown,clean,fresh,persisted,manualKept,historyKept:oldHistory===JSON.stringify(st.sessions),doneKept:doneBefore===JSON.stringify(sets.slice(0,5).map(s=>({w:s.w,r:s.r,rpe:s.rpe,ok:s.ok})))};
   st.current=null;return result;
  })()`);
  assert.deepEqual(Array.from(r.repaired),[102.5,102.5]);assert.deepEqual(Array.from(r.persisted),[102.5,102.5]);assert.deepEqual(Array.from(r.fresh),[102.5,102.5]);
  r.shown.forEach(x=>assert.match(x,/value="102,5"/));assert.equal(r.clean,true);assert.equal(r.manualKept,true);assert.equal(r.historyKept,true);assert.equal(r.doneKept,true,"completed weights and actual reps/RPE stay intact");assert.deepEqual(errors,[]);
  console.log('PASS: screenshot UNVRSL draft repairs to 102.5 kg, rendered inputs and new proposals agree, reload persists, manual and completed/history weights stay untouched.');
 }finally{dom.window.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
