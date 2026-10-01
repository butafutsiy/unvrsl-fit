'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
test('Statistics counts completed workouts over inclusive 7 and 28 calendar days',()=>{
 const root={classList:{remove(){},add(){},contains(){return false}},dataset:{},querySelector(){return null},innerHTML:''};
 const RealDate=Date;class Clock extends RealDate{constructor(...a){super(...(a.length?a:['2026-10-01T13:00:00']))}}
 const finished=(id,date)=>({id,date,ended:1,ex:[{set:[{ok:true}]}]});
 const st={sessions:[finished('today','2026-10-01'),finished('six','2026-09-25'),finished('seven','2026-09-24'),finished('twentyseven','2026-09-04'),finished('twentyeight','2026-09-03'),finished('future','2026-10-02'),{id:'draft',date:'2026-10-01',ex:[{set:[{ok:true}]}]},{id:'empty',date:'2026-10-01',ended:1,ex:[]},finished('deleted','2026-10-01'),finished('today','2026-10-01')],deletedSessionIds:['deleted']};
 const window={};const ctx={Date:Clock,st,window,document:{createElement(){return{}},head:{appendChild(){}},getElementById(){return root}},console};
 vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'..','stats-dashboard.js'),'utf8'),ctx);
 window.statsDashboardRender();
 const value=label=>Number(root.innerHTML.match(new RegExp('>'+label+'</span><b>(\\d+)</b>'))?.[1]);
 assert.equal(value('За 7 дней'),2);assert.equal(value('За 28 дней'),4);
 assert.equal(value('Тренировки'),6);
});
