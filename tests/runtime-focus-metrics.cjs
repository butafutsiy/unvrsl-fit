'use strict';
const assert=require('node:assert/strict');
const {make,wait,errors}=require('./runtime-v392.cjs');
(async()=>{
 const dom=make(null,{trackObservers:true});await wait(2700);
 try{
  const results=dom.window.eval(`(()=>{
   const root=document.getElementById('workout-focus'),results=[];
   for(const [type,target,actual] of [['time',{seconds:120},95],['time',{min:2},115],['distance',{distance:2.5},'2,1']]){
    workoutFocus.close();stopTimer();if(st.current)workoutStore.discard(st);st.sessions=[];
    st.current={id:'focus-metric-'+results.length,date:iso(),w:1,started:Date.now(),trainingEngineRevision:295,ex:[{
     n:type==='time'?'Аэробайк':'Бег',loadType:type,method:'STANDARD',programWeightMode:'adaptive',rest:0,
     set:[{w:0,r:'',ok:false,...target},{w:0,r:'',ok:false,...target}]
    }]};save();nav('start');workoutFocus.open();
    const card=root.querySelector('.wf-load').textContent,form=root.querySelector('form');
    const before={card,rir:root.querySelectorAll('[data-wf-rir]').length,weight:!!form.elements.weight,timer:root.querySelector('[data-wf-work-seconds]')?.dataset.wfWorkSeconds};
    form.elements.reps.value='-1';form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
    const invalidSaved=st.current.ex[0].set[0].ok;
    form.elements.reps.value=String(actual);form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
    const set=st.current.ex[0].set[0];results.push({...before,invalidSaved,ok:set.ok,seconds:set.seconds,distance:set.distance,rirValue:set.actualRir,rpe:set.actualRpe,history:root.querySelector('.wf-row')?.textContent});
   }
   return results;
  })()`);
  for(const r of results){
   assert.doesNotMatch(r.card,/e1RM|Рекомендованный вес|кг/);
   assert.equal(r.rir,0);assert.equal(r.weight,false);assert.equal(r.invalidSaved,false);assert.equal(r.ok,true);
   assert.equal(r.rirValue,null);assert.equal(r.rpe,null);
  }
  assert.match(results[0].card,/120 сек/);assert.equal(results[0].timer,'120');assert.equal(results[0].seconds,95);assert.match(results[0].history,/95 сек/);
  assert.match(results[1].card,/120 сек/);assert.equal(results[1].timer,'120');assert.equal(results[1].seconds,115);
  assert.match(results[2].card,/2,5 км/);assert.equal(results[2].timer,undefined);assert.equal(results[2].distance,2.1);assert.match(results[2].history,/2.1 км/);
  assert.deepEqual(errors,[]);
  console.log('PASS: focus time and distance use metric goals, reject negative results and save actual work without RIR or strength estimates.');
 }finally{dom.window.eval('stopTimer();st.current=null');await wait(100);dom.window.__disconnectTestObservers();dom.window.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
