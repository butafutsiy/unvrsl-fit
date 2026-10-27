'use strict';
// Explicit repair utility. Does not seed or modify unrelated accounts/plans.
const Domain=require('../workout-domain.js');
const {prepareProgramWeights}=require('../program-weight-choice.js');
const clone=x=>JSON.parse(JSON.stringify(x));
const special=e=>['UNVRSL','SLDR','DS','FST-7'].includes(e.method);
function repair(program,{specialSets=true,autoWeight=false}={}){
 const p=clone(program);
 function exercise(e,profile){
  if(e.kind==='cardio'||e.workMode==='timer')return;
  const original=e.cycleOriginalMethod||e.method||'STANDARD';
  if(specialSets&&['UNVRSL','SLDR','DS','FST-7'].includes(original)){
   if(e.method!==original){
    if(!e.cycleOriginalSets?.length)throw Error('Missing authored method sets: '+e.n);
    const weights=(e.sets||[]).map(s=>s.w);
    e.sets=clone(e.cycleOriginalSets);
    // An ordinary deload set represented one full SLDR round, not one mini-set.
    e.sets.forEach((s,i)=>{s.w=weights[original==='SLDR'?Math.floor(i/3):0]??weights[0]??s.w;});
   }
   e.method=original;e.cycleOriginalMethod=original;e.cycleOriginalSets=clone(e.sets);
   e.preserveMethodOnDeload=true;e.cycleManaged=false;e.reps={mode:'method',min:null,max:null};
   for(const s of e.sets)for(const k of ['targetRepMin','targetRepMax','targetRepLabel','targetRpeMin','targetRpeMax','targetRirMin','targetRirMax','allowFailure'])delete s[k];
   if(original==='FST-7')e.sets.forEach((s,i)=>{s.label=`${i+1}/7`;s.rest=i===6?e.rest:30;});
   if(original==='SLDR')e.sets.forEach((s,i)=>{s.label=`Круг ${Math.floor(i/3)+1} · ${i%3+1}/3`;});
  }else if(!specialSets){
   if(special(e)||original!=='STANDARD'){
    const spec=profile[Domain.exerciseKind(e)],rests=Domain.exerciseKind(e)==='isolation'?profile.isoRest:profile.baseRest;
    e.rest=(rests[0]+rests[1])/2;e.tempo=profile.tempo;e.rpe=(spec.rpe[0]+spec.rpe[1])/2;
    e.sets=Array.from({length:spec.sets},(_,i)=>({w:e.sets?.[i]?.w??e.sets?.[0]?.w??0,r:spec.reps[0],rest:e.rest,targetRepMin:spec.reps[0],targetRepMax:spec.reps[1],targetRpeMin:spec.rpe[0],targetRpeMax:spec.rpe[1],allowFailure:false}));
    e.note=(e.note||'').replace(/(?:UNVRSL|SLDR|FST-7|\bDS\b)[^.]*\.?/gi,'').trim();
    e.reps={mode:'auto',min:null,max:null};e.cycleManaged=true;e.weeklySets=spec.sets;
   }
   e.method='STANDARD';e.cycleOriginalMethod='STANDARD';e.cycleOriginalSets=clone(e.sets||[]);
   delete e.preserveMethodOnDeload;
  }
  if(e.parameterOverrides)delete e.parameterOverrides.reps;
  delete e.displayPrescription;delete e.repLabel;
 }
 p.weeks.forEach((w,wi)=>{
  const profile=w.weeklyLoadProfile||Domain.cycleProfiles(p.weeks.length)[wi];
  w.days.forEach(d=>d.ex.forEach(e=>exercise(e,profile)));
  (p.cycleWeekSources?.[wi]||[]).forEach(e=>exercise(e,profile));
 });
 (p.cycleSources||[]).forEach(e=>exercise(e,p.weeks[0].weeklyLoadProfile||Domain.cycleProfiles(p.weeks.length)[0]));
 p.specialSetsMode=specialSets?'authored':'none';
 const result=autoWeight?prepareProgramWeights(p,'auto'):p;
 result.updated=result.updatedAt=Date.now();
 return result;
}
module.exports={repair};
