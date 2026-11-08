'use strict';
const assert=require('node:assert/strict');
const {make,wait,errors}=require('./runtime-v392.cjs');
(async()=>{const dom=make();await wait(3000);const w=dom.window;
try{
 const result=await w.eval(`(async()=>{
  const ex={n:'Жим штанги лёжа',loadType:'external_total',method:'STANDARD',programWeightMode:'adaptive',set:Array.from({length:3},()=>({w:'',programW:0,assignedW:0,weightMode:'auto',r:'',rpe:'',rir:'',ok:false,targetRepMin:8,targetRepMax:12,targetRpeMin:7,targetRpeMax:8}))};
  st.current={id:'stable-dom',started:Date.now(),date:iso(),w:1,c:'Stability',trainingReadinessDone:true,trainingEngineRevision:297,ex:[ex]};
  st.sessions=[];save();nav('start');await trainingEngine200Tick();await trainingLoadModel292.whenIdle();
  const input=document.querySelector('#start .setrow input');
  st.sessions=[{id:'evidence',started:Date.now()-86400000,ended:Date.now()-80000000,date:'2026-10-01',ex:[{...ex,set:Array.from({length:3},()=>({w:60,r:12,rpe:8,rir:2,ok:true}))}]}];
  ex.set.forEach(x=>{x.w='';x.autoInitialApplied=false;x.weightSource='auto';});
  await trainingLoadModel292.schedule();await trainingEngine200Tick();
  return {mounted:input.isConnected,state:ex.set[0].w,display:input.value};
 })()`);
 assert.equal(result.mounted,true,'automatic weight calculation must not replace workout rows');assert.ok(result.state>0);assert.equal(Number(result.display.replace(',','.')),result.state);
 assert.deepEqual(errors,[]);console.log('PASS mounted workout rows and formatted weights after automatic recalculation');
}finally{dom.window.close()}})().catch(e=>{console.error(e);process.exitCode=1});
