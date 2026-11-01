'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const A=require('../workout-domain.js');
function fixture(){
 const set=()=>({w:0,programW:0,targetRepMin:8,targetRepMax:10,targetRpeMin:7,targetRpeMax:8,ok:false});
 const ex={exerciseId:'bench',n:'Жим штанги лёжа',programWeightMode:'adaptive',equipmentProfile:{weightStep:2.5},set:[set(),set(),set(),set()]};
 const state={current:{id:'now',date:'2026-10-08',programWeekIntensityMin:70,programWeekIntensityMax:75,ex:[ex]},
  sessions:[{id:'old',date:'2026-10-02',ended:1,ex:[{...ex,set:Array.from({length:3},()=>({w:135,r:3,rpe:9,ok:true}))}]}]};
 const c={st:state,WorkoutDomain:A,workoutRegistry:A.registry([{id:'bench',n:ex.n,type:'compound',loadType:'external_total'}]),save(){},addEventListener(){}};
 c.window=c;vm.createContext(c);vm.runInContext(fs.readFileSync('training-load-model.js','utf8'),c);return c;
}
test('auto fills all zero weights with the canonical 110 kg and remains stable after recompute and reload',()=>{
 const c=fixture();c.trainingLoadModel292.run();
 for(const s of c.st.current.ex[0].set){assert.equal(s.w,110);assert.equal(s.plannedW,110);assert.equal(s.programW,0);assert.equal(s.weightSource,'auto')}
 c.st.current=JSON.parse(JSON.stringify(c.st.current));
 for(let i=0;i<5;i++)c.trainingLoadModel292.run();
 assert.deepEqual(c.st.current.ex[0].set.map(s=>s.w),[110,110,110,110]);
});
test('auto protects completed, skipped, manual and dismissed weights',()=>{
 const c=fixture(),sets=c.st.current.ex[0].set;
 Object.assign(sets[0],{w:95,r:8,rpe:8,ok:true});Object.assign(sets[1],{w:97.5,skipped:true});
 Object.assign(sets[2],{w:100,manualOverride:true,weightSource:'manual'});sets[3].dismissedRecommendation='previous';
 c.trainingLoadModel292.run();assert.deepEqual(sets.map(s=>s.w),[95,97.5,100,0]);
});
test('prescribed loads and auto without reliable history stay unchanged',()=>{
 const c=fixture();c.st.current.ex[0].programWeightMode='prescribed';c.st.current.ex[0].set.forEach(s=>s.w=120);
 c.trainingLoadModel292.run();assert.ok(c.st.current.ex[0].set.every(s=>s.w===120));
 c.st.sessions=[];c.st.current.ex[0].programWeightMode='adaptive';c.st.current.ex[0].equipmentProfile={availableLoads:[20,35,50]};c.st.current.ex[0].set.forEach(s=>{s.w='';s.plannedW=''});
 c.trainingLoadModel292.run();assert.ok(c.st.current.ex[0].set.every(s=>s.w===''));
});


test('already-open W8 replaces stale untouched auto weights once without changing manual/completed',()=>{
 const c=fixture(),ex=c.st.current.ex[0];
 c.st.current.w=8;c.st.current.testWeek=true;c.st.current.programWeekIntensityMin=90;c.st.current.programWeekIntensityMax=100;
 c.st.sessions=[{id:'old',date:'2026-10-02',ended:1,ex:[{...ex,set:[{w:120,r:8,actualReps:8,actualRpe:9,ok:true},{w:120,r:8,actualReps:8,actualRpe:9,ok:true},{w:120,r:8,actualReps:8,actualRpe:9,ok:true},{w:120,ok:false}]}]}];
 ex.set=[
  {w:120,weightMode:'auto',weightSource:'auto',autoInitialApplied:true,programW:0,targetRepMin:2,targetRepMax:3,targetRpeMin:9,targetRpeMax:9.5},
  {w:120,weightMode:'auto',weightSource:'auto',autoInitialApplied:true,programW:0,targetRepMin:2,targetRepMax:3,targetRpeMin:9,targetRpeMax:9.5},
  {w:147.5,weightMode:'auto',weightSource:'auto',autoInitialApplied:true,role:'test_attempt',attemptNumber:1,plannedReps:1,programW:0,targetRepMin:1,targetRepMax:1,targetRpeMin:9.5,targetRpeMax:10},
  {w:125,weightMode:'auto',weightSource:'manual',manualOverride:true,programW:0,targetRepMin:2,targetRepMax:3,targetRpeMin:9,targetRpeMax:9.5}
 ];
 c.trainingLoadModel292.run();
 const after=ex.set.map(s=>s.w);
 assert.ok(after[0]>120&&after[1]>after[0],JSON.stringify(after));
 assert.equal(ex.set[0].peakAutoRevision,575);
 assert.equal(ex.set[1].peakAutoRevision,575);
 assert.equal(after[2],147.5);
 assert.equal(after[3],125);
 for(let i=0;i<3;i++)c.trainingLoadModel292.run();
 assert.deepEqual(ex.set.map(s=>s.w),after,'once upgraded, pending loads stay stable');
});
