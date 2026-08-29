'use strict';
(()=>{
 if(window.__unvrslExerciseCleanupV2)return;window.__unvrslExerciseCleanupV2=true;
 const norm=s=>String(s||'').toLowerCase().replace(/[()]/g,' ').replace(/[_–—-]+/g,' ').replace(/\s+/g,' ').trim();
 const weird=/(reverse hyper|neck|wrist|finger|toe|rotary calf|donkey calf|sissy|jefferson|zercher|hack squat reverse|reverse hack|t.?bar reverse|vertical row|vertical traction|rotary|dip machine|seated dip|assisted dip machine|lever seated dip|power clean|clean and jerk|snatch|muscle.?up|handstand|planche|human flag|iron cross|dragon flag|archer|typewriter|commando|pistol squat|burpee|bear crawl|crab walk|frog|windmill|kneeling jump|plyometric|bosu|swiss ball|stability ball|exercise ball|suspension|trx|stretch|mobility|warm.?up|cool.?down|yoga|pilates|foam roll|massage)/i;
 const cardioMachine=/(treadmill|stationary bike|exercise bike|air bike|assault bike|rower|rowing machine|ski.?erg|elliptical|cross trainer|stair.?master|stair climber|stepper)/i;
 const cardioNotMachine=/(jump rope|skipping|running outside|walking outside|jogging|swimming|boxing|shadow boxing|battle rope|mountain climber|jumping jack|high knees)/i;
 const cap=s=>s?String(s).charAt(0).toUpperCase()+String(s).slice(1):'';
 function natural(raw){const s=norm(raw);if(!s)return'';const one=/one arm|single arm/.test(s),oneLeg=/one leg|single leg/.test(s);const grip=/neutral grip/.test(s)?' нейтральным хватом':/wide grip/.test(s)?' широким хватом':/close grip|narrow grip/.test(s)?' узким хватом':/reverse grip|underhand/.test(s)?' обратным хватом':'';
  const equip=/smith/.test(s)?'в Смите':/dumbbell/.test(s)?'с гантелями':/ez barbell/.test(s)?'с EZ-штангой':/barbell|olympic barbell/.test(s)?'со штангой':/kettlebell/.test(s)?'с гирей':/cable|rope/.test(s)?'на блоке':/lever|machine/.test(s)?'в тренажёре':/band/.test(s)?'с резиной':/weighted/.test(s)?'с дополнительным весом':'';
  if(/reverse fly|rear delt/.test(s)&&/lever|machine/.test(s))return'Обратная бабочка в тренажёре';
  if(/pec deck|butterfly/.test(s)||(/fly/.test(s)&&/lever|machine/.test(s)))return'Сведение рук в тренажёре';
  if(/bench press|chest press/.test(s)){const a=/incline/.test(s)?' на наклонной скамье':/decline/.test(s)?' на скамье с отрицательным наклоном':'';if(/lever|machine/.test(s))return cap(`жим от груди в тренажёре${a}`);if(/dumbbell/.test(s))return cap(`жим гантелей${a||' лёжа'}${grip}`);if(/smith/.test(s))return cap(`жим в Смите${a||' лёжа'}${grip}`);return cap(`жим штанги${a||' лёжа'}${grip}`)}
  if(/cable fly|crossover/.test(s))return /low to high/.test(s)?'Сведение рук в кроссовере снизу вверх':/high to low/.test(s)?'Сведение рук в кроссовере сверху вниз':'Сведение рук в кроссовере';
  if(/dumbbell fly/.test(s))return /incline/.test(s)?'Разведение гантелей на наклонной скамье':'Разведение гантелей лёжа';
  if(/pull.?up/.test(s))return cap(`${/assisted/.test(s)?'подтягивания в гравитроне':/weighted/.test(s)?'подтягивания с дополнительным весом':'подтягивания'}${grip}`);
  if(/chin.?up/.test(s))return /assisted/.test(s)?'Подтягивания обратным хватом в гравитроне':'Подтягивания обратным хватом';
  if(/lat pulldown|pulldown/.test(s)&&!/straight arm/.test(s))return cap(`тяга верхнего блока${one?' одной рукой':''}${grip}`);
  if(/straight arm pulldown/.test(s))return'Тяга верхнего блока прямыми руками';
  if(/high row/.test(s)&&/lever|machine/.test(s))return'Тяга сверху в тренажёре';
  if(/seated row|low row|horizontal row/.test(s))return cap(`${/lever|machine/.test(s)?'горизонтальная тяга в тренажёре':'горизонтальная тяга нижнего блока'}${one?' одной рукой':''}${grip}`);
  if(/t.?bar row/.test(s))return /chest supported|supported/.test(s)?'Тяга Т-грифа с упором грудью':'Тяга Т-грифа';
  if(/bent over row/.test(s))return cap(`${/dumbbell/.test(s)?'тяга гантелей в наклоне':'тяга штанги в наклоне'}${grip}`);
  if(/dumbbell row|one arm row|single arm row/.test(s))return'Тяга гантели одной рукой';
  if(/pullover/.test(s))return /dumbbell/.test(s)?'Пуловер с гантелью':/cable/.test(s)?'Пуловер на верхнем блоке':'Пуловер в тренажёре';
  if(/shrug/.test(s))return cap(`шраги ${equip}`.trim());
  if(/romanian deadlift/.test(s))return cap(`румынская тяга ${equip}${oneLeg?' на одной ноге':''}`.trim());
  if(/stiff leg deadlift/.test(s))return cap(`тяга на прямых ногах ${equip}`.trim());
  if(/deadlift/.test(s))return cap(`становая тяга ${equip}`.trim());
  if(/front squat/.test(s))return cap(`фронтальный присед ${equip}`.trim());
  if(/bulgarian|split squat/.test(s))return cap(`${/bulgarian/.test(s)?'болгарский сплит-присед':'сплит-присед'} ${equip}`.trim());
  if(/hack squat/.test(s))return'Гакк-присед в тренажёре';
  if(/squat/.test(s))return cap(`приседания ${equip}`.trim());
  if(/leg press/.test(s))return oneLeg?'Жим одной ногой в тренажёре':'Жим ногами в тренажёре';
  if(/leg extension/.test(s))return oneLeg?'Разгибание одной ноги в тренажёре':'Разгибание ног в тренажёре';
  if(/leg curl/.test(s))return /lying/.test(s)?'Сгибание ног лёжа в тренажёре':/standing/.test(s)?'Сгибание ноги стоя в тренажёре':'Сгибание ног сидя в тренажёре';
  if(/hip thrust|glute bridge/.test(s))return cap(`ягодичный мост ${equip}${oneLeg?' на одной ноге':''}`.trim());
  if(/lunge/.test(s))return cap(`${/reverse|backward/.test(s)?'выпады назад':'выпады'} ${equip}`.trim());
  if(/step.?up/.test(s))return cap(`зашагивания на платформу ${equip}`.trim());
  if(/hip abduction|abductor/.test(s))return /cable/.test(s)?'Отведение ноги в сторону на блоке':'Разведение ног в тренажёре';
  if(/hip adduction|adductor/.test(s))return /cable/.test(s)?'Приведение ноги на блоке':'Сведение ног в тренажёре';
  if(/calf raise/.test(s))return cap(`${/seated/.test(s)?'подъём на носки сидя':'подъём на носки стоя'} ${equip}`.trim());
  if(/arnold press/.test(s))return'Жим Арнольда';
  if(/military press/.test(s))return cap(`${/seated/.test(s)?'армейский жим сидя':'армейский жим стоя'} ${equip}`.trim());
  if(/shoulder press|overhead press/.test(s))return /lever|machine/.test(s)?'Жим на плечи в тренажёре':cap(`${/dumbbell/.test(s)?'жим гантелей над головой':'жим над головой'} ${equip}`.trim());
  if(/lateral raise/.test(s))return /cable/.test(s)?'Отведение руки в сторону на блоке':/lever|machine/.test(s)?'Отведение рук в стороны в тренажёре':'Махи гантелями в стороны';
  if(/front raise/.test(s))return cap(`подъём перед собой ${equip}`.trim());
  if(/face pull/.test(s))return'Тяга каната к лицу';
  if(/hammer curl/.test(s))return /cable/.test(s)?'Молотковые сгибания на нижнем блоке':'Молотковые сгибания с гантелями';
  if(/preacher curl/.test(s))return cap(`сгибание рук на скамье Скотта ${equip}`.trim());
  if(/concentration curl/.test(s))return'Концентрированное сгибание с гантелью';
  if(/biceps curl|barbell curl|dumbbell curl|cable curl/.test(s))return cap(`сгибание рук ${equip}${one?' одной рукой':''}`.trim());
  if(/triceps pushdown|pushdown/.test(s))return /rope/.test(s)?'Разгибание рук на верхнем блоке с канатом':'Разгибание рук на верхнем блоке';
  if(/skull crusher|lying triceps extension/.test(s))return cap(`французский жим лёжа ${equip}`.trim());
  if(/triceps extension/.test(s))return cap(`${/overhead/.test(s)?'разгибание рук из-за головы':'разгибание рук на трицепс'} ${equip}${one?' одной рукой':''}`.trim());
  if(/push.?up/.test(s))return /knee/.test(s)?'Отжимания с колен':/close|diamond/.test(s)?'Отжимания узким хватом':/wide/.test(s)?'Отжимания широким хватом':'Отжимания';
  if(/crunch/.test(s))return /cable/.test(s)?'Скручивания на верхнем блоке':'Скручивания';
  if(/sit.?up/.test(s))return'Подъём корпуса';if(/hanging leg raise/.test(s))return'Подъём ног в висе';if(/leg raise/.test(s))return'Подъём ног';if(/hanging knee raise/.test(s))return'Подъём коленей в висе';if(/plank/.test(s))return /side/.test(s)?'Боковая планка':'Планка';if(/russian twist/.test(s))return'Русские повороты';if(/ab wheel/.test(s))return'Выкаты с роликом для пресса';return''
 }
 function sensible(e){const s=norm(e?.n||e?.name);if(!s||weird.test(s))return false;const eq=norm(e?.eq||e?.equipment);if(eq==='cardio'||String(e?.bp||'').toLowerCase()==='cardio')return cardioMachine.test(s)&&!cardioNotMachine.test(s);return !!natural(s)}
 const previous=window.UNVRSL_FINAL_EXERCISES;if(typeof previous==='function')window.UNVRSL_FINAL_EXERCISES=function(){return (previous()||[]).filter(sensible)};
 const oldRu=window.ruExerciseName;function translated(raw){const n=natural(raw);if(n)return n;return typeof oldRu==='function'?oldRu(raw):String(raw||'')}translated.__cleanupV2=true;window.ruExerciseName=translated;try{ruExerciseName=translated}catch(_){}
 window.UNVRSL_CLEAN_TITLE=e=>translated(e?.n||e?.name||'');window.UNVRSL_CARDIO_MACHINE_ONLY=e=>{const s=norm(e?.n||e?.name);return cardioMachine.test(s)&&!cardioNotMachine.test(s)};
 const originalCatalog=window.catalogRecords;
 const exerciseDbRecords=()=>{const src=Array.isArray(window.ogLibrary)?window.ogLibrary:(typeof ogLibrary!=='undefined'&&Array.isArray(ogLibrary)?ogLibrary:[]);return src.map(e=>({...e,id:String(e.id||'').startsWith('og:')?String(e.id):`og:${e.id}`,rawId:e.rawId||e.id,custom:false,anatome:false,cardioPreset:false}))};
 const catalogLocked=function(){if(document.querySelector('#exercises.page.active'))return exerciseDbRecords();return typeof originalCatalog==='function'?originalCatalog.apply(this,arguments):exerciseDbRecords()};
 window.catalogRecords=catalogLocked;try{catalogRecords=catalogLocked}catch(_){}
 window.UNVRSL_EXERCISEDB_ONLY=exerciseDbRecords;
})();