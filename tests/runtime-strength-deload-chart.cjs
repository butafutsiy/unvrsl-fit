'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const {JSDOM}=require(process.env.UNVRSL_JSDOM||'jsdom');
const dom=new JSDOM('<!doctype html><html><head></head><body><section class="ofp-section"><h3>Выбранные упражнения</h3></section></body></html>',
 {url:'https://app.test/',runScripts:'dangerously'});
const w=dom.window;
w.requestAnimationFrame=fn=>w.setTimeout(fn,0);
w.offlineProgressCurrentIdV321=()=> 'n1';
w.WorkoutDomain=require('../workout-domain.js');
const saved=[
 {id:'old',offline_client_id:'n1',trainer_id:'t1',exercise_key:'squat',exercise_name:'Присед со штангой',measured_at:'2026-09-12',weight_kg:65,reps:6,rpe:8,rir:2,e1rm:82.3,is_deload:false,entry_source:'trainer'},
 {id:'a',offline_client_id:'n1',trainer_id:'t1',exercise_key:'squat',exercise_name:'Присед со штангой',measured_at:'2026-09-21',weight_kg:70,reps:8,rpe:8,rir:2,e1rm:93.3,is_deload:false,entry_source:'trainer'},
 {id:'b',offline_client_id:'n1',trainer_id:'t1',exercise_key:'squat',exercise_name:'Присед со штангой',measured_at:'2026-09-28',weight_kg:65,reps:8,rpe:8,rir:2,e1rm:null,is_deload:true,entry_source:'trainer'},
 {id:'c',offline_client_id:'n1',trainer_id:'t1',exercise_key:'squat',exercise_name:'Присед со штангой',measured_at:'2026-10-07',weight_kg:100,reps:1,rpe:8,rir:2,e1rm:110,is_deload:false,entry_source:'trainer'},
 {id:'d',offline_client_id:'n1',trainer_id:'t1',exercise_key:'squat',exercise_name:'Присед со штангой',measured_at:'2026-10-21',weight_kg:80,reps:5,rpe:8,rir:2,e1rm:98.7,is_deload:false,entry_source:'trainer'}
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
 assert.equal(saved[2].e1rm,null,'history remains stored without deload 1RM');
 assert.equal(card.dataset.spMode||card.querySelector('[data-sp-mode="both"]').classList.contains('on'),true,'both metrics are selected on initial render');
 const summary=card.querySelector('[data-sp-strength-summary]');
 assert.ok(summary,'trainer strength chart has a rolling strength summary');
 assert.equal(summary.querySelector('[data-sp-current-1rm]').textContent,'100 кг');
 assert.equal(summary.querySelector('[data-sp-training-max]').textContent,'90 кг');
 assert.equal(summary.querySelector('[data-sp-historical-mean]').textContent,'96,1 кг');
 assert.match(summary.querySelector('[data-sp-confirmed-single]').textContent,/100 кг × 1/);
 assert.match(summary.querySelector('[data-sp-excluded]').textContent,/Разгрузка \/ восстановление: 1/);
 const marker=card.querySelector('.spv335-marker.e1rm.is-deload[data-sp-record="2"]');
 assert.ok(marker,'deload has a separate, plotted 1RM marker');
 assert.match(marker.getAttribute('aria-label'),/только график/);
 assert.equal(card.querySelectorAll('.spv335-marker.e1rm').length,5,'all working and recovery observations plotted');
 assert.match(card.textContent,/86,7 кг/,'65 × 8 at RPE 8 gives 86.7 kg chart-only 1RM');
 assert.match(card.textContent,/Разгрузка · не для автовеса/);
 assert.equal(card.dataset.spBound,'1','record interaction handler initialized');
 assert.deepEqual(Array.from(card.__spRows||[],x=>x._i),[0,1,2,3,4],'record keys are stable');
 const chip=card.querySelector('[data-sp-chip="2"]');
 assert.ok(chip,'deload record chip exists');
 assert.equal(chip.closest('button[data-sp-mode]'),null,'record selection is not a mode-button action');
 let eventBubbled=false;
 card.addEventListener('click',()=>{eventBubbled=true},{capture:true,once:true});
 chip.click();
 assert.equal(eventBubbled,true,'chip click bubbles into its chart card');
 assert.equal(card.dataset.spSelected,'2','selecting deload record should update selected record');
 assert.match(card.querySelector('[data-sp-focus-effort]').textContent,/RPE 8 · RIR 2/,'actual effort appears on selected point');
 assert.match(card.querySelector('[data-sp-focus-e1rm]').textContent,/Разгрузка, только график/);
 assert.equal(saved[2].e1rm,null,'rendering cannot change program calculation input');
 assert.equal(summary.querySelector('[data-sp-current-1rm]').textContent,'100 кг','selecting recovery does not change calculation');
 console.log('Deload graph overlay: 1RM marker, historical date, badge and no persistence passed.');
 w.close();
})().catch(e=>{console.error(e);w.close();process.exitCode=1});