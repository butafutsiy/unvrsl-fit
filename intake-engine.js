'use strict';
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./intake-profile'):root.UNVRSLIntakeProfile);if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.UNVRSLIntake=api})(typeof window!=='undefined'?window:globalThis,(profile)=>{
 const VERSION=2;
 const EQUIPMENT={dumbbells:'Гантели',bench:'Скамья',barbell:'Штанга',rack:'Стойки для приседа',cable:'Верхний и нижний блок',legpress:'Жим ногами',legcurl:'Сгибание ног',chestpress:'Жим от груди в тренажёре',kettlebells:'Гири',pullup_dip:'Турник и брусья'};
 const FOCUS={back:'Спина',chest:'Грудь',shoulders:'Плечи',arms:'Руки',legs:'Ноги',core:'Кор'};
 const FORMATS={balanced:'Баланс',concentrated:'Меньше упражнений',varied:'Больше разнообразия'};
 const FOCUS_SLOTS={back:['pull','vertical'],chest:['push'],shoulders:['shoulder'],arms:['arm','triceps'],legs:['squat','hinge','curlleg','calf'],core:['core']};
 const GOALS={muscle:'Мышечная масса',strength:'Сила',fitness:'Общая физическая форма',fatloss:'Снижение жировой массы'};
 // Curated movement slots. Every candidate points to the canonical catalog.
 const POOL={
  squat:[['canon:leg_press',['legpress']],['og:1760',['dumbbells']],['og:0534',['kettlebells']],['canon:high_bar_squat',['barbell','rack'],'regular'],['og:3168',[]]],
  hinge:[['og:1459',['dumbbells']],['canon:barbell_rdl',['barbell'],'regular'],['og:3523',['bench']]],
  push:[['canon:machine_chest_press',['chestpress']],['og:0289',['dumbbells','bench']],['og:3211',[],'beginner'],['og:3216',[]]],
  pull:[['canon:seated_cable_row',['cable']],['og:0293',['dumbbells']],['canon:barbell_row',['barbell'],'regular'],['og:1429',['pullup_dip'],'regular']],
  vertical:[['canon:lat_pulldown',['cable']],['canon:one_arm_db_row',['dumbbells','bench']],['og:0293',['dumbbells']],['canon:barbell_row',['barbell'],'regular'],['og:1429',['pullup_dip'],'regular']],
  curlleg:[['canon:lying_leg_curl',['legcurl']],['og:1459',['dumbbells']],['og:3523',['bench']]],
  shoulder:[['canon:lateral_raise',['dumbbells']]],
  arm:[['canon:cable_curl',['cable']],['canon:db_supination_curl',['dumbbells']]],
  triceps:[['canon:rope_pushdown',['cable']],['canon:db_overhead_triceps',['dumbbells']]],
  core:[['og:0276',[]]],calf:[['og:1373',[]]]
 };
 function validate(raw){
  if(!raw||typeof raw!=='object')throw Error('Анкета повреждена');
  const extended=raw.schemaVersion===2?profile.normalize(raw):null;
  if(extended)raw={...raw,...extended};
  const a={...(extended||{}),name:String(raw.name||'').trim().slice(0,100),age:Number(raw.age),goal:raw.goal,experience:raw.experience,days:Number(raw.days),minutes:Number(raw.minutes),limitations:raw.limitations,equipment:raw.equipment,excluded:raw.excluded||[]};
  if(!a.name||!Number.isInteger(a.age)||a.age<12||a.age>100)throw Error('Укажи имя и возраст от 12 до 100 лет');
  if(typeof a.goal!=='string'||!Object.hasOwn(GOALS,a.goal)||!['beginner','regular'].includes(a.experience)||![2,3,4].includes(a.days)||![30,45,60,75].includes(a.minutes)||typeof a.limitations!=='boolean')throw Error('Проверь обязательные ответы анкеты');
  if(!Array.isArray(a.equipment)||a.equipment.some(x=>!Object.hasOwn(EQUIPMENT,x))||!Array.isArray(a.excluded)||a.excluded.length>30||a.excluded.some(x=>typeof x!=='string'||x.length>80))throw Error('Проверь список оборудования и исключений');
  a.focus=raw.focus??[];a.format=raw.format??'balanced';
  if(!Array.isArray(a.focus)||a.focus.length>2||a.focus.some(x=>!Object.hasOwn(FOCUS,x))||new Set(a.focus).size!==a.focus.length||!Object.hasOwn(FORMATS,a.format))throw Error('Выбери не больше двух акцентов и формат тренировки');
  a.focus=[...a.focus];
  a.equipment=[...new Set(a.equipment)].sort();a.excluded=[...new Set(a.excluded)].sort();return a;
 }
 function generate(raw,catalog){
  const a=validate(raw),byId=new Map(catalog.map(e=>[e.id,e])),issues=[];
  if(a.age<18||a.age>70)issues.push('Для этого возраста нужна индивидуальная программа тренера.');
  if(a.limitations)issues.push('Указаны боль, ограничения или восстановление после травмы. Сначала обсуди движения с тренером.');
  if(issues.length)return{answers:a,program:null,issues};
  const choose=slot=>(POOL[slot]||[]).find(([id,req,level])=>byId.has(id)&&!a.excluded.includes(id)&&req.every(x=>a.equipment.includes(x))&&(level!=='regular'||a.experience==='regular')&&(level!=='beginner'||a.experience==='beginner'))?.[0];
  const templates=a.days===4?[['Верх A',['push','pull','vertical','shoulder','triceps']],['Низ A',['squat','hinge','core','calf']],['Верх B',['vertical','push','pull','arm','shoulder']],['Низ B',['squat','curlleg','core','calf']]]:Array.from({length:a.days},(_,i)=>[`Всё тело ${i+1}`,i%2?['hinge','push','vertical','squat','arm']:['squat','push','pull','hinge','shoulder']]);
  const priority=new Set(a.focus.flatMap(k=>FOCUS_SLOTS[k]));
  const selected=templates.map(([name,slots])=>({name,allowed:a.days!==4?Object.keys(POOL):name.startsWith('Верх')?['push','pull','vertical','shoulder','arm','triceps']:['squat','hinge','curlleg','core','calf'],requiredNames:slots.slice(0,4).map(choose).filter(Boolean).map(id=>byId.get(id).n),slots:slots.map((slot,i)=>{const id=choose(slot);if(!id&&i<4)issues.push(`«${name}»: нет доступного упражнения для блока ${{squat:'приседания',hinge:'задняя поверхность бедра',push:'жим',pull:'тяга',vertical:'тяга на спину',curlleg:'сгибание ног',core:'корпус'}[slot]||slot}.`);return id?{slot,e:byId.get(id)}:null}).filter(Boolean)}));
  if(issues.length)return{answers:a,program:null,issues:[...new Set(issues)],explanation:'Тренер подберёт замену под твоё оборудование. Сайт не добавляет недоступные упражнения.'};
  const unavailable=a.focus.filter(k=>!selected.some(d=>d.slots.some(x=>FOCUS_SLOTS[k].includes(x.slot)))&&!FOCUS_SLOTS[k].some(s=>choose(s)));
  unavailable.forEach(k=>issues.push(`Акцент «${FOCUS[k]}»: нет доступного упражнения. Тренер уточнит замену.`));
  // A focus changes accessory selection, never removes the four basic movement slots.
  selected.forEach((d,di)=>{if(!a.focus.length)return;const primary=d.slots.slice(0,4),used=new Set(primary.map(x=>x.e.id));
   const preferences=[...priority].filter(s=>d.allowed.includes(s));if(preferences.length)preferences.push(...preferences.splice(0,di%preferences.length));
   const extra=preferences.map(slot=>({slot,id:choose(slot)})).find(x=>x.id&&!used.has(x.id));
   if(extra)d.slots=[...primary,{slot:extra.slot,e:byId.get(extra.id)}];
   d.slots.sort((x,y)=>Number(priority.has(y.slot))-Number(priority.has(x.slot)));
  });
  const weeks=Array.from({length:4},(_,wi)=>({n:wi+1,useIntensity:false,loadProfileManual:true,loadProfileAuto:false,rpeMin:[6,7,7,6][wi],rpeMax:[6,7,7,6][wi],tempo:'2-0-2',baseRestMin:90,baseRestMax:a.goal==='strength'&&a.experience==='regular'?180:90,isolationRestMin:60,isolationRestMax:60,testWeek:false,focus:wi===3?'Снижение объёма и усилия':'Техника и постепенная прогрессия по повторам',days:selected.map((d,di)=>{
   const seen=new Set(),rpe=[6,7,7,6][wi],count=a.experience==='beginner'?[2,2,3,2][wi]:[3,3,3,2][wi];
   const ex=d.slots.filter(x=>{if(seen.has(x.e.id))return false;seen.add(x.e.id);return true}).map(({slot,e},ei)=>{
    const compound=['squat','hinge','push','pull','vertical','curlleg'].includes(slot),strength=a.goal==='strength'&&a.experience==='regular'&&compound&&!['hinge','curlleg'].includes(slot),lo=strength?5:compound?8:10,hi=strength?8:compound?12:15,rest=strength?180:compound?90:60;
    return{id:`intake-${wi}-${di}-${ei}`,n:e.n,sourceId:e.rawId||e.id.replace(/^og:/,''),bp:e.bp,tg:e.tg,eq:e.eq,loadType:e.loadType,method:'STANDARD',reps:{mode:'manual',min:lo,max:hi},rpe,rpeMin:rpe,rpeMax:rpe,effortSourceMode:'manual',tempo:'2-0-2',rest,note:e.loadType==='bodyweight_only'?'Собственный вес. Сохраняй контроль движения.':'Рабочий вес уточнить с тренером. Не рассчитан по возрасту или массе тела.',sets:Array.from({length:count},()=>({w:null,r:lo,rest}))};
   });
   // Format redistributes a fixed set budget; no hidden increase in weekly volume.
   const removable=ex.findLastIndex(e=>!d.requiredNames.includes(e.n)&&!d.slots.some(x=>x.e.n===e.n&&priority.has(x.slot)));
   if(a.format==='concentrated'&&ex.length>4&&removable>=0){const removed=ex.splice(removable,1)[0];let spare=removed.sets.length;for(let i=0;spare>0&&i<ex.length*4;i++){const e=ex[i%ex.length];if(e.sets.length<4){e.sets.push({w:null,r:e.reps.min,rest:e.rest});spare--}}}
   if(a.format==='varied'&&ex.length<6){const used=new Set(ex.map(e=>e.n)),id=['core','arm','triceps','shoulder','curlleg','calf'].filter(s=>d.allowed.includes(s)).map(choose).find(id=>id&&!used.has(byId.get(id).n));
    const donor=[...ex].reverse().find(e=>e.sets.length>1);if(id&&donor){const e=byId.get(id),r=10;donor.sets.pop();ex.push({id:`intake-${wi}-${di}-extra`,n:e.n,sourceId:e.rawId||e.id.replace(/^og:/,''),bp:e.bp,tg:e.tg,eq:e.eq,loadType:e.loadType,method:'STANDARD',reps:{mode:'manual',min:10,max:15},rpe,rpeMin:rpe,rpeMax:rpe,effortSourceMode:'manual',tempo:'2-0-2',rest:60,note:'Рабочий вес уточнить с тренером.',sets:[{w:null,r,rest:60}]})}
   }
   const estimate=()=>Math.ceil(8+ex.reduce((s,e)=>s+2+e.sets.length*(e.reps.max*4+e.rest)/60,0));
   // Keep the first four movement slots. Reduce sets before dropping accessories.
   while(estimate()>a.minutes&&ex.length>4){const i=ex.findLastIndex(e=>!d.requiredNames.includes(e.n));if(i<0)break;ex.splice(i,1)}
   while(estimate()>a.minutes&&ex.some(e=>e.sets.length>2)){const e=[...ex].reverse().find(e=>e.sets.length>2);e.sets.pop()}
   if(estimate()>a.minutes)issues.push(`«${d.name}», неделя ${wi+1}: около ${estimate()} мин при лимите ${a.minutes}. Тренеру нужно сократить занятие.`);
   return{id:`intake-day-${wi}-${di}`,name:d.name,estimatedMinutes:estimate(),ex};
  })}));
  const rationale=[...(a.focus.length?[`Акценты: ${a.focus.map(k=>FOCUS[k]).join(', ')}. Приоритет в порядке упражнений и выборе доступных дополнительных движений; базовые движения сохранены.`]:[]),...(a.format!=='balanced'?[`Формат: ${FORMATS[a.format]}. Подходы перераспределяются между упражнениями; лимит времени может дополнительно сократить объём.`]:[]),...(a.goal==='fatloss'?['Силовые упражнения для сохранения мышц при снижении веса. Питание рассчитывается отдельно после проверки анкеты.']:[]),a.days===4?'4 дня: чередование верха и низа тела.':`${a.days} дня: тренировки всего тела.`,a.experience==='beginner'?'Старт с двух рабочих подходов; техника и подбор нагрузки с тренером.':'Умеренный стартовый объём; нагрузку тренер сверяет с твоей историей.',a.goal==='strength'&&a.experience==='regular'?'Основные движения: 5–8 повторений.':'Основные движения: 8–12 повторений.', 'Неделя 4: снижение усилия и объёма. Повышение веса только после достижения верхней границы повторов с целевым усилием; шаг берётся из настроек упражнения.'];
  return{answers:a,issues:[...new Set(issues)],rationale,program:{name:`${a.name} · ${GOALS[a.goal]} · 4 недели`,weeks,intakeDraft:{version:VERSION,status:'review',answers:a,issues:[...new Set(issues)],rationale},created:Date.now(),updated:Date.now()}};
 }
 function encode(a){const bytes=new TextEncoder().encode(JSON.stringify({v:VERSION,a:validate(a)}));let bin='';bytes.forEach(b=>bin+=String.fromCharCode(b));return btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
 function decode(token){if(typeof token!=='string'||token.length>10000||!/^[A-Za-z0-9_-]+$/.test(token))throw Error('Неверная ссылка анкеты');const bin=atob(token.replace(/-/g,'+').replace(/_/g,'/'));const p=JSON.parse(new TextDecoder().decode(Uint8Array.from(bin,c=>c.charCodeAt(0))));if(![1,VERSION].includes(p.v))throw Error('Версия анкеты не поддерживается');return validate(p.a)}
 return{VERSION,EQUIPMENT,GOALS,FOCUS,FORMATS,POOL,validate,generate,encode,decode};
});
