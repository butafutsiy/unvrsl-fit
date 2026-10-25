'use strict';
const assert=require('node:assert/strict');
const {make,wait,errors}=require('./runtime-v392.cjs');
(async()=>{
 const dom=make(null,{trackObservers:true});await wait(2600);const w=dom.window;
 try{
  const result=await w.eval(`(async()=>{
   await unvrslWarmDeferredModulesV320();
   const row=workoutRegistry.resolve('canon:high_bar_squat');
   const target={targetRepMin:8,targetRepMax:10,targetRpeMin:7,targetRpeMax:8};
   const equipment={id:'policy-rack',exerciseKey:row.id,name:'Стойка для приседа',type:'barbell',loadUnit:'TOTAL',weightStep:2.5,availableLoads:[],implementWeight:20};
   st.equipmentProfiles={...st.equipmentProfiles,[equipment.id]:equipment};
   const ex={...row,exerciseId:row.id,method:'STANDARD',programWeightMode:'prescribed',equipmentProfileId:equipment.id,equipmentProfile:equipment,set:[{...target,w:100,r:10,rpe:9.5,ok:true},{...target,w:100,r:'',rpe:'',ok:false}]};
   st.current={id:'policy-ui',name:'Policy check',date:'2026-10-25',started:Date.now(),target:8,trainingReadinessDone:true,ex:[ex]};
   st.sessions=[];nav('start');await trainingLoadModel292.run();startPage();await trainingEngine200Tick();
   const before=ex.set[1].recommendedW,fact=JSON.stringify(ex.set[0]),key=encodeURIComponent(row.id+'@0');
   equipmentEdit405(key,encodeURIComponent(equipment.id));
   const editorValue=document.getElementById('eq405PolicyH2').value;
   document.getElementById('eq405PolicyH2').value='5';equipmentSave405(key,encodeURIComponent(equipment.id));
   await trainingLoadModel292.run();const after=ex.set[1].recommendedW,stored=st.equipmentProfiles[equipment.id].correctionPolicy.response.H2;
   const next=ex.set[1].recommendation,apply=A=>WorkoutDomain.acceptRecommendation(ex.set[1],A);const applied=apply(next),weight=ex.set[1].w;
   const restored=JSON.parse(JSON.stringify(st.current)),savedFact=JSON.stringify(ex.set[0])===fact;
   st.current=restored;await trainingLoadModel292.run();const reloaded=restored.ex[0].set[1].w;
   const autoSet=restored.ex[0].set[1];delete autoSet.recommendationDecision;delete autoSet.autoInitialApplied;autoSet.weightMode='auto';autoSet.w='';autoSet.manualOverride=false;autoSet.weightSource='auto';await trainingLoadModel292.run();const autoWeight=autoSet.w;
   if(st.current)workoutStore.discard(st);
   const pr=JSON.parse(JSON.stringify(WorkoutDomain.weekProfiles[1]));
   const p=ensureProgramShape({id:'policy-targets',name:'Inherited',weeks:[{n:1,weeklyLoadProfile:pr,days:[{id:'day',name:'Day',ex:[{id:'source',exerciseId:row.id,n:row.n,method:'STANDARD',kind:'compound',effortSourceMode:'auto',parameterOverrides:{effort:{mode:'auto'}},reps:{mode:'manual',min:8,max:10},sets:[{w:100,r:8},{w:100,r:8}]}]}]}]});
   st.programs.push(p);programBeginDayCoreV382(p.id,0,0);await unvrslTrainingPrescriptionSyncV292(true);
   unvrslRpeRangeDisplayV314.annotate(st.current);const targetSet=st.current.ex[0].set[0];
   const goals=[targetSet.targetRpeMin,targetSet.targetRpeMax],once=JSON.stringify(st.current);
   for(let i=0;i<3;i++){unvrslTrainingPrescriptionPrepareV292(st.current);unvrslRpeRangeDisplayV314.annotate(st.current);}
   const stable=JSON.stringify(st.current)===once;st.current=null;
   return {before,after,editorValue,stored,applied,weight,reloaded,savedFact,goals,stable,autoWeight};
  })()`);
  assert.equal(result.before,92.5);assert.equal(Number(result.editorValue),7.5);assert.equal(result.after,95);assert.equal(result.stored,5);
  assert.equal(result.applied,true);assert.equal(result.weight,95);assert.equal(result.reloaded,95);assert.equal(result.savedFact,true);
  assert.deepEqual(Array.from(result.goals),[7,8]);assert.equal(result.stable,true);assert.equal(result.autoWeight,95);assert.deepEqual(errors,[]);
  console.log('Individual policy UI: machine settings, live squat correction, apply/reload, immutable facts and stable inherited goals passed');
 }finally{w.__disconnectTestObservers?.();w.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
