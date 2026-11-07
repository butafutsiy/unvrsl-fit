'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');

test('release v594 installs workout scroll guard without a fixed-nav compositor hint',()=>{
  const html=read('index.html');
  assert.match(html,/__unvrslRelease='v(?:59[4-9]|[6-9]\d{2})'/);
  assert.match(html,/workout-scroll-guard\.js\?v=603/);
  assert.match(html,/sw\.js\?v=(?:59[4-9]|[6-9]\d{2})/);
  assert.match(read('sw.js'),/SW_RELEASE = "v(?:59[4-9]|[6-9]\d{2})"/);
  assert.doesNotMatch(read('mobile-final-fix.js'),/will-change:transform;backface-visibility:hidden/);
  assert.match(read('mobile-final-fix.js'),/translate:none!important/);
});

function environment(pinned=false){
  const pending=[],listeners={};
  let y=0;
  const navStyle={
    translate:'',
    removeProperty(name){if(name==='translate')this.translate=''},
    setProperty(){}
  };
  const offset=()=>Number(navStyle.translate.split(' ')[1]?.replace('px',''))||0;
  const nav={
    style:navStyle,
    getBoundingClientRect:()=>({height:64,bottom:790-(pinned?0:y)+offset()})
  };
  const card={getBoundingClientRect:()=>({top:400-y,bottom:650-y})};
  const body={tagName:'BODY',scrollTop:0};
  const scrollRoot={get scrollTop(){return y},set scrollTop(value){y=value}};
  const start={
    classList:{contains:value=>value==='active'},
    querySelector:value=>value==='.exercise'?card:null,
    querySelectorAll:value=>value==='.exercise'?[card]:[],
    contains:()=>false
  };
  const doc={
    body,documentElement:scrollRoot,scrollingElement:scrollRoot,activeElement:body,
    getElementById:id=>id==='start'?start:id==='modal'?{classList:{contains:()=>false}}:null,
    querySelector:q=>q==='body > .nav'?nav:null,
    addEventListener(){}
  };
  const win={
    st:{current:{id:'session-1'}},innerHeight:800,
    visualViewport:{offsetTop:0,height:800,addEventListener(){}},
    requestAnimationFrame:fn=>{pending.push(fn);return pending.length},
    addEventListener:(name,fn)=>{(listeners[name]||=[]).push(fn)},
    getComputedStyle:()=>({position:'fixed',display:'grid',visibility:'visible',bottom:'10px'}),
    scrollTo:(_x,value)=>{y=value},
    startPage(){y=0;return 'rendered'}
  };
  Object.defineProperty(win,'scrollY',{get:()=>y});
  const ctx={window:win,document:doc,MutationObserver:class{observe(){}},setTimeout(){}};
  vm.runInNewContext(read('workout-scroll-guard.js'),ctx);
  const flush=()=>{while(pending.length)pending.shift()()};
  return {win,nav,setY:value=>{y=value},getY:()=>y,fire:name=>(listeners[name]||[]).forEach(fn=>fn()),flush,offset};
}

test('iOS scrolled workout never translates bottom nav and restores rendered position',()=>{
  const e=environment(false);
  e.flush();
  assert.equal(e.offset(),0);
  e.setY(250);
  e.fire('scroll');
  e.flush();
  assert.equal(e.offset(),0);
  assert.equal(e.win.startPage(),'rendered');
  e.flush();
  assert.equal(e.getY(),250);
  e.setY(0);e.fire('scroll');e.flush();
  assert.equal(e.offset(),0);
});

test('healthy fixed nav is not translated during page scrolling',()=>{
  const e=environment(true);
  e.flush();
  e.setY(275);
  e.fire('scroll');
  e.flush();
  assert.equal(e.offset(),0);
});

test('a new scroll position wins before its delayed browser scroll event arrives',()=>{
  const e=environment(false);e.setY(250);e.win.startPage();
  e.setY(400);e.flush();assert.equal(e.getY(),400);
});
