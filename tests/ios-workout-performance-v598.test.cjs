'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const {memoryIndexedDB}=require('./storage-fixture.cjs');
const read=path=>fs.readFileSync(require('node:path').join(__dirname,'..',path),'utf8');

test('workout nav is fixed by CSS rather than repeatedly translated by visualViewport',()=>{
  const guard=read('workout-scroll-guard.js'),css=read('mobile-final-fix.js');
  assert.doesNotMatch(guard,/visualViewport|navOffset|desiredBottom/);
  assert.doesNotMatch(guard,/style\.translate\s*=/);
  assert.match(guard,/removeProperty\('translate'\)/);
  assert.match(css,/\.nav\{position:fixed!important/);
  assert.match(css,/translate:none!important;transform:none!important/);
});

test('account sync never rebuilds the mounted active workout, but still refreshes other pages',()=>{
  const sync=read('account-sync.js');
  assert.match(sync,/const visibleWorkoutId=/);
  assert.match(sync,/const sameVisibleWorkout=/);
  assert.match(sync,/if\(!sameVisibleWorkout\)render\(\)/);
});

test('hydrated active workout does not wait for remote client catalog at startup',()=>{
  const boot=read('startup-orchestrator.js');
  assert.match(boot,/if\(current\?\.id&&/);
  assert.match(boot,/if\(!localCoreReady\(\)\)return false/);
});

test('load model constructs scoped history once per run, not for each exercise set',()=>{
  const model=read('training-load-model.js');
  const declaration=model.match(/const sessionHistory = recommendationHistory\(\)/g)||[];
  assert.equal(declaration.length,1);
  assert.match(model,/const eligibleHistory = sessionHistory\.filter/);
  assert.match(model,/const observations=eligibleHistory\.flatMap/);
});

test('iPhone scroll updates position in memory and persists one draft after idle, not per frame',async()=>{
  const idx=memoryIndexedDB(),winEvents={},docEvents={},frames=[];
  const timers=new Map();let timerId=0,writes=0,scroll=0;
  const st={current:{id:'active-598',userId:'athlete',ex:[],started:123,scrollY:0},sessions:[],storageRevision:1};
  const journal={schemaVersion:4,owners:{},closed:{}};
  const window={
    indexedDB:idx,__unvrslHadPrimaryStorageV386:true,
    addEventListener(name,handler){(winEvents[name]||=[]).push(handler)},
    dispatchEvent(){},get scrollY(){return scroll},
    unvrslScrollTop:()=>scroll
  };
  const document={
    hidden:false,
    querySelector:selector=>selector==='#start.active'?{}:null,
    addEventListener(name,handler){(docEvents[name]||=[]).push(handler)}
  };
  const ctx={
    window,document,indexedDB:idx,st,localStorage:{getItem:()=>null,setItem:()=>{}},
    save(){writes++;return true},
    workoutStore:{journal:()=>journal,restore(){},save(){},checkpoint(){}},
    WorkoutStore:{DRAFT:'unvrsl-active-workout-v4',PRIMARY:'unvrsl-fit-v3'},
    WorkoutDomain:{migrate(){}},workoutRegistry:{},
    toast(){},console:{warn(){},error(){}},
    Date,JSON,Promise,structuredClone,
    CustomEvent:class{constructor(type){this.type=type}},
    setTimeout(fn){const id=++timerId;timers.set(id,fn);return id},
    clearTimeout(id){timers.delete(id)},
    requestAnimationFrame(fn){frames.push(fn);return frames.length}
  };
  vm.runInNewContext(read('storage-resilience.js'),ctx);
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(window.__unvrslStorageHydrationSettledV386,true);
  assert.ok(winEvents.scroll?.length);
  for(let i=1;i<=40;i++){
    scroll=i*25;
    for(const fn of winEvents.scroll)fn();
    while(frames.length)frames.shift()();
  }
  assert.equal(writes,0,'scroll must not persist 40 copies of whole workout');
  assert.equal(st.current.scrollY,1000,'live scroll position remains current');
  assert.equal(timers.size,1,'one pending idle checkpoint');
  const idle=[...timers.entries()][0];
  timers.delete(idle[0]);idle[1]();
  assert.equal(writes,1,'idle checkpoint persists exactly once');
});
