'use strict';
// Optional real Chromium audit. Requires a local static server and Playwright.
const {chromium}=require(process.env.UNVRSL_PLAYWRIGHT||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const base=process.env.UNVRSL_AUDIT_URL||'http://127.0.0.1:8770/unvrsl-fit/';
const output=process.env.UNVRSL_AUDIT_OUTPUT||'/workspace/unvrsl-audit';fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const results=[];
 try{
  for(const width of [320,390])for(const theme of ['dark','light']){
   const page=await browser.newPage({viewport:{width,height:844},isMobile:true,deviceScaleFactor:1,hasTouch:true});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/*',r=>r.request().url().startsWith(new URL(base).origin)?r.continue():r.abort());
   await page.goto(base);await page.waitForFunction(()=>window.__unvrslStartupComplete,{timeout:25000});
   await page.evaluate(async()=>{await window.unvrslWarmDeferredModulesV320?.();});
   await page.evaluate(({theme})=>{
    window.cloud={user:{id:'visual-fixture',email:'fixture@example.test'},profile:{role:'trainer'},ready:false,initSettled:true};
    window.trainerIsTrainer=()=>true;window.unvrslTrainerShellSyncV260?.(false);
    st.theme=theme;applyTheme();
    st.programs=[ensureProgramShape({id:'visual-plan',name:'Мой 8-недельный цикл · проверка длинного названия',weeks:Array.from({length:8},(_,i)=>({n:i+1,intensityMin:70,intensityMax:75,rpeMin:7,rpeMax:8,days:[{id:'day-'+i,name:'Грудь',ex:[{id:'bench',n:'Жим штанги лёжа',method:'STANDARD',weightMode:'manual',reps:{mode:'manual',min:8,max:12},sets:[{w:80,r:10},{w:'',r:10},{w:90,r:8}],rest:90}]}]}))})];
    st.primaryProgramId='visual-plan';nav('programs');trainerProgramsPage();
   },{theme});
   await page.waitForTimeout(100);
   const programLayout=await page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,primary:document.querySelectorAll('.program-unified-card .program-primary-badge').length,cards:document.querySelectorAll('.program-unified-card').length}));
   assert.ok(programLayout.scroll<=programLayout.width+1,JSON.stringify(programLayout));assert.equal(programLayout.primary,1);assert.equal(programLayout.cards,2);
   await page.screenshot({path:`${output}/programs-${theme}-${width}.png`,fullPage:true});
   await page.evaluate(()=>templatesSheet());await page.waitForTimeout(100);
   assert.ok(await page.getByRole('button',{name:'Оставить только популярные',exact:true}).count());
   const overflow=await page.evaluate(()=>{const sheet=document.getElementById('sheet');return{client:sheet.clientWidth,scroll:sheet.scrollWidth}});
   assert.ok(overflow.scroll<=overflow.client+1,JSON.stringify(overflow));
   await page.screenshot({path:`${output}/templates-${theme}-${width}.png`,fullPage:true});
   await page.evaluate(()=>settingsSheet());await page.waitForTimeout(80);
   const settings=await page.locator('#sheet').innerText();assert.ok(!/Версия приложения|Проверить обновление/.test(settings));assert.match(settings,/UNVRSL Cloud/);assert.match(settings,/Синхронизировать/);
   await page.screenshot({path:`${output}/settings-${theme}-${width}.png`,fullPage:true});
   await page.evaluate(async()=>{
    closeModal();programBeginDayCoreV382('visual-plan',0,0);await trainingEngine200Tick();
    const e=st.current.ex[0];st.sessions=[{id:'previous',date:'2026-10-01',ended:1,ex:[{...e,set:[{w:100,r:8,rpe:8,ok:true},{w:100,r:8,rpe:8,ok:true}]}]}];
    trainingLoadModel292.run();nav('start');await trainingEngine200Tick();
   });await page.waitForTimeout(100);
   await page.screenshot({path:`${output}/workout-${theme}-${width}.png`,fullPage:true});
   const positions=await page.evaluate(()=>{const banner=document.querySelector('.te200-rec').getBoundingClientRect(),set=document.querySelector('.setrow').getBoundingClientRect();return{bannerBottom:banner.bottom,setTop:set.top,banners:document.querySelectorAll('.te200-rec').length,hints:document.querySelectorAll('.te405-next').length}});
   assert.equal(positions.banners,1);assert.equal(positions.hints,0);assert.ok(positions.bannerBottom<=positions.setTop);
   await page.locator('.setrow input').first().focus();
   const navVisible=await page.locator('.nav').isVisible();assert.equal(navVisible,false);
   await page.locator('.setrow input').nth(0).fill('82,5');await page.locator('.setrow input').nth(1).fill('10');await page.locator('.setrow .rpe-input').first().fill('8');await page.locator('.setrow .check').first().click();
   const actual=await page.evaluate(()=>({done:st.current.ex[0].set[0].ok,weight:st.current.ex[0].set[0].actualWeight,assigned:st.current.ex[0].set[0].assignedW}));assert.equal(actual.done,true);assert.equal(actual.weight,82.5);assert.equal(actual.assigned,80);
   await page.evaluate(()=>{document.activeElement?.blur();window.scrollTo(0,document.body.scrollHeight)});await page.waitForTimeout(100);
   const footer=await page.evaluate(()=>({bottom:document.querySelector('.workout-finish-card').getBoundingClientRect().bottom,navTop:document.querySelector('.nav').getBoundingClientRect().top}));assert.ok(footer.bottom<footer.navTop);
   results.push({width,theme,programLayout,templateLayout:overflow,recommendation:positions,keyboardNavHidden:true,actual,footer,errors});
   assert.deepEqual(errors,[]);await page.close();
  }
  fs.writeFileSync(output+'/browser-results.json',JSON.stringify(results,null,2));console.log('PASS Chromium: 320/390 px, dark/light, programs/templates/settings/workout, recommendation placement, keyboard and overflow');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
