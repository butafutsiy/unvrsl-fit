'use strict';
(()=>{
  const W=window,D=document;
  if(W.__unvrslFinalExerciseCatalogV353)return;
  W.__unvrslFinalExerciseCatalogV353=true;

  const norm=v=>String(v??'').toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/[‐‑‒–—-]+/g,' ').replace(/[·•:]+/g,' ').replace(/\s+/g,' ').trim();
  const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const BODY_RU_LOCAL={'upper legs':'Бёдра','lower legs':'Голени','chest':'Грудь','back':'Спина','shoulders':'Плечи','upper arms':'Руки','lower arms':'Предплечья','waist':'Кор','cardio':'Кардио','neck':'Шея'};
  const EQ_RU_LOCAL={'barbell':'Штанга','olympic barbell':'Олимпийская штанга','ez barbell':'EZ-штанга','dumbbell':'Гантели','cable':'Блок','body weight':'Свой вес','leverage machine':'Тренажёр','sled machine':'Жим-платформа','smith machine':'Смит','assisted':'С поддержкой','kettlebell':'Гиря','weighted':'Отягощение','rope':'Канат'};
  const TARGET_RU_LOCAL={'abs':'Пресс','pectorals':'Грудные','lats':'Широчайшие','upper back':'Верх спины','spine':'Разгибатели спины','glutes':'Ягодичные','quads':'Квадрицепсы','hamstrings':'Бицепс бедра','calves':'Икроножные','triceps':'Трицепс','biceps':'Бицепс','delts':'Дельты','forearms':'Предплечья','traps':'Трапеции','adductors':'Приводящие','abductors':'Отводящие','cardiovascular system':'Кардио'};

  const HIP_MEDIA={
    machine:'https://gymvisual.com/img/p/8/7/8/1/8781.gif',
    smith:'https://gymvisual.com/img/p/1/4/9/5/4/14954.gif',
    barbell:'https://gymvisual.com/img/p/5/7/6/1/5761.gif'
  };
  const HIP_TECH={
    machine:'Упрись верхней частью спины в опору и поставь стопы устойчиво на платформу. Опускай таз подконтрольно, сохраняя нейтральное положение позвоночника. Разгибай таз за счёт ягодичных до линии плечи – таз – колени. В верхней точке не переразгибай поясницу и на секунду зафиксируй сокращение ягодичных.',
    smith:'Расположи верх спины на скамье, гриф Смита – над тазом через мягкую накладку. Стопы поставь примерно на ширине таза так, чтобы в верхней точке голени были близки к вертикали. Опускай таз подконтрольно и разгибай его до нейтрального положения корпуса. Не доводи движение за счёт переразгибания поясницы.',
    barbell:'Расположи верх спины на скамье, штангу – над тазом через мягкую накладку. Стопы поставь устойчиво, в верхней точке голени должны быть близки к вертикали. Опускай таз подконтрольно и разгибай его за счёт ягодичных до линии плечи – таз – колени. Удерживай штангу руками и не переразгибай поясницу.'
  };

  const EXTRA=[
    {id:'unvrsl:squat-high-bar',rawId:'unvrsl:squat-high-bar',strictName:'Присед со штангой с высокой постановкой грифа',n:'Присед со штангой с высокой постановкой грифа',bp:'upper legs',eq:'barbell',tg:'quads',virtual:true,instructions:{ru:'Штанга расположена высоко на трапециях. Сохраняй устойчивый корпус и контролируемую глубину приседа.'}},
    {id:'unvrsl:squat-low-bar',rawId:'unvrsl:squat-low-bar',strictName:'Присед со штангой с низкой постановкой грифа',n:'Присед со штангой с низкой постановкой грифа',bp:'upper legs',eq:'barbell',tg:'glutes',virtual:true,instructions:{ru:'Штанга расположена ниже на задней поверхности плечевого пояса. Контролируй наклон корпуса и положение таза.'}},
    {id:'unvrsl:hip-thrust-machine',rawId:'unvrsl:hip-thrust-machine',strictName:'Ягодичный мост в тренажёре',n:'Ягодичный мост в тренажёре',bp:'upper legs',eq:'leverage machine',tg:'glutes',virtual:true,gif:HIP_MEDIA.machine,gif_url:HIP_MEDIA.machine,instructions:{ru:HIP_TECH.machine}},
    {id:'unvrsl:hip-thrust-smith',rawId:'unvrsl:hip-thrust-smith',strictName:'Ягодичный мост в Смите',n:'Ягодичный мост в Смите',bp:'upper legs',eq:'smith machine',tg:'glutes',virtual:true,gif:HIP_MEDIA.smith,gif_url:HIP_MEDIA.smith,instructions:{ru:HIP_TECH.smith}}
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

  function isBarbellHipThrust(e,title=''){
    const hay=norm(`${title} ${e?.n||''} ${e?.strictName||''} ${e?.sourceName||''}`);
    const eq=String(e?.eq||'').toLowerCase();
    return ['barbell','olympic barbell'].includes(eq)&&(/ягодич.*мост|hip thrust|glute bridge/.test(hay));
  }

  function finalRecords(){
    const source=baseRows(),out=[],seen=new Set();
    let squatMedia=null,gluteMedia=null;
    for(const raw of source){
      const before=titleOf(raw);
      if(!squatMedia&&/присед/i.test(before)&&['barbell','olympic barbell'].includes(String(raw?.eq||'').toLowerCase()))squatMedia=raw;
      if(!gluteMedia&&/ягодич|hip thrust|glute bridge/i.test(`${before} ${raw?.n||''}`))gluteMedia=raw;
      const title=canonicalTitle(before);if(!title)continue;
      const key=norm(title);if(seen.has(key))continue;seen.add(key);
      let item={...raw,strictName:title,n:title};
      if(isBarbellHipThrust(raw,title))item={...item,gif:HIP_MEDIA.barbell,gif_url:HIP_MEDIA.barbell,image:'',instructions:{...(raw?.instructions||{}),ru:HIP_TECH.barbell}};
      out.push(item);
    }
    for(const item of EXTRA){
      const key=norm(item.strictName);if(seen.has(key))continue;
      const src=/ягодич/i.test(item.strictName)?gluteMedia:squatMedia;
      out.push({...item,gif:item.gif||src?.gif||src?.gif_url||'',gif_url:item.gif_url||item.gif||src?.gif_url||src?.gif||'',image:item.image||'',sourceId:src?.rawId||src?.id||null});
      seen.add(key);
    }
    return out.sort((a,b)=>titleOf(a).localeCompare(titleOf(b),'ru'));
  }

  function favorite(e){try{return typeof isFavorite==='function'&&isFavorite(recordId(e))}catch(_){return false}}
  function recent(e){try{return Array.isArray(st?.recentExercises)&&st.recentExercises.includes(recordId(e))}catch(_){return false}}
  function eqGroup(e){try{return typeof equipmentGroup==='function'?equipmentGroup(e):String(e?.eq||'')}catch(_){return String(e?.eq||'')}};
  function searchText(e){return norm(`${titleOf(e)} ${e?.n||''} ${bodyName(e)} ${eqName(e)} ${targetName(e)}`)}
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

  function standardDetail(e){
    try{
      const best=typeof bestEstimateFor==='function'?bestEstimateFor(e.n,e.rawId||e.sourceId||null):null;
      if(typeof rmState!=='undefined')rmState={id:e.id,w:best?.w||20,r:best?.r||5};
      if(typeof renderExerciseDetail==='function'){renderExerciseDetail(e);return true}
    }catch(_){ }
    return false;
  }

  W.openFinalVirtualExerciseV352=function(token){
    const id=decodeURIComponent(String(token||'')),e=finalRecords().find(x=>String(x.id)===id);if(!e)return;
    if(standardDetail(e))return;
    const text=typeof e.instructions==='string'?e.instructions:String(e.instructions?.ru||e.instructions?.russian||'');
    const thumb=media(e);
    W.modal?.(`<div class="sheet-grabber"></div><div class="row between"><div><h2>${esc(titleOf(e))}</h2><div class="muted">${esc(bodyName(e))} · ${esc(eqName(e))} · ${esc(targetName(e))}</div></div><button class="btn tiny" onclick="closeModal()">✕</button></div>${thumb?`<div class="exercise-media"><img src="${thumb}" alt="${esc(titleOf(e))}" loading="eager"></div>`:''}<div class="section">ТЕХНИКА ВЫПОЛНЕНИЯ</div><div class="tech-card">${esc(text||'Упражнение из основной базы.')}</div>`);
  };

  function patchFindExercise(){
    let base=null;try{base=W.findExercise||findExercise}catch(_){base=W.findExercise}
    if(typeof base!=='function'||base.__unvrslFinalV353)return;
    const wrapped=function(token){
      const id=decodeURIComponent(String(token||''));
      const own=finalRecords().find(e=>String(e.id)===id);
      return own||base.apply(this,arguments);
    };
    wrapped.__unvrslFinalV353=true;
    W.findExercise=wrapped;try{findExercise=wrapped}catch(_){ }
  }

  let limit=180;const PAGE=180;
  function row(e){
    const t=titleOf(e),thumb=media(e),open=e.virtual?`openFinalVirtualExerciseV352('${encodeURIComponent(e.id)}')`:`openExerciseDetail('${encodeURIComponent(e.id)}')`;
    const star=!e.virtual&&typeof isFavorite==='function'?`<button class="star-btn ${favorite(e)?'on':''}" onclick="event.stopPropagation();toggleFavorite('${esc(recordId(e))}')">★</button>`:'';
    return `<div class="card exlib exlib-btn smart-ex-row" onclick="${open}"><div class="exercise-list-row">${thumb?`<img class="ex-thumb" src="${thumb}" loading="lazy" alt="${esc(t)}">`:''}<div class="grow"><b>${esc(t)}</b><div class="catalog-meta">${esc(bodyName(e))} · ${esc(eqName(e))} · ${esc(targetName(e))}</div></div><div class="smart-row-actions">${star}<span class="chev">›</span></div></div></div>`;
  }
  function render(){
    const el=D.querySelector('#exList');if(!el)return;
    const all=finalRecords(),f=filtered(),shown=f.slice(0,limit);
    el.innerHTML=shown.map(row).join('')+(shown.length<f.length?`<button class="btn full" style="margin:12px 0 4px" onclick="showMoreFinalExercisesV352()">Показать ещё · ${shown.length} из ${f.length}</button>`:'')+(!f.length?'<div class="card muted">По этому фильтру ничего не найдено.</div>':'');
    const c=D.querySelector('#catalogCount');if(c)c.textContent=`Основная база · ${all.length} упражнений${f.length!==all.length?` · найдено ${f.length}`:''}`;
  }

  function install(){
    if(typeof W.UNVRSL_STRICT_CATALOG_V331!=='function')return false;
    W.UNVRSL_FINAL_EXERCISES=finalRecords;
    W.catalogRecords=finalRecords;try{catalogRecords=finalRecords}catch(_){ }
    W.renderExerciseResults=render;try{renderExerciseResults=render}catch(_){ }
    W.showMoreFinalExercisesV352=()=>{limit+=PAGE;render()};
    patchFindExercise();
    if(D.querySelector('#exercises.page.active'))render();
    return true;
  }

  let tries=0;const timer=setInterval(()=>{tries++;if(install()||tries>400)clearInterval(timer)},25);
  install();
})();
