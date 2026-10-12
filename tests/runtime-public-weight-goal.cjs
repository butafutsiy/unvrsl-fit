'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {JSDOM}=require(process.env.UNVRSL_JSDOM||'jsdom');
async function page(goal,weights=[60,62]){
 const dom=new JSDOM('<div id="progressRoot"></div>',{url:'https://fixture.test/progress.html#t='+('x'.repeat(44)),runScripts:'dangerously',pretendToBeVisual:true}),w=dom.window;
 Object.defineProperty(w.crypto,'subtle',{value:crypto.webcrypto.subtle});w.TextEncoder=TextEncoder;w.HTMLElement.prototype.scrollTo=function(o){this.scrollLeft=o.left||0;};
 const snapshot={client:{name:'Тестовый профиль',targetWeight:goal},measurements:weights.map((weight,i)=>({date:'2026-10-0'+(i+1),weight,source:'client',measurements:{}})),strengths:[]};
 w.UNVRSL_CLOUD={url:'https://fixture.test',anonKey:'test-public'};w.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null}})},rpc:async()=>({data:{data:snapshot,viewer_source:'client'},error:null})})};
 w.eval(fs.readFileSync(path.join(__dirname,'../public-progress.js'),'utf8'));
 for(let i=0;i<25&&!w.document.querySelector('.pp-panel');i++)await new Promise(r=>w.setTimeout(r,10));
 assert.ok(w.document.querySelector('.pp-panel'),'private-share fixture loaded');return dom;
}
(async()=>{
 for(const goal of [80,50,62,20,400]){
  const dom=await page(goal),d=dom.window.document,line=d.querySelector('.pp-weight-target line');assert.ok(line,'goal '+goal);
  const y=Number(line.getAttribute('y1'));assert.ok(y>=39&&y<=187,'target stays inside plot');assert.equal(line.getAttribute('y1'),line.getAttribute('y2'));assert.equal(line.getAttribute('stroke-dasharray'),'6 5');
  assert.match(d.querySelector('.pp-weight-target-label').textContent,new RegExp('Цель '+goal+' кг'));
  const stats=d.querySelector('.pp-weight-stats').textContent;assert.match(stats,/Минимум60 кг/);assert.match(stats,/Максимум62 кг/);assert.match(stats,/Среднее61 кг/);assert.equal(d.querySelectorAll('.pp-weight-marker').length,2);
  dom.window.close();
 }
 let dom=await page(80,[60]);assert.ok(dom.window.document.querySelector('.pp-weight-target'));assert.equal(dom.window.document.querySelectorAll('.pp-weight-marker').length,1);dom.window.close();
 for(const goal of [null,0,501]){dom=await page(goal);assert.equal(dom.window.document.querySelector('.pp-weight-target'),null);assert.equal(dom.window.document.querySelector('.pp-weight-goal'),null);dom.window.close();}
 dom=await page(80,[]);assert.match(dom.window.document.querySelector('.pp-empty').textContent,/Пока нет данных/);dom.window.close();
 const appearance=new JSDOM('<meta name="theme-color"><meta name="color-scheme"><select id="pp-theme-mode"><option value="dark">dark</option><option value="light">light</option><option value="system">system</option></select>',{url:'https://fixture.test/',runScripts:'dangerously'}),a=appearance.window;
 let systemLight=false,listener; a.matchMedia=()=>({get matches(){return systemLight;},addEventListener:(type,callback)=>listener=callback});
 const account=JSON.stringify({accountOwnerId:'alice',theme:'dark',privateHistory:['unchanged']});a.localStorage.setItem('unvrsl-fit-v3',account);a.localStorage.setItem('unvrsl-appearance-v1',JSON.stringify({alice:{theme:'light'}}));
 const source=fs.readFileSync(path.join(__dirname,'../public-appearance.js'),'utf8');a.eval(source);assert.equal(a.document.documentElement.dataset.theme,'light');assert.equal(a.document.querySelector('[name="theme-color"]').content,'#f4f5f8');
 const select=a.document.getElementById('pp-theme-mode');select.value='system';select.dispatchEvent(new a.Event('change',{bubbles:true}));assert.equal(a.document.documentElement.dataset.theme,'dark');systemLight=true;listener();assert.equal(a.document.documentElement.dataset.theme,'light');assert.equal(a.localStorage.getItem('unvrsl-public-theme-v1'),'system');
 select.value='dark';select.dispatchEvent(new a.Event('change',{bubbles:true}));listener();assert.equal(a.document.documentElement.dataset.theme,'dark');assert.equal(a.localStorage.getItem('unvrsl-fit-v3'),account);a.eval(source);assert.equal(select.value,'dark');appearance.window.close();
 console.log('Shared appearance: inherited light preference, persisted override, system changes and untouched account data passed');
 console.log('Shared weight goal: gain, loss, reached, extreme valid targets, one point, invalid goals and unchanged measured statistics passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
