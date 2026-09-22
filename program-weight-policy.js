'use strict';
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root){
    root.unvrslProgramWeightProfileV257=api.programWeightProfile;
    root.unvrslProgramWeightLabelV257=api.programWeightLabel;
  }
})(typeof window!=='undefined'?window:null,function(){
  const numeric=value=>{if(value===null||value===undefined||String(value).trim()==='')return null;const n=Number(value);return Number.isFinite(n)&&n>=0?n:null};
  const cardio=exercise=>/^(cardio|time|timer)$/i.test(String(exercise?.mode||exercise?.kind||''))||String(exercise?.kind||'').toLowerCase()==='cardio';
  function programExercises(input){
    const source=input?.p?.p||input?.program||input?.p||input||{};
    if(Array.isArray(source?.weeks))return source.weeks.flatMap(week=>(week?.days||[]).flatMap(day=>day?.ex||[]));
    const routines=source?.snapshot?.routines||source?.routines;
    if(Array.isArray(routines))return routines.flatMap(routine=>routine?.e||[]);
    return[]
  }
  function exerciseLoads(exercise){
    if(!exercise||cardio(exercise))return[];
    const mode=exercise.parameterOverrides?.weight?.mode||exercise.weightMode;
    const bodyweight=/^bodyweight_|^repetitions_only$/.test(exercise.loadType||'');
    const prescribed=set=>{
      if(mode==='auto')return false;
      const n=numeric(set?.w);
      return n!==null&&(n>0||mode==='manual'||bodyweight);
    };
    if(Array.isArray(exercise.sets)&&exercise.sets.length)return exercise.sets.map(prescribed);
    if(Array.isArray(exercise.set)&&exercise.set.length)return exercise.set.map(prescribed);
    const count=Math.max(1,Number(exercise.s)||1);
    return Array.from({length:count},()=>prescribed(exercise))
  }
  function programWeightProfile(input){
    const loads=programExercises(input).flatMap(exerciseLoads),prescribed=loads.filter(Boolean).length,empty=loads.length-prescribed;
    if(!prescribed)return{group:'autoweight',mode:'autoweight',prescribed:0,empty,total:loads.length};
    return{group:'prescribed',mode:empty?'mixed':'prescribed',prescribed,empty,total:loads.length}
  }
  function programWeightLabel(input){
    const profile=programWeightProfile(input);
    if(profile.mode==='autoweight')return{...profile,badge:'Автовес',detail:'Вес рассчитывается по прошлым тренировкам'};
    if(profile.mode==='mixed')return{...profile,badge:'Вес + автовес',detail:'Заданные веса и автовес для пустых упражнений'};
    return{...profile,badge:'Заданные веса',detail:'Плановые веса и рекомендации по прогрессии'}
  }
  return{programWeightProfile,programWeightLabel}
});

// Exercise identities and verified media now load together in index.html.

