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
  await page.goto(base);await page.waitForFunction(()=>window.__unvrslStartupComplete);
  await page.evaluate(()=>{const p={id:'conditioning-test',name:'Кроссфит · тест',weeks:[{n:1,days:[{id:'day-test',name:'Интервалы',ex:[]}]}]};st.programs.push(p);save();openProgramEditor(p.id,0,0)});
  await page.getByRole('button',{name:'＋ AMRAP / EMOM / HIIT / На время',exact:true}).click();
  await page.locator('#sheet select').selectOption('EMOM');await page.getByRole('button',{name:'Подставить пример EMOM',exact:true}).click();await page.locator('#cond-duration').fill('120');await page.getByRole('button',{name:'Сохранить блок',exact:true}).click();
  assert.equal(await page.evaluate(()=>st.programs.find(p=>p.id==='conditioning-test').weeks[0].days[0].conditioning[0].type),'EMOM');
  await page.locator('.program-day [data-program-editor-start]').click();await page.getByRole('button',{name:'По плану · 0%',exact:true}).waitFor();await page.getByRole('button',{name:'По плану · 0%',exact:true}).click();await page.locator('#conditioning-live').waitFor();
  await page.getByRole('button',{name:'Начать блок',exact:true}).click();assert.equal(await page.evaluate(()=>st.current.conditioning[0].status),'running');
  await page.getByRole('button',{name:'Задание выполнено · отдых',exact:true}).click();await page.waitForFunction(()=>document.querySelector('[data-cond-phase]')?.textContent==='Отдых');
  await page.getByRole('button',{name:'Пауза',exact:true}).click();assert.equal(await page.evaluate(()=>st.current.conditioning[0].status),'paused');
  await page.reload();await page.waitForFunction(()=>window.__unvrslStartupComplete);await page.evaluate(()=>nav('start'));await page.getByRole('button',{name:'Продолжить',exact:true}).waitFor();
  await page.getByRole('button',{name:'Продолжить',exact:true}).click();
  await page.evaluate(()=>{st.current.conditioning[0].startedAt=Date.now()-65000;save({draftOnly:true})});await page.waitForFunction(()=>document.querySelector('[data-cond-next]')?.textContent.includes('Интервал 2'));
  await page.getByRole('button',{name:'Таймер ↗',exact:true}).click();await page.screenshot({path:'/tmp/conditioning-emom.png'});await page.getByRole('button',{name:'Закрыть окно',exact:true}).click();assert.equal(await page.evaluate(()=>st.current.conditioning[0].status),'running');
  await page.getByRole('button',{name:'Записать результат',exact:true}).click();await page.locator('#cond-result-intervals').fill('1');await page.getByRole('button',{name:'Сохранить результат блока',exact:true}).click();
  await page.evaluate(()=>completeWorkout());await page.getByRole('heading',{name:'Тренировка завершена',exact:true}).waitFor();assert.ok((await page.locator('#sheet').innerText()).includes('Выполнено интервалов: 1'));assert.equal(await page.evaluate(()=>st.current),null);
  await page.reload();await page.waitForFunction(()=>window.__unvrslStartupComplete);assert.equal(await page.evaluate(()=>st.sessions.find(s=>s.programId==='conditioning-test').conditioning[0].result.intervals),1);
  await page.evaluate(()=>openProgramEditor('conditioning-test',0,0));await page.getByRole('button',{name:'＋ AMRAP / EMOM / HIIT / На время',exact:true}).click();await page.locator('#sheet select').selectOption('HIIT');await page.getByRole('button',{name:'Табата: 20 сек / 10 сек · 8 кругов',exact:true}).click();await page.getByRole('button',{name:'Сохранить блок',exact:true}).click();
  assert.equal(await page.evaluate(()=>st.programs.find(p=>p.id==='conditioning-test').weeks[0].days[0].conditioning[1].total),240);
  assert.deepEqual(errors,[]);console.log('PASS: block editor, EMOM rest, pause/reload, station transitions, focus timer, conditioning-only completion, persisted results, Tabata.');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});
