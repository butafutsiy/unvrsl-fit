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
