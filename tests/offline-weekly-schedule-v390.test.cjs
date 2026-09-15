'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');

function runtime(){
  const document={
    head:{appendChild(){}},
    createElement(){return{id:'',textContent:''}},
    getElementById(){return null},
    querySelector(){return null},
    querySelectorAll(){return[]}
  };
  const context={console,Date,Intl,Math,Promise,document,setTimeout:()=>0,clearTimeout(){},CustomEvent:function(){},addEventListener(){}};
  context.window=context;
  vm.runInNewContext(read('offline-schedule.js'),context);
  return context.unvrslOfflineScheduleV390
}

test('weekday model is Monday-first and schedule supports separate times',()=>{
  const api=runtime();
  assert.equal(api.weekday(new Date('2026-09-14T12:00:00')),1);
  assert.equal(api.weekday(new Date('2026-09-20T12:00:00')),7);
  api.hydrate({
    clients:[{id:'roman',display_name:'Роман'}],
    slots:[
      {id:'m',offline_client_id:'roman',weekday:1,start_time:'19:00:00'},
      {id:'w',offline_client_id:'roman',weekday:3,start_time:'18:00:00'},
      {id:'f',offline_client_id:'roman',weekday:5,start_time:'20:00:00'}
    ]
  });
  assert.equal(api.scheduleSummary('roman'),'ПН – 19:00 · СР – 18:00 · ПТ – 20:00')
});

test('a one-off move changes only the occurrence, not the weekly template',()=>{
  const api=runtime(),monday=api.dateForWeekday(1),wednesday=api.dateForWeekday(3);
  api.hydrate({
    selectedDay:3,
    clients:[{id:'roman',display_name:'Роман'}],
    slots:[{id:'m',offline_client_id:'roman',weekday:1,start_time:'19:00:00'}],
    exceptions:[{schedule_slot_id:'m',original_date:monday,exception_type:'move',new_date:wednesday,new_time:'18:00:00'}],
    events:[]
  });
  const moved=api.occurrenceRows(3);
  assert.equal(moved.length,1);
  assert.equal(moved[0].status,'moved-here');
  assert.equal(moved[0].displayTime,'18:00');
  assert.equal(api.scheduleSummary('roman'),'ПН · 19:00')
});

test('finance counts only completed sessions, never planned or manual balance edits',()=>{
  const api=runtime(),now=new Date(),shifted=new Date(now.getTime()-now.getTimezoneOffset()*60000),today=shifted.toISOString().slice(0,10);
  api.hydrate({events:[
    {event_type:'completed',session_date:today,revenue_cents:112500},
    {event_type:'completed',session_date:today,revenue_cents:112500},
    {event_type:'manual_debit',session_date:today,revenue_cents:0},
    {event_type:'manual_credit',session_date:today,revenue_cents:0}
  ]});
  assert.deepEqual({...api.finance('today')},{count:2,cents:225000})
});

test('database migration links templates, blocks, facts and idempotent writes',()=>{
  const sql=read('supabase-migrations/20260915_offline_weekly_schedule_v390.sql');
  assert.match(sql,/create table if not exists public\.offline_weekly_slots/);
  assert.match(sql,/create table if not exists public\.offline_membership_blocks/);
  assert.match(sql,/create table if not exists public\.offline_session_events/);
  assert.match(sql,/create table if not exists public\.offline_schedule_exceptions/);
  assert.match(sql,/unique \(trainer_id, idempotency_key\)/);
  assert.match(sql,/on conflict \(trainer_id, idempotency_key\) do nothing/);
  assert.match(sql,/security invoker/g);
  assert.match(sql,/enable row level security/g);
  assert.match(sql,/revoke all on table public\.offline_session_events from authenticated/);
  assert.match(sql,/greatest\(total_sessions, v_after\)/)
});

test('runtime loads the schedule after offline progress and exposes one offline add action',()=>{
  const loader=read('frequent-patch.js'),layout=read('clients-action-layout.js'),schedule=read('offline-schedule.js');
  assert.match(loader,/offline-clients\.js\?v=390/);
  assert.match(loader,/clients-action-layout\.js\?v=390[\s\S]*offline-progress\.js\?v=390[\s\S]*offline-schedule\.js\?v=390/);
  assert.match(layout,/offline\.hidden=true/);
  assert.match(schedule,/class="btn full offline-add-client"/);
  assert.match(schedule,/const byDay=new Map\(cache\.slots\.filter/);
  for(const field of ['offChest','offWaist','offAbdomen','offHips','offThigh','offArm','offCalf'])assert.match(schedule,new RegExp(`id="${field}"`))
});
