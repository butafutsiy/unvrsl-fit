'use strict';
// Optional browser runner: install playwright (or playwright-core), set
// UNVRSL_PLAYWRIGHT and UNVRSL_CHROMIUM when using an existing browser.
const {chromium}=require(process.env.UNVRSL_PLAYWRIGHT||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const contrast=require('../theme-contrast.js');
(async()=>{
 const base='http://app.test/',project=path.resolve(__dirname,'..');
 const browser=await chromium.launch({headless:true,executablePath:process.env.UNVRSL_CHROMIUM,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await context.route('**/*',async route=>{
   const url=new URL(route.request().url());
   if(url.origin!==new URL(base).origin)return route.abort();
   const file=path.resolve(project,'.'+(url.pathname==='/'?'/index.html':url.pathname));
   if(!file.startsWith(project+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:''});
   return route.fulfill({path:file,contentType:file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':undefined});
  });
  const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base);await page.waitForFunction(()=>window.__unvrslStartupComplete&&window.workoutFocus);
  await page.evaluate(()=>{
   window.focusFixture=(type='external_total',extra={})=>{
    workoutFocus.close();stopTimer();if(st.current)workoutStore.discard(st);st.sessions=[];
    window.focusFixtureIndex=(window.focusFixtureIndex||0)+1;
    st.current={id:'focus-browser-'+focusFixtureIndex,date:iso(),w:1,started:Date.now(),trainingEngineRevision:295,ex:[{
     n:type==='time'?'Аэробайк':type==='distance'?'Бег':'Жим штанги лёжа',method:'STANDARD',loadType:type,programWeightMode:'adaptive',rest:0,
     set:[{w:0,r:'',ok:false,targetRepMin:8,targetRepMax:12,targetRpeMin:7,targetRpeMax:8,...extra},{w:0,r:'',ok:false,targetRepMin:8,targetRepMax:12,targetRpeMin:7,targetRpeMax:8,...extra}]
    }]};save();nav('start');workoutFocus.open();
   };focusFixture();
  });
  const root=page.locator('#workout-focus');
  assert.match(await root.locator('.wf-load').innerText(),/Без истории нельзя рассчитать/);
  assert.equal(await root.locator('[name=weight]').inputValue(),'');
  for(const theme of ['light','dark'])for(const accent of ['#bf5af2','#30d158','#0a84ff','#ff9f0a','#ff375f','#ff453a','#64d2ff','#ffd60a']){
   await page.evaluate(({theme,accent})=>{st.theme=theme;st.accent=accent;applyTheme();applyAccent();rememberAppearance();},{theme,accent});
   await root.locator('[data-wf-rir="2"]').click();
   const styles=await page.evaluate(()=>{
    const root=document.getElementById('workout-focus'),css=getComputedStyle(root),html=getComputedStyle(document.documentElement);
    const hex=value=>{const c=document.createElement('canvas');c.width=c.height=1;const x=c.getContext('2d');x.fillStyle=value;x.fillRect(0,0,1,1);return '#'+[...x.getImageData(0,0,1,1).data].slice(0,3).map(n=>n.toString(16).padStart(2,'0')).join('');};
    const pair=selector=>{const el=root.querySelector(selector),s=getComputedStyle(el);return {text:hex(s.color),background:hex(s.backgroundColor)};};
    const card=root.querySelector('.wf-load'),text=card.querySelector('.wf-number'),sub=card.querySelector('.wf-sub');
    return {bg:css.backgroundColor,expectedBg:html.getPropertyValue('--bg').trim(),inheritedBg:css.getPropertyValue('--bg').trim(),accent:css.getPropertyValue('--green').trim(),action:hex(css.getPropertyValue('--action').trim()),card:{text:hex(getComputedStyle(text).color),background:hex(getComputedStyle(card).backgroundColor)},sub:hex(getComputedStyle(sub).color),primary:pair('.wf-primary'),selected:pair('[data-wf-rir="2"]'),input:pair('[name=weight]'),overflow:root.scrollWidth>root.clientWidth};
   });
   assert.equal(styles.inheritedBg,styles.expectedBg,theme);
   assert.equal(styles.accent,accent);
   assert.equal(styles.primary.background,styles.action);
   assert.equal(styles.selected.background,styles.action);
   for(const pair of [styles.card,styles.primary,styles.selected,styles.input])assert.ok(contrast.contrast(pair.text,pair.background)>=4.5,JSON.stringify({theme,accent,pair}));
   assert.ok(contrast.contrast(styles.sub,styles.card.background)>=4.5,JSON.stringify({theme,accent,styles}));
   assert.equal(styles.overflow,false);
  }
  await page.evaluate(()=>{st.theme='light';st.accent='#bf5af2';applyTheme();applyAccent();rememberAppearance();workoutFocus.calibrate(0);});
  assert.match(await root.locator('.wf-load').innerText(),/лёгкой контролируемой нагрузки/);
  assert.equal(await root.locator('[name=weight]').inputValue(),'');
  if(process.env.UNVRSL_SCREENSHOTS){fs.mkdirSync(process.env.UNVRSL_SCREENSHOTS,{recursive:true});await page.screenshot({path:path.join(process.env.UNVRSL_SCREENSHOTS,'focus-first-load-light.png')});}
  await page.evaluate(()=>focusFixture('time',{seconds:120}));
  assert.match(await root.locator('.wf-load').innerText(),/120 сек/);
  assert.doesNotMatch(await root.locator('.wf-load').innerText(),/e1RM|Рекомендованный вес|кг/);
  assert.equal(await root.locator('[data-wf-rir]').count(),0);
  assert.equal(await root.locator('[name=weight]').count(),0);
  assert.equal(await root.locator('[data-wf-work-seconds="120"]').count(),1);
  if(process.env.UNVRSL_SCREENSHOTS)await page.screenshot({path:path.join(process.env.UNVRSL_SCREENSHOTS,'focus-aerobike-light.png')});
  await root.locator('[name=reps]').fill('95');await root.locator('[type=submit]').click();
  const timed=await page.evaluate(()=>({...st.current.ex[0].set[0]}));
  assert.equal(timed.ok,true);assert.equal(timed.seconds,95);assert.equal(timed.actualRir,null);assert.equal(timed.actualRpe,null);
  assert.match(await root.locator('.wf-row').textContent(),/95 сек/);
  await page.evaluate(()=>focusFixture('distance',{distance:2.5}));
  assert.match(await root.locator('.wf-load').innerText(),/2,5 км/);
  assert.doesNotMatch(await root.locator('.wf-load').innerText(),/e1RM|Рекомендованный вес/);
  await root.locator('[name=reps]').fill('2,1');await root.locator('[type=submit]').click();
  const distance=await page.evaluate(()=>({...st.current.ex[0].set[0]}));assert.equal(distance.ok,true);assert.equal(distance.distance,2.1);
  await page.evaluate(()=>focusFixture('time'));assert.equal(await root.locator('[data-wf-work-seconds]').count(),0);
  await root.locator('[name=reps]').fill('-1');await root.locator('[type=submit]').click();assert.equal(await page.evaluate(()=>st.current.ex[0].set[0].ok),false);
  await page.evaluate(()=>focusFixture('bodyweight_only'));
  assert.doesNotMatch(await root.locator('.wf-load').innerText(),/e1RM|Рекомендованный вес|Подобрать вес/);
  assert.equal(await root.locator('[data-wf-rir="2"]').count(),1);
  assert.deepEqual(errors,[]);
  console.log('PASS: live theme/accent inheritance, 16 contrast combinations, mobile layout, first-load guidance, time/distance recording without RIR, correct metric history and bodyweight card.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
