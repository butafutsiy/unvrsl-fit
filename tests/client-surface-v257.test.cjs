'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {programWeightProfile,programWeightLabel}=require('../program-weight-policy-v257.js');

const root=path.join(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');

test('client programs are split into prescribed and autoweight groups',()=>{
  const prescribed={weeks:[{days:[{ex:[{sets:[{w:100},{w:100}]}]}]}]};
  const automatic={weeks:[{days:[{ex:[{sets:[{w:0},{w:0}]}]}]}]};
  const mixed={weeks:[{days:[{ex:[{sets:[{w:100},{w:0}]}]}]}]};
  assert.deepEqual(programWeightProfile(prescribed),{group:'prescribed',mode:'prescribed',prescribed:2,empty:0,total:2});
  assert.deepEqual(programWeightProfile(automatic),{group:'autoweight',mode:'autoweight',prescribed:0,empty:2,total:2});
  assert.equal(programWeightProfile(mixed).group,'prescribed');
  assert.equal(programWeightProfile(mixed).mode,'mixed');
  assert.equal(programWeightLabel(automatic).badge,'Автовес');
  const picker=read('client-program-picker.js');
  assert.match(picker,/С ЗАДАННЫМИ ВЕСАМИ/);
  assert.match(picker,/>АВТОВЕС</);
  assert.match(picker,/selectedWeight\.detail/);
});

test('client Home contains no program card',()=>{
  const runtime=read('client-final-runtime-v222.js'),fallback=read('app-mode.js');
  const canonical=runtime.match(/function renderCanonicalClientHome\(\)\{([\s\S]*?)\n  \}\n  function installCanonicalClientHome/)?.[1]||'';
  const legacy=fallback.match(/function clientCleanHome\(\)\{([\s\S]*?)\n\}/)?.[1]||'';
  assert.doesNotMatch(canonical,/МОЙ ПЛАН|Открыть план|client-plan-card-v255/);
  assert.doesNotMatch(legacy,/МОЙ ПЛАН|Открыть план/);
  assert.match(canonical,/clientCalendarHtml\(\).*clientStreakHtml\(\)/);
});

test('client calendar rejects the trainer built-in cycle but keeps an assigned manual workout',()=>{
  const assigned={id:'client-program',cloudPlanId:'cloud-plan',trainerId:'trainer',name:'Клиентская программа',weeks:[{days:[{name:'День клиента',ex:[]}]}]};
  const context={
    console,encodeURIComponent,decodeURIComponent,setTimeout:()=>0,confirm:()=>true,
    cloud:{user:{id:'client'},profile:{role:'client'}},unvrslTrainerMode:()=>false,
    st:{calendarPlans:{},sessions:[],programs:[assigned],clientAssignedUserId:'client',clientAssignmentsLoaded:true,clientAssignedPlanIds:['cloud-plan']},
    ROUTINES:[{w:1,c:'A1',t:'Мой план',e:[]}],RPE:{1:8},
    plannedForDate:()=>({w:1,c:'A1',t:'Мой план',e:[]}),
    iso:d=>d.toISOString().slice(0,10),parseDate:s=>new Date(`${s}T12:00:00`),
    save:()=>{},modal:()=>{},closeModal:()=>{},toast:()=>{},
    document:{createElement:()=>({}),head:{appendChild:()=>{}},getElementById:()=>null}
  };
  context.window=context;
  vm.runInNewContext(read('calendar-planner-v234.js'),context);
  assert.equal(context.calendarPlanForDateV234('2026-09-01'),null);
  context.st.calendarPlans['2026-09-02']={kind:'builtin',week:1,code:'A1'};
  assert.equal(context.calendarPlanForDateV234('2026-09-02'),null);
  context.st.calendarPlans['2026-09-03']={kind:'program',programId:'client-program',weekIndex:0,dayIndex:0};
  assert.equal(context.calendarPlanForDateV234('2026-09-03').c,'День клиента');
});

test('choosing plan keeps adaptive exercises in autoweight mode',()=>{
  const context={
    console,setInterval:()=>0,setTimeout:()=>0,
    st:{current:null},save:()=>{},startPage:()=>{},
    document:{getElementById:()=>null},
    window:null
  };
  context.window=context;
  vm.runInNewContext(read('exact-plan-fix-v228.js'),context);
  const current={programId:'assigned',ex:[
    {programWeightMode:'prescribed',set:[{programW:110,plannedW:100,baselineW:100,w:100,ok:false}]},
    {programWeightMode:'adaptive',weightDecision:'adaptive_auto',set:[{programW:0,plannedW:60,baselineW:60,w:60,ok:false}]}
  ]};
  context.st.current=current;
  context.unvrslRestoreExactPlanV257(current);
  assert.equal(current.ex[0].set[0].w,110);
  assert.equal(current.ex[0].programWeightMode,'prescribed');
  assert.equal(current.ex[1].set[0].w,60);
  assert.equal(current.ex[1].set[0].programW,0);
  assert.equal(current.ex[1].programWeightMode,'adaptive');
  assert.equal(current.ex[1].weightDecision,'adaptive_auto');
});
