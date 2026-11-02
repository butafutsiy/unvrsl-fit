'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const {JSDOM}=require(process.env.UNVRSL_JSDOM||'jsdom');
const dom=new JSDOM('<!doctype html><html><head></head><body><section class="ofp-section"><h3>Выбранные упражнения</h3></section></body></html>',
 {url:'https://app.test/',runScripts:'dangerously'});
const w=dom.window;
w.requestAnimationFrame=fn=>w.setTimeout(fn,0);
w.offlineProgressCurrentIdV321=()=> 'n1';
const saved=[
 {id:'a',offline_client_id:'n1',trainer_id:'t1',exercise_key:'squat',exercise_name:'Присед со штангой',measured_at:'2026-09-21',weight_kg:70,reps:8,rpe:8,rir:2,e1rm:93.3,is_deload:false,entry_source:'trainer'},
 {id:'b',offline_client_id:'n1',trainer_id:'t1',exercise_key:'squat',exercise_name:'Присед со штангой',measured_at:'2026-09-28',weight_kg:65,reps:8,rpe:8,rir:2,e1rm:null,is_deload:true,entry_source:'trainer'},
 {id:'c',offline_client_id:'n1',trainer_id:'t1',exercise_key:'squat',exercise_name:'Присед со штангой',measured_at:'2026-10-07',weight_kg:100,reps:1,rpe:8,rir:2,e1rm:110,is_deload:false,entry_source:'trainer'}
];
w.cloud={user:{id:'t1'},client:{from(table){
 assert.equal(table,'offline_client_strengths');
 const q={select(){return this},eq(){return this},order(){return this},limit(){return this},
 then(resolve,reject){return Promise.resolve({data:saved,error:null}).then(resolve,reject)}};
 return q;
}}};
w.eval(fs.readFileSync(require.resolve('../strength-progress.js'),'utf8'));
(async()=>{
 w.dispatchEvent(new w.Event('unvrsl:deferred-modules-ready'));
 for(let i=0;i<30&&!w.document.querySelector('.spv335-card');i++)await new Promise(r=>setTimeout(r,20));
 const card=w.document.querySelector('.spv335-card');
 assert.ok(card,'strength overlay must render for trainer');
 assert.equal(saved[1].e1rm,null,'history remains stored without deload 1RM');
 card.querySelector('[data-sp-mode="both"]').click();
 const marker=card.querySelector('.spv335-marker.e1rm.is-deload[data-sp-record="1"]');
 assert.ok(marker,'deload has a separate, plotted 1RM marker');
 assert.match(marker.getAttribute('aria-label'),/только график/);
 assert.ok(card.querySelectorAll('.spv335-marker.e1rm').length===3,'all observations plotted');
 assert.match(card.textContent,/86,7 кг/,'65 × 8 at RPE 8 gives 86.7 kg chart-only 1RM');
 assert.match(card.textContent,/Разгрузка · не для автовеса/);
 assert.equal(card.dataset.spBound,'1','record interaction handler initialized');
 assert.deepEqual(Array.from(card.__spRows||[],x=>x._i),[0,1,2],'record keys are stable');
 card.querySelector('[data-sp-chip="1"]').click();
 assert.equal(card.dataset.spSelected,'1','selecting deload record should update selected record');
 assert.match(card.querySelector('[data-sp-focus-e1rm]').textContent,/Разгрузка, только график/);
 assert.equal(saved[1].e1rm,null,'rendering cannot change program calculation input');
 console.log('Deload graph overlay: 1RM marker, historical date, badge and no persistence passed.');
 w.close();
})().catch(e=>{console.error(e);w.close();process.exitCode=1});