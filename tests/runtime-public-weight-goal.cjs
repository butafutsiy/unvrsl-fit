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
 console.log('Shared weight goal: gain, loss, reached, extreme valid targets, one point, invalid goals and unchanged measured statistics passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
