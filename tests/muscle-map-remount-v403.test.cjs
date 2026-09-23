'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

test('a replaced statistics card refreshes, and tapping the active period retries it',()=>{
  const listeners=[];
  const card={dataset:{anatomeBound:'401'},querySelector(selector){
    if(selector==='.anatome-loading')return {};
    if(selector==='.anatome-tonnage-local small')return {textContent:'Считаю по выполненным подходам…'};
    return null;
  },querySelectorAll(){return [{classList:{toggle(){},contains(){return true}},addEventListener(_,fn){listeners.push(fn)}}]}};
  const root={querySelector:selector=>selector==='#anatomeMuscleCard'?card:null};
  let refreshes=0;
  const window={unvrslRefreshMuscleMap211(){refreshes++}};
  const document={createElement:()=>({}),head:{appendChild(){}},getElementById:id=>id==='stats'?root:null};
  const source=fs.readFileSync(path.join(__dirname,'..','anatome-muscle-map.js'),'utf8');
  vm.runInNewContext(source,{window,document,MutationObserver:class{observe(){}},queueMicrotask(){}});
  assert.equal(refreshes,1);
  card.dataset.anatomeBound='';
  window.anatomeMountCardV254();
  assert.equal(refreshes,2);
  listeners[0]();
  assert.equal(refreshes,3);
});

test('completed legacy workouts are included in statistics history',()=>{
  const source=fs.readFileSync(path.join(__dirname,'..','stats-dashboard.js'),'utf8');
  const window={};
  const document={createElement:()=>({style:{}}),head:{appendChild(){}},getElementById:()=>null};
  const st={sessions:[{id:'old',date:'2026-09-23',status:'completed',exercises:[{name:'Жим лёжа',sets:[{completed:true,weight:60,reps:10}]}]}],deletedSessionIds:[]};
  vm.runInNewContext(source,{window,document,st,Date,Map,Set,Promise,console});
  assert.equal(window.unvrslStatsSessions254().length,1);
});
