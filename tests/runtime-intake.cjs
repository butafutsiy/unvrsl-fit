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
  for(const [key,value] of Object.entries({firstName:'Анна',lastName:'Иванова',age:'30',height:'165',weight:'60',steps:'7000',currentSessions:'1'}))await page.locator(`[name=${key}]`).fill(value);
  for(const [key,value] of Object.entries({sex:'female',goal:'muscle',sportExperience:'y2plus',strengthExperience:'none',trainingBreak:'never',pain:'none',medicalRestrictions:'none',nutritionGoal:'maintain',overweight:'no',dailyActivity:'low'}))await page.locator(`[name=${key}]`).selectOption(value);
  await page.locator('[value=dumbbells]').check();await page.locator('[value=bodyweight]').check();assert.equal(await page.locator('[value=dumbbells]').isChecked(),false);await page.locator('[value=gym]').check();assert.equal(await page.locator('[value=bodyweight]').isChecked(),false);
  await page.locator('[value=spinal_hernia]').check();assert.equal(await page.locator('#spineDetails').isVisible(),true);await page.locator('#noConditions').check();assert.equal(await page.locator('[value=spinal_hernia]').isChecked(),false);
  await page.screenshot({path:'/tmp/intake-form.png',fullPage:true});await page.locator('[type=submit]').click();await page.locator('#resultView').waitFor({state:'visible'});
  assert.equal(await page.locator('#result details').count(),4);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:'/tmp/intake-result.png',fullPage:true});
  await page.evaluate(()=>{Object.defineProperty(navigator,'share',{configurable:true,value:async x=>{window.capturedShare=x}})});
  await page.locator('#send').click();const reviewUrl=await page.evaluate(()=>window.capturedShare.url);assert.ok(reviewUrl.includes('#intakeReview='));
  await page.goto(reviewUrl);await page.getByRole('button',{name:'Открыть черновик в редакторе'}).waitFor();await page.getByRole('button',{name:'Открыть черновик в редакторе'}).click();await page.getByRole('button',{name:'Анкета и утверждение'}).waitFor();await page.waitForTimeout(500);
  await page.evaluate(()=>{st.theme='light';applyTheme()});
  const close=page.getByRole('button',{name:'Закрыть окно',exact:true});const rect=await close.boundingBox();assert.ok(rect.y>=52&&rect.height>=44);assert.equal(await page.locator('#modal button:visible').evaluateAll(xs=>xs.filter(x=>/^[✕×✖]$/.test(x.textContent.trim())).length),1);await page.locator('#sheet').evaluate(el=>el.scrollTop=el.scrollHeight);assert.ok((await close.boundingBox()).y>=52);
  for(const selector of ['.pbr-add','.mini-actions button'])assert.equal(await page.locator(selector).first().evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(236, 238, 243)');
  await page.locator('#sheet').evaluate(el=>el.scrollTop=0);await page.screenshot({path:'/tmp/v456-light.png'});
  const info=await page.evaluate(()=>{const p=st.programs.find(p=>p.intakeDraft);window.testIntakeId=p.id;return{count:st.programs.filter(p=>p.intakeDraft).length,rpe:p.weeks.map(w=>w.rpeMin),intensity:p.weeks.map(w=>w.useIntensity),reps:p.weeks[0].days[0].ex[0].reps}});
  assert.equal(info.count,1);assert.deepEqual(info.rpe,[6,7,7,6]);assert.deepEqual(info.intensity,[false,false,false,false]);assert.deepEqual(info.reps,{mode:'manual',min:8,max:12});
  await page.getByRole('button',{name:'90–100%',exact:true}).click();
  await page.waitForFunction(()=>document.getElementById('wrg268BaseMin')?.value==='1'&&document.getElementById('wrg268BaseMax')?.value==='3');
  assert.equal(await page.locator('#wrg268IsoMin').inputValue(),'8');assert.equal(await page.locator('#wrg268IsoMax').inputValue(),'12');
  assert.equal(await page.locator('#pi261Min').inputValue(),'90');assert.equal(await page.locator('#pi261Max').inputValue(),'100');
  await page.getByRole('button',{name:'Сохранить профиль недели',exact:true}).click();
  const selectedWeek=await page.evaluate(()=>{const p=st.programs.find(p=>p.id===window.testIntakeId);return {min:p.weeks[0].intensityMin,max:p.weeks[0].intensityMax,base:[p.weeks[0].baseRepMin,p.weeks[0].baseRepMax],other:p.weeks[1].intensityMin??null}});
  assert.deepEqual(selectedWeek,{min:90,max:100,base:[1,3],other:null});
  await page.screenshot({path:'/tmp/v456-intensity.png',fullPage:true});
  await page.evaluate(()=>trainingRequestProgramStartV382(window.testIntakeId,0,0));assert.equal(await page.evaluate(()=>st.current),null);assert.ok((await page.locator('#sheet').innerText()).includes('Черновик · ожидает проверки'));
  if(!await page.evaluate(()=>typeof cloudShareProgram==='function')){await page.addScriptTag({path:path.join(root,'cloud.js')});await page.addScriptTag({path:path.join(root,'cloud-programs.js')})}
  await page.evaluate(()=>cloudShareProgram(window.testIntakeId));assert.ok((await page.locator('#toast').innerText()).includes('утверди'));
  await page.screenshot({path:'/tmp/intake-editor.png',fullPage:true});
  await page.reload();await page.waitForFunction(()=>window.__unvrslStartupComplete);await page.goto(reviewUrl);await page.getByRole('button',{name:'Открыть черновик в редакторе'}).click();await page.getByRole('button',{name:'Анкета и утверждение'}).waitFor();assert.equal(await page.evaluate(()=>st.programs.filter(p=>p.intakeDraft).length),1);
  await page.getByRole('button',{name:'Анкета и утверждение'}).click();const personalBefore=await page.evaluate(()=>JSON.stringify(st.nutritionPlanner));await page.getByRole('button',{name:'Рассчитать КБЖУ по анкете'}).click();assert.ok((await page.locator('#sheet').innerText()).includes('Белки:'));assert.equal(await page.evaluate(()=>JSON.stringify(st.nutritionPlanner)),personalBefore);await page.getByRole('button',{name:'Вернуться к анкете'}).click();await page.locator('#intakeApproved').check();await page.getByRole('button',{name:'Утвердить программу',exact:true}).click();
  await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>st.programs.find(p=>p.intakeDraft).intakeDraft.status),'approved');
  if(!await page.evaluate(()=>typeof cloudShareProgram==='function')){await page.addScriptTag({path:path.join(root,'cloud.js')});await page.addScriptTag({path:path.join(root,'cloud-programs.js')})}
  const cleaned=await page.evaluate(()=>cloudProgramSnapshot(st.programs.find(p=>p.intakeDraft)).program);assert.equal(cleaned.intakeDraft,undefined);assert.equal(cleaned.intakeSourceKey,undefined);
  await page.evaluate(()=>{window.capturedShare=null;Object.defineProperty(navigator,'share',{configurable:true,value:async x=>{window.capturedShare=x}});return _cloudLocalShareProgram(st.programs.find(p=>p.intakeDraft).id)});
  assert.ok((await page.evaluate(()=>window.capturedShare.url)).includes('#plan='));
  await page.addScriptTag({path:path.join(root,'trainer-clients-canonical.js')});
  await page.evaluate(()=>{window.trainerCreateClientInvite=()=>window.menuAction='registration';window.offlineNewClientSheet=()=>window.menuAction='offline';unvrslAddClientV391()});
  await page.getByRole('button',{name:'Отправить ссылку для регистрации',exact:true}).click();assert.equal(await page.evaluate(()=>window.menuAction),'registration');
  await page.getByRole('button',{name:'Отправить ссылку для составления программы',exact:true}).click();assert.equal(await page.evaluate(()=>window.capturedShare.url),base+'intake.html');
  await page.getByRole('button',{name:'Добавить офлайн-клиента вручную',exact:true}).click();assert.equal(await page.evaluate(()=>window.menuAction),'offline');
  assert.deepEqual(errors,[]);console.log('PASS: mobile questionnaire, share link, import, persistence, deduplication, draft launch/share guards, approval, sanitized program sharing.');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});
