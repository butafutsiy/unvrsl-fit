'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'..','muscle-map-full.js'),'utf8');

test('tonnage renders even when the optional anatomy body asset is unavailable',async()=>{
  const today=new Date().toISOString().slice(0,10),timers=[];
  const value={textContent:'—'},note={textContent:'Считаю…'},label={textContent:''};
  const tonnage={querySelector:q=>q==='b'?value:q==='small'?note:q==='span'?label:null};
  const figure={dataset:{},innerHTML:'',querySelector:()=>null};
  const top={innerHTML:''},sub={textContent:''};
  const card={isConnected:true,dataset:{},querySelector:q=>q==='.anatome-figure'?figure:q==='.anatome-top'?top:q==='.anatome-sub'?sub:q==='.anatome-tonnage-local'?tonnage:q==='[data-days].on'?{dataset:{days:'7'}}:null};
  const session={id:'finished-1',date:today,ended:Date.now(),ex:[{n:'Приседания со штангой',set:[{ok:true,reps:10,w:60}]}]};
  const window={addEventListener(){},__unvrslMuscleMapFullV176:false};
  const document={getElementById:id=>id==='anatomeMuscleCard'?card:null,querySelector(){return null},addEventListener(){}};
  const context={window,document,st:{sessions:[session],bw:[]},workoutRegistry:{resolve(){return null}},WorkoutDomain:{summary:()=>({volume:600,unknownVolumeSets:0})},fetch:async()=>({ok:false,status:404}),getComputedStyle:()=>({getPropertyValue:()=>'#30d158'}),setTimeout(fn,ms){timers.push({fn,ms});return timers.length},clearTimeout(){},console:{warn(){}},Date,Map,Set,URL,Promise};
  window.WorkoutDomain=context.WorkoutDomain;
  vmRun(source,context);
  window.unvrslRefreshMuscleMap211();
  await timers.find(item=>item.ms===80).fn();
  assert.equal(value.textContent,'600 кг');
  assert.equal(note.textContent,'Только завершённые подходы');
  assert.match(figure.innerHTML,/Карта мышц временно недоступна/);
});

test('a stalled history hydration cannot block saved tonnage or leave the map loading',async()=>{
  const date=new Date().toISOString().slice(0,10),timers=[];
  const value={textContent:'—'},note={textContent:'Считаю…'};
  const tonnage={querySelector:q=>q==='b'?value:q==='small'?note:null};
  const figure={dataset:{},innerHTML:'Строю карту…',querySelector:()=>null};
  const card={querySelector:q=>q==='.anatome-figure'?figure:q==='.anatome-top'?{innerHTML:''}:q==='.anatome-sub'?{textContent:''}:q==='.anatome-tonnage-local'?tonnage:q==='[data-days].on'?{dataset:{days:'7'}}:null};
  const session={id:'one',date,ex:[{n:'Приседания со штангой',set:[{ok:true,reps:10,w:60}]}]};
  const window={addEventListener(){},unvrslStatsSessions254:()=>[session],unvrslStatsHistoryState254:()=>({status:'loading'})};
  const document={getElementById:id=>id==='anatomeMuscleCard'?card:null,querySelector(){return null},addEventListener(){}};
  const context={window,document,st:{sessions:[session],bw:[]},workoutRegistry:{},WorkoutDomain:{summary:()=>({volume:600,unknownVolumeSets:0})},fetch:async()=>({ok:false,status:404}),getComputedStyle:()=>({getPropertyValue:()=>'#30d158'}),setTimeout(fn,ms){timers.push({fn,ms});return timers.length},clearTimeout(){},console:{warn(){}},Date,Map,Set,URL,Promise};
  window.WorkoutDomain=context.WorkoutDomain;
  vmRun(source,context);
  await timers.find(item=>item.ms===80).fn();
  assert.equal(value.textContent,'600 кг');
  assert.match(note.textContent,/Синхронизирую историю/);
  assert.match(figure.innerHTML,/Карта мышц временно недоступна/);
});

test('completed cloud workouts become available while check-ins are still pending',async()=>{
  const dashboard=fs.readFileSync(path.join(__dirname,'..','stats-dashboard.js'),'utf8');
  const today=new Date().toISOString().slice(0,10);
  const query=table=>({select(){return this},eq(){return this},order(){return this},limit(){return table==='workouts'?Promise.resolve({data:[{external_id:'cloud-1',workout_date:today,payload:{ended:Date.now(),ex:[{set:[{ok:true,w:60,r:10}]}]}}],error:null}):new Promise(()=>{})}});
  const events=[];
  const window={cloud:{user:{id:'owner-1'},client:{from:query}},dispatchEvent:event=>events.push(event.type)};
  const document={createElement:()=>({style:{}}),head:{appendChild(){}},getElementById:()=>null};
  const context={window,document,st:{sessions:[],deletedSessionIds:[]},setTimeout(){return 1},clearTimeout(){},console:{warn(){}},Date,Map,Set,Promise,CustomEvent:class{constructor(type){this.type=type}}};
  vmRun(dashboard,context);
  window.statsProgressRefresh(false);
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(window.unvrslStatsHistoryState254().status,'ready');
  assert.equal(window.unvrslStatsSessions254().length,1);
  assert.equal(window.unvrslStatsSessions254()[0].date,today);
  assert.ok(events.includes('unvrsl:stats-history-ready'));
});

test('light theme removes legacy dashboard gradients and lightens home activity controls',()=>{
  const css=fs.readFileSync(path.join(__dirname,'..','theme-light.css'),'utf8');
  assert.match(css,/html\[data-theme="light"\] body #stats \.sd2-metric\{[^}]*background-image:none!important/);
  assert.match(css,/html\[data-theme="light"\] body #stats \.anatome-tonnage-local\{/);
  assert.match(css,/html\[data-theme="light"\] body #home \.sd2-cell\{background:#e5e8ed!important/);
  assert.match(css,/html\[data-theme="light"\] body #home \.sd2-seg\{background:#eceef2!important/);
  assert.match(css,/body #home \.weekly-checkin-card,[\s\S]*?body #clients \.checkin-overview,[\s\S]*?background:#fff!important;background-image:none!important/);
  assert.match(css,/body #clients \.client-tabs\{background:#eceef2!important/);
  assert.match(css,/body #home \.bw190-chip\{background:#f5f6f8!important/);
  const shell=fs.readFileSync(path.join(__dirname,'..','anatome-muscle-map.js'),'utf8');
  assert.doesNotMatch(shell,/generateImage|from\('workouts'\)/);
});

function vmRun(code,context){require('node:vm').runInNewContext(code,context)}
