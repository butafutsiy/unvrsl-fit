'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
test('time-based aerobike in ordinary workout renders one slim row without RPE entry or equipment',()=>{
 const styles=[];
 const document={
  createElement:()=>({id:'',textContent:'',style:{}}),
  head:{appendChild:s=>styles.push(s)},
  querySelector:()=>null,
  querySelectorAll:()=>[]
 };
 const W={exerciseGroupCard:()=>'<div class="exercise strength">strength unchanged</div>',addEventListener(){}};
 const sandbox={window:W,document,esc:x=>String(x),encodeURIComponent,console};
 vm.runInNewContext(fs.readFileSync(path.join(root,'cardio-metric-fixes.js'),'utf8'),sandbox);
 const e={n:'Аэробайк',kind:'cardio',mode:'timer',target:5,tempo:'равномерный',set:[{workSeconds:480,ok:false}]};
 const html=W.exerciseGroupCard({},{base:e.n,indices:[0],entries:[e]});
 assert.match(html,/cardio-compact-ex/);
 assert.match(html,/08:00/);
 assert.match(html,/RPE 5/);
 assert.match(html,/Таймер/);
 assert.match(html,/toggleSet\(0,0\)/);
 assert.doesNotMatch(html,/\<input|sethead|Оборудование|отдых 90 сек/);
 const css=styles.find(x=>x.id==='unvrsl-cardio-compact-style')?.textContent;
 assert.ok(css);
 assert.match(css,/background:var\(--panel\)/);
 assert.match(css,/\.eq405-control\{display:none!important\}/);
 assert.doesNotMatch(css,/#1c1c1e|#111113/);
 const normal=W.exerciseGroupCard({}, {base:'Жим лёжа',indices:[0],entries:[{n:'Жим лёжа',set:[{w:80,r:8}]}]});
 assert.match(normal,/strength unchanged/);
});
test('standard cardio always skips strength equipment widget, without disabling strength editing',()=>{
 const code=fs.readFileSync(path.join(root,'equipment-profiles-v405.js'),'utf8');
 assert.match(code,/card\.matches\?\.\("\.cardio-compact-ex,\.cardio-workout"\)/);
 assert.match(code,/card\.querySelector\("\.eq405-control"\)\?\.remove\(\)/);
 assert.match(code,/let button=card\.querySelector\("\.eq405-control"\)/);
});
test('focus time UI uses collapsible actual metrics and has no large standalone RPE card',()=>{
 const code=fs.readFileSync(path.join(root,'focus-cardio-ui.js'),'utf8');
 assert.doesNotMatch(code,/\['RPE',info\.rpe/);
 assert.match(code,/Фактические показатели/);
 assert.match(code,/Завершить и сохранить/);
 const focus=fs.readFileSync(path.join(root,'focus-workout.js'),'utf8');
 assert.match(focus,/#workout-focus\[data-cardio=true\] \.wf-cardio-result\{border:0!important/);
 assert.match(focus,/#workout-focus\[data-cardio=true\] \.wf-cardio-screen\{padding:7px 0 10px!important/);
});
