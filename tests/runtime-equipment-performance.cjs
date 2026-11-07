'use strict';
const assert=require('node:assert/strict');
const {make,wait,errors}=require('./runtime-v392.cjs');
(async()=>{
 const dom=make();await wait(3300);const w=dom.window;
 try{
  await w.eval(`(async()=>{
    st.current=session(UNVRSL_ROUTINES.find(r=>r.w===1&&r.c==='B'));
    st.current.trainingReadinessDone=true;
    st.sessions=Array.from({length:120},(_,i)=>({id:'history-'+i,date:'2026-09-01',started:Date.parse('2026-06-01')+i*86400000,ended:Date.parse('2026-06-01')+i*86400000+3600000,
      ex:st.current.ex.map(e=>({...e,set:e.set.map(()=>({w:30,r:12,rpe:8,rir:2,ok:true}))}))}));
    nav('start');await trainingEngine200Tick();await trainingLoadModel292.whenIdle();
  })()`);await wait(500);await w.trainingLoadModel292.whenIdle();
  const target=5,ex=w.st.current.ex[target];
  Object.assign(ex.set[0],{w:30,r:12,rpe:8,rir:2,ok:true,actualWeight:30,actualReps:12});
  const completed=JSON.stringify(ex.set[0]);
  const other=w.st.current.ex[0].set[0].recommendation;
  let beats=0,calls=[];const heartbeat=w.setInterval(()=>beats++,1);
  const original=w.WorkoutDomain.recommend;
  w.WorkoutDomain.recommend=function(e,...args){calls.push({name:e.n,beat:beats});return original.call(this,e,...args)};
  const token=w.eval(`encodeURIComponent(workoutRegistry.identity(st.current.ex[${target}])+'@${target}')`);
  w.equipmentEdit405(token,'');await wait(30);
  w.document.getElementById('eq405Name').value='Matrix';w.document.getElementById('eq405Step').value='';
  w.document.getElementById('eq405Available').value='11.3, 13.5, 15.8';calls=[];
  w.equipmentSave405(token,'');
  assert.equal(calls.length,0,'save closes the form before starting any recommendation math');
  assert.ok(!w.document.getElementById('modal').classList.contains('show'));
  await w.trainingLoadModel292.whenIdle();await wait(100);w.clearInterval(heartbeat);
  assert.ok(calls.length>0);assert.ok(calls.every(x=>x.name===ex.n),'equipment does not recalculate unrelated exercises');
  assert.equal(calls.length,ex.set.filter(s=>!s.ok&&!s.skipped).length,'one calculation per pending set, not two full workouts');
  assert.ok(calls.at(-1).beat>calls[0].beat,'heartbeat runs between set calculations');
  assert.equal(w.st.current.ex[0].set[0].recommendation,other,'unrelated recommendations retain their identity');
  // Selecting new equipment preserves completed facts and snapshots the old apparatus.
  assert.equal(ex.set[0].w,30);assert.equal(ex.set[0].actualReps,12);assert.equal(ex.set[0].ok,true);
  const stored=JSON.parse(w.localStorage.getItem('unvrsl-fit-v3'));
  assert.equal(stored.current.ex[target].equipmentProfile.name,'Matrix');
  const historyBefore=JSON.stringify(w.st.sessions);
  calls=[];const p1=w.trainingLoadModel292.schedule({exerciseIndices:[target]});
  const p2=w.trainingLoadModel292.schedule({exerciseIndices:[target]});
  const p3=w.trainingLoadModel292.schedule({exerciseIndices:[target]});
  assert.equal(p1,p2);assert.equal(p2,p3);await p1;
  assert.equal(calls.length,ex.set.filter(s=>!s.ok&&!s.skipped).length);
  assert.equal(JSON.stringify(w.st.sessions),historyBefore);
  // A queued calculation may outlive navigation, cancellation or a new workout.
  const pending=w.trainingLoadModel292.schedule({exerciseIndices:[target]});
  w.st.current=null;await pending;assert.equal(w.st.current,null);
  // Both loader entry points share one pending promise and normalized file identity.
  const pA=w.loadExternalScript('./dedupe-fixture.js?v=1');
  const pB=w.loadExternalScript('dedupe-fixture.js?v=2');assert.equal(pA,pB);
  const scripts=[...w.document.querySelectorAll('script[src]')].filter(n=>n.src.includes('/dedupe-fixture.js'));
  assert.equal(scripts.length,1);scripts[0].dispatchEvent(new w.Event('load'));await pA;
  await w.loadExternalScript('./dedupe-fixture.js?v=3');assert.equal(w.document.querySelectorAll('script[src*="dedupe-fixture"]').length,1);
  const classic=w.document.createElement('script');classic.src='./existing-fixture.js?v=old';w.document.body.appendChild(classic);
  await w.loadExternalScript('./existing-fixture.js?v=new');assert.equal(w.document.querySelectorAll('script[src*="existing-fixture"]').length,1);
  const failed=w.loadExternalScript('./retry-fixture.js').catch(()=>false);
  w.document.querySelector('script[src*="retry-fixture"]').dispatchEvent(new w.Event('error'));assert.equal(await failed,false);
  const retried=w.loadExternalScript('./retry-fixture.js');w.document.querySelector('script[src*="retry-fixture"]').dispatchEvent(new w.Event('load'));await retried;
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({historyWorkouts:120,exercise:ex.n,pendingSets:calls.length,heartbeatTicks:beats,scopedEquipmentSave:true,coalescedRequests:true,historyUnchanged:true,staleCalculationStopped:true}));
 }finally{dom.window.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
