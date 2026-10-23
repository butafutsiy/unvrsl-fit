'use strict';
const assert=require('node:assert/strict');
const {make,wait,errors}=require('./runtime-v392.cjs');
const {memoryIndexedDB}=require('./storage-fixture.cjs');
async function ready(dom){const deadline=Date.now()+15000;while(!dom.window.__unvrslStartupComplete||typeof dom.window.applyAutoWarmup!=='function'){assert.ok(Date.now()<deadline,'workout modules must finish loading');await wait(50);}}
(async()=>{
 const indexedDB=memoryIndexedDB(),state={bw:[],sessions:[],current:null,week:1,theme:'dark',accent:'#bf5af2',storageRevision:1};
 indexedDB.stores.set('state',new Map([['latest',{state:{...state,theme:'light',storageRevision:2}}]]));
 const dom=make({'unvrsl-fit-v3':JSON.stringify(state)},{trackObservers:true,indexedDB});
 let seed;
 try{
  await ready(dom);
  assert.equal(dom.window.document.documentElement.dataset.theme,'light','durable light theme must survive the default dark boot');
  const result=dom.window.eval(`(()=>{
   const target=()=>({w:150,r:'',ok:false,targetRepMin:8,targetRepMax:12,targetRpeMin:7,targetRpeMax:8});
   st.current={id:'warmup-runtime',date:iso(),w:1,started:Date.now(),trainingEngineRevision:295,ex:[{n:'Присед со штангой high-bar',eq:'barbell',loadType:'external_total',programWeightMode:'adaptive',rest:0,set:[target(),target()]}]};
   save();nav('start');workoutFocus.open();
   const root=document.getElementById('workout-focus'),click=sel=>{const el=root.querySelector(sel);if(!el)throw Error('Missing '+sel);el.click();};
   const input=(sel,value)=>{const el=root.querySelector(sel);el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));};
   input('[name=reps]','10');click('[data-wf-rir="2"]');
   const preview=root.querySelectorAll('.wf-warmup-preview>div').length;
   click('[data-wf-action="warmup-plan"]');
   const count=st.current.ex[0].warmup.length;
   input('[data-wf-warmup-row="0"] [data-wf-warmup-field="weight"]','25');input('[data-wf-warmup-row="0"] [data-wf-warmup-field="reps"]','8');
   const originalSave=window.save;window.save=()=>false;click('[data-wf-warmup-save="0"]');const failed=st.current.ex[0].warmup[0].ok;window.save=originalSave;
   click('[data-wf-warmup-save="0"]');
   const first=JSON.parse(JSON.stringify(st.current.ex[0].warmup[0]));
   applyAutoWarmup([0],encodeURIComponent(st.current.ex[0].n));const notDuplicated=st.current.ex[0].warmup.length===count;
   click('[data-wf-action="warmup-add"]');
   input('[data-wf-warmup-row="'+count+'"] [data-wf-warmup-field="weight"]','-5');input('[data-wf-warmup-row="'+count+'"] [data-wf-warmup-field="reps"]','4');click('[data-wf-warmup-save="'+count+'"]');const invalid=st.current.ex[0].warmup[count].ok;
   input('[data-wf-warmup-row="'+count+'"] [data-wf-warmup-field="weight"]','100');click('[data-wf-warmup-save="'+count+'"]');
   const workDraft=root.querySelector('[name=reps]').value,queue=WorkoutFocusFlow.queue(st.current).length,tonnage=WorkoutDomain.tonnage(st.current,workoutRegistry);
   workoutFocus.close();nav('start');const header=document.querySelectorAll('#start .workout-head [data-focus-open]').length,inline=document.querySelectorAll('[data-focus-exercise]').length;
   const work=st.current.ex[0].set.map(x=>({ok:x.ok,w:x.w,actualReps:x.actualReps}));
   const seed={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);seed[k]=localStorage.getItem(k);}
   return {preview,count,failed,first,notDuplicated,invalid,custom:st.current.ex[0].warmup[count],workDraft,queue,tonnage,work,header,inline,seed};
  })()`);
  assert.equal(result.preview,5);assert.equal(result.count,5);assert.equal(result.failed,false);
  assert.equal(result.first.ok,true);assert.equal(result.first.w,25);assert.equal(result.first.actualReps,8);assert.equal(result.first.plannedW,20);assert.equal(result.first.warmup,true);
  assert.equal(result.notDuplicated,true);assert.equal(result.invalid,false);assert.equal(result.custom.ok,true);assert.equal(result.custom.w,100);
  assert.equal(result.workDraft,'10');assert.equal(result.queue,2);assert.equal(result.tonnage,0);
  for(const x of result.work){assert.equal(x.ok,false);assert.equal(x.w,150);assert.equal(x.actualReps,undefined);}
  assert.equal(result.header,1);assert.equal(result.inline,0);seed=result.seed;
 }finally{dom.window.eval('stopTimer();st.current=null');await wait(100);dom.window.__disconnectTestObservers();dom.window.close();}
 const restored=make(seed,{trackObservers:true});
 try{
  await ready(restored);
  const data=restored.window.eval(`(()=>{nav('start');workoutFocus.open();return {warmup:st.current.ex[0].warmup,work:st.current.ex[0].set,rows:document.querySelectorAll('[data-wf-warmup-row]').length}})()`);
  assert.equal(data.rows,6);assert.equal(data.warmup[0].w,25);assert.equal(data.warmup[0].actualReps,8);assert.equal(data.warmup[5].ok,true);assert.equal(data.work[0].ok,false);
  assert.deepEqual(errors,[]);
  console.log('PASS: recovered light theme, focus warmup preview, actual edits, save rollback, manual warmup, no duplicate plan, independent work/volume, one header launch and draft reload.');
 }finally{restored.window.eval('stopTimer();st.current=null');await wait(100);restored.window.__disconnectTestObservers();restored.window.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
