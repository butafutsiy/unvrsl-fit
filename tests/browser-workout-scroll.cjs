'use strict';
const {chromium}=require(process.env.UNVRSL_PLAYWRIGHT||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const base=process.env.UNVRSL_AUDIT_URL||'http://127.0.0.1:8770/unvrsl-fit/';
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']});
 try{for(const theme of ['light','dark']){
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>r.request().url().startsWith(new URL(base).origin)?r.continue():r.abort());
  await page.goto(base);await page.waitForFunction(()=>window.__unvrslStartupComplete,{timeout:25000});
  await page.evaluate(async theme=>{
   await unvrslWarmDeferredModulesV320();st.theme=theme;applyTheme();
   st.current=session(UNVRSL_ROUTINES.find(r=>r.w===1&&r.c==='B'));st.current.trainingReadinessDone=true;
   const e=st.current.ex[5];e.programWeightMode='prescribed';
   e.set=e.set.slice(0,3).map((s,i)=>({...s,w:13.5,programW:13.5,plannedW:13.5,assignedW:13.5,r:i<2?12:'',rpe:i<2?8:'',rir:i<2?2:'',ok:i<2,actualReps:i<2?12:null,actualWeight:i<2?13.5:null}));
   save();nav('start');await trainingEngine200Tick();await trainingLoadModel292.whenIdle();
  },theme);await page.waitForTimeout(400);
  const row=page.locator('#start .check[onclick="toggleSet(5,2)"]').locator('..');
  await row.evaluate(el=>el.scrollIntoView({block:'center'}));
  const before=await row.evaluate(el=>{window.__stableWorkoutRow=el;return el.getBoundingClientRect().top});
  await row.locator('input[inputmode="numeric"]').fill('12');
  await row.locator('[data-effort="rpe"]').fill('8');
  await row.locator('[data-effort="rir"]').fill('2');
  await row.locator('.check').click();
  await page.evaluate(async()=>{await trainingLoadModel292.whenIdle();await trainingEngine200Tick()});await page.waitForTimeout(450);
  const after=await page.evaluate(()=>({mounted:__stableWorkoutRow.isConnected,top:__stableWorkoutRow.getBoundingClientRect().top,ok:st.current.ex[5].set[2].ok,reps:st.current.ex[5].set[2].actualReps,rpe:st.current.ex[5].set[2].actualRpe,rir:st.current.ex[5].set[2].actualRir,timer:document.querySelector('#timer').classList.contains('show')}));
  assert.equal(after.mounted,true);assert.ok(Math.abs(after.top-before)<=2,JSON.stringify({theme,before,after}));
  assert.equal(after.ok,true);assert.equal(after.reps,12);assert.equal(after.rpe,8);assert.equal(after.rir,2);assert.equal(after.timer,true);assert.deepEqual(errors,[]);
  console.log('PASS stable active row after reps/RPE/RIR, completion, recommendation removal and rest timer '+JSON.stringify({theme,before,after}));await page.close();
 }}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
