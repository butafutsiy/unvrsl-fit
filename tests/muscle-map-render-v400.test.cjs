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
  const context={window,document,st:{sessions:[session],bw:[]},workoutRegistry:{resolve(){return null}},WorkoutDomain:{summary:()=>({volume:600,unknownVolumeSets:0})},fetch:async()=>({ok:false,status:404}),getComputedStyle:()=>({getPropertyValue:()=>'#30d158'}),setTimeout(fn){timers.push(fn);return timers.length},console,Date,Map,Set,URL};
  window.WorkoutDomain=context.WorkoutDomain;
  vmRun(source,context);
  window.unvrslRefreshMuscleMap211();
  await timers.at(-1)();
  assert.equal(value.textContent,'600 кг');
  assert.equal(note.textContent,'Только завершённые подходы');
  assert.match(figure.innerHTML,/Карта мышц временно недоступна/);
});

test('light theme removes legacy dashboard gradients and lightens home activity controls',()=>{
  const css=fs.readFileSync(path.join(__dirname,'..','theme-light.css'),'utf8');
  assert.match(css,/html\[data-theme="light"\] body #stats \.sd2-metric\{[^}]*background-image:none!important/);
  assert.match(css,/html\[data-theme="light"\] body #stats \.anatome-tonnage-local\{/);
  assert.match(css,/html\[data-theme="light"\] body #home \.sd2-cell\{background:#e5e8ed!important/);
  assert.match(css,/html\[data-theme="light"\] body #home \.sd2-seg\{background:#eceef2!important/);
});

function vmRun(code,context){require('node:vm').runInNewContext(code,context)}
