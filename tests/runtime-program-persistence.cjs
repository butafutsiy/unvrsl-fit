'use strict';
const {chromium}=require(process.env.UNVRSL_PLAYWRIGHT||'playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const root=path.resolve(__dirname,'..'),server=require('node:http').createServer((req,res)=>{
  const file=path.join(root,new URL(req.url,'http://local').pathname==='/'?'index.html':decodeURIComponent(new URL(req.url,'http://local').pathname));
  try{res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':'application/json');res.end(fs.readFileSync(file))}catch(_){res.statusCode=404;res.end()}
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}/`;
 const browser=await chromium.launch({headless:true,executablePath:process.env.UNVRSL_CHROMIUM,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();
  await page.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
  const id='prog-functional-20261001-v1';
  await page.goto(base+'?program=functional-8');await page.getByRole('button',{name:'Добавить к себе',exact:true}).click();
  await page.waitForFunction(id=>st.programs.some(p=>p.id===id),id);
  await page.waitForFunction(()=>!new URLSearchParams(location.search).has('program'));
  await page.reload();await page.waitForFunction(()=>window.__unvrslStartupComplete);
  assert.equal(await page.evaluate(id=>st.programs.find(p=>p.id===id).weeks.flatMap(w=>w.days).length,id),24);
  await page.evaluate(id=>renameProgramSheet(id),id);await page.locator('#rpName').fill('Мой функциональный цикл');await page.locator('#sheet').getByRole('button',{name:'Сохранить',exact:true}).click();
  await page.reload();await page.waitForFunction(()=>window.__unvrslStartupComplete);
  assert.equal(await page.evaluate(id=>st.programs.find(p=>p.id===id).name,id),'Мой функциональный цикл');
  page.on('dialog',d=>d.accept());await page.evaluate(id=>trainerDeleteOwnProgram(id),id);
  await page.reload();await page.waitForFunction(()=>window.__unvrslStartupComplete);
  assert.equal(await page.evaluate(id=>st.programs.some(p=>p.id===id),id),false);
  await page.goto(base+'?program=functional-8');await page.getByRole('button',{name:'Добавить к себе',exact:true}).click();await page.waitForFunction(()=>!location.search);
  await page.goto(base+'?program=functional-8');await page.getByRole('button',{name:'Добавить к себе',exact:true}).click();await page.waitForFunction(()=>!location.search);
  assert.equal(await page.evaluate(id=>st.programs.filter(p=>p.id===id).length,id),1);
  await page.reload();await page.waitForFunction(()=>window.__unvrslStartupComplete);
  assert.equal(await page.evaluate(id=>st.programs.filter(p=>p.id===id).length,id),1);
  // Reproduce the recording: owner login seeds a master plan, Safari quota
  // forces IndexedDB persistence, then the entire page is reopened.
  async function ownerLogin(target){
   await target.evaluate(()=>{window.cloud={user:{email:'butafutsiy@mail.ru'},profile:{role:'trainer'}}});
   await target.addScriptTag({url:base+'app-mode.js'});
   await target.evaluate(()=>ensureMasterTrainerPlan());
  }
  await ownerLogin(page);
  const master=await page.evaluate(()=>st.programs.find(p=>p.isMasterPlan).id);
  await context.addInitScript(()=>{Storage.prototype.setItem=function(){throw new DOMException('Quota exceeded','QuotaExceededError')}});
  await page.reload();await page.waitForFunction(()=>window.__unvrslStartupComplete);
  await ownerLogin(page);
  await page.evaluate(id=>renameProgramSheet(id),master);await page.locator('#rpName').fill('Сохранённое имя');
  await page.evaluate(id=>renameProgram(id),master);
  await page.reload();await page.waitForFunction(()=>window.__unvrslStartupComplete);
  await ownerLogin(page);
  assert.equal(await page.evaluate(id=>st.programs.find(p=>p.id===id).name,master),'Сохранённое имя');
  await page.evaluate(id=>trainerDeleteOwnProgram(id),master);
  await page.close();const reopened=await context.newPage();
  await reopened.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
  await reopened.goto(base);await reopened.waitForFunction(()=>window.__unvrslStartupComplete);
  await ownerLogin(reopened);
  await reopened.evaluate(()=>ensureMasterTrainerPlan());
  assert.equal(await reopened.evaluate(()=>st.programs.some(p=>p.isMasterPlan)),false);
  console.log('PASS: import, rename, deletion, reimport; owner master plan stays deleted after quota fallback and reopening.');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});
