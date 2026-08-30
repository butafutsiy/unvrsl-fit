'use strict';
(()=>{
  const SEED='sergey-8-week-training-plan';
  const NAME='Тренировочный план (Сергей)';
  if(typeof st!=='object')return;
  if(!Array.isArray(st.programs))st.programs=[];
  if(!st.seededPrograms||typeof st.seededPrograms!=='object')st.seededPrograms={};

  const existing=st.programs.find(p=>p?.seedId===SEED||p?.name===NAME);
  if(existing){st.seededPrograms[SEED]=true;try{save()}catch(e){};return}
  if(st.seededPrograms[SEED])return;

  const weekMeta=[
    {n:1,focus:'Техника и базовый объём'},
    {n:2,focus:'Накопление объёма'},
    {n:3,focus:'Повышение интенсивности'},
    {n:4,focus:'Разгрузка'},
    {n:5,focus:'Тяжёлая гипертрофия'},
    {n:6,focus:'Восстановительный объём'},
    {n:7,focus:'Силовой акцент'},
    {n:8,focus:'Контрольная неделя'}
  ];

  const schemes={
    primary:[
      {s:4,reps:'8–10',r:8,rpe:7,label:'7',tempo:'3-1-2',rest:150},
      {s:4,reps:'8–10',r:8,rpe:8,label:'8',tempo:'3-1-2',rest:150},
      {s:4,reps:'6–8',r:6,rpe:8.5,label:'8–9',tempo:'2-0-2',rest:180},
      {s:2,reps:'10–12',r:10,rpe:6.5,label:'6–7',tempo:'2-0-2',rest:120},
      {s:4,reps:'6–8',r:6,rpe:8.5,label:'8–9',tempo:'2-0-2',rest:180},
      {s:3,reps:'10–12',r:10,rpe:7,label:'7',tempo:'3-1-2',rest:120},
      {s:5,reps:'4–6',r:4,rpe:8.5,label:'8–9',tempo:'2-0-1',rest:210},
      {s:3,reps:'6–8',r:6,rpe:7.5,label:'7–8',tempo:'2-0-X',rest:150}
    ],
    secondary:[
      {s:3,reps:'10–12',r:10,rpe:7,label:'7',tempo:'3-1-2',rest:120},
      {s:4,reps:'8–10',r:8,rpe:8,label:'8',tempo:'3-1-2',rest:120},
      {s:3,reps:'8–10',r:8,rpe:8.5,label:'8–9',tempo:'2-0-2',rest:120},
      {s:2,reps:'12–15',r:12,rpe:6.5,label:'6–7',tempo:'2-0-2',rest:90},
      {s:4,reps:'8–10',r:8,rpe:8.5,label:'8–9',tempo:'2-0-2',rest:120},
      {s:3,reps:'12',r:12,rpe:7,label:'7',tempo:'3-1-2',rest:90},
      {s:4,reps:'6–8',r:6,rpe:8.5,label:'8–9',tempo:'2-0-1',rest:150},
      {s:3,reps:'8–10',r:8,rpe:7.5,label:'7–8',tempo:'2-0-1',rest:120}
    ],
    isolation:[
      {s:3,reps:'12–15',r:12,rpe:7,label:'7',tempo:'2-1-2',rest:75},
      {s:3,reps:'10–12',r:10,rpe:8,label:'8',tempo:'2-1-2',rest:75},
      {s:3,reps:'10–12',r:10,rpe:8.5,label:'8–9',tempo:'2-1-2',rest:90},
      {s:2,reps:'15',r:15,rpe:6.5,label:'6–7',tempo:'2-1-2',rest:60},
      {s:3,reps:'8–10',r:8,rpe:8.5,label:'8–9',tempo:'2-1-2',rest:90},
      {s:2,reps:'15–20',r:15,rpe:7,label:'7',tempo:'2-1-2',rest:60},
      {s:3,reps:'8–10',r:8,rpe:8,label:'8',tempo:'2-1-2',rest:90},
      {s:2,reps:'12–15',r:12,rpe:7,label:'7',tempo:'2-1-2',rest:60}
    ],
    pullup:[
      {s:4,reps:'6–8',r:6,rpe:7,label:'7',tempo:'2-1-2',rest:150},
      {s:4,reps:'6–8',r:6,rpe:8,label:'8',tempo:'2-1-2',rest:150},
      {s:4,reps:'5–7',r:5,rpe:8.5,label:'8–9',tempo:'2-1-1',rest:180},
      {s:2,reps:'8',r:8,rpe:6.5,label:'6–7',tempo:'3-1-2',rest:120},
      {s:4,reps:'5–6',r:5,rpe:8.5,label:'8–9',tempo:'2-1-1',rest:180},
      {s:3,reps:'8',r:8,rpe:7,label:'7',tempo:'3-1-2',rest:120},
      {s:5,reps:'4–5',r:4,rpe:8.5,label:'8–9',tempo:'2-0-1',rest:210},
      {s:3,reps:'6–8',r:6,rpe:7.5,label:'7–8',tempo:'2-1-1',rest:150}
    ],
    calves:[
      {s:4,reps:'12–15',r:12,rpe:7,label:'7',tempo:'2-1-2',rest:60},
      {s:4,reps:'12–15',r:12,rpe:8,label:'8',tempo:'2-1-2',rest:60},
      {s:4,reps:'10–12',r:10,rpe:8.5,label:'8–9',tempo:'2-1-2',rest:75},
      {s:2,reps:'15–20',r:15,rpe:6.5,label:'6–7',tempo:'2-1-2',rest:45},
      {s:4,reps:'10–12',r:10,rpe:8.5,label:'8–9',tempo:'2-1-2',rest:75},
      {s:3,reps:'15–20',r:15,rpe:7,label:'7',tempo:'2-1-2',rest:45},
      {s:4,reps:'8–10',r:8,rpe:8,label:'8',tempo:'2-1-2',rest:75},
      {s:3,reps:'12–15',r:12,rpe:7,label:'7',tempo:'2-1-2',rest:60}
    ]
  };

  const dayDefs=[
    {
      name:'День 1 · Грудь + трицепс + средняя дельта',
      exercises:[
        {n:'1 · Жим штанги лёжа',type:'primary'},
        {n:'2 · Жим гантелей на наклонной скамье',type:'secondary',note:'Вес в упражнении указывается на одну гантель.'},
        {n:'3 · Сведение в кроссовере на низ груди',type:'isolation',note:'Траектория сверху вниз, сведение к линии нижней части груди.'},
        {n:'4 · Жим в тренажёре на грудь',type:'secondary',note:'Тот чёрный тренажёр между «бабочкой» и тренажёром на квадрицепс.'},
        {n:'5 · Французский жим',type:'isolation'},
        {n:'6 · Махи гантелями в стороны',type:'isolation'},
        {n:'7 · Разгибание рук на верхнем блоке',type:'isolation'}
      ]
    },
    {
      name:'День 2 · Спина + бицепс + плечи',
      exercises:[
        {n:'1 · Подтягивания с дополнительным весом',type:'pullup',note:'Дополнительный вес увеличивать только при чистой технике и попадании в целевой RPE.'},
        {n:'2 · Тяга в наклоне в Смите',type:'primary'},
        {n:'3 · Тяга гантели одной рукой к поясу',type:'secondary',note:'Повторы указаны на каждую руку.'},
        {n:'4 · Тяга вертикального блока',type:'secondary'},
        {n:'5 · Подъём штанги на бицепс',type:'isolation'},
        {n:'6 · Сгибание гантелей с супинацией',type:'isolation',note:'Повторы указаны на каждую руку.'},
        {n:'7 · Жим гантелей сидя',type:'secondary',note:'Вес в упражнении указывается на одну гантель.'}
      ]
    },
    {
      name:'День 3 · Ноги',
      exercises:[
        {n:'1 · Гакк-присед',type:'primary',note:'Основное движение дня. Глубина — только при сохранении стабильного положения таза и коленей.'},
        {n:'2 · Жим ногами',type:'secondary'},
        {n:'3 · Румынская тяга',type:'secondary',note:'Контролировать растяжение задней поверхности бедра, не теряя нейтральное положение корпуса.'},
        {n:'4 · Сгибание ног лёжа',type:'isolation'},
        {n:'5 · Разгибание ног',type:'isolation'},
        {n:'6 · Сведение ног в тренажёре',type:'isolation'},
        {n:'7 · Подъём на носки в тренажёре',type:'calves'}
      ]
    }
  ];

  const restText=sec=>sec>=120?`${Math.round(sec/30)/2} мин`:`${sec} сек`;
  const exercise=(def,wi,di,ei)=>{
    const p=schemes[def.type][wi];
    const note=[`Отдых: ${restText(p.rest)}`,def.note].filter(Boolean).join(' · ');
    return{
      n:def.n,
      sourceId:null,
      method:'STANDARD',
      rpe:p.rpe,
      rpeLabel:p.label,
      tempo:p.tempo,
      rest:p.rest,
      note,
      repLabel:p.reps,
      kind:'reps',
      sets:Array.from({length:p.s},()=>({w:0,r:p.r,rest:p.rest})),
      displayPrescription:`${p.s}×${p.reps} · RPE ${p.label} · темп ${p.tempo} · отдых ${restText(p.rest)}`,
      id:`sergey-w${wi+1}-d${di+1}-e${ei+1}`
    }
  };

  const plan={
    id:SEED,
    seedId:SEED,
    sourceRevision:1,
    name:NAME,
    author:'Сергей',
    description:'8-недельный сплит 3 раза в неделю: грудь, спина и стабильный день ног. W1 — техника и базовый объём, W2 — объём, W3 — интенсивность, W4 — разгрузка, W5 — тяжёлая гипертрофия, W6 — восстановительный объём, W7 — силовой акцент, W8 — контрольная неделя. Рабочий вес подбирается по целевому RPE.',
    principles:[
      'Целевой RPE важнее заранее выбранного веса: вес подбирается под усилие текущего дня.',
      'RPE 7 ≈ 3 повтора в запасе, RPE 8 ≈ 2, RPE 9 ≈ 1. Отказ в базовых движениях не требуется.',
      'Разминочные подходы не входят в указанное количество рабочих подходов.',
      'Если техника ухудшается раньше целевого RPE, вес необходимо снизить.',
      'На 4-й неделе цель — восстановиться, а не сохранить веса тяжёлых недель.'
    ],
    created:Date.now(),
    updated:Date.now(),
    weeks:weekMeta.map((wm,wi)=>({
      n:wm.n,
      focus:wm.focus,
      days:dayDefs.map((d,di)=>({
        id:`sergey-w${wi+1}-d${di+1}`,
        name:d.name,
        ex:d.exercises.map((e,ei)=>exercise(e,wi,di,ei))
      }))
    }))
  };

  st.programs.push(plan);
  st.seededPrograms[SEED]=true;
  try{save()}catch(e){console.warn('Sergey plan save',e)}

  const basePrescription=window.prescriptionText;
  if(typeof basePrescription==='function'&&!basePrescription.__sergeyLabels){
    const wrapped=function(e){return e?.displayPrescription||basePrescription(e)};
    wrapped.__sergeyLabels=true;
    window.prescriptionText=wrapped;
    try{prescriptionText=wrapped}catch(e){}
  }
})();
