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

(()=>{
  if(typeof window==='undefined'||window.__unvrslPlanExerciseCanonicalLoaderV330)return;
  window.__unvrslPlanExerciseCanonicalLoaderV330=true;
  const loadSync=()=>{
    if(window.__unvrslExerciseCatalogSyncV330||document.querySelector('script[data-exercise-catalog-sync-v330]'))return;
    const p=document.createElement('script');p.src='exercise-catalog-sync-v330.js?v=331';p.async=false;p.dataset.exerciseCatalogSyncV330='1';
    (document.head||document.documentElement).appendChild(p)
  };
  const load=()=>{
    if(window.__unvrslPlanExerciseCanonicalV329){loadSync();return}
    const existing=document.querySelector('script[data-plan-exercise-canonical-v329]');
    if(existing){existing.addEventListener('load',loadSync,{once:true});return}
    const s=document.createElement('script');s.src='exercise-plan-canonical-v329.js?v=329';s.async=false;s.dataset.planExerciseCanonicalV329='1';s.addEventListener('load',loadSync,{once:true});
    (document.head||document.documentElement).appendChild(s)
  };
  if(document.readyState==='complete')load();else window.addEventListener('load',load,{once:true})
})();
