'use strict';
const assert=require('node:assert/strict');
const {make,wait,errors}=require('./runtime-v392.cjs');
(async()=>{
 const dom=make();await wait(2800);const w=dom.window;w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;
 try{
 const result=await w.eval(`(async()=>{
  st.current=null;
  const source=ensureProgramShape({id:'delivery-source',name:'Проверка отправки',weeks:[{n:1,intensityMin:70,intensityMax:75,useIntensity:true,days:[{id:'source-day',name:'Спина',ex:[{id:'source-row',n:'Тяга верхнего блока',method:'STANDARD',kind:'compound',weightMode:'manual',parameterOverrides:{weight:{mode:'manual',value:81}},sets:[{w:81,r:10,rest:90},{w:81,r:10,rest:90}]}]}]}]});
  st.programs.push(source);
  duplicateProgram(source.id);
  const choice=document.querySelector('#sheet').textContent;
  applyProgramWeightChoice('auto');
  const copied=st.programs.at(-1),block=copied.weeks[0].days[0].ex[0];
  const blankBefore=block.sets.every(s=>s.w==='');
  const originalWeight=source.weeks[0].days[0].ex[0].sets[0].w;
  closeModal();beginProgramDay(copied.id,0,0);await trainingConfirmReadiness200(false);await new Promise(r=>setTimeout(r,160));
  const active=st.current,ex=active.ex[0];
  const autoMode=ex.programWeightMode;
  const noSourceWeight=ex.set.every(s=>s.w!==81&&s.programW!==81&&s.plannedW!==81);
  equipmentOpen405(encodeURIComponent(workoutRegistry.identity(ex)+'@0'));
  const equipmentCopy=document.getElementById('sheet').textContent;
  st.current=null;closeModal();
  cloneBuiltInCycle();applyProgramWeightChoice('auto');
  const builtInBlank=st.programs.at(-1).weeks.every(w=>w.days.every(d=>d.ex.every(e=>(e.sets||[]).every(s=>s.w===''))));
  window.cloudConfigured=()=>false;
  let shared=null;Object.defineProperty(navigator,'share',{configurable:true,value:async payload=>{shared=payload}});
  await shareProgram(source.id);await applyProgramWeightChoice('auto');
  const payload=await decodeSharedPayload(shared.url.split('#plan=')[1]);
  const sentBlank=payload.program.weeks[0].days[0].ex[0].sets.every(s=>s.w==='');
  await shareProgram(source.id);await applyProgramWeightChoice('keep');
  const keep=await decodeSharedPayload(shared.url.split('#plan=')[1]);
  renderWorkoutSummary({id:'long',started:1000000000000,ended:1000019931000,ex:[]});
  const time=[...document.querySelectorAll('.wc392-grid b')][0]?.textContent;
  return {builtInBlank,choice,blankBefore,originalWeight,autoMode,noSourceWeight,equipmentCopy,sentBlank,kept:keep.program.weeks[0].days[0].ex[0].sets[0].w,time};
 })()`);
 assert.equal(result.builtInBlank,true);assert.match(result.choice,/Сохранить веса/);assert.match(result.choice,/Автовес/);assert.equal(result.blankBefore,true);assert.equal(result.originalWeight,81);assert.equal(result.autoMode,'adaptive');assert.equal(result.noSourceWeight,true);
 assert.doesNotMatch(result.equipmentCopy,/Leg Extension/);assert.equal(result.sentBlank,true);assert.equal(result.kept,81);assert.equal(result.time,'5:32:11');assert.deepEqual(errors,[]);
 console.log('PASS: real app copy choice, auto launch, equipment scope, share keep/auto, source preservation and long summary duration.');
 }finally{dom.window.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
