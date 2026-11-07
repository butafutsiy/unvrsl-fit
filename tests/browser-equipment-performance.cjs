'use strict';
const {chromium}=require(process.env.UNVRSL_PLAYWRIGHT||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const base=process.env.UNVRSL_AUDIT_URL||'http://127.0.0.1:8770/unvrsl-fit/';
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>r.request().url().startsWith(new URL(base).origin)?r.continue():r.abort());
  await page.goto(base);await page.waitForFunction(()=>window.__unvrslStartupComplete,{timeout:25000});
  await page.evaluate(async()=>{await unvrslWarmDeferredModulesV320();
   st.current=session(UNVRSL_ROUTINES.find(r=>r.w===1&&r.c==='B'));st.current.trainingReadinessDone=true;
   st.sessions=Array.from({length:120},(_,i)=>({id:'hist-'+i,date:'2026-09-01',started:Date.parse('2026-06-01')+i*86400000,ended:Date.parse('2026-06-01')+i*86400000+3600000,ex:st.current.ex.map(e=>({...e,set:e.set.map(()=>({w:30,r:12,rpe:8,rir:2,ok:true}))}))}));
   nav('start');await trainingEngine200Tick();await trainingLoadModel292.whenIdle();
  });
  const result=await page.evaluate(async()=>{
   const target=5,ex=st.current.ex[target];let beats=0,calls=[];
   const base=WorkoutDomain.recommend;WorkoutDomain.recommend=function(e,...args){calls.push({name:e.n,beat:beats});return base.call(this,e,...args)};
   const key=encodeURIComponent(workoutRegistry.identity(ex)+'@'+target);equipmentEdit405(key,'');
   document.getElementById('eq405Name').value='Matrix';document.getElementById('eq405Step').value='';document.getElementById('eq405Available').value='11.3, 13.5, 15.8';
   const heartbeat=setInterval(()=>beats++,1),before=performance.now();equipmentSave405(key,'');
   const saveMs=performance.now()-before,immediateCalls=calls.length,closed=!document.getElementById('modal').classList.contains('show');
   await trainingLoadModel292.whenIdle();clearInterval(heartbeat);
   return {saveMs,immediateCalls,closed,beats,calls,exercise:ex.n,pending:ex.set.filter(s=>!s.ok&&!s.skipped).length,equipment:ex.equipmentProfile.name};
  });
  assert.equal(result.immediateCalls,0);assert.equal(result.closed,true);assert.equal(result.equipment,'Matrix');
  assert.ok(result.calls.length>0);assert.equal(result.calls.length,result.pending);
  assert.ok(result.calls.every(x=>x.name===result.exercise));
  assert.ok(result.calls.at(-1).beat>result.calls[0].beat,'touch/timer tasks run between computations');
  assert.ok(result.saveMs<750,'save handler must not freeze the page for seconds');assert.deepEqual(errors,[]);
  console.log('PASS real mobile browser equipment performance '+JSON.stringify(result));
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
