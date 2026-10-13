'use strict';
const assert=require('node:assert/strict');
const {make,wait,errors}=require('./runtime-v392.cjs');
(async()=>{
 const dom=make();await wait(2400);const W=dom.window;
 try{
  const result=await W.eval(`(async()=>{
   const examples=['Жим гантелей сидя','Сведение рук в кроссовере','Жим штанги лёжа'];
   const plan=examples.map(n=>prescriptionText({n,method:'STANDARD',sets:[{w:25,r:10}]},null,null));
   const methods=['UNVRSL','DS','SLDR','FST-7'].map(method=>prescriptionText({n:examples[0],method,sets:[{w:25,r:8,role:'heavy'},{w:20,r:10,role:'light'}]},null,null));
   const e={n:examples[0],method:'STANDARD',programWeightMode:'prescribed',set:[{w:25,r:10,ok:false,manualOverride:true,weightSource:'manual'}]};
   st.current={id:'pair-ui',w:1,c:'A',name:'Парный вес',started:Date.now(),ex:[e]};
   const mount=document.createElement('div');document.body.appendChild(mount);mount.innerHTML=workoutWeightInput(e,e.set[0],0,0);
   const input=mount.querySelector('input'),shown=input.value,before=JSON.stringify(e);
   input.focus();const focused=input.value;input.blur();const unchanged=JSON.stringify(e)===before;
   input.focus();input.value='27,5';input.dispatchEvent(new Event('change',{bubbles:true}));input.blur();
   const edited={shown:input.value,w:e.set[0].w,r:e.set[0].r};
   input.focus();input.value='30 / 30';input.dispatchEvent(new Event('change',{bubbles:true}));input.blur();
   const pasted={shown:input.value,w:e.set[0].w};
   input.focus();input.value='30 / 40';input.dispatchEvent(new Event('change',{bubbles:true}));input.blur();
   const unequal={shown:input.value,w:e.set[0].w};
   const total=WorkoutDomain.tonnage({ex:[{...e,set:[{...e.set[0],ok:true}]}]},workoutRegistry);
   const one=workoutWeightInput({n:'Тяга гантели одной рукой',loadType:'per_dumbbell',implementCount:1},{w:25},0,0);
   st.current=null;mount.remove();await new Promise(resolve=>setTimeout(resolve,100));return {plan,methods,shown,focused,unchanged,edited,pasted,unequal,total,one};
  })()`);
  assert.ok(result.plan[0].includes('25 / 25 кг'));assert.ok(result.plan[1].includes('25 / 25 кг'));assert.ok(!result.plan[2].includes('25 / 25'));
  result.methods.forEach(text=>assert.ok(text.includes('25 / 25')));
  assert.equal(result.shown,'25 / 25');assert.equal(result.focused,'25');assert.equal(result.unchanged,true);
  assert.equal(result.edited.shown,'27,5 / 27,5');assert.equal(result.edited.w,27.5);assert.equal(result.edited.r,10);
  assert.equal(result.pasted.shown,'30 / 30');assert.equal(result.pasted.w,30);assert.equal(result.unequal.w,30);assert.equal(result.total,600);
  assert.ok(!result.one.includes('paired-load-input'));assert.equal(errors.length,0,errors.join('\n'));
  console.log('PASS: paired plan weights in standard/UNVRSL/drop/SLDR/FST-7 prescriptions, numeric editing, unchanged focus, equal pair paste, rejected unequal pair, single-hand exceptions and unchanged tonnage units.');
 }finally{dom.window.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
