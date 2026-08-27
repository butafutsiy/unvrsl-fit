'use strict';
(()=>{
  if(window.__unvrslFemaleTemplates)return;window.__unvrslFemaleTemplates=true;
  const RPE_W=[7,7.5,8,8,8.5,7,8.5,7];
  const ex=(n,s,r,opt={})=>({id:typeof uid==='function'?uid('pex'):'pex-'+Math.random(),n,sourceId:null,bp:'',tg:'',eq:'',method:'STANDARD',rpe:opt.rpe??8,tempo:opt.tempo||'2-0-2',rest:opt.rest||90,note:opt.note||'',sets:Array.from({length:s},()=>({label:'',w:0,r,rest:opt.rest||90}))});
  const day=(name,items)=>({id:typeof uid==='function'?uid('day'):'day-'+Math.random(),name,ex:items});
  const program=(name,weeks,daysFactory,meta)=>({id:typeof uid==='function'?uid('prog'):'prog-'+Date.now()+Math.random(),name,created:Date.now(),updated:Date.now(),femaleTemplate:true,meta,weeks:Array.from({length:weeks},(_,i)=>({n:i+1,focus:i===weeks-1?'Разгрузка / техника':i<2?'Освоение и накопление объёма':i<4?'Прогрессия нагрузки':'Интенсификация',days:daysFactory(i,RPE_W[Math.min(i,RPE_W.length-1)])}))});
  const E=(n,s,r,rpe,rest=90,note='')=>ex(n,s,r,{rpe,rest,note});

  const T={
    glute3:{title:'Ягодицы · 3 дня',meta:'6 недель · акцент на ягодицы · 2 тренировки низа + верх',build(){return program(this.title,6,(w,rpe)=>[
      day('Ягодицы A · сила',[E('Ягодичный мост',4,w<2?10:8,rpe,150),E('Румынская тяга',3,10,rpe,120),E('Болгарские выпады',3,10,rpe,90,'На каждую ногу'),E('Отведение бедра в тренажёре',3,15,rpe,60),E('Сгибание ног',3,12,rpe,75)]),
      day('Верх тела + ягодичный памп',[E('Тяга верхнего блока',3,10,rpe,90),E('Тяга горизонтального блока',3,12,rpe,90),E('Жим гантелей на наклонной',3,10,rpe,90),E('Махи гантелями в стороны',3,15,rpe,60),E('Отведение бедра в тренажёре',4,20,rpe,45),E('Разгибание бедра в кроссовере',3,15,rpe,60,'На каждую ногу')]),
      day('Ягодицы B · объём',[E('Ягодичный мост',3,12,rpe,120),E('Жим ногами',3,12,rpe,120,'Стопы выше и чуть шире'),E('Выпады назад',3,10,rpe,90,'На каждую ногу'),E('Гиперэкстензия с акцентом на ягодицы',3,12,rpe,75),E('Отведение бедра в тренажёре',4,15,rpe,45)])
    ],this.meta)}},
    glute4:{title:'Ягодицы + ноги · 4 дня',meta:'8 недель · выраженный ягодичный приоритет',build(){return program(this.title,8,(w,rpe)=>[
      day('Низ A · ягодицы сила',[E('Ягодичный мост',4,w<3?8:6,rpe,180),E('Румынская тяга',4,8,rpe,150),E('Болгарские выпады',3,8,rpe,120,'На каждую ногу'),E('Отведение бедра в тренажёре',3,15,rpe,60)]),
      day('Верх A',[E('Тяга верхнего блока',4,10,rpe,90),E('Жим гантелей лёжа',3,10,rpe,90),E('Тяга горизонтального блока',3,12,rpe,90),E('Махи гантелями в стороны',4,15,rpe,60),E('Отведение на заднюю дельту',3,15,rpe,60)]),
      day('Низ B · ягодицы объём',[E('Ягодичный мост',3,12,rpe,120),E('Жим ногами',4,10,rpe,120,'Стопы выше и чуть шире'),E('Шаги на платформу',3,10,rpe,90,'На каждую ногу'),E('Сгибание ног',3,12,rpe,75),E('Разгибание бедра в кроссовере',3,15,rpe,60,'На каждую ногу'),E('Отведение бедра в тренажёре',3,20,rpe,45)]),
      day('Верх B + ягодичный памп',[E('Тяга в наклоне',3,10,rpe,120),E('Жим гантелей сидя',3,10,rpe,90),E('Тяга верхнего блока узким хватом',3,12,rpe,90),E('Махи гантелями в стороны',3,15,rpe,60),E('Разгибание бедра в кроссовере',3,20,rpe,45,'Лёгкий памп')])
    ],this.meta)}},
    posterior3:{title:'Ягодицы + бицепс бедра · 3 дня',meta:'6 недель · задняя цепь · минимум лишнего объёма квадрицепса',build(){return program(this.title,6,(w,rpe)=>[
      day('Задняя цепь A',[E('Румынская тяга',4,8,rpe,150),E('Ягодичный мост',4,10,rpe,150),E('Сгибание ног',4,10,rpe,90),E('Гиперэкстензия с акцентом на ягодицы',3,12,rpe,75),E('Отведение бедра в тренажёре',3,15,rpe,60)]),
      day('Верх тела',[E('Тяга верхнего блока',3,10,rpe,90),E('Тяга горизонтального блока',3,10,rpe,90),E('Жим гантелей на наклонной',3,10,rpe,90),E('Махи гантелями в стороны',3,15,rpe,60),E('Отведение на заднюю дельту',3,15,rpe,60),E('Сгибание рук',2,12,rpe,60)]),
      day('Задняя цепь B',[E('Ягодичный мост',4,8,rpe,150),E('Выпады назад',3,10,rpe,90,'Длинный шаг, на каждую ногу'),E('Сгибание ног',3,12,rpe,75),E('Разгибание бедра в кроссовере',3,15,rpe,60,'На каждую ногу'),E('Отведение бедра в тренажёре',4,20,rpe,45)])
    ],this.meta)}},
    womenFull3:{title:'Женский Full Body · 3 дня',meta:'8 недель · всё тело · ягодицы в каждой неделе',build(){return program(this.title,8,(w,rpe)=>[
      day('Full Body A',[E('Присед со штангой',3,8,rpe,150),E('Ягодичный мост',3,10,rpe,120),E('Тяга верхнего блока',3,10,rpe,90),E('Жим гантелей лёжа',3,10,rpe,90),E('Махи гантелями в стороны',3,15,rpe,60)]),
      day('Full Body B',[E('Румынская тяга',3,8,rpe,150),E('Болгарские выпады',3,10,rpe,90,'На каждую ногу'),E('Тяга горизонтального блока',3,10,rpe,90),E('Жим гантелей сидя',3,10,rpe,90),E('Отведение бедра в тренажёре',3,15,rpe,60)]),
      day('Full Body C',[E('Жим ногами',3,10,rpe,120),E('Ягодичный мост',3,12,rpe,120),E('Тяга в наклоне',3,10,rpe,120),E('Жим гантелей на наклонной',3,10,rpe,90),E('Отведение на заднюю дельту',3,15,rpe,60),E('Разгибание бедра в кроссовере',3,15,rpe,60,'На каждую ногу')])
    ],this.meta)}},
    beginner2:{title:'Ягодицы · новичок · 2 дня',meta:'6 недель · простой вход · 2 тренировки в неделю',build(){return program(this.title,6,(w,rpe)=>[
      day('Низ A',[E('Ягодичный мост',3,12,Math.min(rpe,8),120),E('Жим ногами',3,12,Math.min(rpe,8),120),E('Сгибание ног',3,12,Math.min(rpe,8),75),E('Отведение бедра в тренажёре',3,15,Math.min(rpe,8),60)]),
      day('Низ B + верх',[E('Румынская тяга с гантелями',3,10,Math.min(rpe,8),120),E('Выпады назад',3,10,Math.min(rpe,8),90,'На каждую ногу'),E('Тяга верхнего блока',3,10,Math.min(rpe,8),90),E('Жим гантелей лёжа',3,10,Math.min(rpe,8),90),E('Махи гантелями в стороны',2,15,Math.min(rpe,8),60),E('Отведение бедра в тренажёре',3,20,Math.min(rpe,8),45)])
    ],this.meta)}},
    gluteShoulders4:{title:'Ягодицы + плечи · 4 дня',meta:'8 недель · эстетический акцент: ягодицы, средняя и задняя дельта',build(){return program(this.title,8,(w,rpe)=>[
      day('Ягодицы A',[E('Ягодичный мост',4,8,rpe,150),E('Румынская тяга',3,10,rpe,120),E('Болгарские выпады',3,10,rpe,90,'На каждую ногу'),E('Отведение бедра в тренажёре',4,15,rpe,60)]),
      day('Плечи + спина A',[E('Тяга верхнего блока',3,10,rpe,90),E('Жим гантелей сидя',3,10,rpe,90),E('Махи гантелями в стороны',4,15,rpe,60),E('Отведение на заднюю дельту',4,15,rpe,60),E('Тяга горизонтального блока',3,12,rpe,90)]),
      day('Ягодицы B',[E('Жим ногами',4,10,rpe,120,'Стопы выше и чуть шире'),E('Ягодичный мост',3,12,rpe,120),E('Шаги на платформу',3,10,rpe,90,'На каждую ногу'),E('Сгибание ног',3,12,rpe,75),E('Разгибание бедра в кроссовере',3,15,rpe,60,'На каждую ногу')]),
      day('Плечи + верх B',[E('Тяга в наклоне',3,10,rpe,120),E('Жим гантелей на наклонной',3,10,rpe,90),E('Махи гантелями в стороны',4,15,rpe,60),E('Протяжка на плечи',3,12,rpe,75),E('Отведение на заднюю дельту',3,15,rpe,60)])
    ],this.meta)}}
  };

  window.createFemaleTemplateProgram=function(id){const spec=T[id];if(!spec)return;const p=spec.build();st.programs=Array.isArray(st.programs)?st.programs:[];st.programs.push(p);save();if(typeof openProgramEditor==='function')openProgramEditor(p.id,0,0);if(typeof toast==='function')toast('Шаблон добавлен в мои программы')};
  function html(){return `<div class="section">ДЛЯ ДЕВУШЕК · АКЦЕНТ НА ЯГОДИЦЫ</div><div class="muted small" style="margin:0 8px 10px">Рабочие веса оставлены пустыми: первая тренировка задаёт стартовые веса, дальше можно использовать автопрогрессию по RPE.</div>${Object.entries(T).map(([id,p])=>`<div class="card"><div class="row between"><div class="grow"><b>${esc(p.title)}</b><div class="muted small" style="margin-top:4px">${esc(p.meta)}</div></div><button class="btn tiny primary" onclick="createFemaleTemplateProgram('${id}')">Добавить</button></div></div>`).join('')}`}

  function patch(){
    const current=window.templatesSheet||(()=>{try{return templatesSheet}catch(e){return null}})();
    if(typeof current!=='function'||current.__femaleTemplates)return false;
    const base=current;
    const wrapped=function(){const r=base.apply(this,arguments);const sh=document.querySelector('#sheet');if(sh&&!sh.querySelector('.female-template-section')){const wrap=document.createElement('div');wrap.className='female-template-section';wrap.innerHTML=html();sh.appendChild(wrap)}return r};
    wrapped.__femaleTemplates=true;window.templatesSheet=wrapped;try{templatesSheet=wrapped}catch(e){};return true;
  }
  [0,100,400,1000,2200].forEach(t=>setTimeout(patch,t));
})();