'use strict';
const assert=require('node:assert/strict');
const {make,wait,errors}=require('./runtime-v392.cjs');
const plain=x=>JSON.parse(JSON.stringify(x));
function trackedRuntime(seed){
 const dom=make(seed),Observer=dom.window.MutationObserver,observers=[];
 dom.window.MutationObserver=class extends Observer{constructor(callback){super(callback);observers.push(this);}};
 const close=dom.window.close.bind(dom.window);dom.window.close=()=>{observers.forEach(observer=>observer.disconnect());close();};
 return dom;
}
(async()=>{
 let dom=trackedRuntime();await wait(2200);
 try{
  console.log('Initial runtime ready');
  const legacy=await dom.window.eval(`(async()=>{
   const p=buildBuiltinEngineCycle('2026-10-11','strength',true,10);st.programs.push(p);
   p.weeks[8].days[0].ex.find(e=>e.kind==='compound').sets[0].w=182.5;
   programBeginDayCoreV382(p.id,8,0);await unvrslTrainingPrescriptionSyncV292(true);
   const history=JSON.stringify(st.sessions),current=JSON.stringify(st.current),oldDayId=p.weeks[8].days[0].id;

   p.engineCycleRevision=501;const savedState=JSON.stringify(st),primary=WorkoutStore.PRIMARY;
   const changed=upgradeBuiltinEngineCycleV502(p),twice=upgradeBuiltinEngineCycleV502(p);
   return {primary,savedState,id:p.id,oldDayId,changed,twice,historyPreserved:JSON.stringify(st.sessions)===history,currentPreserved:JSON.stringify(st.current)===current,
    count:st.programs.filter(x=>x.id===p.id).length,length:p.weeks.length,weight:p.weeks[6].days[0].ex.find(e=>e.kind==='compound'||e.kind==='base').sets[0].w,
    dayId:p.weeks[6].days[0].id,backup:p.previousCycle.weeks.length};
  })()`);
  console.log('Legacy migration done');
  assert.ok(legacy.changed&&!legacy.twice&&legacy.historyPreserved&&legacy.currentPreserved);
  assert.equal(legacy.count,1);assert.equal(legacy.length,8);assert.equal(legacy.weight,182.5);assert.equal(legacy.dayId,legacy.oldDayId);assert.equal(legacy.backup,10);
  dom.window.eval('if(st.current)workoutStore.discard(st)');await wait(150);
  dom.window.close();dom=trackedRuntime({[legacy.primary]:legacy.savedState});await wait(2600);
  console.log('Reload ready');dom.window.__cycleAuditProgress=n=>console.log('Week '+n);
  const result=await dom.window.eval(`(async()=>{
   const p=programById(${JSON.stringify(legacy.id)}),migrated=p.weeks.length;
   const retainedCurrent=st.current?.w===9&&st.current?.weeklyLoadProfile?.phase==='strength';
   if(st.current)workoutStore.discard(st);
   const ordinary=st.programs.find(x=>!x.builtinEngineTemplate);const stale=ordinary?.id||p.id;
   programUi={pid:stale,week:0,day:0,query:''};
   previewPrimaryProgramDay(p.id,6,0);
   const preview=[...document.querySelectorAll('#sheet .program-ex')].map(row=>({name:row.querySelector('b').textContent,text:row.querySelector('.muted').textContent}));
   const audit=[];
   for(let wi=0;wi<8;wi++)for(let di=0;di<5;di++){
    if(di===0)__cycleAuditProgress(wi+1);
    if(st.current)workoutStore.discard(st);
    programBeginDayCoreV382(p.id,wi,di);await unvrslTrainingPrescriptionSyncV292(true);
    const live=st.current;
    if(!live||live.programId!==p.id)throw Error('Launch failed W'+(wi+1)+' D'+di);
    audit.push({wi,di,test:p.weeks[wi].testWeek,profile:p.weeks[wi].weeklyLoadProfile,
     exercises:live.ex.map(e=>({kind:e.kind,method:e.method,mode:e.mode,intensity:[e.targetIntensityMin,e.targetIntensityMax],
      sets:e.set.map(s=>({role:s.role,reps:[s.targetRepMin,s.targetRepMax],label:s.targetRepLabel,rpe:[s.targetRpeMin,s.targetRpeMax],seconds:s.workSeconds}))}))});
   }
   if(st.current)workoutStore.discard(st);
   // The actual editor uses the same W9 defaults as the day preview.
   openProgramEditor(p.id,6);const constructorText=document.getElementById('sheet').textContent;
   const base=p.weeks[6].days[0].ex.find(e=>e.kind==='base'||e.kind==='compound');
   base.reps={mode:'manual',min:7,max:9};base.parameterOverrides.effort={mode:'manual',rpeMin:6,rpeMax:7};
   beginProgramDay(p.id,6,0);await trainingConfirmReadiness200(false);await unvrslTrainingPrescriptionSyncV292(true);
   const edited=st.current.ex.find(e=>e.exerciseId===base.exerciseId);
   const manual={reps:[edited.set[0].targetRepMin,edited.set[0].targetRepMax],rpe:[edited.set[0].targetRpeMin,edited.set[0].targetRpeMax]};
   if(st.current)workoutStore.discard(st);
   newProgramSheet();const choices=[...document.getElementById('npWeeks').options].map(x=>x.value);
   document.getElementById('npName').value='Ten-week constructor audit';document.getElementById('npWeeks').value='10';document.getElementById('npDays').value='5';createProgram();
   const custom=st.programs.find(x=>x.name==='Ten-week constructor audit');
   custom.weeks[0].days[0].ex=[{id:'audit-base',n:'Присед со штангой',kind:'compound',method:'STANDARD',sets:[{w:100,r:10}],reps:{mode:'auto'},parameterOverrides:{effort:{mode:'auto'}}},
    {id:'audit-iso',n:'Разгибание ног',kind:'isolation',method:'STANDARD',sets:[{w:40,r:12}],reps:{mode:'auto'},parameterOverrides:{effort:{mode:'auto'}}}];
   cycleBuildFromFirstWeek(custom.id);
   const constructorProfiles=custom.weeks.map(w=>({base:w.weeklyLoadProfile.base,iso:w.weeklyLoadProfile.isolation}));
   // Resizing an existing cycle must use the visible length, not stale options.
   custom.weeks.push({n:11,days:custom.weeks[0].days.map(d=>({id:uid('day'),name:d.name,ex:[]}))});
   cycleBuildFromFirstWeek(custom.id);const resized=custom.weeks.length;
   return {migrated,retainedCurrent,preview,audit,constructorText,manual,choices,constructorProfiles,resized,
    phases:p.weeks.map(w=>w.phase),name:p.name,duplicates:st.programs.filter(x=>x.id===p.id).length,
    uniqueDays:new Set(p.weeks.flatMap(w=>w.days.map(d=>d.id))).size};
  })()`);
  assert.equal(result.migrated,8);assert.ok(result.retainedCurrent);assert.equal(result.duplicates,1);assert.equal(result.uniqueDays,40);
  assert.match(result.name,/8-недельный/);
  const preview=plain(result.preview),squat=preview.find(x=>/high-bar/.test(x.name)),isolation=preview.find(x=>/Разгибание ног/.test(x.name)),cardio=preview.find(x=>/Аэробайк/.test(x.name));
  assert.match(squat.text,/3×3–5/);assert.match(squat.text,/88–90%/);assert.match(squat.text,/RPE 8,5–9,5/);
  assert.match(isolation.text,/4×15–20/);assert.match(isolation.text,/60–65%/);assert.match(isolation.text,/RPE 7–8/);
  for(const row of preview)assert.equal((row.text.match(/RPE/g)||[]).length,1,'one effort prescription per exercise');
  assert.doesNotMatch(cardio.text,/темп|кг|%/);assert.match(cardio.text,/RPE 5/);
  for(const row of plain(result.audit))for(const e of row.exercises){
   if(e.mode==='timer'){for(const set of e.sets){assert.ok(set.seconds>0);assert.equal(set.reps[0],null);assert.equal(set.rpe[0],null);}continue;}
   const spec=row.profile[e.kind==='isolation'?'isolation':'base'];
   assert.deepEqual(e.intensity,spec.pct,'separate load corridors');
   if(e.method!=='STANDARD')continue;
   for(const set of e.sets){
    const reps=row.test?(set.role==='test_attempt'?[1,1]:[2,3]):spec.reps;
    assert.deepEqual(set.reps,reps,'per-set reps survive every launch wrapper');
    assert.equal(set.label,reps[0]===reps[1]?String(reps[0]):reps.join('–'));
    assert.deepEqual(set.rpe,row.test&&set.role==='test_attempt'?[9.5,10]:spec.rpe);
   }
  }
  assert.match(result.constructorText,/3×3–5/);assert.match(result.constructorText,/4×15–20/);
  assert.deepEqual(plain(result.manual),{reps:[7,9],rpe:[6,7]});
  assert.deepEqual(Array.from(result.choices),['4','6','8','10','12','manual']);assert.equal(result.resized,11);
  assert.deepEqual(Array.from(result.phases),['volume','work','intensification','deload','heavy','recovery','strength','test']);
  assert.equal(result.constructorProfiles.length,10);
  assert.deepEqual(errors,[]);
  console.log('Eight-week migration: persisted migration, no duplicates, edited kg, active snapshot, all 40 launches, contextual preview, cardio, test single, manual overrides and constructor resizing passed');
 }finally{dom.window.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
