'use strict';
(()=>{
  const W=window,D=document;
  if(W.__unvrslFinalExerciseCatalogV356)return;
  W.__unvrslFinalExerciseCatalogV356=true;

  const norm=v=>String(v??'').toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/[‐‑‒–—-]+/g,' ').replace(/[·•:]+/g,' ').replace(/\s+/g,' ').trim();
  const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const BODY_RU_LOCAL={'upper legs':'Бёдра','lower legs':'Голени','chest':'Грудь','back':'Спина','shoulders':'Плечи','upper arms':'Руки','lower arms':'Предплечья','waist':'Кор','cardio':'Кардио','neck':'Шея'};
  const EQ_RU_LOCAL={'barbell':'Штанга','olympic barbell':'Олимпийская штанга','ez barbell':'EZ-штанга','dumbbell':'Гантели','cable':'Блок','body weight':'Свой вес','leverage machine':'Тренажёр','sled machine':'Жим-платформа','smith machine':'Смит','assisted':'С поддержкой','kettlebell':'Гиря','weighted':'Отягощение','rope':'Канат'};
  const TARGET_RU_LOCAL={'abs':'Пресс','pectorals':'Грудные','lats':'Широчайшие','upper back':'Верх спины','spine':'Разгибатели спины','glutes':'Ягодичные','quads':'Квадрицепсы','hamstrings':'Бицепс бедра','calves':'Икроножные','triceps':'Трицепс','biceps':'Бицепс','delts':'Дельты','forearms':'Предплечья','traps':'Трапеции','adductors':'Приводящие','abductors':'Отводящие','cardiovascular system':'Кардио'};

  const HIP={
    machine:{
      id:'unvrsl:hip-thrust-machine',name:'Ягодичный мост в тренажёре',eq:'leverage machine',gif:'assets/hip-thrust-machine.gif?v=356',
      summary:'Рычажный вариант ягодичного моста с фиксированной траекторией. Удобен для стабильной прогрессии рабочего веса.',
      tech:'Зафиксируй верх спины на опоре и поставь стопы устойчиво на платформу. Опускай таз подконтрольно, сохраняя нейтральное положение позвоночника. Разгибай таз за счёт ягодичных до линии плечи – таз – колени. В верхней точке сделай короткую фиксацию без переразгибания поясницы.',
      cues:['Стопы устойчиво, давление через всю стопу','Подбородок слегка к груди, рёбра не раскрывать','Вверху – сильное сокращение ягодичных без прогиба в пояснице'],
      mistakes:['Толчок поясницей вместо разгибания таза','Слишком далёкая или слишком близкая постановка стоп','Потеря контроля в нижней точке'],
      loadNote:'1ПМ считается по фактически записанному весу тренажёра. Для похожей рычажной конструкции ориентировочная сила на таз составляет около 0,60 × суммарного веса блинов без учёта собственного веса рычага.'
    },
    smith:{
      id:'unvrsl:hip-thrust-smith',name:'Ягодичный мост в Смите',eq:'smith machine',gif:'assets/hip-thrust-smith.gif?v=356',
      summary:'Вариант с фиксированной траекторией грифа. Удобен для контроля техники и последовательной прогрессии веса.',
      tech:'Расположи верх спины на скамье, гриф Смита – над тазом через мягкую накладку. Стопы поставь примерно на ширине таза так, чтобы в верхней точке голени были близки к вертикали. Опускай таз подконтрольно и разгибай его до нейтрального положения корпуса.',
      cues:['Лопатки опираются на край скамьи','Голени в верхней точке близки к вертикали','Пауза около 1 секунды в верхней точке'],
      mistakes:['Слишком высокая скамья и избыточный прогиб','Отталкивание носками вместо всей стопы','Сведение коленей внутрь под нагрузкой']
    },
    barbell:{
      id:'unvrsl:hip-thrust-barbell',name:'Ягодичный мост со штангой',eq:'barbell',gif:'assets/hip-thrust-barbell.gif?v=356',
      summary:'Классический силовой вариант со свободной штангой. Рабочий вес, история и расчётный 1ПМ отслеживаются как у остальных силовых упражнений.',
      tech:'Расположи верх спины на скамье, штангу – над тазом через мягкую накладку. Стопы поставь устойчиво; в верхней точке голени должны быть близки к вертикали. Опускай таз подконтрольно и разгибай его за счёт ягодичных до линии плечи – таз – колени. Удерживай штангу руками и не переразгибай поясницу.',
      cues:['Гриф расположен над тазобедренными суставами','Таз поднимать ягодичными, а не поясницей','Сохранять одинаковую постановку стоп от подхода к подходу'],
      mistakes:['Гиперэкстензия поясницы в верхней точке','Рывок со дна и потеря контроля штанги','Слишком большая амплитуда за счёт движения корпуса']
    }
  };

  const EXTRA=[
    {id:'unvrsl:squat-high-bar',rawId:'unvrsl:squat-high-bar',strictName:'Присед со штангой с высокой постановкой грифа',n:'Присед со штангой с высокой постановкой грифа',bp:'upper legs',eq:'barbell',tg:'quads',virtual:true,instructions:{ru:'Штанга расположена высоко на трапециях. Сохраняй устойчивый корпус и контролируемую глубину приседа.'}},
    {id:'unvrsl:squat-low-bar',rawId:'unvrsl:squat-low-bar',strictName:'Присед со штангой с низкой постановкой грифа',n:'Присед со штангой с низкой постановкой грифа',bp:'upper legs',eq:'barbell',tg:'glutes',virtual:true,instructions:{ru:'Штанга расположена ниже на задней поверхности плечевого пояса. Контролируй наклон корпуса и положение таза.'}},
    {id:HIP.machine.id,rawId:HIP.machine.id,strictName:HIP.machine.name,n:HIP.machine.name,bp:'upper legs',eq:HIP.machine.eq,tg:'glutes',virtual:true,gif:HIP.machine.gif,gif_url:HIP.machine.gif,image:'',instructions:{ru:HIP.machine.tech},unvrslHipKind:'machine'},
    {id:HIP.smith.id,rawId:HIP.smith.id,strictName:HIP.smith.name,n:HIP.smith.name,bp:'upper legs',eq:HIP.smith.eq,tg:'glutes',virtual:true,gif:HIP.smith.gif,gif_url:HIP.smith.gif,image:'',instructions:{ru:HIP.smith.tech},unvrslHipKind:'smith'}
  ];

  const titleOf=e=>String(e?.strictName||e?.n||e?.name||'').trim();
  const bodyName=e=>{const k=String(e?.bp||'').toLowerCase();try{if(typeof BP_RU==='object'&&BP_RU[k])return BP_RU[k]}catch(_){ }return BODY_RU_LOCAL[k]||e?.bp||'—'};
  const eqName=e=>{const k=String(e?.eq||'').toLowerCase();try{if(typeof EQ_RU==='object'&&EQ_RU[k])return EQ_RU[k]}catch(_){ }return EQ_RU_LOCAL[k]||e?.eq||'—'};
  const targetName=e=>{const k=String(e?.tg||'').toLowerCase();try{if(typeof ruTarget==='function'){const v=ruTarget(k);if(v)return v}}catch(_){ }return TARGET_RU_LOCAL[k]||e?.tg||'—'};
  const media=e=>{const u=e?.image||e?.gif||e?.gif_url||'';try{return u&&typeof mediaUrl==='function'?mediaUrl(u):u}catch(_){return u}};
  const recordId=e=>String(e?.rawId||e?.id||e?.n||'');

  function canonicalTitle(raw){
    const t=String(raw||'').trim(),k=norm(t);
    if(!t||k==='прим')return'';
    if(/^(?:\d+[a-zа-я]?|[a-zа-я]\d+)\s*(?:·|\.|:|-)/iu.test(t))return'';
    if(k==='присед со штангой'||k==='приседания со штангой'||k==='глубокий присед со штангой')return'';
    if(k==='присед со штангой high bar'||k==='приседания со штангой high bar')return'Присед со штангой с высокой постановкой грифа';
    if(k==='присед со штангой low bar'||k==='приседания со штангой low bar')return'Присед со штангой с низкой постановкой грифа';
    return t;
  }

  function baseRows(){
    try{
      const fn=W.UNVRSL_STRICT_CATALOG_V331;
      return typeof fn==='function'?(fn()||[]):[];
    }catch(_){return[]}
  }

  function hipKind(e,title=''){
    if(e?.unvrslHipKind)return e.unvrslHipKind;
    const hay=norm(`${e?.id||''} ${e?.rawId||''} ${title} ${e?.n||''} ${e?.strictName||''} ${e?.sourceName||''} ${e?.eq||''}`);
    const hip=/ягодич.*мост|hip thrust|glute bridge|хип траст/.test(hay);
    if(!hip)return'';
    if(/smith|смит/.test(hay))return'smith';
    if(/machine|тренаж|leverage/.test(hay))return'machine';
    if(/barbell|штанг/.test(hay))return'barbell';
    return'';
  }

  function enrichHip(e,kind){
    const d=HIP[kind];if(!d)return e;
    return {...e,strictName:d.name,n:d.name,bp:'upper legs',eq:d.eq,tg:'glutes',gif:d.gif,gif_url:d.gif,image:'',instructions:{...(typeof e?.instructions==='object'?e.instructions:{}),ru:d.tech},unvrslHipKind:kind};
  }

  function finalRecords(){
    const source=baseRows(),out=[],seen=new Set();
    let squatMedia=null;
    for(const raw of source){
      const before=titleOf(raw);
      if(!squatMedia&&/присед/i.test(before)&&['barbell','olympic barbell'].includes(String(raw?.eq||'').toLowerCase()))squatMedia=raw;
      const title=canonicalTitle(before);if(!title)continue;
      let item={...raw,strictName:title,n:title};
      const kind=hipKind(item,title);
      if(kind)item=enrichHip(item,kind);
      const key=norm(titleOf(item));if(seen.has(key))continue;seen.add(key);
      out.push(item);
    }
    for(const item of EXTRA){
      const key=norm(item.strictName);if(seen.has(key))continue;
      const src=/присед/i.test(item.strictName)?squatMedia:null;
      out.push({...item,gif:item.gif||src?.gif||src?.gif_url||'',gif_url:item.gif_url||item.gif||src?.gif_url||src?.gif||'',image:item.image||src?.image||'',sourceId:src?.rawId||src?.id||null});
      seen.add(key);
    }
    return out.sort((a,b)=>titleOf(a).localeCompare(titleOf(b),'ru'));
  }

  function favorite(e){try{return typeof isFavorite==='function'&&isFavorite(recordId(e))}catch(_){return false}}
  function recent(e){try{return Array.isArray(st?.recentExercises)&&st.recentExercises.includes(recordId(e))}catch(_){return false}}
  function eqGroup(e){try{return typeof equipmentGroup==='function'?equipmentGroup(e):String(e?.eq||'')}catch(_){return String(e?.eq||'')}};
  function searchText(e){const kind=hipKind(e);const aliases=kind?' ягодичный мост хип траст хип-траст hip thrust glute bridge':'';return norm(`${titleOf(e)} ${e?.n||''} ${bodyName(e)} ${eqName(e)} ${targetName(e)}${aliases}`)}
  function filtered(){
    const q=norm(typeof exQuery==='undefined'?'':exQuery);
    return finalRecords().filter(e=>{
      try{
        if(typeof exBody!=='undefined'){
          if(exBody==='favorites'&&!favorite(e))return false;
          if(exBody==='recent'&&!recent(e))return false;
          if(!['all','favorites','recent','frequent'].includes(exBody)&&e.bp!==exBody)return false;
        }
        if(typeof exEquipment!=='undefined'&&exEquipment!=='all'&&eqGroup(e)!==exEquipment)return false;
      }catch(_){ }
      return !q||searchText(e).includes(q);
    });
  }

  function hipExtrasHtml(kind){
    const d=HIP[kind];if(!d)return'';
    const points=(label,items,mark)=>`<div class="section">${label}</div><div class="card" style="padding:12px 14px">${items.map(x=>`<div style="display:flex;gap:9px;align-items:flex-start;padding:7px 0"><b style="min-width:14px">${mark}</b><span>${esc(x)}</span></div>`).join('')}</div>`;
    return `<div class="unvrsl-hip-extra-v356"><div class="card" style="padding:13px 15px;line-height:1.45">${esc(d.summary)}</div>${kind==='machine'?`<div class="card muted" style="padding:12px 14px;line-height:1.45">${esc(d.loadNote)}</div>`:''}${points('КЛЮЧЕВЫЕ АКЦЕНТЫ',d.cues,'✓')}${points('ЧАСТЫЕ ОШИБКИ',d.mistakes,'×')}</div>`;
  }

  function decorateHipDetail(kind){
    if(!kind)return;
    const sheet=D.getElementById('sheet');if(!sheet||sheet.querySelector('.unvrsl-hip-extra-v356'))return;
    const rm=[...sheet.querySelectorAll('.section')].find(x=>/РАСЧ[ЁЕ]ТНЫЙ\s*1ПМ/i.test(x.textContent||''));
    const html=hipExtrasHtml(kind);
    if(rm)rm.insertAdjacentHTML('beforebegin',html);else sheet.insertAdjacentHTML('beforeend',html);
    const source=sheet.querySelector('.source-note');
    if(source)source.textContent='Анимация и редакция техники: UNVRSL FIT.';
  }

  function openHip(e){
    try{
      const key=e.raw||e.n,best=typeof bestEstimateFor==='function'?bestEstimateFor(key,e.rawId||e.sourceId||null):null;
      if(typeof rmState!=='undefined')rmState={id:e.id,w:best?.w||20,r:best?.r||5};
      if(typeof renderExerciseDetail==='function'){renderExerciseDetail(e);decorateHipDetail(hipKind(e));return true}
    }catch(_){ }
    return false;
  }

  W.openFinalHipExerciseV356=function(token){
    const id=decodeURIComponent(String(token||'')),e=finalRecords().find(x=>String(x.id)===id||String(x.rawId)===id);if(!e)return;
    if(openHip(e))return;
  };

  W.openFinalVirtualExerciseV356=function(token){
    const id=decodeURIComponent(String(token||'')),e=finalRecords().find(x=>String(x.id)===id);if(!e)return;
    const text=typeof e.instructions==='string'?e.instructions:String(e.instructions?.ru||e.instructions?.russian||'');
    W.modal?.(`<div class="sheet-grabber"></div><div class="row between"><div><h2>${esc(titleOf(e))}</h2><div class="muted">${esc(bodyName(e))} · ${esc(eqName(e))} · ${esc(targetName(e))}</div></div><button class="btn tiny" onclick="closeModal()">✕</button></div><div class="card" style="margin-top:16px"><div class="muted">Техника</div><div style="margin-top:7px;line-height:1.45">${esc(text||'Упражнение из основной базы.')}</div></div>`);
  };

  let limit=180;const PAGE=180;
  function row(e){
    const t=titleOf(e),thumb=media(e),kind=hipKind(e);
    const open=kind?`openFinalHipExerciseV356('${encodeURIComponent(e.id)}')`:e.virtual?`openFinalVirtualExerciseV356('${encodeURIComponent(e.id)}')`:`openExerciseDetail('${encodeURIComponent(e.id)}')`;
    const star=!e.virtual&&typeof isFavorite==='function'?`<button class="star-btn ${favorite(e)?'on':''}" onclick="event.stopPropagation();toggleFavorite('${esc(recordId(e))}')">★</button>`:'';
    return `<div class="card exlib exlib-btn smart-ex-row" onclick="${open}"><div class="exercise-list-row">${thumb?`<img class="ex-thumb" src="${thumb}" loading="lazy" alt="${esc(t)}">`:''}<div class="grow"><b>${esc(t)}</b><div class="catalog-meta">${esc(bodyName(e))} · ${esc(eqName(e))} · ${esc(targetName(e))}</div></div><div class="smart-row-actions">${star}<span class="chev">›</span></div></div></div>`;
  }
  function render(){
    const el=D.querySelector('#exList');if(!el)return;
    const all=finalRecords(),f=filtered(),shown=f.slice(0,limit);
    el.innerHTML=shown.map(row).join('')+(shown.length<f.length?`<button class="btn full" style="margin:12px 0 4px" onclick="showMoreFinalExercisesV356()">Показать ещё · ${shown.length} из ${f.length}</button>`:'')+(!f.length?'<div class="card muted">По этому фильтру ничего не найдено.</div>':'');
    const c=D.querySelector('#catalogCount');if(c)c.textContent=`Основная база · ${all.length} упражнений${f.length!==all.length?` · найдено ${f.length}`:''}`;
  }

  function install(){
    if(typeof W.UNVRSL_STRICT_CATALOG_V331!=='function')return false;
    W.UNVRSL_FINAL_EXERCISES=finalRecords;
    W.catalogRecords=finalRecords;try{catalogRecords=finalRecords}catch(_){ }
    W.renderExerciseResults=render;try{renderExerciseResults=render}catch(_){ }
    W.showMoreFinalExercisesV356=()=>{limit+=PAGE;render()};
    if(D.querySelector('#exercises.page.active'))render();
    return true;
  }

  let tries=0;const timer=setInterval(()=>{tries++;if(install()||tries>400)clearInterval(timer)},25);
  install();
})();
