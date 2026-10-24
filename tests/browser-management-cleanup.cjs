'use strict';
const {chromium}=require(process.env.UNVRSL_PLAYWRIGHT||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const base=process.env.UNVRSL_AUDIT_URL||'http://127.0.0.1:8770/unvrsl-fit/',output=process.env.UNVRSL_AUDIT_OUTPUT||'/workspace/unvrsl-management-audit';fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']}),results=[];
 try{
  for(const width of [320,390])for(const theme of ['dark','light']){
   const page=await browser.newPage({viewport:{width,height:844},isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
   await page.route('**/*',r=>r.request().url().startsWith(new URL(base).origin)?r.continue():r.abort());await page.goto(base);await page.waitForFunction(()=>window.__unvrslStartupComplete,{timeout:25000});await page.evaluate(async()=>{await unvrslWarmDeferredModulesV320()});await page.waitForFunction(()=>window.__unvrslCloudModulesSettledV260,{timeout:25000});
   // Let the existing 0/250/900/1800 ms program migration passes finish
   // before interacting with an expanded menu in the isolated fixture.
   await page.waitForTimeout(2000);
   await page.evaluate(theme=>{
    window.cloud={user:{id:'management-fixture',email:'fixture@example.test'},profile:{role:'trainer'},ready:false,initSettled:true};window.trainerIsTrainer=()=>true;st.accountOwnerId='management-fixture';st.theme=theme;applyTheme();
    st.sessions=[{id:'history-kept',date:iso(),ended:1,ex:[]}];st.programs=[ensureProgramShape({id:'managed',name:'Мой 8-недельный цикл · проверка',weeks:[{days:[{id:'day',name:'Грудь',ex:[{id:'long',n:'Французский жим с гантелями лёжа',method:'STANDARD',weightMode:'auto',sets:[{w:'',r:10},{w:'',r:10},{w:'',r:10}],rest:75}]}]}]})];
    nav('programs');trainerProgramsPage();
   },theme);
   const menu=page.locator('.program-unified-card').last().locator('.program-more');
   if(!await menu.evaluate(el=>el.open))await menu.locator('summary').click();
   await page.waitForFunction(()=>document.querySelectorAll('.program-card-actions')[document.querySelectorAll('.program-card-actions').length-1]?.clientWidth>0);
   const actions=await page.locator('.program-unified-card').last().locator('.program-card-actions').evaluate(el=>({width:el.clientWidth,last:el.lastElementChild.getBoundingClientRect().width,cardInner:el.closest('.program-unified-card').clientWidth-parseFloat(getComputedStyle(el.closest('.program-unified-card')).paddingLeft)-parseFloat(getComputedStyle(el.closest('.program-unified-card')).paddingRight),primaryHeight:el.closest('.program-card-footer').querySelector(':scope>.btn')?.getBoundingClientRect().height||0}));assert.ok(Math.abs(actions.width-actions.last)<=1&&actions.width>=actions.cardInner-1&&actions.primaryHeight<=60,JSON.stringify(actions));
   await page.evaluate(()=>document.querySelectorAll('.program-unified-card .program-card-actions')[document.querySelectorAll('.program-unified-card .program-card-actions').length-1].scrollIntoView({block:'center'}));await page.screenshot({path:`${output}/management-programs-${theme}-${width}.png`});
   await page.evaluate(()=>settingsSheet());const text=await page.locator('#sheet').innerText();assert.match(text,/UNVRSL Cloud/);assert.doesNotMatch(text,/Синхронизировать|Облачная копия|Синхронизация/);
   const alignment=await page.locator('#sheet').evaluate(el=>{
    const segments=[...el.querySelectorAll('.seg')].map(seg=>[...seg.children].map(b=>({width:b.getBoundingClientRect().width,height:b.getBoundingClientRect().height,align:getComputedStyle(b).justifyContent})));
    const colors=[...el.querySelectorAll('.color')].map(c=>{const r=c.getBoundingClientRect();return{x:r.x,y:r.y}});return{segments,colors,overflow:el.scrollWidth>el.clientWidth+1};
   });assert.equal(alignment.overflow,false);for(const segment of alignment.segments){assert.ok(Math.max(...segment.map(b=>b.width))-Math.min(...segment.map(b=>b.width))<=1);assert.ok(segment.every(b=>b.align==='center'))}for(let i=0;i<4;i++){assert.equal(alignment.colors[i].y,alignment.colors[0].y);assert.equal(alignment.colors[i+4].y,alignment.colors[4].y);assert.equal(alignment.colors[i].x,alignment.colors[i+4].x)}
   await page.screenshot({path:`${output}/management-settings-${theme}-${width}.png`});
   await page.evaluate(()=>openProgramEditor('managed'));
   const editor=await page.locator('.program-ex>.row').first().evaluate(el=>({row:el.getBoundingClientRect().width,title:el.querySelector('.grow').getBoundingClientRect().width,overflow:el.scrollWidth>el.clientWidth+1,buttons:[...el.querySelectorAll('.program-ex-edit-actions>.btn')].map(b=>b.getBoundingClientRect().width)}));assert.ok(editor.title>=editor.row-1&&!editor.overflow,JSON.stringify(editor));assert.ok(Math.max(...editor.buttons)-Math.min(...editor.buttons)<=1,JSON.stringify(editor));
   await page.locator('.program-ex').first().scrollIntoViewIfNeeded();await page.screenshot({path:`${output}/management-editor-${theme}-${width}.png`});
   // Simulate the real reported quota failure, including synchronization metadata.
   await page.evaluate(()=>{Storage.prototype.setItem=function(){throw new DOMException('The quota has been exceeded.','QuotaExceededError')};st.programs.find(p=>p.id==='managed').name='Успешно сохранено'});
   await page.locator('#saveProgramButton').click();await page.waitForFunction(()=>!document.getElementById('modal').classList.contains('show'));assert.match(await page.locator('#toast').innerText(),/Программа сохранена/);assert.equal(await page.evaluate(()=>window.__unvrslStorageModeV393),'indexeddb');
   await page.evaluate(async()=>{const t=await saveProgramAsTemplate('managed');window.cleanupTemplateId=t.id;await hideTemplateOption(encodeURIComponent('saved:'+t.id));hiddenTemplateOptionsSheet()});
   await page.screenshot({path:`${output}/management-hidden-${theme}-${width}.png`});await page.locator('.program-template-card').getByRole('button',{name:'Удалить',exact:true}).click();await page.waitForFunction(()=>document.getElementById('sheet').textContent.includes('Скрытых шаблонов нет'));assert.match(await page.locator('#sheet').innerText(),/Скрытых шаблонов нет/);
   await page.evaluate(async()=>{for(const id of ['trash-one','trash-two']){st.programs.push(ensureProgramShape({id,name:'Программа в корзине',weeks:[{days:[]}]}));await trainerDeleteOwnProgram(id)}st.programTrash[0].deletedAt=1;openProgramTrash()});
   assert.doesNotMatch(await page.locator('#sheet').innerText(),/01\.01\.1970/);await page.screenshot({path:`${output}/management-trash-${theme}-${width}.png`});
   await page.locator('.program-trash-card').first().getByRole('button',{name:'Удалить',exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('.program-trash-card').length===1);
   await page.getByRole('button',{name:'Очистить корзину',exact:true}).click();await page.waitForFunction(()=>document.getElementById('sheet').textContent.includes('Корзина пуста'));assert.match(await page.locator('#sheet').innerText(),/Корзина пуста/);assert.equal(await page.evaluate(()=>st.sessions[0].id),'history-kept');
   await page.reload();await page.waitForFunction(()=>window.__unvrslStartupComplete,{timeout:25000});
   const persisted=await page.evaluate(()=>({name:st.programs.find(p=>p.id==='managed')?.name,trash:st.programTrash.length,templates:st.programTemplates.length,history:st.sessions[0]?.id}));assert.equal(persisted.name,'Успешно сохранено');assert.equal(persisted.trash,0);assert.equal(persisted.templates,0);assert.equal(persisted.history,'history-kept');assert.deepEqual(errors,[]);
   results.push({width,theme,actions,alignment,editor,persisted,errors});await page.close();
  }
  fs.writeFileSync(output+'/management-results.json',JSON.stringify(results,null,2));console.log('PASS Chromium management: alignment, hidden template delete, trash purge, full localStorage quota, editor close and actual IndexedDB reload, both themes at 320/390 px');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
