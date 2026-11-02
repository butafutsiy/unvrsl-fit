'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require(process.env.UNVRSL_JSDOM||'jsdom');
const dom=new JSDOM('<!doctype html><html><head></head><body><main></main></body></html>',{runScripts:'outside-only',pretendToBeVisual:true,url:'https://app.test/'}),W=dom.window;
W.HTMLElement.prototype.scrollTo=function(o){this.scrollLeft=o.left||0};
W.setTimeout=()=>0;W.requestAnimationFrame=()=>0;
const day=i=>{const d=new Date();d.setDate(d.getDate()-10+i);return d.toISOString().slice(0,10)};
const session=(id,i,w,equipment)=>({id,date:day(i),ended:1,ex:[{n:'Жим ногами',loadType:'external_total',...(equipment?{equipmentProfileId:equipment,equipmentProfile:{id:equipment,name:equipment==='matrix'?'Matrix':'Foreman'}}:{}),set:[{w,r:1,ok:true}]}]});
W.st={bw:[],sessions:[session('a',0,100,'matrix'),session('b',1,300,'foreman'),session('c',2,110,'matrix'),session('d',3,360,'foreman'),session('e',4,120)]};
for(const name of ['workout-domain.js','strength-analytics.js'])W.eval(fs.readFileSync(path.join(__dirname,'..',name),'utf8'));
W.workoutRegistry=W.WorkoutDomain.registry([{id:'leg',n:'Жим ногами',tg:'quads',loadType:'external_total'}]);
W.eval(fs.readFileSync(path.join(__dirname,'..','profile-strength-core.js'),'utf8'));
W.document.querySelector('main').innerHTML=W.profileStrengthOverviewHtml();
const query=s=>W.document.querySelector(s),familyKey=query('[data-strength-key]').dataset.strengthKey;
assert.equal(W.document.querySelectorAll('.strength-exercise').length,1);
assert.equal(W.document.querySelectorAll('.strength-record').length,5);
assert.deepEqual([...W.document.querySelectorAll('.strength-record')].map(b=>Number(b.getAttribute('onclick').match(/,(\d+)\)/)[1])),[0,1,2,3,4]);
assert.equal(W.document.querySelector('.strength-record:last-child').getAttribute('aria-pressed'),'true');
assert.match(query('.strength-average').textContent,/15.*%/);
assert.match(query('.strength-average').textContent,/2 из 3/);
assert.match(query('.strength-chart').textContent,/100% = старт/);
assert.equal(W.document.querySelectorAll('.strength-equipment-picker option').length,4);
assert.match(query('.strength-focus').textContent,/Оборудование не указано/);
W.strengthSelect(encodeURIComponent(familyKey),0);
assert.match(query('.strength-focus').textContent,/Matrix/);assert.match(query('.strength-focus').textContent,/100 кг/);
const matrixOption=[...W.document.querySelectorAll('.strength-equipment-picker option')].find(o=>o.textContent.includes('Matrix'));
W.strengthEquipment(encodeURIComponent(familyKey),matrixOption.value);
assert.equal(query('[data-strength-current]').textContent,'—','missing RPE cannot fabricate a rolling 1RM');
assert.equal(W.document.querySelectorAll('.strength-marker.e1').length,2,'legacy chart values stay visible');
assert.equal(W.document.querySelectorAll('.strength-record').length,2);
W.strengthSelect(encodeURIComponent(matrixOption.value),0);
assert.match(query('.strength-focus').textContent,/100 кг/);
W.strengthMode(encodeURIComponent(matrixOption.value),'weight');
assert.equal(W.document.querySelectorAll('.strength-line.e1').length,0);
W.strengthEquipment(encodeURIComponent(familyKey),'all');
assert.equal(W.document.querySelectorAll('.strength-record').length,5);
assert.match(query('.strength-average').textContent,/15.*%/);
W.strengthFilter('group','chest');assert.equal(W.document.querySelectorAll('.strength-exercise').length,0);
W.strengthFilter('group','legs');assert.equal(W.document.querySelectorAll('.strength-exercise').length,1);

// The personal account shares the same working-evidence and adaptive rolling
// estimator as the offline weekly table, without allowing recovery to
// influence either the current 1RM or historical eligible mean.
const sample=[
  [65,6,false],[70,8,false],[65,8,true],[100,1,false],[80,5,false]
];
W.st.sessions=sample.map(([w,r,deload],i)=>({
 id:'personal-'+i,date:day(i),ended:1,deload,
 ex:[{n:'Присед со штангой',loadType:'external_total',set:[
   {w,r,actualReps:r,actualRpe:8,actualRir:2,ok:true}
 ]}]
}));
W.workoutRegistry=W.WorkoutDomain.registry([{id:'squat',n:'Присед со штангой',tg:'quads',loadType:'external_total'}]);
W.document.querySelector('main').innerHTML=W.profileStrengthOverviewHtml();
const personal=W.document.querySelector('[data-strength-summary]');
assert.ok(personal,'personal strength card shows unified rolling 1RM summary');
assert.equal(personal.querySelector('[data-strength-current]').textContent,'100 кг');
assert.equal(personal.querySelector('[data-strength-tm]').textContent,'90 кг');
assert.equal(personal.querySelector('[data-strength-historical]').textContent,'96,1 кг');
assert.match(personal.querySelector('[data-strength-single]').textContent,/100 кг × 1/);
assert.match(personal.querySelector('[data-strength-recovery]').textContent,/Разгрузка \/ восстановление: 1/);
assert.equal(W.document.querySelector('[data-strength-session-max]').textContent,'98,7 кг','selected training point shows its own estimate');
assert.equal(W.document.querySelector('[data-strength-program-max]').textContent,'100 кг','programme maximum stays separate');
assert.match(W.document.querySelector('[data-strength-session-note]').textContent,/Оценка по этой тренировке/);
assert.equal(W.document.querySelectorAll('.strength-marker.e1').length,5,'all chart 1RM points remain visible');
assert.equal(W.document.querySelectorAll('.strength-marker.recovery.e1').length,1,'recovery e1RM remains a chart-only point');
assert.match(W.document.querySelector('.strength-record.recovery').textContent,/86,7 кг/);
assert.match(W.document.querySelector('.strength-focus').textContent,/RPE 8/,'selected top set displays its effort');
const personalKey=W.document.querySelector('[data-strength-key]').dataset.strengthKey;
W.strengthSelect(encodeURIComponent(personalKey),2);
assert.match(W.document.querySelector('.strength-focus').textContent,/Разгрузка: только график/);
assert.equal(W.document.querySelector('[data-strength-session-max]').textContent,'86,7 кг','recovery chart observation still has descriptive 1RM');
assert.equal(W.document.querySelector('[data-strength-program-max]').textContent,'100 кг','recovery cannot replace program reference');
assert.match(W.document.querySelector('[data-strength-session-note]').textContent,/только график/);
assert.equal(W.document.querySelector('[data-strength-current]').textContent,'100 кг','selecting recovery cannot change current strength');
assert.equal(W.document.querySelector('[data-strength-historical]').textContent,'96,1 кг','recovery cannot change eligible mean');
// A non-deload session with no RPE stays in the chart but does not fabricate a strength baseline.
W.st.sessions=[session('no-effort',0,80)];
W.document.querySelector('main').innerHTML=W.profileStrengthOverviewHtml();
assert.equal(W.document.querySelector('[data-strength-current]').textContent,'—');
assert.equal(W.document.querySelector('[data-strength-program-max]').textContent,'—','missing RPE leaves program estimate absent');
assert.equal(W.document.querySelector('[data-strength-session-max]').textContent,'80 кг','graph preserves observational estimate without RPE');
assert.match(W.document.querySelector('[data-strength-summary]').textContent,/нужны рабочие подходы с RPE 7–10/i);

console.log('PASS: one equipment family, personal rolling 1RM/TM/eligible mean, verified singles, recovery markers and protection.');

dom.window.close();
