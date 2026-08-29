'use strict';
(()=>{
 if(window.__unvrslCardioGifFixV1)return;window.__unvrslCardioGifFixV1=true;
 const GIF={
  'cardio:airbike':'https://d205bpvrqc9yn1.cloudfront.net/2141.gif',
  'cardio:skierg':'https://d205bpvrqc9yn1.cloudfront.net/2142.gif',
  'cardio:rower':'https://d205bpvrqc9yn1.cloudfront.net/1161.gif',
  'cardio:treadmill':'https://d205bpvrqc9yn1.cloudfront.net/3666.gif',
  'cardio:stairmaster':'https://d205bpvrqc9yn1.cloudfront.net/2311.gif',
  'cardio:stepper':'https://d205bpvrqc9yn1.cloudfront.net/2311.gif'
 };
 const TITLES={
  'cardio:airbike':'Аэробайк',
  'cardio:skierg':'Лыжный тренажёр SkiErg',
  'cardio:rower':'Гребной тренажёр',
  'cardio:treadmill':'Беговая дорожка',
  'cardio:stairmaster':'StairMaster',
  'cardio:stepper':'Степпер'
 };
 const patch=e=>{if(!e)return e;const id=String(e.id||'');if(!GIF[id])return e;return {...e,n:TITLES[id],name:TITLES[id],__ruTitle:TITLES[id],gif:GIF[id],gif_url:GIF[id],gifUrl:GIF[id],bp:'cardio',bodyPart:'cardio',tg:'cardiovascular system',target:'cardiovascular system',eq:'cardio',kind:'cardio'};};
 const base=window.UNVRSL_EXERCISE_RECORDS;
 if(typeof base==='function')window.UNVRSL_EXERCISE_RECORDS=()=>base().map(patch);
 const oldFind=window.findExercise;
 if(typeof oldFind==='function')window.findExercise=function(token){return patch(oldFind.call(this,token));};
 const oldTitle=window.UNVRSL_EXERCISE_TITLE;
 window.UNVRSL_EXERCISE_TITLE=e=>TITLES[String(e?.id||'')]||(typeof oldTitle==='function'?oldTitle(e):String(e?.n||e?.name||''));
 const rerender=()=>{try{if(document.querySelector('#exercises.page.active')&&typeof window.exercisesPage==='function')window.exercisesPage();}catch(_){}};
 setTimeout(rerender,0);
})();
