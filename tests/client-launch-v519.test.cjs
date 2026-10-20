'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');

function runtime({user={id:'client-1',email:'client@example.test'},role='client',settled=true,ready=true,current=null}={}){
  const callbacks=new Map();
  const on=(event,callback)=>{if(!callbacks.has(event))callbacks.set(event,new Set());callbacks.get(event).add(callback)};
  const off=(event,callback)=>callbacks.get(event)?.delete(callback);
  const dispatch=event=>{for(const fn of [...callbacks.get(event)||[]])fn()};
  let picker=0,signIn=0,nav=0;
  const w={
    cloud:{user,profile:{role},initSettled:settled},st:{current},
    __unvrslClientRuntimeUserIdV519:ready?user?.id:null,
    openClientStartProgramPicker:()=>{picker++},
    cloudPasswordLoginSheet:()=>{signIn++},
    nav:()=>{nav++},
    toast:()=>{},
    addEventListener:on,removeEventListener:off
  };
  let click;
  const doc={addEventListener:(type,handler,capture)=>{
    if(type==='click'&&capture===true)click=handler;
  }};
  vm.runInNewContext(read('client-launch-reliability.js'),
    {window:w,document:doc,console,setTimeout,clearTimeout,Promise});
  const fire=()=>{
    const result={prevented:false,stopped:false};
    click({
      target:{closest:selector=>selector==='.nav button[data-p="start"]'?{}:null},
      preventDefault:()=>result.prevented=true,
      stopImmediatePropagation:()=>result.stopped=true
    });
    return result;
  };
  return {w,fire,dispatch,values:()=>({picker,signIn,nav})};
}

test('Play opens the client program picker without entering My Plan',async()=>{
  const x=runtime();
  const event=x.fire();
  assert.equal(event.prevented,true);
  assert.equal(event.stopped,true);
  await x.w.unvrslClientStartV519();
  assert.equal(x.values().picker,1);
  assert.equal(x.values().nav,0);
});
test('trainer Play retains original navigation',async()=>{
  const x=runtime({user:{id:'trainer-2',email:'trainer@example.test'},role:'trainer'});
  const event=x.fire();
  assert.equal(event.prevented,false);
  assert.equal(event.stopped,false);
  assert.equal(x.values().picker,0);
});
test('active workout Play is not intercepted',()=>{
  const x=runtime({current:{id:'active-1'}});
  assert.equal(x.fire().prevented,false);
});
test('Play waits for an existing session and client programs',async()=>{
  const x=runtime({user:null,settled:false,ready:false});
  assert.equal(x.fire().prevented,true);
  x.w.cloud.user={id:'client-late'};
  x.w.cloud.initSettled=true;
  x.dispatch('unvrsl:cloud-ready');
  x.w.__unvrslClientRuntimeUserIdV519='client-late';
  x.dispatch('unvrsl:client-ready');
  await x.w.unvrslClientStartV519();
  assert.equal(x.values().picker,1);
  assert.equal(x.values().signIn,0);
});
test('Play offers login only after missing session is settled',async()=>{
  const x=runtime({user:null,settled:true,ready:false});
  x.fire();
  await x.w.unvrslClientStartV519();
  assert.equal(x.values().signIn,1);
});
test('iOS keyboard and client assignment failure show usable recovery controls',()=>{
  assert.match(read('mobile-final-fix.js'),/body:has\(input:focus\) \.nav/);
  assert.match(read('mobile-final-fix.js'),/font-size:16px!important/);
  assert.match(read('client-program-picker.js'),/unvrslRetryClientAssignmentsV519/);
  assert.match(read('client-final-runtime.js'),/unvrsl:auth-changed/);
});
