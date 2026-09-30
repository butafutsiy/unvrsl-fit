'use strict';
// npm install --prefix /tmp/intake-tests playwright @sparticuz/chromium
// UNVRSL_PLAYWRIGHT=<module> UNVRSL_CHROMIUM=<executable> node tests/runtime-intake.cjs
const {chromium}=require(process.env.UNVRSL_PLAYWRIGHT||'playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const root=path.resolve(__dirname,'..'),server=require('node:http').createServer((req,res)=>{
  const name=decodeURIComponent(new URL(req.url,'http://local').pathname),file=path.join(root,name==='/'?'index.html':name);
  if(!file.startsWith(root+path.sep)){res.statusCode=403;return res.end()}
  try{res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':'application/octet-stream');res.end(fs.readFileSync(file))}catch(_){res.statusCode=404;res.end()}
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}/`;
 const browser=await chromium.launch({headless:true,executablePath:process.env.UNVRSL_CHROMIUM||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
  await page.goto(base+'intake.html');
  await page.locator('[name=name]').fill('Анна');await page.locator('[name=age]').fill('30');await page.locator('[name=goal]').selectOption('muscle');await page.locator('[name=experience]').selectOption('beginner');await page.locator('[name=limitations]').selectOption('no');
  for(const x of ['dumbbells','bench','cable','legpress'])await page.locator(`[value=${x}]`).check();
  await page.screenshot({path:'/tmp/intake-form.png',fullPage:true});await page.locator('[type=submit]').click();await page.locator('#resultView').waitFor({state:'visible'});
  assert.equal(await page.locator('#result details').count(),4);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:'/tmp/intake-result.png',fullPage:true});
  await page.evaluate(()=>{Object.defineProperty(navigator,'share',{configurable:true,value:async x=>{window.capturedShare=x}})});
  await page.locator('#send').click();const reviewUrl=await page.evaluate(()=>window.capturedShare.url);assert.ok(reviewUrl.includes('#intakeReview='));
  await page.goto(reviewUrl);await page.getByRole('button',{name:'Открыть черновик в редакторе'}).waitFor();await page.getByRole('button',{name:'Открыть черновик в редакторе'}).click();await page.getByRole('button',{name:'Анкета и утверждение'}).waitFor();await page.waitForTimeout(500);
  const info=await page.evaluate(()=>{const p=st.programs.find(p=>p.intakeDraft);window.testIntakeId=p.id;return{count:st.programs.filter(p=>p.intakeDraft).length,rpe:p.weeks.map(w=>w.rpeMin),intensity:p.weeks.map(w=>w.useIntensity),reps:p.weeks[0].days[0].ex[0].reps}});
  assert.equal(info.count,1);assert.deepEqual(info.rpe,[6,7,7,6]);assert.deepEqual(info.intensity,[false,false,false,false]);assert.deepEqual(info.reps,{mode:'manual',min:8,max:12});
  await page.evaluate(()=>trainingRequestProgramStartV382(window.testIntakeId,0,0));assert.equal(await page.evaluate(()=>st.current),null);assert.ok((await page.locator('#sheet').innerText()).includes('Черновик · ожидает проверки'));
  if(!await page.evaluate(()=>typeof cloudShareProgram==='function')){await page.addScriptTag({path:path.join(root,'cloud.js')});await page.addScriptTag({path:path.join(root,'cloud-programs.js')})}
  await page.evaluate(()=>cloudShareProgram(window.testIntakeId));assert.ok((await page.locator('#toast').innerText()).includes('утверди'));
  await page.screenshot({path:'/tmp/intake-editor.png',fullPage:true});
  await page.reload();await page.waitForFunction(()=>window.__unvrslStartupComplete);await page.goto(reviewUrl);await page.getByRole('button',{name:'Открыть черновик в редакторе'}).click();await page.getByRole('button',{name:'Анкета и утверждение'}).waitFor();assert.equal(await page.evaluate(()=>st.programs.filter(p=>p.intakeDraft).length),1);
  await page.getByRole('button',{name:'Анкета и утверждение'}).click();await page.locator('#intakeApproved').check();await page.getByRole('button',{name:'Утвердить программу',exact:true}).click();
  await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>st.programs.find(p=>p.intakeDraft).intakeDraft.status),'approved');
  if(!await page.evaluate(()=>typeof cloudShareProgram==='function')){await page.addScriptTag({path:path.join(root,'cloud.js')});await page.addScriptTag({path:path.join(root,'cloud-programs.js')})}
  const cleaned=await page.evaluate(()=>cloudProgramSnapshot(st.programs.find(p=>p.intakeDraft)).program);assert.equal(cleaned.intakeDraft,undefined);assert.equal(cleaned.intakeSourceKey,undefined);
  await page.evaluate(()=>{window.capturedShare=null;Object.defineProperty(navigator,'share',{configurable:true,value:async x=>{window.capturedShare=x}});return _cloudLocalShareProgram(st.programs.find(p=>p.intakeDraft).id)});
  assert.ok((await page.evaluate(()=>window.capturedShare.url)).includes('#plan='));
  assert.deepEqual(errors,[]);console.log('PASS: mobile questionnaire, share link, import, persistence, deduplication, draft launch/share guards, approval, sanitized program sharing.');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});
