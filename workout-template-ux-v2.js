'use strict';
(()=>{
  if(window.__unvrslWorkoutTemplateUxV2)return;
  window.__unvrslWorkoutTemplateUxV2=true;
  const BUILTIN='__builtin_cycle__';

  const style=document.createElement('style');
  style.id='workout-template-ux-v2-style';
  style.textContent=`
    .unvrsl-time-set{display:grid;grid-template-columns:32px minmax(72px,.8fr) minmax(112px,1.25fr) minmax(70px,.8fr) 42px;gap:8px;align-items:center;margin-top:8px}
    .unvrsl-time-set .work-time{font-size:17px;font-weight:800;text-align:center}.unvrsl-time-set input{width:100%;background:#111113;border:1px solid #343438;border-radius:13px;color:#fff;padding:11px 7px;text-align:center;font-size:16px}
    .unvrsl-glute-template .template-tag{display:inline-flex;margin-top:7px;padding:5px 9px;border-radius:999px;background:rgba(255,55,95,.12);color:#ff6b91;font-size:11px;font-weight:800}
    @media(max-width:390px){.unvrsl-time-set{grid-template-columns:28px 66px minmax(104px,1fr) 66px 40px;gap:6px}.unvrsl-time-set .btn{padding:10px 8px!important;font-size:12px!important}}
  `;
  document.head.appendChild(style);

  function programDeletedKeys(){
    if(!st.deletedProgramKeys||typeof st.deletedProgramKeys!=='object')st.deletedProgramKeys={};
    return st.deletedProgramKeys;
  }
  function programKeys(p){return [p?.id,p?.seedId,p?.cloudPlanId].filter(Boolean).map(String)}
  function isDeletedProgram(p){const d=programDeletedKeys();return programKeys(p).some(k=>d[k])}
  function purgeDeletedPrograms(){
    if(!Array.isArray(st.programs))st.programs=[];
    const before=st.programs.length;
    st.programs=st.programs.filter(p=>p&&!isDeletedProgram(p));
    if(before!==st.programs.length)try{save()}catch(e){}
  }
  purgeDeletedPrograms();
  [400,1200,3000].forEach(t=>setTimeout(purgeDeletedPrograms,t));

  function firstUsableProgram(){return (st.programs||[]).find(p=>p&&!p.archived&&!isDeletedProgram(p))||null}
  function ensurePrimaryAfterDelete(){
    if(st.builtinProgramHidden&&String(st.primaryProgramId||'')===BUILTIN){const p=firstUsableProgram();st.primaryProgramId=p?.id||null;st.startProgramId=p?.id||null}
    if(st.primaryProgramId&&!firstUsableProgram()&&st.builtinProgramHidden){st.primaryProgramId=null;st.startProgramId=null}
  }

  window.trainerDeleteOwnProgram=function(id){
    const p=typeof programById==='function'?programById(id):(st.programs||[]).find(x=>String(x.id)===String(id));
    if(!p)return;
    const note=p.cloudPlanId?'\n\nУже отправленная клиенту версия останется у него, пока ты отдельно не уберёшь её в карточке клиента.':'';
    if(!confirm(`Удалить программу «${p.name||'Программа'}»?${note}`))return;
    const d=programDeletedKeys();programKeys(p).forEach(k=>d[k]=true);
    st.programs=(st.programs||[]).filter(x=>String(x.id)!==String(id));
    if(String(st.primaryProgramId)===String(id)){const next=firstUsableProgram();if(next){st.primaryProgramId=next.id;st.startProgramId=next.id}else if(!st.builtinProgramHidden){st.primaryProgramId=BUILTIN;st.startProgramId=BUILTIN}else{st.primaryProgramId=null;st.startProgramId=null}}
    try{save()}catch(e){}
    if(typeof trainerProgramsPage==='function')trainerProgramsPage();
    if(typeof planPage==='function')planPage();
    if(typeof toast==='function')toast('Программа удалена');
  };
  try{trainerDeleteOwnProgram=window.trainerDeleteOwnProgram}catch(e){}

  window.trainerDeleteBuiltinProgram=function(){
    const name=typeof window.unvrslBuiltInProgramName==='function'?window.unvrslBuiltInProgramName():(st.builtinProgramName||'Встроенный цикл · 8 недель');
    if(!confirm(`Удалить «${name}» из «Моих программ»?\n\nИсходный код цикла останется в приложении, но программа больше не будет показываться и выбираться для старта.`))return;
    st.builtinProgramHidden=true;
    const next=firstUsableProgram();st.primaryProgramId=next?.id||null;st.startProgramId=next?.id||null;
    try{save()}catch(e){}
    if(typeof trainerProgramsPage==='function')trainerProgramsPage();
    if(typeof planPage==='function')planPage();
    if(typeof toast==='function')toast('Встроенная программа удалена');
  };

  const baseTrainerPrograms=window.trainerProgramsPage;
  if(typeof baseTrainerPrograms==='function'){
    const wrapped=function(){
      purgeDeletedPrograms();ensurePrimaryAfterDelete();
      const r=baseTrainerPrograms.apply(this,arguments);
      const root=document.getElementById('programs');if(!root)return r;
      const builtinName=typeof window.unvrslBuiltInProgramName==='function'?window.unvrslBuiltInProgramName():(st.builtinProgramName||'Встроенный цикл · 8 недель');
      const card=[...root.querySelectorAll('.card')].find(c=>(c.textContent||'').includes(builtinName)&&/(встроенная|8 нед)/i.test(c.textContent||''));
      if(card){
        if(st.builtinProgramHidden){card.remove()}
        else{
          const actions=card.querySelector('.coach-actions');
          if(actions&&!actions.querySelector('[data-delete-builtin]')){const b=document.createElement('button');b.type='button';b.className='btn tiny danger';b.dataset.deleteBuiltin='1';b.textContent='Удалить';b.onclick=window.trainerDeleteBuiltinProgram;actions.appendChild(b)}
        }
      }
      return r;
    };
    wrapped.__deletePersistenceV2=true;window.trainerProgramsPage=wrapped;try{trainerProgramsPage=wrapped}catch(e){}
  }

  const basePlanPage=window.planPage;
  if(typeof basePlanPage==='function'){
    const wrapped=function(){
      purgeDeletedPrograms();ensurePrimaryAfterDelete();
      if(st.builtinProgramHidden&&!firstUsableProgram()){
        const root=document.getElementById('plan');if(root)root.innerHTML='<div class="card"><div class="title">Основная программа не выбрана</div><div class="muted" style="margin-top:7px">Добавь программу из шаблонов или создай новую.</div><button class="btn primary full" style="margin-top:14px" onclick="nav(\'programs\');setTimeout(()=>templatesSheet(),100)">Открыть шаблоны</button></div>';
        return;
      }
      return basePlanPage.apply(this,arguments);
    };
    wrapped.__hiddenBuiltinV2=true;window.planPage=wrapped;try{planPage=wrapped}catch(e){}
  }

  function scrubHiddenBuiltinPicker(){
    if(!st.builtinProgramHidden)return;
    const sh=document.getElementById('sheet');if(!sh)return;
    [...sh.querySelectorAll('.start-program-choice')].forEach(b=>{if(/Встроенная/i.test(b.textContent||''))b.remove()});
  }
  const baseOpenPicker=window.openStartProgramPicker;
  if(typeof baseOpenPicker==='function'){
    window.openStartProgramPicker=function(){
      purgeDeletedPrograms();
      const p=firstUsableProgram();
      if(st.builtinProgramHidden&&!p){return typeof toast==='function'?toast('Сначала добавь программу'):undefined}
      if(st.builtinProgramHidden&&String(st.primaryProgramId||'')===BUILTIN){st.primaryProgramId=p.id;st.startProgramId=p.id;try{save()}catch(e){}}
      const r=baseOpenPicker.apply(this,arguments);setTimeout(scrubHiddenBuiltinPicker,0);return r;
    };
  }
  const sheet=document.getElementById('sheet');if(sheet)new MutationObserver(scrubHiddenBuiltinPicker).observe(sheet,{subtree:true,childList:true});

  function formatWork(sec){sec=Math.max(0,Math.round(Number(sec)||0));if(sec>=60&&sec%60===0)return `${sec/60} мин`;const m=Math.floor(sec/60),s=sec%60;return m?`${m}:${String(s).padStart(2,'0')}`:`${s} сек`}
  window.unvrslStartWorkTimer=function(sec){
    const fn=window.timer||((typeof timer==='function')?timer:null);if(!fn||!sec)return;
    const r=fn(sec,' ');setTimeout(()=>{const lab=document.querySelector('#timer .muted.small');if(lab)lab.textContent=''},0);return r;
  };
  window.programWorkTimer=function(sec){return window.unvrslStartWorkTimer(sec)};
  try{programWorkTimer=window.programWorkTimer}catch(e){}

  function patchBuiltInTimed(w,c,beforeId){
    const s=st.current;if(!s||s.id===beforeId||Number(s.w)!==Number(w)||String(s.c)!==String(c))return;
    const routine=(typeof ROUTINES!=='undefined'?ROUTINES:[]).find(r=>Number(r.w)===Number(w)&&String(r.c)===String(c));if(!routine)return;
    (routine.e||[]).forEach((src,i)=>{
      const min=Number(src?.m);if(!(min>0)||!s.ex?.[i])return;
      const e=s.ex[i],sec=Math.round(min*60);e.mode='timer';e.workSeconds=sec;e.d=src.d||e.d||'';e.target=e.target||s.target;
      (e.set||[]).forEach(x=>{x.workSeconds=sec;x.r=0});
    });
    try{save()}catch(e){}
    if(typeof startPage==='function')startPage();
  }
  const baseBegin=window.begin;
  if(typeof baseBegin==='function'&&!baseBegin.__timedBuiltinV2){
    const wrapped=function(w,c){const before=st.current?.id||null,r=baseBegin.apply(this,arguments);patchBuiltInTimed(w,c,before);return r};
    wrapped.__timedBuiltinV2=true;window.begin=wrapped;try{begin=wrapped}catch(e){}
  }

  const baseExerciseCard=window.exerciseCard;
  if(typeof baseExerciseCard==='function'&&!baseExerciseCard.__timedBuiltinV2){
    const wrapped=function(s,e,ei){
      if(e?.mode!=='timer'||s?.antonPlan)return baseExerciseCard.apply(this,arguments);
      const target=e.target||s.target||8;
      const rows=(e.set||[]).map((x,si)=>{const sec=x.workSeconds||e.workSeconds||0;return `<div class="unvrsl-time-set"><span class="setnum">${si+1}</span><b class="work-time">${formatWork(sec)}</b><button class="btn tiny" onclick="unvrslStartWorkTimer(${sec})">▶ Таймер</button><input inputmode="decimal" value="${x.rpe||''}" placeholder="${target}" onchange="editSet(${ei},${si},'rpe',this.value)"><button class="check ${x.ok?'done':''}" onclick="toggleSet(${ei},${si})">${x.ok?'✓':'○'}</button></div>`}).join('');
      return `<div class="exercise"><div class="row between"><div class="grow"><div class="exname">${esc(e.n)}</div>${e.d?`<div class="exnote">${esc(e.d)}</div>`:''}<div class="rest-label">Таймер упражнения</div></div></div><div class="sethead"><span>#</span><span>время</span><span>таймер</span><span>RPE</span><span></span></div>${rows}</div>`;
    };
    wrapped.__timedBuiltinV2=true;window.exerciseCard=wrapped;try{exerciseCard=wrapped}catch(e){}
  }

  const timerLabel=document.querySelector('#timer .muted.small');
  function cleanWorkTimerLabel(){const lab=document.querySelector('#timer .muted.small');if(lab&&(/Работа/i.test(lab.textContent||'')|/%D[0-9A-F]/i.test(lab.textContent||'')))lab.textContent=''}
  if(document.getElementById('timer'))new MutationObserver(cleanWorkTimerLabel).observe(document.getElementById('timer'),{subtree:true,childList:true,characterData:true});
  cleanWorkTimerLabel();

  const RPE_W=[7,7.5,8,6.5,8,8.5,9,7];
  function gx(n,s,r,rpe,rest=90,note=''){return ppEx(n,s,r,{rpe,rest,tempo:'2-0-2',note})}
  function glute3Build(){return {id:uid('prog'),name:'Ягодицы · 3 дня · акцент рост',created:Date.now(),updated:Date.now(),templateCategory:'glutes',meta:'8 недель · 3 дня · ягодицы + бицепс бедра + поддержание верха',weeks:Array.from({length:8},(_,wi)=>{const q=RPE_W[wi];return {n:wi+1,days:[
    ppDay('Низ A · ягодичный мост + квадрицепс',[gx('Ягодичный мост',4,8,q,150),gx('Болгарские выпады',3,10,q,120,'На каждую ногу.'),gx('Жим ногами',3,12,q,120),gx('Разведение ног',3,18,q,60),gx('Разгибание ног',2,15,q,60)]),
    ppDay('Верх + ягодицы',[gx('Тяга верхнего блока',3,10,q,90),gx('Жим гантелей на наклонной',3,10,q,90),gx('Тяга горизонтального блока',3,12,q,90),gx('Махи гантелей в стороны',3,15,q,60),gx('Ягодичный мост в тренажёре',3,12,q,90),gx('Отведение ноги назад в кроссовере',3,15,q,60,'На каждую ногу.')]),
    ppDay('Низ B · растянутая позиция ягодиц',[gx('Румынская тяга',4,8,q,150),gx('Выпады назад',3,10,q,120,'На каждую ногу.'),gx('Зашагивания на тумбу',3,10,q,90,'На каждую ногу.'),gx('Сгибание ног',3,12,q,75),gx('Разведение ног',3,20,q,60)])
  ]}})} }
  function glute4Build(){return {id:uid('prog'),name:'Ягодицы + ноги · 4 дня',created:Date.now(),updated:Date.now(),templateCategory:'glutes',meta:'8 недель · 4 дня · 2 низа + 2 верха',weeks:Array.from({length:8},(_,wi)=>{const q=RPE_W[wi];return {n:wi+1,days:[
    ppDay('Низ A · ягодицы тяжело',[gx('Ягодичный мост',4,6,q,180),gx('Румынская тяга',3,8,q,150),gx('Болгарские выпады',3,8,q,120,'На каждую ногу.'),gx('Разведение ног',3,15,q,60)]),
    ppDay('Верх A',[gx('Тяга верхнего блока',3,10,q,90),gx('Жим гантелей лёжа',3,10,q,90),gx('Тяга горизонтального блока',3,12,q,90),gx('Махи в стороны',3,15,q,60),gx('Отведение на заднюю дельту',3,15,q,60)]),
    ppDay('Низ B · ягодицы объём',[gx('Присед со штангой',3,8,q,150),gx('Жим ногами',3,12,q,120),gx('Выпады назад',3,12,q,90,'На каждую ногу.'),gx('Сгибание ног',3,15,q,75),gx('Отведение ноги назад в кроссовере',3,15,q,60,'На каждую ногу.'),gx('Разведение ног',2,25,q,45)]),
    ppDay('Верх B',[gx('Тяга в наклоне',3,8,q,120),gx('Жим гантелей на наклонной',3,10,q,90),gx('Вертикальная тяга одной рукой',3,12,q,75,'На каждую руку.'),gx('Протяжка на плечи',3,12,q,75),gx('Махи в стороны',3,15,q,60)])
  ]}})} }
  function gluteBeginnerBuild(){return {id:uid('prog'),name:'Ягодицы · начинающий · 3 дня',created:Date.now(),updated:Date.now(),templateCategory:'glutes',meta:'6 недель · 3 дня · простая техника и умеренный объём',weeks:Array.from({length:6},(_,wi)=>{const q=wi===3?6.5:Math.min(8,7+wi*.25);return {n:wi+1,days:[
    ppDay('Низ A',[gx('Ягодичный мост',3,10,q,120),gx('Жим ногами',3,10,q,120),gx('Сгибание ног',3,12,q,75),gx('Разведение ног',3,15,q,60)]),
    ppDay('Верх',[gx('Тяга верхнего блока',3,10,q,90),gx('Жим в тренажёре на грудь',3,10,q,90),gx('Тяга горизонтального блока',3,12,q,90),gx('Махи в стороны',2,15,q,60),gx('Отведение на заднюю дельту',2,15,q,60)]),
    ppDay('Низ B',[gx('Румынская тяга с гантелями',3,10,q,120),gx('Болгарские выпады',3,10,q,90,'На каждую ногу.'),gx('Зашагивания',2,10,q,90,'На каждую ногу.'),gx('Разведение ног',3,18,q,60)])
  ]}})} }
  function gluteShapeBuild(){return {id:uid('prog'),name:'Ягодицы + верх тела · 4 дня',created:Date.now(),updated:Date.now(),templateCategory:'glutes',meta:'8 недель · 4 дня · ягодицы 2×/нед + спина и плечи',weeks:Array.from({length:8},(_,wi)=>{const q=RPE_W[wi];return {n:wi+1,days:[
    ppDay('Ягодицы A',[gx('Ягодичный мост',4,8,q,150),gx('Румынская тяга',3,10,q,150),gx('Болгарские выпады',3,10,q,120),gx('Разведение ног',3,20,q,60)]),
    ppDay('Спина + плечи',[gx('Тяга верхнего блока',4,10,q,90),gx('Тяга горизонтального блока',3,12,q,90),gx('Махи в стороны',4,15,q,60),gx('Отведение на заднюю дельту',3,15,q,60),gx('Сгибание рук',2,12,q,60)]),
    ppDay('Ягодицы B',[gx('Присед со штангой',3,8,q,150),gx('Выпады назад',3,10,q,90),gx('Зашагивания',3,10,q,90),gx('Сгибание ног',3,12,q,75),gx('Отведение ноги назад',3,15,q,60)]),
    ppDay('Грудь + плечи',[gx('Жим гантелей на наклонной',3,10,q,90),gx('Жим гантелей сидя',3,10,q,90),gx('Махи в стороны',3,15,q,60),gx('Тяга верхнего блока узким хватом',3,12,q,90),gx('Разгибание рук на блоке',2,12,q,60)])
  ]}})} }
  const GLUTE_TEMPLATES={glute3:{title:'Ягодицы · 3 дня · акцент рост',meta:'8 недель · 3 дня · основной акцент на ягодичные',build:glute3Build},glute4:{title:'Ягодицы + ноги · 4 дня',meta:'8 недель · 4 дня · 2 тренировки низа',build:glute4Build},gluteBeginner:{title:'Ягодицы · начинающий · 3 дня',meta:'6 недель · мягкий вход и умеренный объём',build:gluteBeginnerBuild},gluteShape:{title:'Ягодицы + верх тела · 4 дня',meta:'8 недель · ягодицы, спина и плечи',build:gluteShapeBuild}};
  window.addGluteTemplateToPrograms=function(id){const spec=GLUTE_TEMPLATES[id];if(!spec)return;const p=spec.build();st.programs.push(p);try{save()}catch(e){};closeModal();if(typeof nav==='function')nav('programs');if(typeof trainerProgramsPage==='function')trainerProgramsPage();if(typeof toast==='function')toast('Программа добавлена в «Мои программы»')};

  window.createFromTemplate=function(id){const t=typeof templateById==='function'?templateById(id):null;if(!t)return;const p=typeof clone==='function'?clone(t):JSON.parse(JSON.stringify(t));p.id=uid('prog');p.name=t.name||'Программа из шаблона';p.created=Date.now();p.updated=Date.now();delete p.sourceProgramId;(p.weeks||[]).forEach(w=>(w.days||[]).forEach(d=>d.id=uid('day')));st.programs.push(p);try{save()}catch(e){};closeModal();if(typeof nav==='function')nav('programs');if(typeof trainerProgramsPage==='function')trainerProgramsPage();toast('Шаблон добавлен в «Мои программы»')};
  try{createFromTemplate=window.createFromTemplate}catch(e){}

  if(typeof POPULAR_PROGRAMS!=='undefined'){
    window.createPopularProgram=function(id){const spec=POPULAR_PROGRAMS[id];if(!spec)return;const p=spec.build();st.programs.push(p);try{save()}catch(e){};closeModal();if(typeof nav==='function')nav('programs');if(typeof trainerProgramsPage==='function')trainerProgramsPage();toast('Программа добавлена в «Мои программы»')};
    try{createPopularProgram=window.createPopularProgram}catch(e){}
  }

  const baseTemplates=window.templatesSheet||((typeof templatesSheet==='function')?templatesSheet:null);
  if(typeof baseTemplates==='function'){
    const wrapped=function(){
      const r=baseTemplates.apply(this,arguments);const sh=document.getElementById('sheet');if(!sh)return r;
      sh.querySelectorAll('button').forEach(b=>{const t=(b.textContent||'').trim();if(t==='Использовать'||t==='Добавить')b.textContent='В мои программы'});
      if(!sh.querySelector('.unvrsl-glute-templates')){
        const box=document.createElement('div');box.className='unvrsl-glute-templates';box.innerHTML='<div class="section">ДЛЯ ДЕВУШЕК · АКЦЕНТ НА ЯГОДИЦЫ</div><div class="muted small" style="margin:0 8px 10px">Рабочие веса не заданы: их можно подобрать по RPE на первой тренировке, дальше работает автопрогрессия.</div>'+Object.entries(GLUTE_TEMPLATES).map(([id,x])=>`<div class="card unvrsl-glute-template"><div class="row between"><div class="grow"><b>${esc(x.title)}</b><div class="muted small" style="margin-top:4px">${esc(x.meta)}</div><span class="template-tag">Ягодицы</span></div><button class="btn tiny primary" onclick="addGluteTemplateToPrograms('${id}')">В мои программы</button></div></div>`).join('');sh.appendChild(box)
      }
      return r;
    };
    window.templatesSheet=wrapped;try{templatesSheet=wrapped}catch(e){}
  }
})();
