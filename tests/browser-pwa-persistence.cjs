'use strict';
const {chromium}=require(process.env.UNVRSL_PLAYWRIGHT||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const output=process.env.UNVRSL_AUDIT_OUTPUT||'/workspace/unvrsl-audit';
const base=process.env.UNVRSL_AUDIT_URL||'http://127.0.0.1:8780/unvrsl-fit/';
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await context.newPage();
  await page.route('**/*',r=>r.request().url().startsWith(new URL(base).origin)?r.continue():r.abort());
  page.on('dialog',dialog=>dialog.accept());await page.goto(base);await page.waitForFunction(()=>window.__unvrslStartupComplete,{timeout:25000});
  await page.evaluate(async()=>{await window.unvrslWarmDeferredModulesV320?.();await navigator.serviceWorker.ready;});
  await page.waitForFunction(()=>!!navigator.serviceWorker.controller,{timeout:25000});
  const before=await page.evaluate(async()=>{
   const p=ensureProgramShape({id:'offline-plan',seedId:'offline-source',name:'Offline fixture',weeks:[{days:[{ex:[]}]}]});st.programs.push(p);await persistWorkoutState();
   st.current={id:'offline-draft',date:iso(),c:'Audit',w:1,started:Date.now(),trainingEngineRevision:295,ex:[{n:'Жим',method:'STANDARD',loadType:'external_total',programWeightMode:'prescribed',set:[{w:80,selectedW:80,actualWeight:80,programW:95,assignedW:95,weightMode:'prescribed',weightPolicyRevision:528,r:10,actualReps:10,rpe:8,actualRpe:8,ok:true}]}]};
   st.sessions.push({id:'offline-history',date:iso(),ended:1,ex:[]});await persistWorkoutState();await trainerDeleteOwnProgram(p.id);await persistWorkoutState();
   return{deleted:!st.programs.some(p=>p.id==='offline-plan'),history:st.sessions.length,cacheKeys:await caches.keys()};
  });assert.equal(before.deleted,true);
  await context.setOffline(true);await page.reload();await page.waitForFunction(()=>window.__unvrslStartupComplete,{timeout:25000});
  const offline=await page.evaluate(()=>({programReturned:st.programs.some(p=>p.id==='offline-plan'),trash:st.programTrash.some(p=>p.id==='offline-plan'),draft:st.current?.id,weight:st.current?.ex[0].set[0].actualWeight,assigned:st.current?.ex[0].set[0].assignedW,history:st.sessions.length}));
  assert.equal(offline.programReturned,false);assert.equal(offline.trash,true);assert.equal(offline.draft,'offline-draft');assert.equal(offline.weight,80);assert.equal(offline.assigned,95);assert.equal(offline.history,before.history);
  await page.evaluate(async()=>{await restoreDeletedProgram('offline-plan');await persistWorkoutState()});await page.reload();await page.waitForFunction(()=>window.__unvrslStartupComplete,{timeout:25000});
  assert.equal(await page.evaluate(()=>st.programs.some(p=>p.id==='offline-plan')),true);
  fs.mkdirSync(output,{recursive:true});fs.writeFileSync(output+'/pwa-results.json',JSON.stringify({before,offline,restoredOffline:true},null,2));
  console.log('PASS production PWA: actual Service Worker cache, offline deletion/reload, active draft/actual weights, history and explicit offline restore');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
