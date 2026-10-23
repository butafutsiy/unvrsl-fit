'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function fixture(){
 const events={},steps=[],notices=[],button={};let banner;
 const d={hidden:false,addEventListener(){},getElementById:()=>banner,createElement:()=>({setAttribute(){},querySelector:()=>button}),querySelector:()=>({insertAdjacentElement:(_p,node)=>banner=node})};
 const w={document:d,__unvrslRelease:'v1',st:{current:{id:'unfinished',ex:[{set:[{w:95,ok:true}]}]}},
  addEventListener:(name,fn)=>events[name]=fn,fetch:async()=>({ok:true,text:async()=>"window.__unvrslRelease='v2'"}),
  navigator:{serviceWorker:{getRegistration:async()=>({update:async()=>steps.push('check'),waiting:{postMessage:()=>steps.push('activate')}}),addEventListener:(name,fn)=>events['sw:'+name]=fn}},
  persistWorkoutState:async()=>{steps.push('save');return true},location:{reload:()=>steps.push('reload')},toast:x=>notices.push(x)};
 vm.runInNewContext(fs.readFileSync('app-refresh.js','utf8'),{window:w,document:d,Date,Error});return{w,events,steps,notices,banner:()=>banner};
}
test('new release is offered without reloading an active workout',async()=>{
 const f=fixture(),before=JSON.stringify(f.w.st);await f.w.checkAppUpdate(true);
 assert.match(f.banner().innerHTML,/v1.*v2/);assert.ok(!f.steps.includes('reload'));assert.equal(JSON.stringify(f.w.st),before);
 await f.w.applyAppUpdate();assert.deepEqual(f.steps,['check','save','activate','reload']);assert.equal(JSON.stringify(f.w.st),before);
});
test('failed durable save blocks the update and permits retry',async()=>{
 const f=fixture();f.events['sw:message']({data:{type:'UNVRSL_RELEASE_READY',release:'v2'}});
 f.w.persistWorkoutState=async()=>false;assert.equal(await f.w.applyAppUpdate(),false);assert.ok(!f.steps.includes('reload'));assert.match(f.notices[0],/Не удалось сохранить/);
 f.w.persistWorkoutState=async()=>true;assert.equal(await f.w.applyAppUpdate(),true);
});
test('same and older service worker releases do not offer an update',()=>{
 const f=fixture();for(const release of ['v0','v1','invalid'])f.events['sw:message']({data:{type:'UNVRSL_RELEASE_READY',release}});
 assert.equal(f.banner(),undefined);assert.deepEqual(f.steps,[]);
});
