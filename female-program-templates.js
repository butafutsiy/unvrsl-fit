'use strict';
(()=>{
  if(window.__unvrslFemaleTemplatesV2)return;window.__unvrslFemaleTemplatesV2=true;

  const WAVE=[7,7.5,8,8,8.5,7.5,8.5,7];
  const id=(p='id')=>typeof uid==='function'?uid(p):`${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
  const ex=(n,s,r,opt={})=>({id:id('pex'),n,sourceId:null,bp:'',tg:'',eq:'',method:'STANDARD',rpe:opt.rpe??8,tempo:opt.tempo||'2-0-2',rest:opt.rest??90,note:opt.note||'',sets:Array.from({length:s},()=>({label:'',w:0,r,rest:opt.rest??90}))});
  const E=(n,s,r,rpe,rest=90,note='')=>ex(n,s,r,{rpe,rest,note});
  const day=(name,items)=>({id:id('day'),name,ex:items});
  const program=(key,title,weeks,daysFactory,meta,source,sourceName)=>({
    id:id('prog'),templateKey:key,name:title,created:Date.now(),updated:Date.now(),femaleTemplate:true,internetTemplate:true,
    source,sourceName,meta,weeks:Array.from({length:weeks},(_,i)=>({n:i+1,focus:i===weeks-1?'Разгрузка и техника':i<2?'Освоение и накопление объёма':i<5?'Прогрессия нагрузки':'Интенсификация',days:daysFactory(i,WAVE[Math.min(i,WAVE.length-1)])}))
  });

  const T={
    stern3:{
      title:'Glute Hypertrophy · 3 дня',
      meta:'6 недель · 2 ягодичных дня + верх · по принципам Erin Stern',
      source:'https://barbend.com/news/program-glutes-erin-stern/',sourceName:'Erin Stern / BarBend',
      build(){return program('stern-glute-3',this.title,6,(w,rpe)=>[
        day('Ягодицы A · растянутая позиция',[
          E('Фронтальный сумо-присед',4,w<2?10:8,rpe,150),E('Румынская тяга B-stance',3,10,rpe,120,'На каждую сторону'),E('Болгарские выпады с передней ногой на возвышении',3,10,rpe,105,'На каждую ногу'),E('Ягодичный мост одной ногой',3,12,rpe,90,'На каждую ногу'),E('Отведение бедра в тренажёре',2,18,rpe,45)
        ]),
        day('Верх тела',[
          E('Тяга верхнего блока',3,10,rpe,90),E('Жим гантелей на наклонной',3,10,rpe,90),E('Тяга горизонтального блока',3,12,rpe,90),E('Жим гантелей сидя',3,10,rpe,90),E('Махи гантелями в стороны',3,15,rpe,60),E('Отведение на заднюю дельту',3,15,rpe,60)
        ]),
        day('Ягодицы B · сокращённая позиция',[
          E('Ягодичный мост',4,w<2?10:8,rpe,150),E('Жим ногами',3,10,rpe,120,'Стопы выше средней линии платформы'),E('Выпады назад',3,10,rpe,90,'На каждую ногу'),E('Разгибание бедра в кроссовере',3,15,rpe,60,'На каждую ногу'),E('Отведение бедра в тренажёре',3,20,rpe,45)
        ])
      ],this.meta,this.source,this.sourceName)}
    },
    dlb4:{
      title:'Glute Builder · 4 дня',
      meta:'6 недель · тяжёлые ягодицы + верх · по тренировке Dana Linn Bailey',
      source:'https://barbend.com/news/grow-glutes-like-dana-linn-bailey/',sourceName:'Dana Linn Bailey / BarBend',
      build(){return program('dlb-glute-builder-4',this.title,6,(w,rpe)=>[
        day('Ягодицы A · силовой акцент',[
          E('Ягодичный мост в тренажёре',4,w<2?10:8,rpe,150),E('Сумо-становая тяга',4,8,rpe,150),E('Гудморнинг в тренажёре или со штангой',3,10,rpe,120),E('Обратные выпады с дефицита',3,10,rpe,90,'На каждую ногу'),E('Разгибание бедра в кроссовере',3,15,rpe,60)
        ]),
        day('Верх A',[
          E('Тяга верхнего блока',4,10,rpe,90),E('Жим гантелей лёжа',3,10,rpe,90),E('Тяга горизонтального блока',3,12,rpe,90),E('Махи гантелями в стороны',4,15,rpe,60),E('Разгибание рук на блоке',3,12,rpe,60)
        ]),
        day('Ягодицы B · односторонняя работа',[
          E('Ягодичный мост B-stance',3,10,rpe,120,'На каждую сторону'),E('Румынская тяга на одной ноге',3,10,rpe,105,'На каждую ногу'),E('Болгарские выпады',3,10,rpe,90,'На каждую ногу'),E('Жим ногами одной ногой',3,12,rpe,90,'На каждую ногу'),E('Отведение бедра в тренажёре',3,18,rpe,45)
        ]),
        day('Верх B',[
          E('Тяга в наклоне',3,8,rpe,120),E('Жим гантелей на наклонной',3,10,rpe,90),E('Тяга верхнего блока узким хватом',3,12,rpe,90),E('Жим гантелей сидя',3,10,rpe,90),E('Отведение на заднюю дельту',3,15,rpe,60),E('Сгибание рук',3,12,rpe,60)
        ])
      ],this.meta,this.source,this.sourceName)}
    },
    wellness4:{
      title:'Wellness · ягодицы + квадрицепс · 4 дня',
      meta:'8 недель · нижняя часть 3 раза за 8 дней · идеи Shanique Grant и Gracie Collis',
      source:'https://barbend.com/news/shanique-grants-3-rules-for-quad-training/',sourceName:'BarBend · Wellness lower body',
      build(){return program('wellness-glute-quad-4',this.title,8,(w,rpe)=>[
        day('Низ A · ягодицы',[
          E('Ягодичный мост',4,w<3?10:8,rpe,150),E('Румынская тяга',3,10,rpe,120),E('Болгарские выпады',3,10,rpe,90,'Длинный шаг, на каждую ногу'),E('Разгибание бедра в кроссовере',3,15,rpe,60),E('Отведение бедра в тренажёре',3,18,rpe,45)
        ]),
        day('Верх тела',[
          E('Тяга верхнего блока',3,10,rpe,90),E('Тяга горизонтального блока',3,10,rpe,90),E('Жим гантелей на наклонной',3,10,rpe,90),E('Махи гантелями в стороны',4,15,rpe,60),E('Отведение на заднюю дельту',3,15,rpe,60),E('Сгибание рук',2,12,rpe,60)
        ]),
        day('Низ B · квадрицепс + ягодицы',[
          E('Присед со штангой',4,w<3?10:8,rpe,150),E('Жим ногами',3,12,rpe,120),E('Болгарские выпады',3,10,rpe,90,'Более вертикальный корпус'),E('Разгибание ног',3,15,rpe,60),E('Ягодичный мост',3,12,rpe,105),E('Отведение бедра в тренажёре',2,20,rpe,45)
        ]),
        day('Задняя цепь + плечи',[
          E('Румынская тяга',4,8,rpe,150),E('Сгибание ног',3,12,rpe,75),E('Гиперэкстензия с акцентом на ягодицы',3,12,rpe,75),E('Махи гантелями в стороны',4,15,rpe,60),E('Протяжка на плечи',3,12,rpe,75),E('Отведение на заднюю дельту',3,15,rpe,60)
        ])
      ],this.meta,this.source,this.sourceName)}
    },
    womenUL4:{
      title:'Upper / Lower для девушек · 4 дня',
      meta:'10 недель · сбалансированная гипертрофия · адаптация идеи Muscle & Strength',
      source:'https://www.muscleandstrength.com/workouts/10-week-upper-lower-workout-program-for-women',sourceName:'Muscle & Strength',
      build(){return program('women-upper-lower-4',this.title,10,(w,rpe)=>[
        day('Lower A · ягодицы + бицепс бедра',[
          E('Ягодичный мост',4,w<2?10:8,rpe,150),E('Румынская тяга',3,10,rpe,120),E('Болгарские выпады',3,10,rpe,90,'На каждую ногу'),E('Сгибание ног',3,12,rpe,75),E('Отведение бедра в тренажёре',3,15,rpe,60)
        ]),
        day('Upper A',[
          E('Тяга верхнего блока',4,10,rpe,90),E('Жим гантелей лёжа',3,10,rpe,90),E('Тяга горизонтального блока',3,12,rpe,90),E('Жим гантелей сидя',3,10,rpe,90),E('Махи гантелями в стороны',3,15,rpe,60),E('Разгибание рук на блоке',2,12,rpe,60)
        ]),
        day('Lower B · квадрицепс + ягодицы',[
          E('Присед со штангой',4,w<2?10:8,rpe,150),E('Жим ногами',3,12,rpe,120),E('Выпады назад',3,10,rpe,90,'На каждую ногу'),E('Разгибание ног',3,15,rpe,60),E('Ягодичный мост',3,12,rpe,105),E('Подъём на носки',3,15,rpe,60)
        ]),
        day('Upper B',[
          E('Тяга в наклоне',3,10,rpe,120),E('Жим гантелей на наклонной',3,10,rpe,90),E('Тяга верхнего блока узким хватом',3,12,rpe,90),E('Махи гантелями в стороны',4,15,rpe,60),E('Отведение на заднюю дельту',3,15,rpe,60),E('Сгибание рук',2,12,rpe,60)
        ])
      ],this.meta,this.source,this.sourceName)}
    },
    home4:{
      title:'Домашние ягодицы · 4 дня',
      meta:'6 недель · гантели/резинки/вес тела · по мотивам 4-Day At-Home Glute Building',
      source:'https://www.muscleandstrength.com/workouts/4-day-at-home-glute-building-workout',sourceName:'Muscle & Strength',
      build(){return program('home-glute-4',this.title,6,(w,rpe)=>[
        day('Низ A',[
          E('Ягодичный мост с гантелью',4,12,rpe,90),E('Румынская тяга с гантелями',3,10,rpe,90),E('Болгарские выпады с гантелями',3,10,rpe,75,'На каждую ногу'),E('Отведение бедра с резинкой',3,20,rpe,45)
        ]),
        day('Верх A',[
          E('Тяга гантели одной рукой',3,12,rpe,75),E('Отжимания',3,10,rpe,75),E('Жим гантелей сидя',3,10,rpe,75),E('Махи гантелями в стороны',3,15,rpe,45)
        ]),
        day('Низ B',[
          E('Присед с гантелью',4,12,rpe,90),E('Выпады назад с гантелями',3,10,rpe,75,'На каждую ногу'),E('Ягодичный мост одной ногой',3,12,rpe,75,'На каждую ногу'),E('Румынская тяга на одной ноге с гантелью',3,10,rpe,75,'На каждую ногу'),E('Отведение бедра с резинкой',3,20,rpe,45)
        ]),
        day('Верх B + ягодичный памп',[
          E('Тяга гантелей в наклоне',3,12,rpe,75),E('Жим гантелей лёжа на полу',3,12,rpe,75),E('Махи гантелями в стороны',3,15,rpe,45),E('Ягодичный мост с паузой',3,20,rpe,60,'Пауза 2 сек вверху')
        ])
      ],this.meta,this.source,this.sourceName)}
    }
  };

  function add(idKey){
    const spec=T[idKey];if(!spec)return;
    const p=spec.build();
    st.programs=Array.isArray(st.programs)?st.programs:[];st.programs.push(p);save();
    if(typeof toast==='function')toast('Программа добавлена в «Мои программы»');
    if(typeof openProgramEditor==='function')openProgramEditor(p.id,0,0)
  }
  window.createFemaleTemplateProgram=add;

  function html(){
    return `<div class="female-template-section"><div class="section">ДЛЯ ДЕВУШЕК · НОВАЯ ПОДБОРКА</div><div class="muted small" style="margin:0 8px 10px">Старые ягодичные шаблоны убраны. Здесь программы, собранные по открытым тренировочным материалам и адаптированные под RPE. Вес на первой тренировке вводится вручную.</div>${Object.entries(T).map(([k,p])=>`<div class="card"><div class="row between"><div class="grow"><b>${esc(p.title)}</b><div class="muted small" style="margin-top:4px">${esc(p.meta)}</div><div class="muted small" style="margin-top:5px">Источник: ${esc(p.sourceName)}</div></div><button class="btn tiny primary" onclick="createFemaleTemplateProgram('${k}')">Добавить</button></div></div>`).join('')}</div>`
  }

  function patch(){
    const current=window.templatesSheet||(()=>{try{return templatesSheet}catch(e){return null}})();
    if(typeof current!=='function'||current.__femaleTemplatesV2)return false;
    const base=current;
    const wrapped=function(){
      const r=base.apply(this,arguments),sh=document.querySelector('#sheet');if(!sh)return r;
      sh.querySelectorAll('.female-template-section').forEach(x=>x.remove());
      sh.insertAdjacentHTML('beforeend',html());return r
    };
    wrapped.__femaleTemplatesV2=true;window.templatesSheet=wrapped;try{templatesSheet=wrapped}catch(e){};return true;
  }
  [0,100,400,1000,2200].forEach(t=>setTimeout(patch,t));
})();
