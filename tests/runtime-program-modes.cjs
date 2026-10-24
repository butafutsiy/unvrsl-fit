'use strict';
const assert=require('node:assert/strict');
const {make,wait,errors}=require('./runtime-v392.cjs');
(async()=>{
 const dom=make();await wait(2500);const w=dom.window;
 try{
  const result=await w.eval(`(async()=>{
   const entry=(id,n,mode,weight)=>({id,n,weightMode:mode,method:'STANDARD',kind:'compound',rest:90,rpe:8,
    equipmentProfile:{id:'rack-'+id,loadUnit:'TOTAL',weightStep:2.5,min:20,max:300},reps:{mode:'manual',min:8,max:10},sets:Array.from({length:3},()=>({w:weight,r:8}))});
   const entries=[entry('fixed','Жим штанги лёжа','manual',95),entry('empty','Румынская тяга со штангой','auto',0),entry('stale','Тяга штанги в наклоне','auto',200)];
   const p=ensureProgramShape({id:'two-modes',name:'Two modes',weeks:[{n:1,intensityMin:70,intensityMax:75,days:[{id:'day',name:'Mixed day',ex:entries}]}]});
   st.programs.push(p);st.sessions=[{id:'history',date:new Date().toISOString().slice(0,10),started:Date.now()-86400000,ended:Date.now()-86400000+1000,ex:entries.map(e=>({n:e.n,sourceId:e.sourceId,equipmentProfile:e.equipmentProfile,method:'STANDARD',tempo:'2-0-X',set:Array.from({length:3},()=>({w:100,r:8,rpe:8,ok:true}))}))}];
   programBeginDayCoreV382(p.id,0,0);await trainingEngine200Tick();await unvrslTrainingPrescriptionSyncV292(true);trainingLoadModel292.run();
   const initial=st.current.ex.map(e=>({mode:e.programWeightMode,weights:e.set.map(s=>s.w),recommendations:e.set.map(s=>s.recommendedW)}));
   st.current.ex[1].set[0].manualOverride=true;st.current.ex[1].set[0].weightSource='manual';st.current.ex[1].set[0].w=77.5;
   trainingLoadModel292.run();
   return{initial,manual:st.current.ex[1].set[0].w,policy:st.current.trainingWeightPolicy214};
  })()`);
  assert.equal(result.policy,'mixed');assert.equal(result.initial[0].mode,'prescribed');assert.deepEqual(Array.from(result.initial[0].weights),[95,95,95]);assert.ok(result.initial[0].recommendations.every(x=>x>0));
  for(const ex of result.initial.slice(1)){assert.equal(ex.mode,'adaptive');assert.ok(ex.weights.every(x=>x>0&&x!==200));assert.deepEqual(Array.from(ex.weights),Array.from(ex.recommendations))}
  assert.equal(result.manual,77.5);assert.deepEqual(errors,[]);
  console.log('Program modes: prescribed weight plus recommendations, empty and explicit auto loads, mixed launch and protected manual edits passed');
 }finally{dom.window.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
