'use strict';
const assert=require('node:assert/strict');
const {make,wait,errors}=require('./runtime-v392.cjs');
(async()=>{
 const dom=make();await wait(3000);const W=dom.window;
 try{
  const r=await W.eval(`(async()=>{
   const exercise=n=>({n,method:'UNVRSL',tempo:'3-1-2',rest:150,sourceId:null,exerciseId:'stale',loadType:'per_dumbbell',implementCount:2,equipmentProfileId:'old',equipmentProfile:{step:10},set:[{w:125,r:8,rpe:7,rir:3,ok:false,manualOverride:true,plannedW:125,programW:125,equipmentSnapshot:{id:'old'},recommendationRestore:{w:125}}]});
   st.current={id:'rep-test',w:1,c:'A',started:Date.now(),trainingEngineRevision:295,ex:[exercise('Хип-траст со штангой')]};
   const open=n=>replaceExerciseSheet([0],encodeURIComponent(n));open(st.current.ex[0].n);
   const recommended=__replacement.candidates.filter(x=>x.recommend).map(x=>({name:x.e.n,bp:x.e.bp})),first=document.querySelector('.replacement-item b').textContent,selfExcluded=!__replacement.candidates.some(x=>x.e.id==='canon:barbell_hip_thrust');
   const searches={};for(const q of ['гак','в гаке','гакк приседания','hack squat','бицепс','штангой наклоны']){filterReplacement(q);searches[q]=document.querySelector('#replacementList').textContent}
   filterReplacement('несуществующее упражнение');const empty=document.querySelector('#replacementList').textContent;
   setReplacementMode('all');const page1=document.querySelectorAll('.replacement-item').length;showMoreReplacements();const page2=document.querySelectorAll('.replacement-item').length,all=__replacement.candidates.length;
   setReplacementMode('similar');const restored=document.querySelector('#repSearch').value===''&&document.querySelector('[data-replacement-mode="similar"]').getAttribute('aria-pressed')==='true';
   filterReplacement('гак');document.querySelector('.replacement-item').click();await new Promise(resolve=>setTimeout(resolve,100));const replaced=JSON.parse(JSON.stringify(st.current.ex[0]));
   st.current.ex=[exercise('Румынская тяга со штангой — DS D1'),exercise('Румынская тяга со штангой — DS D2')];
   replaceExerciseSheet([0,1],encodeURIComponent('Румынская тяга со штангой'),'0085');const rdl=__replacement.candidates.filter(x=>x.recommend).map(x=>x.e.n);
   filterReplacement('румынская гантелями');document.querySelector('.replacement-item').click();const grouped=st.current.ex.map(x=>({n:x.n,id:x.exerciseId,method:x.method}));
   st.current.ex[1].set[0].ok=true;const before=JSON.stringify(st.current.ex);applyReplacement([0,1],encodeURIComponent('Румынская тяга с гантелями'),encodeURIComponent('Гакк-присед'),'canon:hack_squat');const locked=before===JSON.stringify(st.current.ex);
   st.current.ex=[exercise('Хип-траст со штангой')];open(st.current.ex[0].n);filterReplacement('гак');st.current.id='new';selectReplacement(0);const stale=st.current.ex[0].n==='Хип-траст со штангой';
   st.current.ex=[exercise('Неизвестное движение')];open(st.current.ex[0].n);const unknown=__replacement.candidates.filter(x=>x.recommend).length;filterReplacement('гак');const fallback=__replacement.visible[0]?.e.id;
   const legSupport=WorkoutDomain.repsText({n:'Выпады назад с гантелями'},24)==='12 / 12';
   st.current=null;closeModal();return {recommended,first,selfExcluded,searches,empty,page1,page2,all,restored,replaced,rdl,grouped,locked,stale,unknown,fallback,legSupport};
  })()`);
  assert.ok(r.recommended.length);assert.ok(r.recommended.every(x=>x.bp==='upper legs'));assert.match(r.first,/Ягодичный мост/);assert.equal(r.selfExcluded,true);
  for(const q of ['гак','в гаке','гакк приседания','hack squat'])assert.match(r.searches[q],/Гакк-присед/,q);
  assert.match(r.searches['бицепс'],/Сгибание/);assert.match(r.searches['штангой наклоны'],/Наклоны со штангой \(гудморнинг\)/);assert.doesNotMatch(r.searches['штангой наклоны'],/со штангой со штангой/);
  assert.match(r.empty,/Ничего не найдено/);assert.equal(r.page1,24);assert.equal(r.page2,48);assert.equal(r.all,188);assert.equal(r.restored,true);
  assert.equal(r.replaced.n,'Гакк-присед');assert.equal(r.replaced.exerciseId,'canon:hack_squat');assert.equal(r.replaced.sourceId,'0743');assert.equal(r.replaced.loadType,'external_total');assert.equal(r.replaced.implementCount,1);assert.equal(r.replaced.equipmentProfileId,undefined);
  assert.equal(r.replaced.set[0].w,'');assert.equal(r.replaced.set[0].programW,0);assert.equal(r.replaced.set[0].assignedW,null);assert.equal(r.replaced.set[0].recommendationRestore,undefined);assert.equal(r.replaced.set[0].equipmentSnapshot,undefined);assert.equal(r.replaced.set[0].manualOverride,false);
  assert.equal(r.replaced.set[0].r,8);assert.equal(r.replaced.set[0].rpe,7);assert.equal(r.replaced.set[0].rir,3);assert.equal(r.replaced.method,'UNVRSL');assert.equal(r.replaced.tempo,'3-1-2');assert.equal(r.replaced.rest,150);
  assert.equal(r.rdl[0],'Румынская тяга с гантелями');assert.ok(r.rdl.every(n=>!n.includes('гудморнинг')));assert.equal(r.grouped[0].n,'Румынская тяга с гантелями — DS D1');assert.equal(r.grouped[1].n,'Румынская тяга с гантелями — DS D2');assert.ok(r.grouped.every(x=>x.id==='og:1459'&&x.method==='UNVRSL'));
  assert.equal(r.locked,true);assert.equal(r.stale,true);assert.equal(r.unknown,0);assert.equal(r.fallback,'canon:hack_squat');assert.equal(r.legSupport,true);assert.deepEqual(errors,[]);
  console.log('PASS: canonical recommendations, global alias search, pagination, selection, grouped methods, load reset, completed-set lock, stale-session guard and preserved per-leg display.');
 }finally{dom.window.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
