'use strict';
function ppSets(count,reps,rest=90){return Array.from({length:count},()=>({label:'',w:0,r:reps,rest}))}
function ppEx(n,count,reps,opt={}){return{id:uid('pex'),n,sourceId:null,bp:'',tg:'',eq:'',method:'STANDARD',rpe:opt.rpe??8,tempo:opt.tempo||'2-0-2',rest:opt.rest||90,note:opt.note||'',sets:ppSets(count,reps,opt.rest||90)}}
function ppDay(name,ex){return{id:uid('day'),name,ex}}
function ppRepeatWeeks(count,daysFactory){return Array.from({length:count},(_,wi)=>({n:wi+1,days:daysFactory(wi)}))}
function ppProgram(name,weeks,source,sourceName,meta){return{id:uid('prog'),name,created:Date.now(),updated:Date.now(),source,sourceName,internetTemplate:true,meta,weeks}}

const POPULAR_PROGRAMS={
 stronglifts:{
  title:'StrongLifts 5×5',meta:'Сила · 3 дня/нед · 8 недель в шаблоне',source:'https://stronglifts.com/stronglifts-5x5/workout-program/',sourceName:'StrongLifts',
  build(){const A=()=>ppDay('Workout A',[ppEx('Присед со штангой',5,5,{rest:180,rpe:7,note:'Начни с лёгкого веса. После успешных 5×5 постепенно прибавляй нагрузку.'}),ppEx('Жим штанги лёжа',5,5,{rest:180,rpe:7,note:'После успешных 5×5 постепенно прибавляй нагрузку.'}),ppEx('Тяга штанги в наклоне',5,5,{rest:180,rpe:7,note:'После успешных 5×5 постепенно прибавляй нагрузку.'})]);const B=()=>ppDay('Workout B',[ppEx('Присед со штангой',5,5,{rest:180,rpe:7,note:'Начни с лёгкого веса. После успешных 5×5 постепенно прибавляй нагрузку.'}),ppEx('Жим штанги стоя',5,5,{rest:180,rpe:7,note:'После успешных 5×5 постепенно прибавляй нагрузку.'}),ppEx('Становая тяга',1,5,{rest:240,rpe:7,note:'По базовой схеме StrongLifts — один рабочий подход из 5 повторений.'})]);return ppProgram(this.title,ppRepeatWeeks(8,wi=>{const first=(wi*3)%2===0;return first?[A(),B(),A()]:[B(),A(),B()]}),this.source,this.sourceName,this.meta)}
 },
 ppl6:{
  title:'Push / Pull / Legs ×2',meta:'Масса + сила · 6 дней/нед · средний уровень',source:'https://www.muscleandstrength.com/workouts/6-day-powerbuilding-split-meal-plan',sourceName:'Muscle & Strength',
  build(){const days=()=>[
   ppDay('Push A · тяжёлый',[ppEx('Жим штанги лёжа',4,6,{rest:150,rpe:8}),ppEx('Жим гантелей на наклонной',3,8,{rest:120,rpe:8}),ppEx('Жим над головой',3,8,{rest:120,rpe:8}),ppEx('Подъём гантелей в стороны',3,15,{rest:60,rpe:8}),ppEx('Разгибание рук на блоке',3,12,{rest:60,rpe:8})]),
   ppDay('Pull A · тяжёлый',[ppEx('Подтягивания',4,6,{rest:150,rpe:8}),ppEx('Тяга штанги в наклоне',4,6,{rest:150,rpe:8}),ppEx('Тяга горизонтального блока',3,10,{rest:90,rpe:8}),ppEx('Обратная бабочка',3,15,{rest:60,rpe:8}),ppEx('Сгибание рук со штангой',3,10,{rest:75,rpe:8})]),
   ppDay('Legs A · тяжёлый',[ppEx('Присед со штангой',4,6,{rest:180,rpe:8}),ppEx('Румынская тяга',3,8,{rest:150,rpe:8}),ppEx('Жим ногами',3,10,{rest:120,rpe:8}),ppEx('Сгибание ног',3,12,{rest:75,rpe:8}),ppEx('Подъём на носки',4,15,{rest:60,rpe:8})]),
   ppDay('Push B · объём',[ppEx('Жим штанги на наклонной',3,10,{rest:120,rpe:8}),ppEx('Жим гантелей сидя',3,10,{rest:90,rpe:8}),ppEx('Сведение рук в кроссовере',3,15,{rest:60,rpe:8}),ppEx('Подъём гантелей в стороны',4,15,{rest:60,rpe:8}),ppEx('Французское разгибание',3,12,{rest:60,rpe:8})]),
   ppDay('Pull B · объём',[ppEx('Тяга верхнего блока',4,10,{rest:90,rpe:8}),ppEx('Тяга Т-грифа',3,10,{rest:120,rpe:8}),ppEx('Тяга одной рукой',3,12,{rest:75,rpe:8}),ppEx('Face Pull',3,15,{rest:60,rpe:8}),ppEx('Молотковые сгибания',3,12,{rest:60,rpe:8})]),
   ppDay('Legs B · объём',[ppEx('Фронтальный присед',3,8,{rest:150,rpe:8}),ppEx('Ягодичный мост',3,10,{rest:120,rpe:8}),ppEx('Выпады назад',3,10,{rest:90,rpe:8,note:'Повторения на каждую ногу.'}),ppEx('Разгибание ног',3,15,{rest:60,rpe:8}),ppEx('Сгибание ног',3,15,{rest:60,rpe:8}),ppEx('Подъём на носки',4,15,{rest:60,rpe:8})])
  ];return ppProgram(this.title,ppRepeatWeeks(6,()=>days()),this.source,this.sourceName,this.meta)}
 },
 upperlower:{
  title:'Upper / Lower · 4 дня',meta:'Гипертрофия · 4 дня/нед · 8 недель',source:'https://www.muscleandstrength.com/workouts/upper-lower-4-day-gym-bodybuilding-workout',sourceName:'Muscle & Strength',
  build(){const days=()=>[
   ppDay('Upper A',[ppEx('Жим штанги лёжа',3,8,{rest:150,rpe:8}),ppEx('Тяга штанги в наклоне',3,8,{rest:150,rpe:8}),ppEx('Жим над головой',3,10,{rest:120,rpe:8}),ppEx('Тяга верхнего блока',3,10,{rest:90,rpe:8}),ppEx('Подъём гантелей в стороны',3,15,{rest:60,rpe:8}),ppEx('Сгибание рук',3,12,{rest:60,rpe:8}),ppEx('Разгибание рук на блоке',3,12,{rest:60,rpe:8})]),
   ppDay('Lower A',[ppEx('Присед со штангой',3,8,{rest:180,rpe:8}),ppEx('Румынская тяга',3,10,{rest:150,rpe:8}),ppEx('Жим ногами',3,12,{rest:120,rpe:8}),ppEx('Сгибание ног',3,12,{rest:75,rpe:8}),ppEx('Подъём на носки',4,15,{rest:60,rpe:8})]),
   ppDay('Upper B',[ppEx('Жим гантелей на наклонной',3,10,{rest:120,rpe:8}),ppEx('Подтягивания',3,8,{rest:120,rpe:8}),ppEx('Тяга горизонтального блока',3,12,{rest:90,rpe:8}),ppEx('Жим гантелей сидя',3,10,{rest:90,rpe:8}),ppEx('Обратная бабочка',3,15,{rest:60,rpe:8}),ppEx('Молотковые сгибания',3,12,{rest:60,rpe:8}),ppEx('Французское разгибание',3,12,{rest:60,rpe:8})]),
   ppDay('Lower B',[ppEx('Становая тяга',3,5,{rest:210,rpe:8}),ppEx('Фронтальный присед',3,10,{rest:150,rpe:8}),ppEx('Болгарские выпады',3,10,{rest:90,rpe:8,note:'Повторения на каждую ногу.'}),ppEx('Разгибание ног',3,15,{rest:60,rpe:8}),ppEx('Сгибание ног',3,15,{rest:60,rpe:8}),ppEx('Подъём на носки',4,15,{rest:60,rpe:8})])
  ];return ppProgram(this.title,ppRepeatWeeks(8,()=>days()),this.source,this.sourceName,this.meta)}
 },
 fullbody3:{
  title:'Full Body · 3 дня',meta:'Сила + гипертрофия · 3 дня/нед · 8 недель',source:'https://www.muscleandstrength.com/workouts/total-package-workout',sourceName:'Muscle & Strength',
  build(){const days=()=>[
   ppDay('Full Body A',[ppEx('Присед со штангой',4,6,{rest:180,rpe:8}),ppEx('Жим гантелей лёжа',3,10,{rest:120,rpe:8}),ppEx('Тяга гантели одной рукой',3,10,{rest:90,rpe:8}),ppEx('Жим гантелей сидя',3,10,{rest:90,rpe:8}),ppEx('Сгибание рук',2,12,{rest:60,rpe:8}),ppEx('Подъём на носки',3,15,{rest:60,rpe:8})]),
   ppDay('Full Body B',[ppEx('Жим штанги лёжа',4,6,{rest:180,rpe:8}),ppEx('Тяга верхнего блока',3,10,{rest:90,rpe:8}),ppEx('Жим ногами',3,10,{rest:120,rpe:8}),ppEx('Сгибание ног',3,12,{rest:75,rpe:8}),ppEx('Подъём гантелей в стороны',3,15,{rest:60,rpe:8}),ppEx('Разгибание рук на блоке',2,12,{rest:60,rpe:8})]),
   ppDay('Full Body C',[ppEx('Становая тяга',3,5,{rest:210,rpe:8}),ppEx('Жим гантелей на наклонной',3,10,{rest:120,rpe:8}),ppEx('Тяга горизонтального блока',3,10,{rest:90,rpe:8}),ppEx('Выпады назад',3,10,{rest:90,rpe:8,note:'Повторения на каждую ногу.'}),ppEx('Подъём гантелей в стороны',3,15,{rest:60,rpe:8}),ppEx('Молотковые сгибания',2,12,{rest:60,rpe:8})])
  ];return ppProgram(this.title,ppRepeatWeeks(8,()=>days()),this.source,this.sourceName,this.meta)}
 },
 phul:{
  title:'PHUL-style · сила + масса',meta:'Upper/Lower · 4 дня/нед · 8 недель',source:'https://www.muscleandstrength.com/workouts/phul-workout',sourceName:'Muscle & Strength / PHUL',
  build(){const days=()=>[
   ppDay('Upper Strength',[ppEx('Жим штанги лёжа',4,5,{rest:210,rpe:8}),ppEx('Тяга штанги в наклоне',4,5,{rest:210,rpe:8}),ppEx('Жим над головой',3,6,{rest:180,rpe:8}),ppEx('Подтягивания с весом',3,6,{rest:180,rpe:8}),ppEx('Сгибание рук со штангой',3,8,{rest:90,rpe:8}),ppEx('Жим узким хватом',3,8,{rest:90,rpe:8})]),
   ppDay('Lower Strength',[ppEx('Присед со штангой',4,5,{rest:240,rpe:8}),ppEx('Становая тяга',3,5,{rest:240,rpe:8}),ppEx('Жим ногами',3,10,{rest:120,rpe:8}),ppEx('Сгибание ног',3,10,{rest:90,rpe:8}),ppEx('Подъём на носки',4,10,{rest:75,rpe:8})]),
   ppDay('Upper Hypertrophy',[ppEx('Жим штанги на наклонной',4,10,{rest:120,rpe:8}),ppEx('Тяга горизонтального блока',4,10,{rest:120,rpe:8}),ppEx('Тяга верхнего блока',3,12,{rest:90,rpe:8}),ppEx('Подъём гантелей в стороны',4,15,{rest:60,rpe:8}),ppEx('Сгибание рук на наклонной',3,12,{rest:60,rpe:8}),ppEx('Разгибание рук на блоке',3,12,{rest:60,rpe:8})]),
   ppDay('Lower Hypertrophy',[ppEx('Фронтальный присед',4,10,{rest:150,rpe:8}),ppEx('Румынская тяга',4,10,{rest:150,rpe:8}),ppEx('Разгибание ног',3,15,{rest:60,rpe:8}),ppEx('Сгибание ног',3,15,{rest:60,rpe:8}),ppEx('Ягодичный мост',3,12,{rest:90,rpe:8}),ppEx('Подъём на носки',4,15,{rest:60,rpe:8})])
  ];return ppProgram(this.title,ppRepeatWeeks(8,()=>days()),this.source,this.sourceName,this.meta)}
 }
};

function createPopularProgram(id){const spec=POPULAR_PROGRAMS[id];if(!spec)return;const p=spec.build();st.programs.push(p);save();openProgramEditor(p.id,0,0);toast('Шаблон добавлен в мои программы')}
function popularProgramsHtml(){return `<div class="section">ПОПУЛЯРНЫЕ ПРОГРАММЫ ИЗ ИНТЕРНЕТА</div><div class="muted small" style="margin:0 8px 10px">Адаптированы под UNVRSL FIT. Рабочие веса оставлены пустыми — выставь их под себя.</div>${Object.entries(POPULAR_PROGRAMS).map(([id,p])=>`<div class="card"><div class="row between"><div class="grow"><b>${esc(p.title)}</b><div class="muted small" style="margin-top:4px">${esc(p.meta)}</div></div><button class="btn tiny primary" onclick="createPopularProgram('${id}')">Добавить</button></div><a href="${p.source}" target="_blank" rel="noopener" class="muted small" style="display:inline-block;margin-top:10px">Источник: ${esc(p.sourceName)} ↗</a></div>`).join('')}`}
const _templatesSheetPopular=templatesSheet;
templatesSheet=function(){_templatesSheetPopular();const sh=$('#sheet');if(!sh)return;const wrap=document.createElement('div');wrap.innerHTML=popularProgramsHtml();sh.append(...wrap.childNodes)};
