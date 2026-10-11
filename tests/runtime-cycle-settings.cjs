'use strict';
const assert=require('node:assert/strict');
const {make,wait,errors}=require('./runtime-v392.cjs');
const plain=x=>JSON.parse(JSON.stringify(x));
(async()=>{
 const dom=make();await wait(2200);
 try{
  const w=dom.window;
  const initial=w.eval(`(()=>{
   newProgramSheet();const choices=[...document.getElementById('npWeeks').options].map(x=>x.value),hasPriority=!!document.getElementById('npPriority');
   document.getElementById('npName').value='Manual periodization';document.getElementById('npWeeks').value='manual';document.getElementById('npManualWeeks').value='7';document.getElementById('npDays').value='6';document.getElementById('npPeriodization').value='manual';cycleOptionsChanged();
   const phases=['volume','work','test','recovery','heavy','deload','strength'];document.querySelectorAll('[data-cycle-phase]').forEach((x,i)=>x.value=phases[i]);createProgram();
   const p=st.programs.find(x=>x.name==='Manual periodization');if(!p)throw Error('Manual creation failed');
   p.weeks[0].days[0].ex=[{id:'manual-bench',exerciseId:'canon:bench_press',n:'Жим лёжа',kind:'compound',method:'STANDARD',sets:[{w:80,r:10}],reps:{mode:'auto'}},{id:'manual-curl',n:'Сгибание рук',kind:'isolation',method:'STANDARD',sets:[{w:15,r:12}],reps:{mode:'auto'}}];
   cycleBuildFromFirstWeek(p.id);openProgramEditor(p.id,0);return {id:p.id,choices,hasPriority,phases:p.weeks.map(w=>w.phase),days:p.weeks.map(w=>w.days.length)};
  })()`);
  assert.deepEqual(Array.from(initial.choices),['4','6','8','10','12','manual']);assert.equal(initial.hasPriority,false);
  assert.deepEqual(Array.from(initial.phases),['volume','work','test','recovery','heavy','deload','strength']);assert.ok(initial.days.every(x=>x===6));
  await wait(200);
  const edited=w.eval(`(()=>{
   const p=programById(${JSON.stringify(initial.id)}),f=(id,value)=>document.getElementById(id).value=value;
   f('wr264IsoPctMin',70);f('wr264IsoPctMax',75);f('wr264IsoRpeMin',8);f('wr264IsoRpeMax',9);f('wr264IsoSets',5);
   f('wrg268IsoMin',10);f('wrg268IsoMax',12);const box=document.querySelector('.wrg268-box');box.dataset.manual='1';box.dataset.manualTouched='1';
   [...document.querySelectorAll('#sheet button')].find(x=>x.textContent==='Сохранить профиль недели').click();
   p.weeks[4].days[0].ex.find(e=>e.exerciseId==='canon:bench_press').sets[0].w=123.75;
   const oldId=p.weeks[4].days[0].id;cycleBuildFromFirstWeek(p.id);
   return {profile:p.weeks[0].weeklyLoadProfile,mode:p.cycleOptions.periodizationMode,phases:p.weeks.map(w=>w.phase),weight:p.weeks[4].days[0].ex.find(e=>e.exerciseId==='canon:bench_press').sets[0].w,idKept:p.weeks[4].days[0].id===oldId};
  })()`);
  assert.deepEqual(plain(edited.profile.isolation),{pct:[70,75],sets:5,reps:[10,12],rpe:[8,9],rir:[1,2]});assert.deepEqual(plain(edited.profile.base.pct),[70,75]);assert.equal(edited.mode,'manual');assert.equal(edited.weight,123.75);assert.equal(edited.idKept,true);
  const settings=w.eval(`(()=>{
   const p=programById(${JSON.stringify(initial.id)});cycleSettingsSheet(p.id);
   document.getElementById('npWeeks').value='manual';document.getElementById('npManualWeeks').value='9';document.getElementById('npDays').value='7';document.getElementById('npPeriodization').value='manual';cycleOptionsChanged(true);
   const chosen=[...document.querySelectorAll('[data-cycle-phase]')].map(x=>x.value);cycleSaveSettings(p.id);
   const result={length:p.weeks.length,days:p.weeks.map(w=>w.days.length),phases:p.weeks.map(w=>w.phase),chosen,profile:p.weeks[0].weeklyLoadProfile.isolation,weight:p.weeks[4].days[0].ex.find(e=>e.exerciseId==='canon:bench_press').sets[0].w,backup:p.previousCycle.weeks.length,options:JSON.parse(JSON.stringify(p.cycleOptions))};
   cycleUndo(p.id);result.undo=p.weeks.length;return result;
  })()`);
  assert.equal(settings.length,9);assert.ok(settings.days.every(x=>x===7));assert.deepEqual(plain(settings.phases),plain(settings.chosen));assert.deepEqual(plain(settings.profile),plain(edited.profile.isolation));assert.equal(settings.weight,123.75);assert.equal(settings.backup,7);assert.equal(settings.undo,7);assert.equal('priority' in settings.options,false);
  assert.deepEqual(errors,[]);console.log('Cycle settings: manual weeks/days/phases, independent isolation %, RPE/RIR, edited kilograms, stable IDs, resize and undo passed');
 }finally{dom.window.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
