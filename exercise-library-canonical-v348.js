'use strict';
(()=>{
  const W=window,D=document;
  if(W.__unvrslCanonicalExerciseLibraryV348)return;
  W.__unvrslCanonicalExerciseLibraryV348=true;

  const clean=s=>String(s||'').toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/\([^)]*\)/g,' ').replace(/[_–—-]+/g,' ').replace(/[·•:]+/g,' ').replace(/\s+/g,' ').trim();
  const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const RM_EQ=new Set(['barbell','olympic barbell','ez barbell','dumbbell','cable','leverage machine','sled machine','smith machine','kettlebell','weighted','rope']);
  const ALLOWED_EQ=new Set([...RM_EQ,'body weight','assisted','band','medicine ball']);
  const JUNK=/(stretch|mobility|warm.?up|cool.?down|yoga|pilates|foam roll|massage|neck bridge|finger|ankle circle|balance board|bosu|stability ball|swiss ball|exercise ball|suspension|trx|archer|typewriter|commando|muscle.?up|handstand|planche|human flag|iron cross|dragon flag|burpee|clean and jerk|power clean|hang clean|snatch|overhead squat|plyometric|pistol squat|sissy squat|zercher|jefferson|bear crawl|crab walk|scorpion|windmill|donkey calf|frog pump|kneeling jump|battle rope|battling rope|bench dip|bench hip extension|basic toe touch|body up)/i;
  const EXACT={
    '3/4 sit up':'Скручивания 3/4','air bike':'Велосипедные скручивания','barbell bench press':'Жим штанги лёжа',
    'barbell incline bench press':'Жим штанги на наклонной скамье','barbell decline bench press':'Жим штанги на скамье с отрицательным наклоном',
    'barbell deadlift':'Становая тяга со штангой','barbell romanian deadlift':'Румынская тяга со штангой','barbell bent over row':'Тяга штанги в наклоне',
    'barbell front squat':'Фронтальный присед со штангой','barbell full squat':'Приседания со штангой','dumbbell bench press':'Жим гантелей лёжа',
    'dumbbell incline bench press':'Жим гантелей на наклонной скамье','dumbbell shoulder press':'Жим гантелей над головой',
    'dumbbell lateral raise':'Махи гантелями в стороны','dumbbell hammer curl':'Молотковые сгибания с гантелями','pull up':'Подтягивания',
    'chin up':'Подтягивания обратным хватом','push up':'Отжимания','lever leg extension':'Разгибание ног в тренажёре',
    'lever lying leg curl':'Сгибание ног лёжа в тренажёре','lever seated leg curl':'Сгибание ног сидя в тренажёре',
    'cable lat pulldown':'Тяга верхнего блока','cable seated row':'Горизонтальная тяга нижнего блока','plank':'Планка','side plank':'Боковая планка'
  };
  const CANONICAL=new Map([
    ['присед со штангой high bar','Присед со штангой с высокой постановкой грифа'],
    ['приседания со штангой high bar','Присед со штангой с высокой постановкой грифа'],
    ['присед со штангой low bar','Присед со штангой с низкой постановкой грифа'],
    ['приседания со штангой low bar','Присед со штангой с низкой постановкой грифа'],
    ['махи гантелей в стороны','Махи гантелями в стороны'],
    ['зашагивания с гантелями','Зашагивания на платформу с гантелями'],
    ['разведение на заднюю дельту','Разведение гантелей на заднюю дельту'],
    ['кардио лестница','Лестница / StairMaster'],
    ['лестница stairmaster','Лестница / StairMaster']
  ]);
  const EXTRA=[
    {id:'unvrsl:squat-high-bar',rawId:'unvrsl:squat-high-bar',n:'Присед со штангой с высокой постановкой грифа',strictName:'Присед со штангой с высокой постановкой грифа',bp:'upper legs',eq:'barbell',tg:'quads',virtual:true,instructions:{ru:'Штанга расположена высоко на трапециях. Сохраняй устойчивый корпус и контролируемую глубину приседа.'}},
    {id:'unvrsl:squat-low-bar',rawId:'unvrsl:squat-low-bar',n:'Присед со штангой с низкой постановкой грифа',strictName:'Присед со штангой с низкой постановкой грифа',bp:'upper legs',eq:'barbell',tg:'glutes',virtual:true,instructions:{ru:'Штанга расположена ниже на задней поверхности плечевого пояса. Контролируй наклон корпуса и положение таза.'}},
    {id:'unvrsl:hip-thrust-machine',rawId:'unvrsl:hip-thrust-machine',n:'Ягодичный мост в тренажёре',strictName:'Ягодичный мост в тренажёре',bp:'upper legs',eq:'leverage machine',tg:'glutes',virtual:true,instructions:{ru:'Разгибай таз в тренажёре с контролем амплитуды и фиксацией ягодичных в верхней точке.'}},
    {id:'unvrsl:hip-thrust-smith',rawId:'unvrsl:hip-thrust-smith',n:'Ягодичный мост в Смите',strictName:'Ягодичный мост в Смите',bp:'upper legs',eq:'smith machine',tg:'glutes',virtual:true,instructions:{ru:'Выполняй ягодичный мост под грифом Смита, сохраняя устойчивое положение корпуса и полный контроль таза.'}}
  ];
  const BODY_RU={'upper legs':'Бёдра','lower legs':'Голени','chest':'Грудь','back':'Спина','shoulders':'Плечи','upper arms':'Руки','lower arms':'Предплечья','waist':'Кор','cardio':'Кардио','neck':'Шея'};
  const EQ_RU_LOCAL={'barbell':'Штанга','olympic barbell':'Олимпийская штанга','ez barbell':'EZ-штанга','dumbbell':'Гантели','cable':'Блок','body weight':'Свой вес','leverage machine':'Тренажёр','sled machine':'Жим-платформа','smith machine':'Смит','assisted':'С поддержкой','kettlebell':'Гиря','weighted':'Отягощение','rope':'Канат','band':'Резина','medicine ball':'Медбол'};
  const TARGET_RU={'abs':'Пресс','pectorals':'Грудные','lats':'Широчайшие','upper back':'Верх спины','spine':'Разгибатели спины','glutes':'Ягодичные','quads':'Квадрицепсы','hamstrings':'Бицепс бедра','calves':'Икроножные','triceps':'Трицепс','biceps':'Бицепс','delts':'Дельты','forearms':'Предплечья','traps':'Трапеции','adductors':'Приводящие','abductors':'Отводящие','cardiovascular system':'Кардио'};

  function ruInstruction(e){const i=e?.instructions||{};return typeof i==='string'?i.trim():String(i.ru||i.russian||'').trim()}
  function hasGif(e){return !!String(e?.gif||e?.gif_url||e?.image||'').trim()}
  function sourceTitle(e){
    const raw=String(e?.n||e?.name||'').trim(),key=clean(raw);
    if(EXACT[key])return EXACT[key];
    try{if(typeof W.UNVRSL_CLEAN_TITLE==='function'){const t=String(W.UNVRSL_CLEAN_TITLE(e)||'').trim();if(t&&/[А-Яа-яЁё]/.test(t))return t}}catch(_){ }
    try{if(typeof W.ruExerciseName==='function'){const t=String(W.ruExerciseName(raw)||'').trim();if(t&&/[А-Яа-яЁё]/.test(t)&&!/\b(bench|body|basic|battle|battling|touch|dip|rope|extension)\b/i.test(t))return t}}catch(_){ }
    return'';
  }
  function canonicalTitle(value){
    let title=String(value||'').trim().replace(/\s+/g,' ');if(!title)return'';
    if(/^(?:\d+[a-zа-я]?|[a-zа-я]\d+)\s*(?:·|\.|:|-)/iu.test(title))return'';
    if(/^кардио\s*(?:·|:|-)/iu.test(title))return'';
    let k=clean(title);if(!k||k==='прим')return'';
    if(k==='аэробайк a2')return'Аэробайк';
    if(k==='приседания со штангой'||k==='присед со штангой'||k==='глубокий присед со штангой')return'';
    return CANONICAL.get(k)||title;
  }
  function valid(e){
    if(!e||e.custom||e.anatome)return false;
    const eq=String(e.eq||e.equipment||'').toLowerCase();
    return ALLOWED_EQ.has(eq)&&hasGif(e)&&!!ruInstruction(e)&&!JUNK.test(clean(e.n||e.name))&&!!canonicalTitle(sourceTitle(e));
  }
  function baseRecords(){
    const src=Array.isArray(W.ogLibrary)?W.ogLibrary:(typeof ogLibrary!=='undefined'&&Array.isArray(ogLibrary)?ogLibrary:[]),out=[],seen=new Set();
    for(const raw of src){
      if(!valid(raw))continue;
      const title=canonicalTitle(sourceTitle(raw));if(!title)continue;
      const eq=String(raw.eq||raw.equipment||'').toLowerCase(),key=`${clean(title)}|${eq}`;
      if(seen.has(key))continue;seen.add(key);
      out.push({...raw,id:String(raw.id).startsWith('og:')?String(raw.id):`og:${raw.id}`,rawId:raw.rawId||raw.id,strictName:title,custom:false});
    }
    return out;
  }
  function attachThumbs(rows){
    const glute=rows.find(e=>/ягодичн.*мост|hip thrust|glute bridge/i.test(`${e.strictName||''} ${e.n||''}`));
    const squat=rows.find(e=>/присед/i.test(e.strictName||'')&&['barbell','olympic barbell'].includes(String(e.eq||'').toLowerCase()));
    return EXTRA.map(x=>{
      const src=/ягодич/i.test(x.strictName)?glute:squat;
      return {...x,gif:src?.gif||src?.gif_url||'',gif_url:src?.gif_url||src?.gif||'',image:src?.image||'',sourceId:src?.id||null};
    });
  }
  function allRecords(){
    const base=baseRecords(),out=base.slice(),seen=new Set(base.map(e=>`${clean(e.strictName)}|${String(e.eq||'').toLowerCase()}`));
    for(const x of attachThumbs(base)){const key=`${clean(x.strictName)}|${String(x.eq||'').toLowerCase()}`;if(!seen.has(key)){out.push(x);seen.add(key)}}
    return out.sort((a,b)=>String(a.strictName||'').localeCompare(String(b.strictName||''),'ru'));
  }

  const id=e=>String(e.rawId||e.id||e.n||'');
  const fav=e=>typeof W.isFavorite==='function'&&W.isFavorite(id(e));
  const recent=e=>{try{return Array.isArray(st?.recentExercises)&&st.recentExercises.includes(id(e))}catch(_){return false}};
  const eqGroup=e=>{try{return typeof equipmentGroup==='function'?equipmentGroup(e):String(e.eq||'')}catch(_){return String(e.eq||'')}};
  const bodyName=e=>{const k=String(e.bp||'').toLowerCase();try{if(typeof BP_RU==='object'&&BP_RU[k])return BP_RU[k]}catch(_){ }return BODY_RU[k]||e.bp||'—'};
  const eqName=e=>{const k=String(e.eq||'').toLowerCase();try{if(typeof EQ_RU==='object'&&EQ_RU[k])return EQ_RU[k]}catch(_){ }return EQ_RU_LOCAL[k]||e.eq||'—'};
  const targetName=e=>{const k=String(e.tg||'').toLowerCase();try{if(typeof ruTarget==='function'){const v=ruTarget(k);if(v)return v}}catch(_){ }return TARGET_RU[k]||e.tg||'—'};
  function hay(e){return clean(`${e.strictName||''} ${e.n||''} ${bodyName(e)} ${eqName(e)} ${targetName(e)}`)}
  function filtered(){
    const q=clean(typeof exQuery==='undefined'?'':exQuery);
    return allRecords().filter(e=>{
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
  function media(e){const u=e.image||e.gif||e.gif_url||'';try{return u&&typeof mediaUrl==='function'?mediaUrl(u):u}catch(_){return u}}
  function row(e){
    const t=e.strictName||e.n||'Упражнение',thumb=media(e),open=e.virtual?`openCanonicalVirtualExerciseV348('${encodeURIComponent(e.id)}')`:`openExerciseDetail('${encodeURIComponent(e.id)}')`;
    const star=!e.virtual&&typeof W.isFavorite==='function'?`<button class="star-btn ${fav(e)?'on':''}" onclick="event.stopPropagation();toggleFavorite('${esc(id(e))}')">★</button>`:'';
    return `<div class="card exlib exlib-btn smart-ex-row" onclick="${open}"><div class="exercise-list-row">${thumb?`<img class="ex-thumb" src="${esc(thumb)}" loading="lazy" alt="${esc(t)}">`:''}<div class="grow"><b>${esc(t)}</b><div class="catalog-meta">${esc(bodyName(e))} · ${esc(eqName(e))} · ${esc(targetName(e))}</div></div><div class="smart-row-actions">${star}<span class="chev">›</span></div></div></div>`;
  }
  let limit=180;const PAGE=180;
  function render(){
    const el=D.querySelector('#exList');if(!el)return;
    const all=allRecords(),f=filtered(),shown=f.slice(0,limit);
    el.innerHTML=shown.map(row).join('')+(shown.length<f.length?`<button class="btn full" style="margin:12px 0 4px" onclick="showMoreCanonicalExercisesV348()">Показать ещё · ${shown.length} из ${f.length}</button>`:'')+(!f.length?'<div class="card muted">По этому фильтру ничего не найдено.</div>':'');
    const c=D.querySelector('#catalogCount');if(c)c.textContent=`Основная база · ${all.length} упражнений${f.length!==all.length?` · найдено ${f.length}`:''}`;
    D.querySelectorAll('#exercises .catalog-head .chip,#exercises .quality-media-line').forEach(x=>x.remove());
  }
  W.openCanonicalVirtualExerciseV348=function(token){
    const key=decodeURIComponent(token||''),e=allRecords().find(x=>String(x.id)===key);if(!e)return;
    const text=ruInstruction(e)||'Упражнение добавлено в общую базу.';
    W.modal?.(`<div class="sheet-grabber"></div><div class="row between"><div><h2>${esc(e.strictName||e.n)}</h2><div class="muted">${esc(bodyName(e))} · ${esc(eqName(e))} · ${esc(targetName(e))}</div></div><button class="btn tiny" onclick="closeModal()">✕</button></div><div class="card" style="margin-top:16px"><div class="muted">Техника</div><div style="margin-top:7px;line-height:1.45">${esc(text)}</div></div>`);
  };
  W.showMoreCanonicalExercisesV348=()=>{limit+=PAGE;render()};
  W.UNVRSL_FINAL_EXERCISES=allRecords;
  W.UNVRSL_CANONICAL_EXERCISES_V348=allRecords;
  W.catalogRecords=allRecords;try{catalogRecords=allRecords}catch(_){ }
  W.renderExerciseResults=render;try{renderExerciseResults=render}catch(_){ }

  ['setExerciseQuery','setExerciseBody','setExerciseEquipment'].forEach(k=>{
    const fn=W[k];if(typeof fn!=='function'||fn.__canonicalV348)return;
    const wrapped=function(){limit=PAGE;const r=fn.apply(this,arguments);setTimeout(render,0);return r};
    wrapped.__canonicalV348=true;W[k]=wrapped;try{globalThis[k]=wrapped}catch(_){ }
  });
  let tries=0;const timer=setInterval(()=>{
    tries++;
    if(D.querySelector('#exercises.page.active'))render();
    if(allRecords().length>150&&tries>12)clearInterval(timer);
    if(tries>120)clearInterval(timer);
  },150);
  setTimeout(()=>{if(D.querySelector('#exercises.page.active'))render()},50);
})();