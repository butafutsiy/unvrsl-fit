'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const C=require('../focus-cardio.js');
function ui(){
 const original=global.window;
 const w={UNVRSLFocusCardio:C,displayExerciseName:x=>x,UNVRSLCardio:{settings:e=>e.cardio||{}}};
 global.window=w;
 delete require.cache[require.resolve('../focus-cardio-ui.js')];
 require('../focus-cardio-ui.js');
 const U=w.UNVRSLFocusCardioUI;
 global.window=original;
 return U;
}
const ex={n:'Аэробайк',mode:'cardio',loadType:'time',workSeconds:480,cardio:{mode:'steady',rpe:5}};
const set={workSeconds:480,ok:false};
const row={ei:0,si:0};
const session=()=>({id:'t1',ex:[{...ex,set:[{...set}]}],focusState:{cardioTimers:{}}});
test('aerobike 480 sec displays an 08:00 cardio face, not strength field',()=>{
 assert.equal(C.cardio(ex,'time'),true);
 assert.equal(C.duration(ex,set),480);
 const s=session(),U=ui();
 const html=U.render({session:s,row,e:s.ex[0],set:s.ex[0].set[0],d:{},all:[row],done:0});
 assert.match(html,/Аэробайк/);
 assert.match(html,/08:00/);
 assert.match(html,/Начать кардио/);
 assert.match(html,/data-wf-form="cardio"/);
 assert.match(html,/Фактические показатели/);
 assert.match(html,/Завершить и сохранить/);
 assert.match(html,/Непрерывно/);
 assert.doesNotMatch(html,/class="wf-cardio-metrics"|class="wf-cardio-result-title"/);
 assert.doesNotMatch(html,/Техника сохранена|Возникла боль|480 сек|name="weight"|name="reps"/);
});
test('timer starts, pauses, resumes, and persists exact elapsed time on reload',()=>{
 let x=C.command(null,'start',1000000);
 assert.equal(C.elapsed(x,1012500),13);
 x=C.command(x,'pause',1020000);
 assert.equal(C.elapsed(x,1200000),20);
 x=C.command(x,'resume',1400000);
 assert.equal(C.elapsed(x,1410000),30);
 const restored=JSON.parse(JSON.stringify(x));
 assert.equal(C.elapsed(restored,1415000),35);
 assert.equal(C.snapshot(restored,480,1415000).remaining,445);
 const stopped=C.command(restored,'finish',1420000);
 assert.equal(C.elapsed(stopped,1540000),40);
 assert.equal(C.elapsed(C.command(stopped,'reset',2000000)),0);
});
test('interval time includes only work rounds plus the pauses between rounds',()=>{
 const e={...ex,cardio:{mode:'interval',rounds:8,workSeconds:30,restSeconds:60}};
 const total=8*30+7*60;
 assert.equal(C.duration(e,set),total);
 assert.equal(C.intervalPhase(e.cardio,35).phase,'rest');
 assert.equal(C.intervalPhase(e.cardio,90).round,2);
});
test('cardio result records a timed or manually corrected duration and optional metrics',()=>{
 const s=session(),U=ui();s.focusState.cardioTimers['0:0']={status:'paused',startedAt:null,elapsedMs:120000};
 const elements={minutes:{value:''},distanceKm:{value:'1.5'},heartRate:{value:'130'},reportedKcal:{value:'72'},rpe:{value:'5.5'}};
 const form={elements,dataset:{wfForm:'cardio'}};
 const result=U.read(form,s,row);
 assert.equal(result.reps,'120');
 assert.equal(result.rir,'unknown');
 assert.equal(result.technique,true);
 assert.equal(result.cardio.reportedKcal,72);
 elements.minutes.value='3.5';
 assert.equal(U.read(form,s,row).reps,'210');
});
test('non-cardio timed strength movement stays on the existing exercise screen',()=>{
 assert.equal(C.cardio({n:'Планка',loadType:'time'},'time'),false);
 assert.equal(C.cardio({n:'Жим штанги лёжа',loadType:'external_total'},'external_total'),false);
 assert.equal(C.cardio({n:'Беговая дорожка',loadType:'time'},'time'),true);
});
