'use strict';
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root){
    root.unvrslProgramWeightProfileV257=api.programWeightProfile;
    root.unvrslProgramWeightLabelV257=api.programWeightLabel;
  }
})(typeof window!=='undefined'?window:null,function(){
  const positive=value=>{const n=Number(value);return Number.isFinite(n)&&n>0?n:0};
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
    if(Array.isArray(exercise.sets)&&exercise.sets.length)return exercise.sets.map(set=>positive(set?.w));
    if(Array.isArray(exercise.set)&&exercise.set.length)return exercise.set.map(set=>positive(set?.w));
    const count=Math.max(1,Number(exercise.s)||1);
    return Array.from({length:count},()=>positive(exercise.w))
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
