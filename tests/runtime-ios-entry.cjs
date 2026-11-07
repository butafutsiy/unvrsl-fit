'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require(process.env.UNVRSL_JSDOM||'jsdom');
const {make,wait,errors}=require('./runtime-v392.cjs');
const {indexedDB}=require(process.env.UNVRSL_FAKE_IDB||'fake-indexeddb');
(async()=>{
 // Simulate iOS viewport panning separately from the document's scroll root.
 const viewportDom=new JSDOM('<body><div class="app"><input id="previous"></div><nav class="nav"></nav><div id="modal"><button class="modal-close-global">Close</button><div id="sheet"><input id="equipment"></div></div></body>',{url:'http://app.test',runScripts:'outside-only',pretendToBeVisual:true});
 const v=viewportDom.window,root=v.document.documentElement,nav=v.document.querySelector('.nav');
 v.visualViewport=new v.EventTarget();Object.assign(v.visualViewport,{height:800,offsetTop:0});
 v.closeModal=()=>v.document.getElementById('modal').classList.remove('show');
 nav.getBoundingClientRect=()=>({top:700,width:390,height:64});
 v.eval(fs.readFileSync(require.resolve('../app-viewport.js'),'utf8'));
 v.eval(fs.readFileSync(require.resolve('../interface-runtime.js'),'utf8'));
 const clearance=root.style.getPropertyValue('--app-controls-clearance');
 v.document.getElementById('previous').focus();nav.style.visibility='hidden';v.UNVRSLViewport.refresh();await wait(40);
 assert.equal(root.style.getPropertyValue('--app-controls-clearance'),clearance,'keyboard hiding nav does not collapse document clearance');
 Object.assign(v.visualViewport,{height:420,offsetTop:150});v.visualViewport.dispatchEvent(new v.Event('scroll'));
 assert.equal(root.style.getPropertyValue('--visible-height'),'420px');assert.equal(root.style.getPropertyValue('--visible-top'),'150px');
 const modal=v.document.getElementById('modal');modal.classList.add('show');await wait(30);
 v.document.getElementById('equipment').focus();v.closeModal();await wait(30);
 assert.ok(!v.document.activeElement.matches('input'),'close neither retains a hidden input nor reopens the previous input');
 viewportDom.window.close();
 const dom=make(undefined,{indexedDB});await wait(3000);const w=dom.window;
 try{
  // Exercise the production wrapper chain and real draft persistence.
  await w.eval(`(async()=>{
   st.current=session(UNVRSL_ROUTINES.find(r=>r.w===1&&r.c==='B'));
   st.current.trainingReadinessDone=true;nav('start');await trainingEngine200Tick();
  })()`);await wait(700);
  const input=w.document.querySelectorAll('#start .exercise')[4].querySelectorAll('.setrow input')[1];
  const rir=input.closest('.setrow').querySelector('[data-effort="rir"]');
  input.focus();input.value='12';input.dispatchEvent(new w.Event('input',{bubbles:true}));input.dispatchEvent(new w.Event('change',{bubbles:true}));
  w.startPage();await wait(100);
  assert.ok(input.isConnected,'focused reps input stays mounted across background renders');
  assert.equal(w.document.activeElement,input);
  assert.equal(w.st.current.ex[4].set[0].r,12);
  rir.focus();w.startPage();await wait(350);
  assert.ok(rir.isConnected,'keyboard Next does not rebuild the next field');assert.equal(w.document.activeElement,rir);
  rir.value='2';rir.dispatchEvent(new w.Event('change',{bubbles:true}));
  assert.equal(w.st.current.ex[4].set[0].rir,2);assert.equal(w.st.current.ex[4].set[0].rpe,8);
  rir.blur();await wait(450);
  assert.ok(!input.isConnected,'deferred render runs when editing finishes');
  assert.ok(!w.document.activeElement.matches('input'),'blur does not refocus a replacement input');

  // Save the decimal equipment list used in the recording.
  w.document.querySelectorAll('#start .eq405-control')[4].click();await wait(30);
  w.document.querySelector('#sheet .btn.primary').click();await wait(30);
  w.document.getElementById('eq405Name').value='Matrix';w.document.getElementById('eq405Step').value='';
  const available=w.document.getElementById('eq405Available');available.value='11.3, 13.5, 15.8';available.focus();
  w.document.querySelector('#sheet .btn.primary').click();await wait(400);
  assert.deepEqual(Array.from(w.st.current.ex[4].equipmentProfile.availableLoads),[11.3,13.5,15.8]);
  assert.ok(!w.document.getElementById('modal').classList.contains('show'));
  assert.ok(!w.document.activeElement.matches('input'),'closing equipment releases the keyboard');

  const id=w.st.current.id;
  const original=w.closeWorkoutDraft;let locked=false;
  w.closeWorkoutDraft=async(...args)=>{locked=w.__workoutFinishing;await wait(30);return original(...args)};
  await w.cancelWorkout();assert.equal(locked,true,'cancellation locks background account reconciliation');
  assert.equal(w.st.current,null);assert.equal(w.eval('workoutStore.journal().closed')[id].reason,'discarded');
  w.nav('home');assert.equal(w.document.querySelector('[data-workout-draft]'),null);
  const stored=JSON.parse(w.localStorage.getItem('unvrsl-fit-v3'));
  assert.equal(stored.current,null);assert.equal(stored.sessions.length,0);
  // A stale account snapshot cannot re-open the locally discarded session.
  w.st={...w.st,current:{id,ex:[]}};assert.equal(w.st.current,null);
  assert.deepEqual(errors,[]);
  console.log('PASS iOS entry: mounted fields, keyboard Next/blur, RIR, decimal equipment, cancellation lock, durable tombstone and stale snapshot');
 }finally{dom.window.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
