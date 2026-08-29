'use strict';
(()=>{
 if(window.__unvrslExerciseCleanupV2)return;window.__unvrslExerciseCleanupV2=true;
 const norm=s=>String(s||'').toLowerCase().replace(/[()]/g,' ').replace(/[_–—-]+/g,' ').replace(/\s+/g,' ').trim();
 const weird=/(reverse hyper|neck|wrist|finger|toe|rotary calf|donkey calf|sissy|jefferson|zercher|hack squat reverse|reverse hack|t.?bar reverse|vertical row|vertical traction|rotary|dip machine|seated dip|assisted dip machine|lever seated dip|lever reverse|power clean|clean and jerk|snatch|muscle.?up|handstand|planche|human flag|iron cross|dragon flag|archer|typewriter|commando|pistol squat|burpee|bear crawl|crab walk|frog|windmill|kneeling jump|plyometric|bosu|swiss ball|stability ball|exercise ball|suspension|trx|stretch|mobility|warm.?up|cool.?down|yoga|pilates|foam roll|massage)/i;
 const cardioMachine=/(treadmill|stationary bike|exercise bike|air bike|assault bike|rower|rowing machine|ski.?erg|elliptical|cross trainer|stair.?master|stair climber|stepper)/i;
 const cardioNotMachine=/(jump rope|skipping|running outside|walking outside|jogging|swimming|boxing|shadow boxing|battle rope|mountain climber|jumping jack|high knees)/i;
 const exact={
  'lever seated reverse fly':'Обратная бабочка в тренажёре',
  'lever reverse fly':'Обратная бабочка в тренажёре',
  'lever seated fly':'Сведение рук в тренажёре',
  'lever chest press':'Жим от груди в тренажёре',
  'lever seated chest press':'Жим от груди сидя в тренажёре',
  'lever shoulder press':'Жим на плечи в тренажёре',
  'lever seated shoulder press':'Жим на плечи сидя в тренажёре',
  'lever seated row':'Горизонтальная тяга в тренажёре',
  'lever high row':'Тяга сверху в тренажёре',
  'lever lat pulldown':'Тяга верхнего блока в тренажёре',
  'lever leg extension':'Разгибание ног в тренажёре',
  'lever seated leg curl':'Сгибание ног сидя в тренажёре',
  'lever lying leg curl':'Сгибание ног лёжа в тренажёре',
  'lever leg press':'Жим ногами в тренажёре',
  'lever seated calf raise':'Подъём на носки сидя в тренажёре',
  'lever standing calf raise':'Подъём на носки стоя в тренажёре',
  'lever hip abduction':'Разведение ног в тренажёре',
  'lever hip adduction':'Сведение ног в тренажёре',
  'lever preacher curl':'Сгибание рук на скамье Скотта в тренажёре',
  'lever triceps extension':'Разгибание рук на трицепс в тренажёре'
 };
 function machineTitle(raw){const s=norm(raw);if(exact[s])return exact[s];if(!/(lever|machine)/.test(s))return'';
  if(/reverse fly|rear delt/.test(s))return'Обратная бабочка в тренажёре';
  if(/fly|pec deck|butterfly/.test(s))return'Сведение рук в тренажёре';
  if(/chest press|bench press/.test(s))return /incline/.test(s)?'Жим от груди в наклонном тренажёре':'Жим от груди в тренажёре';
  if(/shoulder press|overhead press/.test(s))return'Жим на плечи в тренажёре';
  if(/high row/.test(s))return'Тяга сверху в тренажёре';
  if(/seated row|low row|horizontal row/.test(s))return'Горизонтальная тяга в тренажёре';
  if(/lat pulldown|pulldown/.test(s))return'Тяга сверху в тренажёре';
  if(/leg extension/.test(s))return'Разгибание ног в тренажёре';
  if(/leg curl/.test(s))return /lying/.test(s)?'Сгибание ног лёжа в тренажёре':'Сгибание ног сидя в тренажёре';
  if(/leg press/.test(s))return'Жим ногами в тренажёре';
  if(/hack squat/.test(s))return'Гакк-присед в тренажёре';
  if(/hip thrust/.test(s))return'Ягодичный мост в тренажёре';
  if(/hip abduction|abductor/.test(s))return'Разведение ног в тренажёре';
  if(/hip adduction|adductor/.test(s))return'Сведение ног в тренажёре';
  if(/calf raise/.test(s))return /seated/.test(s)?'Подъём на носки сидя в тренажёре':'Подъём на носки стоя в тренажёре';
  if(/preacher curl/.test(s))return'Сгибание рук на скамье Скотта в тренажёре';
  if(/biceps curl|curl/.test(s))return'Сгибание рук на бицепс в тренажёре';
  if(/triceps extension/.test(s))return'Разгибание рук на трицепс в тренажёре';
  return'';
 }
 function sensible(e){const s=norm(e?.n||e?.name);if(!s||weird.test(s))return false;const eq=norm(e?.eq||e?.equipment);if(eq==='cardio'||String(e?.bp||'').toLowerCase()==='cardio')return cardioMachine.test(s)&&!cardioNotMachine.test(s);return true}
 const previous=window.UNVRSL_FINAL_EXERCISES;
 if(typeof previous==='function')window.UNVRSL_FINAL_EXERCISES=function(){return (previous()||[]).filter(sensible)};
 const oldRu=window.ruExerciseName;
 function translated(raw){const m=machineTitle(raw);if(m)return m;return typeof oldRu==='function'?oldRu(raw):String(raw||'')}
 translated.__cleanupV2=true;window.ruExerciseName=translated;try{ruExerciseName=translated}catch(_){}
 window.UNVRSL_CLEAN_TITLE=function(e){return machineTitle(e?.n||e?.name)||translated(e?.n||e?.name||'')};
 window.UNVRSL_CARDIO_MACHINE_ONLY=e=>{const s=norm(e?.n||e?.name);return cardioMachine.test(s)&&!cardioNotMachine.test(s)};
})();