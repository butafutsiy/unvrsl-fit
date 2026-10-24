'use strict';
const {chromium}=require(process.env.UNVRSL_PLAYWRIGHT||'playwright');
const assert=require('node:assert/strict');
const base=process.env.UNVRSL_AUDIT_URL||'http://127.0.0.1:8770/unvrsl-fit/';
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>r.request().url().startsWith(new URL(base).origin)?r.continue():r.abort());
  await page.goto(base);await page.waitForFunction(()=>window.__unvrslStartupComplete,{timeout:30000});
  await page.evaluate(async()=>{
   await window.unvrslWarmDeferredModulesV320?.();
   st.current=session(UNVRSL_ROUTINES.find(r=>r.w===1&&r.c==='B'));
   const ex=st.current.ex[0];ex.n='Жим штанги лёжа';ex.loadType='external_total';ex.programWeightMode='prescribed';
   ex.set=ex.set.slice(0,2);ex.set.forEach(s=>Object.assign(s,{w:100,programW:100,r:'',rpe:'',ok:false,targetRepMin:10,targetRepMax:10,targetRpeMin:8,targetRpeMax:8}));
   Object.assign(ex.set[0],{r:9,rpe:10,ok:true});
   nav('start');await trainingEngine200Tick();trainingLoadModel292.run();await trainingEngine200Tick();
  });
  const state=()=>page.evaluate(()=>{
   const ex=st.current.ex[0],live=ex.set[1].recommendation.nextSetSuggestion;
   const card=document.querySelector('#start .exercise .te200-rec');
   return {action:live.action,weight:live.weight,text:card?.textContent,disabled:card?.querySelector('button')?.disabled,
    done:JSON.stringify(ex.set[0]),next:ex.set[1].w,program:ex.set[1].programW};
  });
  const before=await state();assert.equal(before.weight,95);assert.equal(before.disabled,false);
  await page.locator('#start .exercise .te200-rec button').first().click();
  const after=await state();assert.equal(after.next,95);assert.equal(after.program,before.program);assert.equal(after.done,before.done);
  await page.evaluate(async()=>{Object.assign(st.current.ex[0].set[0],{pain:true,r:'',rpe:''});trainingLoadModel292.run();await trainingEngine200Tick()});
  const pain=await state();assert.equal(pain.action,'stop');assert.equal(pain.disabled,undefined);assert.match(pain.text,/боль|боли/);
  assert.equal(await page.evaluate(()=>WorkoutDomain.acceptRecommendation(st.current.ex[0].set[1],st.current.ex[0].set[1].recommendation)),false);
  assert.equal((await state()).next,95);
  assert.deepEqual(errors,[]);
  console.log('PASS mobile Chromium: RIR correction, explicit application, protected completed/coach weights, pain without effort, blocked stop action');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
