'use strict';
const {chromium}=require(process.env.UNVRSL_PLAYWRIGHT||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const base=process.env.UNVRSL_AUDIT_URL||'http://127.0.0.1:8770/unvrsl-fit/',output=process.env.UNVRSL_AUDIT_OUTPUT||'/workspace/unvrsl-activity-audit';fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']});
 const results=[];
 try{for(const width of [320,390])for(const theme of ['dark','light']){
  const page=await browser.newPage({viewport:{width,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>r.request().url().startsWith(new URL(base).origin)?r.continue():r.abort());
  await page.goto(base);await page.waitForFunction(()=>window.__unvrslStartupComplete,{timeout:25000});
  await page.evaluate(async()=>{await window.unvrslWarmDeferredModulesV320?.();await window.__unvrslCloudModulesSettledV260;});
  await page.evaluate(({theme})=>{
   const NativeDate=window.Date;window.Date=class extends NativeDate{constructor(...args){super(...(args.length?args:[2026,9,24,12]))}};
   window.cloud={user:{id:'activity-fixture'},profile:{role:'trainer'},ready:false,initSettled:true};window.trainerIsTrainer=()=>true;window.unvrslTrainerShellSyncV260?.(false);
   st.theme=theme;applyTheme();st.accountOwnerId='activity-fixture';st.current=null;st.deletedSessionIds=[];
   const dates=[1,3,5,7,9,11,12,14,19,21,24].map(d=>`2026-10-${String(d).padStart(2,'0')}`).concat([1,3,5,7,9,11,13,15,17].map(d=>`2026-09-${String(d).padStart(2,'0')}`),Array.from({length:12},(_,i)=>`2026-01-${String(i+1).padStart(2,'0')}`));
   st.sessions=dates.map((date,i)=>({id:'fixture-'+i,date,started:Date.parse(date+'T09:00:00Z'),ended:Date.parse(date+'T09:00:00Z')+(30+15*(i%4))*60000,ex:[{id:'bench',n:'Жим лёжа',set:[{w:80,r:10,ok:true}]}]}));
   st.bw=[{d:'2026-10-12',w:94}];st.weightGoalKg=90;nav('home');
  },{theme});
  await page.evaluate(()=>homeProgressRefresh(true));await page.waitForTimeout(100);
  const card=page.locator('.sd2-activity-card');await card.evaluate(el=>el.scrollIntoView({block:'center'}));await page.waitForTimeout(100);
  assert.deepEqual(await page.locator('[data-activity-count]').allTextContents(),['3','11','32']);
  assert.deepEqual(await page.locator('.sd2-activity-delta').allTextContents(),['+1 к прошлой','+2 к прошлому']);
  assert.match(await page.locator('[data-activity="year"]').innerText(),/За 2026 год/);
  assert.deepEqual(await page.locator('[data-activity-previous-count]').allTextContents(),['2','9']);
  assert.match(await page.locator('.sd2-current').innerText(),/94/);
  assert.match(await card.innerText(),/по времени тренировок/);
  assert.equal(await card.locator('[data-activity-date="2026-10-24"]').getAttribute('data-minutes'),'60');
  assert.match(await card.locator('[data-activity-date="2026-10-24"]').getAttribute('title'),/60 мин/);
  assert.notEqual(await card.locator('[data-activity-date="2026-10-01"]').getAttribute('class'),await card.locator('[data-activity-date="2026-10-03"]').getAttribute('class'));
  assert.equal(await page.locator('.nav').isVisible(),true);
  const layout=await card.evaluate(el=>{const r=el.getBoundingClientRect(),grid=el.querySelector('.sd2-heat'),wrap=el.querySelector('.sd2-heat-wrap'),cell=grid.querySelector('.sd2-cell');return{width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,card:r.toJSON(),gridWidth:grid.clientWidth,gridScroll:grid.scrollWidth,wrapWidth:wrap.clientWidth,wrapScroll:wrap.scrollWidth,cellWidth:cell.getBoundingClientRect().width,cellHeight:cell.getBoundingClientRect().height,gap:getComputedStyle(grid).gap,overflow:getComputedStyle(wrap).overflowX,metrics:[...el.querySelectorAll('.sd2-activity-metric')].map(m=>({client:m.clientWidth,scroll:m.scrollWidth,top:m.getBoundingClientRect().top})),cells:grid.querySelectorAll('.sd2-cell').length}});
  assert.ok(layout.scroll<=layout.width+1,JSON.stringify(layout));assert.ok(layout.gridScroll<=layout.gridWidth+1,JSON.stringify(layout));assert.ok(layout.cells>=365);assert.equal(layout.cellWidth,10);assert.equal(layout.cellHeight,10);assert.equal(layout.gap,'4px');assert.equal(layout.overflow,'auto');assert.ok(layout.wrapScroll>layout.wrapWidth,'original-size annual grid scrolls inside its own card');
  for(const metric of layout.metrics){assert.ok(metric.scroll<=metric.client+1,JSON.stringify(metric));assert.equal(metric.top,layout.metrics[0].top)}
  await page.screenshot({path:`${output}/activity-${theme}-${width}.png`});
  // Reference scenario matching the report: two sessions this week, one yesterday Friday.
  await page.evaluate(()=>{
   const dates=[1,3,4,5,6,7,8,12,15,18,20,23].map(d=>`2026-10-${String(d).padStart(2,'0')}`).concat([1,3,5,7,9,11,13,15,17,19,21,23,27].map(d=>`2026-09-${String(d).padStart(2,'0')}`),[1,2,3,4,5,6].map(d=>`2026-08-0${d}`));
   st.sessions=dates.map((date,i)=>({id:'recheck-'+i,date,started:Date.parse(date+'T09:00:00Z'),ended:Date.parse(date+'T10:00:00Z'),ex:[{set:[{w:80,r:10,ok:true}]}]}));
  });await page.evaluate(()=>homeProgressRefresh(true));
  assert.deepEqual(await page.locator('[data-activity-count]').allTextContents(),['2','12','31']);
  assert.deepEqual(await page.locator('[data-activity-previous-count]').allTextContents(),['3','12']);
  assert.match(await page.locator('[data-activity="week"]').innerText(),/12–18 окт/);
  assert.match(await page.locator('[data-activity="month"]').innerText(),/1–24 сент/);
  const geometry=await card.evaluate(el=>{
   const current=el.querySelectorAll('[data-current-week="true"]'),previous=el.querySelectorAll('[data-week-start="2026-10-12"]');
   const rects=week=>[...week].map(c=>({date:c.dataset.activityDate,count:Number(c.dataset.count),x:c.getBoundingClientRect().x,y:c.getBoundingClientRect().y,width:c.getBoundingClientRect().width,height:c.getBoundingClientRect().height}));
   return{current:rects(current),previous:rects(previous),labels:[...el.querySelectorAll('.sd2-activity-weekdays span')].map(x=>({text:x.textContent,y:x.getBoundingClientRect().y}))};
  });
  assert.deepEqual(geometry.current.map(x=>x.count),[0,1,0,0,1,0,0]);
  assert.equal(geometry.current[4].date,'2026-10-23');assert.deepEqual(geometry.labels.map(x=>x.text),['Пн','Вт','Ср','Чт','Пт','Сб','Вс']);
  for(let i=0;i<7;i++){assert.equal(geometry.current[i].x,geometry.current[0].x);assert.equal(geometry.current[i].y,geometry.current[0].y+i*14);assert.equal(geometry.labels[i].y,geometry.current[i].y);assert.equal(geometry.current[i].x-geometry.previous[i].x,14)}
  await card.evaluate(el=>el.scrollIntoView({block:'center'}));await page.screenshot({path:`${output}/activity-reference-${theme}-${width}.png`});
  await page.locator('[data-activity="week"] .sd2-activity-open').click();
  assert.deepEqual(await page.locator('#sheet [data-period-count]').allTextContents(),['2','3']);
  assert.deepEqual(await page.locator('#sheet [data-period-days="current"] [data-counted-date]').evaluateAll(rows=>rows.map(x=>x.dataset.countedDate)),['2026-10-23','2026-10-20']);
  assert.deepEqual(await page.locator('#sheet [data-period-days="previous"] [data-counted-date]').evaluateAll(rows=>rows.map(x=>x.dataset.countedDate)),['2026-10-18','2026-10-15','2026-10-12']);
  await page.screenshot({path:`${output}/activity-detail-${theme}-${width}.png`});
  await page.locator('.sd2-detail-tabs').getByRole('button',{name:'Месяц',exact:true}).click();
  assert.deepEqual(await page.locator('#sheet [data-period-count]').allTextContents(),['12','12']);
  const sheetOverflow=await page.locator('#sheet').evaluate(el=>el.scrollWidth>el.clientWidth+1);assert.equal(sheetOverflow,false);
  await page.locator('.sd2-detail-tabs').getByRole('button',{name:'Год',exact:true}).click();assert.deepEqual(await page.locator('#sheet [data-period-count]').allTextContents(),['31']);
  await page.evaluate(()=>closeModal());
  // Offline edits should refresh the same card via the standard history event.
  await page.evaluate(()=>{st.deletedSessionIds=['recheck-10','recheck-11'];window.dispatchEvent(new CustomEvent('unvrsl:history-updated'))});
  await page.waitForFunction(()=>document.querySelector('[data-activity="week"] [data-activity-count]')?.textContent==='0');
  assert.match(await page.locator('[data-activity="week"] .sd2-activity-delta').innerText(),/−3/);
  await page.evaluate(()=>{st.sessions=[];st.deletedSessionIds=[]});await page.evaluate(()=>homeProgressRefresh(true));
  assert.deepEqual(await page.locator('[data-activity-count]').allTextContents(),['0','0','0']);assert.deepEqual(await page.locator('.sd2-activity-delta').allTextContents(),['Без изменений','Без изменений']);assert.deepEqual(errors,[]);
  results.push({width,theme,layout,geometry,errors});await page.close();
 }}finally{await browser.close()}
 fs.writeFileSync(output+'/activity-browser-results.json',JSON.stringify(results,null,2));
 console.log('PASS Chromium activity: 320/390 px, dark/light, calendar counts/deltas/year, vertical Monday–Sunday columns, Friday alignment, date detail parity, original-size duration grid, contained horizontal scrolling, no page overflow, offline deletion events, empty history, bodyweight parity');
})().catch(e=>{console.error(e);process.exitCode=1});
