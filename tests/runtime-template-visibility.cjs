'use strict';
const assert=require('node:assert/strict');
const {make,wait,errors}=require('./runtime-v392.cjs');
(async()=>{
 const dom=make(null,{trackObservers:true});await wait(2600);const w=dom.window;
 try{
  await w.unvrslWarmDeferredModulesV320?.();
  const result=await w.eval(`(async()=>{
   const p=ensureProgramShape({id:'own',name:'Моя программа',weeks:[{days:[{ex:[]}]}]});st.programs.push(p);await saveProgramAsTemplate(p.id);
   const ownId=st.programTemplates[0].id,ownCopy=JSON.stringify(st.programTemplates),programCopy=JSON.stringify(st.programs);
   templatesSheet();const initial=document.getElementById('sheet').textContent;
   await hideTemplateOption(encodeURIComponent('personal:semen-upper-lower-8'));
   const individual=document.getElementById('sheet').textContent;
   await keepOnlyPopularTemplates();const onlyPopular=document.getElementById('sheet').textContent;
   // Invalid keys cannot remove protected popular programs.
   const protectedResult=await hideTemplateOption('popular%3Astronglifts');
   hiddenTemplateOptionsSheet();const hidden=document.getElementById('sheet').textContent;
   await restoreTemplateOption('builtin%3Acycle');const restored=document.getElementById('sheet').textContent;
   const originalPersist=window.persistWorkoutState;window.persistWorkoutState=async()=>false;
   const failed=await hideTemplateOption('builtin%3Acycle');window.persistWorkoutState=originalPersist;templatesSheet();
   const afterFailure=document.getElementById('sheet').textContent;
   const template=st.programTemplates.find(t=>t.id===ownId);template.weeks[0].days[0].ex=[{id:'private-id',n:'Жим',method:'STANDARD',sets:[{w:95,assignedW:95,actualWeight:95,actualReps:10,ok:true,r:10}],rest:90}];template.history=[{id:'private-history'}];
   const countBefore=st.programs.length,first=createFromTemplate(ownId),second=createFromTemplate(ownId);await Promise.all([first,second]);
   const added=st.programs.find(p=>p.id!==ownId&&p.id!=='own'),newSet=added.weeks[0].days[0].ex[0].sets[0];
   const independent={added:st.programs.length-countBefore,id:added.id,dayId:added.weeks[0].days[0].id,originalDay:template.weeks[0].days[0].id,weight:newSet.w,actual:newSet.actualWeight,history:added.history,originalWeight:template.weeks[0].days[0].ex[0].sets[0].w};
   // A template provider loaded later also respects “only popular”.
   registerTemplateOption('female:late','Поздняя подборка');const lateHidden=templateIsHidden('female:late');
   const seed={};for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);seed[key]=localStorage.getItem(key)}
   return{initial,individual,onlyPopular,protectedResult,hidden,restored,failed,afterFailure,lateHidden,ownId,seed,independent,
    unchangedPrograms:st.programs.some(p=>JSON.stringify(p)===JSON.parse(programCopy).map(p=>JSON.stringify(p))[0]),unchangedTemplates:st.programTemplates.length===JSON.parse(ownCopy).length};
  })()`);
  assert.match(result.initial,/Верх–низ · Семён/);assert.match(result.initial,/Убрать из шаблонов/);
  assert.doesNotMatch(result.individual,/Верх–низ · Семён/);assert.match(result.individual,/Мой 8-недельный цикл/);
  assert.match(result.onlyPopular,/StrongLifts/);assert.match(result.onlyPopular,/Push \/ Pull \/ Legs/);
  assert.doesNotMatch(result.onlyPopular,/Верх–низ · Семён|Мой 8-недельный цикл|Моя программа|ДЛЯ ДЕВУШЕК/);
  assert.equal(result.protectedResult,false);assert.match(result.hidden,/Верх–низ · Семён/);assert.match(result.hidden,/Моя программа/);
  assert.match(result.restored,/Мой 8-недельный цикл/);assert.equal(result.failed,false);assert.match(result.afterFailure,/Мой 8-недельный цикл/);
  assert.equal(result.unchangedPrograms,true);assert.equal(result.unchangedTemplates,true);assert.equal(result.lateHidden,true);
  assert.equal(result.independent.added,1);assert.notEqual(result.independent.id,result.ownId);assert.notEqual(result.independent.dayId,result.independent.originalDay);assert.equal(Number(result.independent.weight),0);assert.equal(result.independent.actual,undefined);assert.equal(result.independent.history,undefined);assert.equal(result.independent.originalWeight,95);
  const restored=make(result.seed,{trackObservers:true});await wait(2600);await restored.window.unvrslWarmDeferredModulesV320?.();
  try{restored.window.templatesSheet();const text=restored.window.document.getElementById('sheet').textContent;
   assert.match(text,/Мой 8-недельный цикл/);assert.match(text,/StrongLifts/);assert.doesNotMatch(text,/Верх–низ · Семён|Моя программа/);
  }finally{restored.window.__disconnectTestObservers();restored.window.close()}
  const builtin=await w.saveProgramAsTemplate('__builtin_cycle__');assert.equal(builtin.weeks.length,8);assert.equal(builtin.sourceProgramId,'__builtin_cycle__');
  assert.deepEqual(errors,[]);console.log('Template hiding: individual controls, only popular, reversible restore, failed persistence, late providers and reload passed');
 }finally{dom.window.__disconnectTestObservers();dom.window.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
