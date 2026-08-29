'use strict';
(()=>{
 if(window.__unvrslExerciseTitleConsistencyV3)return;window.__unvrslExerciseTitleConsistencyV3=true;
 const norm=s=>String(s||'').toLowerCase().replace(/\([^)]*\)/g,' ').replace(/[_–—-]+/g,' ').replace(/\s+/g,' ').trim();
 const oldTitle=window.UNVRSL_EXERCISE_TITLE;
 function contextualTitle(e){
  const n=norm(e?.n||e?.name),eq=norm(e?.eq||e?.equipment);
  if(/concentration curl/.test(n)){
   if(/cable|rope/.test(eq))return'Концентрированное сгибание на нижнем блоке';
   if(/dumbbell/.test(eq))return'Концентрированное сгибание с гантелью';
   if(/lever|machine/.test(eq))return'Концентрированное сгибание в тренажёре';
   return'Концентрированное сгибание на бицепс';
  }
  if(/hammer curl/.test(n)){
   if(/cable|rope/.test(eq))return'Молотковые сгибания на нижнем блоке';
   if(/dumbbell/.test(eq))return'Молотковые сгибания с гантелями';
  }
  if(/preacher curl/.test(n)){
   if(/cable|rope/.test(eq))return'Сгибание рук на скамье Скотта на нижнем блоке';
   if(/dumbbell/.test(eq))return'Сгибание рук на скамье Скотта с гантелью';
   if(/ez barbell/.test(eq))return'Сгибание рук на скамье Скотта с EZ-штангой';
   if(/barbell/.test(eq))return'Сгибание рук на скамье Скотта со штангой';
   if(/lever|machine/.test(eq))return'Сгибание рук на скамье Скотта в тренажёре';
  }
  if(/biceps curl|barbell curl|dumbbell curl|cable curl/.test(n)){
   if(/cable|rope/.test(eq))return'Сгибание рук на нижнем блоке';
   if(/dumbbell/.test(eq))return'Сгибание рук с гантелями';
   if(/ez barbell/.test(eq))return'Сгибание рук с EZ-штангой';
   if(/barbell/.test(eq))return'Сгибание рук со штангой';
   if(/lever|machine/.test(eq))return'Сгибание рук в тренажёре';
  }
  return typeof oldTitle==='function'?oldTitle(e):String(e?.__ruTitle||e?.n||e?.name||'Упражнение');
 }
 window.UNVRSL_EXERCISE_TITLE=contextualTitle;
 const oldFind=window.findExercise;
 if(typeof oldFind==='function'){
  const wrappedFind=function(token){const e=oldFind.apply(this,arguments);if(e)e.__ruTitle=contextualTitle(e);return e};
  window.findExercise=wrappedFind;try{findExercise=wrappedFind}catch(_){}
 }
 const oldRender=window.renderExerciseDetail;
 if(typeof oldRender==='function'){
  const wrappedRender=function(ex){if(ex){const title=contextualTitle(ex);const copy={...ex,n:title,sourceName:ex.sourceName||ex.n,__originalName:ex.n};return oldRender.call(this,copy)}return oldRender.apply(this,arguments)};
  window.renderExerciseDetail=wrappedRender;try{renderExerciseDetail=wrappedRender}catch(_){}
 }
 const oldRecords=window.UNVRSL_EXERCISE_RECORDS;
 if(typeof oldRecords==='function')window.UNVRSL_EXERCISE_RECORDS=function(){return (oldRecords()||[]).map(e=>({...e,__ruTitle:contextualTitle(e)}))};
 if(!document.querySelector('script[data-cardio-gif-fix]')){const s=document.createElement('script');s.src='./cardio-gif-fix-v1.js';s.dataset.cardioGifFix='1';document.head.appendChild(s)}
 if(document.querySelector('#exercises.page.active')&&typeof window.exercisesPage==='function')setTimeout(()=>window.exercisesPage(),0);
})();