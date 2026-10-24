'use strict';
const assert=require('node:assert/strict');
const {make,wait,errors}=require('./runtime-v392.cjs');
(async()=>{
 const dom=make(null,{trackObservers:true});await wait(2700);const W=dom.window;
 try{
  const result=await W.eval(`(async()=>{
   const wait=ms=>new Promise(r=>setTimeout(r,ms));
   const target=w=>({w,programW:0,r:'',ok:false,targetRepMin:8,targetRepMax:12,targetRpeMin:7,targetRpeMax:8});
   const ex=(n,w=50)=>({n,method:'STANDARD',loadType:'external_total',programWeightMode:'adaptive',rest:90,set:[target(w),target(w)]});
   const reset=()=>{workoutFocus.close();stopTimer();if(st.current)workoutStore.discard(st);st.sessions=[];};
   const root=()=>document.getElementById('workout-focus');
   const click=selector=>{const b=root().querySelector(selector);if(!b)throw Error('Missing '+selector+' in '+root().textContent);b.click();};
   const submit=(weight,reps,rir)=>{const form=root().querySelector('form');if(form.elements.weight)form.elements.weight.value=String(weight);form.elements.reps.value=String(reps);form.elements.technique.checked=true;click('[data-wf-rir="'+rir+'"]');form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));};
   st.current={id:'focus-pair',date:iso(),w:1,c:'Focus',name:'Pair',started:Date.now(),trainingEngineRevision:295,ex:[{...ex('Жим штанги лёжа'),superGroup:'pair',transitionSec:0},{...ex('Тяга штанги в наклоне'),superGroup:'pair',afterGroupRestSec:90}]};
   save();nav('start');await wait(100);workoutFocus.open();
   const firstTitle=root().querySelector('h2').textContent;
   const originalSave=window.save;window.save=()=>false;
   submit(50,10,2);
   const saveFailure={ok:st.current.ex[0].set[0].ok,title:root().querySelector('h2').textContent};
   window.save=originalSave;
   submit(50,10,2);await wait(30);
   const afterA={title:root().querySelector('h2').textContent,done:st.current.ex[0].set[0].ok,timer:workoutTimerSnapshot().end,unchanged:st.current.ex[0].set[0].w};
   submit(50,10,2);await wait(30);
   const afterB={text:root().textContent,done:st.current.ex[1].set[0].ok,rest:!!st.current.focusState.rest};
   // Test the real timer's completion signal, rather than calling the focus handler.
   timer(1,'Отдых после связки');await wait(1250);
   const roundTwo={title:root().querySelector('h2').textContent,badge:root().querySelector('.wf-badge').textContent,rest:!!st.current.focusState.rest};
   reset();
   st.current={id:'focus-cal',date:iso(),w:1,c:'Calibration',name:'Calibration',started:Date.now(),trainingEngineRevision:295,ex:[ex('Жим штанги лёжа',0)]};
   save();nav('start');await wait(60);workoutFocus.open();
   const empty=root().textContent;click('[data-wf-action="calibrate"]');
   const initial={weight:root().querySelector('[name=weight]').value,reps:root().querySelector('[name=reps]').value,steps:[...root().querySelectorAll('[data-wf-step]')].map(x=>x.textContent),mode:st.current.loadCalibrationDraft.mode,target:root().querySelector('.wf-load').textContent};
   submit(40,12,3);click('[data-wf-action="skip-cal-rest"]');
   click('[data-wf-step="8"]');submit(45,8,2);click('[data-wf-action="skip-cal-rest"]');
   const preview=root().textContent;
   const completedBefore=st.current.ex[0].set.filter(x=>x.ok).length;
   click('[data-wf-action="save-calibration"]');await wait(30);
   const calibration={sessions:st.sessions.length,evidence:st.current.calibrationSessions.length,probes:st.current.calibrationSessions[0].ex[0].set.length,inputWeight:root().querySelector('[name=weight]').value,inputReps:root().querySelector('[name=reps]').value,weight:st.current.ex[0].set[0].w,completedBefore,completedAfter:st.current.ex[0].set.filter(x=>x.ok).length,text:root().textContent};
   workoutFocus.render();workoutFocus.render();calibration.evidenceAfterRenders=st.current.calibrationSessions.length;
   const held=st.current.ex[0].set[0].w;
   submit(held,10,2);await wait(20);click('[data-wf-action="continue"]');
   const saved={w:st.current.ex[0].set[0].w,r:st.current.ex[0].set[0].actualReps,rir:st.current.ex[0].set[0].actualRir};
   const seed={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);seed[k]=localStorage.getItem(k);}
   return {saveFailure,firstTitle,afterA,afterB,roundTwo,empty,initial,preview,calibration,saved,seed};
  })()`);
  assert.equal(result.saveFailure.ok,false);assert.match(result.saveFailure.title,/Жим/);
  assert.match(result.firstTitle,/Жим/);assert.match(result.afterA.title,/Тяга/);assert.equal(result.afterA.done,true);assert.equal(result.afterA.timer,0);
  assert.equal(result.afterB.done,true);assert.equal(result.afterB.rest,true);assert.match(result.afterB.text,/Отдых после связки/);
  assert.match(result.roundTwo.title,/Жим/);assert.match(result.roundTwo.badge,/круг 2/);assert.equal(result.roundTwo.rest,false);
  assert.match(result.empty,/Первый рабочий вес ещё не подобран/);assert.equal(result.initial.weight,'');assert.equal(result.initial.reps,'');
  assert.equal(result.initial.mode,'target');assert.match(result.initial.target,/8–12 повт. · RIR 2–3/);assert.deepEqual(Array.from(result.initial.steps),['12','10','8','6','4','2']);assert.match(result.preview,/Предварительный e1RM/);
  assert.equal(result.calibration.sessions,0);assert.equal(result.calibration.evidence,1);assert.equal(result.calibration.evidenceAfterRenders,1);assert.equal(result.calibration.probes,2);
  assert.ok(result.calibration.weight>0);assert.equal(Number(result.calibration.inputWeight),result.calibration.weight);assert.equal(result.calibration.inputReps,'');assert.equal(result.calibration.completedBefore,0);assert.equal(result.calibration.completedAfter,0);
  assert.equal(result.saved.r,10);assert.equal(result.saved.rir,2);
  dom.window.__disconnectTestObservers();dom.window.close();
  const restored=make(result.seed,{trackObservers:true});await wait(2300);
  try{
   const restoredResult=restored.window.eval('({evidence:st.current.calibrationSessions.length,probes:st.current.calibrationSessions[0].ex[0].set.length,actual:st.current.ex[0].set[0].actualReps,weight:st.current.ex[0].set[0].w,ok:st.current.ex[0].set[0].ok})');
   assert.equal(restoredResult.evidence,1);assert.equal(restoredResult.probes,2);assert.equal(restoredResult.actual,10);assert.equal(restoredResult.ok,true);assert.equal(restoredResult.weight,result.saved.w);
   const launched=await restored.window.eval(`(async()=>{
    workoutFocus.close();stopTimer();workoutStore.discard(st);
    const block={id:'sup-launch',method:'SUPERSET',n:'Связка',rounds:3,rpe:8,betweenRest:0,rest:90,
     items:[{n:'Жим штанги лёжа',sourceId:'barbell_bench'},{n:'Тяга штанги в наклоне',sourceId:'barbell_row'}],itemSettings:[{w:50,r:12},{w:0,r:8}]};
    const p={id:'focus-custom-super',name:'Focus custom super',weeks:[{n:1,days:[{id:'super-day',name:'Super day',ex:[block]}]}]};
    st.programs.push(p);save();programBeginDayCoreV382(p.id,0,0);await trainingEngine200Tick();
    workoutFocus.open();
    return {ex:st.current.ex.map(e=>({n:e.n,count:e.set.length,group:e.superGroup,pos:e.superPos,transition:e.transitionSec,after:e.afterGroupRestSec,mode:e.programWeightMode,w:e.set[0].w,reps:e.set[0].targetRepMin})),badge:document.querySelector('#workout-focus .wf-badge')?.textContent};
   })()`);
   assert.equal(launched.ex.length,2);assert.equal(launched.ex[0].count,3);assert.equal(launched.ex[1].count,3);
   assert.equal(launched.ex[0].group,launched.ex[1].group);assert.equal(launched.ex[0].pos,0);assert.equal(launched.ex[1].pos,1);
   assert.equal(launched.ex[0].transition,0);assert.equal(launched.ex[1].after,90);
   assert.equal(launched.ex[0].mode,'prescribed');assert.equal(launched.ex[0].w,50);assert.equal(launched.ex[1].mode,'adaptive');
   assert.equal(launched.ex[0].reps,12);assert.equal(launched.ex[1].reps,8);assert.match(launched.badge,/Суперсет/);
   const revised=await restored.window.eval(`(async()=>{
    workoutFocus.close();stopTimer();workoutStore.discard(st);st.sessions=[];
    const target=()=>({w:0,r:'',ok:false,targetRepMin:8,targetRepMax:12,targetRpeMin:7,targetRpeMax:8});
    const ex=()=>({n:'Жим штанги лёжа',method:'STANDARD',loadType:'external_total',programWeightMode:'adaptive',rest:90,equipmentProfile:{id:'probe-machine',availableLoads:[20,35,50]},set:[target(),target(),target()]});
    st.current={id:'credit-new',date:iso(),w:1,started:Date.now(),trainingEngineRevision:295,ex:[ex()]};save();nav('start');workoutFocus.open();workoutFocus.calibrate(0);
    const root=document.querySelector('#workout-focus'),click=s=>{const b=root.querySelector(s);if(!b)throw Error('Missing '+s);b.click();};
    const submit=(weight,reps,rir)=>{const f=root.querySelector('form');f.elements.weight.value=String(weight);f.elements.reps.value=String(reps);f.elements.technique.checked=true;click('[data-wf-rir="'+rir+'"]');f.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));};
    const inp=root.querySelector('[name=weight]');inp.value='20';click('[data-wf-weight="1"]');const stepped=inp.value;
    submit(35,10,2);const offered=!!root.querySelector('[data-wf-action="credit-calibration"]');
    const oldSave=window.save;window.save=()=>false;click('[data-wf-action="credit-calibration"]');const failed=st.current.ex[0].set[0].ok;window.save=oldSave;
    click('[data-wf-action="credit-calibration"]');
    const credited={ok:st.current.ex[0].set[0].ok,reps:st.current.ex[0].set[0].actualReps,id:st.current.ex[0].set[0].calibrationAttemptId,evidence:(st.current.calibrationSessions||[]).length,committed:st.current.loadCalibrationDraft.committed};
    click('[data-wf-action="continue"]');submit(35,10,'unknown');
    const unknown={ok:st.current.ex[0].set[1].ok,rir:st.current.ex[0].set[1].actualRir,rpe:st.current.ex[0].set[1].actualRpe,uncertain:st.current.ex[0].set[1].effortUncertain};
    click('[data-wf-action="continue"]');const held=st.current.ex[0].set[2].w;
    workoutFocus.close();stopTimer();workoutStore.discard(st);
    const a=ex(),b=ex();a.set[0].w=35;a.superGroup=b.superGroup='preflight';b.n='Тяга штанги в наклоне';
    st.current={id:'preflight-new',date:iso(),w:1,started:Date.now(),trainingEngineRevision:295,ex:[a,b]};save();nav('start');workoutFocus.open();
    const preflightOffer=!!root.querySelector('[data-wf-calibrate-index="1"]');submit(35,10,2);
    const preflight={offered:preflightOffer,firstDone:st.current.ex[0].set[0].ok,ei:st.current.loadCalibrationDraft.ei};
    workoutFocus.close();stopTimer();workoutStore.discard(st);
    st.current={id:'unknown-probe',date:iso(),w:1,started:Date.now(),trainingEngineRevision:295,ex:[ex()]};save();nav('start');workoutFocus.open();workoutFocus.calibrate(0);
    submit(35,10,'unknown');const unknownProbe={credit:!!root.querySelector('[data-wf-action="credit-calibration"]'),anchor:!!root.querySelector('[data-wf-action="save-calibration"]')};
    click('[data-wf-action="use-unconfirmed"]');unknownProbe.weight=st.current.ex[0].set[0].w;unknownProbe.evidence=(st.current.calibrationSessions||[]).length;unknownProbe.done=st.current.ex[0].set[0].ok;
    return {stepped,offered,failed,credited,unknown,held,preflight,unknownProbe};
   })()`);
   assert.equal(revised.stepped,'35');assert.equal(revised.offered,true);assert.equal(revised.failed,false);
   assert.equal(revised.credited.ok,true);assert.equal(revised.credited.reps,10);assert.ok(revised.credited.id);assert.equal(revised.credited.evidence,0);assert.equal(revised.credited.committed,true);
   assert.equal(revised.unknown.ok,true);assert.equal(revised.unknown.rir,null);assert.equal(revised.unknown.rpe,null);assert.equal(revised.unknown.uncertain,true);assert.equal(revised.held,35);
   assert.equal(revised.preflight.offered,true);assert.equal(revised.preflight.firstDone,false);assert.equal(revised.preflight.ei,1);
   assert.equal(revised.unknownProbe.credit,false);assert.equal(revised.unknownProbe.anchor,false);assert.equal(revised.unknownProbe.weight,35);assert.equal(revised.unknownProbe.evidence,0);assert.equal(revised.unknownProbe.done,false);
  }finally{restored.window.__disconnectTestObservers();restored.window.close();}
  assert.deepEqual(errors,[]);
  console.log('PASS: focus superset A1/B1/rest/A2, real timer completion, zero-load wizard, current-target probes, optional rep steps, legal weight stepper, credit/retry without duplicate evidence, uncertain effort, superset preflight, autoweight, actual sets and draft reload.');
 }finally{dom.window.__disconnectTestObservers?.();dom.window.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
