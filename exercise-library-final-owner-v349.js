'use strict';
(()=>{
  const W=window,D=document;
  if(W.__unvrslExerciseFinalOwnerV349)return;
  W.__unvrslExerciseFinalOwnerV349=true;

  const base=typeof W.UNVRSL_FINAL_EXERCISES==='function'?W.UNVRSL_FINAL_EXERCISES:null;
  if(!base)return;

  const norm=v=>String(v??'').toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/\s+/g,' ').trim();
  const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const EXTRAS=[
    {id:'unvrsl:hip-thrust-machine',rawId:'unvrsl:hip-thrust-machine',n:'Ягодичный мост в тренажёре',name:'Ягодичный мост в тренажёре',strictName:'Ягодичный мост в тренажёре',bp:'upper legs',eq:'leverage machine',tg:'glutes',custom:false,virtual:true,instructions:{ru:'Выполняй разгибание таза в тренажёре с контролем амплитуды и фиксацией ягодичных в верхней точке.'}},
    {id:'unvrsl:hip-thrust-smith',rawId:'unvrsl:hip-thrust-smith',n:'Ягодичный мост в Смите',name:'Ягодичный мост в Смите',strictName:'Ягодичный мост в Смите',bp:'upper legs',eq:'smith machine',tg:'glutes',custom:false,virtual:true,instructions:{ru:'Выполняй ягодичный мост под грифом Смита, сохраняя устойчивое положение корпуса и полный контроль таза.'}}
  ];
  const BODY_RU_LOCAL={'upper legs':'Бёдра','lower legs':'Голени','chest':'Грудь','back':'Спина','shoulders':'Плечи','upper arms':'Руки','lower arms':'Предплечья','waist':'Кор','cardio':'Кардио','neck':'Шея'};
  const EQ_RU_LOCAL={'barbell':'Штанга','olympic barbell':'Олимпийская штанга','ez barbell':'EZ-штанга','dumbbell':'Гантели','cable':'Блок','body weight':'Свой вес','leverage machine':'Тренажёр','sled machine':'Жим-платформа','smith machine':'Смит','assisted':'С поддержкой','kettlebell':'Гиря','weighted':'Отягощение','rope':'Канат','band':'Резина','medicine ball':'Медбол'};
  const TARGET_RU_LOCAL={'abs':'Пресс','pectorals':'Грудные','lats':'Широчайшие','upper back':'Верх спины','spine':'Разгибатели спины','glutes':'Ягодичные','quads':'Квадрицепсы','hamstrings':'Бицепс бедра','calves':'Икроножные','triceps':'Трицепс','biceps':'Бицепс','delts':'Дельты','forearms':'Предплечья','traps':'Трапеции','adductors':'Приводящие','abductors':'Отводящие','cardiovascular system':'Кардио'};

  const title=e=>String(e?.strictName||e?.finalTitle||e?.nameRu||'').trim()||(()=>{try{return String(W.UNVRSL_CLEAN_TITLE?.(e)||W.ruExerciseName?.(e?.n||e?.name||'')||e?.n||e?.name||'Упражнение').trim()}catch(_){return String(e?.n||e?.name||'Упражнение')}})();
  const body=e=>{const k=String(e?.bp||e?.body_part||'').toLowerCase();try{if(typeof BP_RU==='object'&&BP_RU[k])return BP_RU[k]}catch(_){ }return BODY_RU_LOCAL[k]||String(e?.bp||e?.body_part||'—')};
  const equipment=e=>{const k=String(e?.eq||e?.equipment||'').toLowerCase();try{if(typeof EQ_RU==='object'&&EQ_RU[k])return EQ_RU[k]}catch(_){ }return EQ_RU_LOCAL[k]||String(e?.eq||e?.equipment||'—')};
  const target=e=>{const k=String(e?.tg||e?.target||'').toLowerCase();try{if(typeof ruTarget==='function'){const x=ruTarget(k);if(x)return x}}catch(_){ }return TARGET_RU_LOCAL[k]||String(e?.tg||e?.target||'—')};
  const eqGroup=e=>{try{return typeof equipmentGroup==='function'?equipmentGroup(e):String(e?.eq||'')}catch(_){return String(e?.eq||'')}};
  const fav=e=>{try{return typeof isFavorite==='function'&&isFavorite(String(e?.rawId||e?.id||e?.n||''))}catch(_){return false}};
  const recent=e=>{try{return Array.isArray(st?.recentExercises)&&st.recentExercises.includes(String(e?.rawId||e?.id||e?.n||''))}catch(_){return false}};

  function attachMedia(extra,rows){
    const src=rows.find(e=>/hip thrust|glute bridge|ягодичн.*мост/i.test(`${e?.n||''} ${title(e)}`));
    return {...extra,gif:src?.gif||src?.gif_url||'',gif_url:src?.gif_url||src?.gif||'',image:src?.image||''};
  }
  function records(){
    const rows=base().slice(),seen=new Set(rows.map(e=>norm(title(e)));
    for(const x of EXTRAS){if(!seen.has(norm(x.strictName))){rows.push(attachMedia(x,rows));seen.add(norm(x.strictName))}}
    return rows.sort((a,b)=>title(a).localeCompare(title(b),'ru'));
  }
  function hay(e){return norm(`${title(e)} ${e?.n||''} ${body(e)} ${equipment(e)} ${target(e)}`)};
  function filtered(){
    const q=norm(typeof exQuery==='undefined'?'':exQuery);
    return records().filter(e=>{
      try{
        if(typeof exBody!=='undefined'){
          if(exBody==='favorites'&&!fav(e))return false;
          if(exBody==='recent'&&!recent(e))return false;
          if(exBody==='frequent')return false;
          if(!['all','favorites','recent','frequent'].includes(exBody)&&e.bp!==exBody)return false;
        }
        if(typeof exEquipment!=='undefined'&&exEquipment!=='all'&&eqGroup(e)!==exEquipment)return false;
      }catch(_){ }
      return !q||hay(e).includes(q);
    });
  }
  function media(e){const u=e?.image||e?.gif||e?.gif_url||'';try{return u&&typeof mediaUrl==='function'?mediaUrl(u):u}catch(_){return u}};
  function row(e){
    const t=title(e),thumb=media(e),id=String(e?.id||''),open=e?.virtual?`openFinalVirtualExerciseV349('${encodeURIComponent(id)}')`:`openExerciseDetail('${encodeURIComponent(id.startsWith('og:')?id:`og:${id}`)}')`;
    return `<div class="card exlib exlib-btn smart-ex-row" onclick="${open}"><div class="exercise-list-row">${thumb?`<img class="ex-thumb" src="${esc(thumb)}" loading="lazy" alt="${esc(t)}">`:''}<div class="grow"><b>${esc(t)}</b><div class="catalog-meta">${esc(body(e))} · ${esc(equipment(e))} · ${esc(target(e))}</div></div><div class="smart-row-actions">${!e?.virtual&&typeof isFavorite==='function'?`<button class="star-btn ${fav(e)?'on':''}" onclick="event.stopPropagation();toggleFavorite('${esc(String(e?.rawId||e?.id||e?.n||''))}')">★</button>`:''}<span class="chev">›</span></div></div></div>`;
  }
  let limit=180;const PAGE=180;
  function render(){
    const el=D.querySelector('#exList');if(!el)return;
    const all=records(),f=filtered(),shown=f.slice(0,limit);
    el.innerHTML=shown.map(row).join('')+(shown.length<f.length?`<button class="btn full" style="margin:12px 0 4px" onclick="showMoreFinalOwnerV349()">Показать ещё · ${shown.length} из ${f.length}</button>`:'')+(!f.length?'<div class="card muted">По этому фильтру ничего не найдено.</div>':'');
    const c=D.querySelector('#catalogCount');if(c)c.textContent=`Основная база · ${all.length} упражнений${f.length!==all.length?` · найдено ${f.length}`:''}`;
    D.querySelectorAll('#exercises .catalog-head .chip,#exercises .quality-media-line').forEach(x=>x.remove());
  }
  W.openFinalVirtualExerciseV349=function(token){
    const id=decodeURIComponent(token||''),e=records().find(x=>String(x?.id)===id);if(!e)return;
    const text=String(e?.instructions?.ru||'').trim();
    W.modal?.(`<div class="sheet-grabber"></div><div class="row between"><div><h2>${esc(title(e))}</h2><div class="muted">${esc(body(e))} · ${esc(equipment(e))} · ${esc(target(e))}</div></div><button class="btn tiny" onclick="closeModal()">✕</button></div><div class="card" style="margin-top:16px"><div class="muted">Техника</div><div style="margin-top:7px;line-height:1.45">${esc(text)}</div></div>`);
  };
  W.showMoreFinalOwnerV349=()=>{limit+=PAGE;render()};
  W.UNVRSL_FINAL_EXERCISES=records;
  W.catalogRecords=records;try{catalogRecords=records}catch(_){ }
  W.renderExerciseResults=render;try{renderExerciseResults=render}catch(_){ }

  ['setExerciseQuery','setExerciseBody','setExerciseEquipment'].forEach(k=>{
    const fn=W[k];if(typeof fn!=='function'||fn.__finalOwnerV349)return;
    const wrapped=function(){limit=PAGE;const r=fn.apply(this,arguments);setTimeout(render,0);return r};
    wrapped.__finalOwnerV349=true;W[k]=wrapped;try{globalThis[k]=wrapped}catch(_){ }
  });
  render();
})();