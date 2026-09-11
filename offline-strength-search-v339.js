'use strict';
(()=>{
  const W=window,D=document,REV=343;
  if(W.__unvrslOfflineStrengthSearchV343)return;
  W.__unvrslOfflineStrengthSearchV343=true;

  const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const norm=v=>String(v??'').toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/[‐‑‒–—-]+/g,' ').replace(/[()]/g,' ').replace(/[·•:]+/g,' ').replace(/\s+/g,' ').trim();
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));

  // Те же закреплённые русские названия, которые использует основная библиотека упражнений.
  const EXACT=Object.freeze({
    '3/4 sit up':'Скручивания 3/4',
    'air bike':'Велосипедные скручивания',
    'barbell bench press':'Жим штанги лёжа',
    'barbell incline bench press':'Жим штанги на наклонной скамье',
    'barbell decline bench press':'Жим штанги на скамье с отрицательным наклоном',
    'barbell deadlift':'Становая тяга со штангой',
    'barbell romanian deadlift':'Румынская тяга со штангой',
    'barbell bent over row':'Тяга штанги в наклоне',
    'barbell front squat':'Фронтальный присед со штангой',
    'barbell full squat':'Приседания со штангой',
    'dumbbell bench press':'Жим гантелей лёжа',
    'dumbbell incline bench press':'Жим гантелей на наклонной скамье',
    'dumbbell shoulder press':'Жим гантелей над головой',
    'dumbbell lateral raise':'Махи гантелями в стороны',
    'dumbbell hammer curl':'Молотковые сгибания с гантелями',
    'pull up':'Подтягивания',
    'chin up':'Подтягивания обратным хватом',
    'push up':'Отжимания',
    'lever leg extension':'Разгибание ног в тренажёре',
    'lever lying leg curl':'Сгибание ног лёжа в тренажёре',
    'lever seated leg curl':'Сгибание ног сидя в тренажёре',
    'cable lat pulldown':'Тяга верхнего блока',
    'cable seated row':'Горизонтальная тяга нижнего блока',
    'plank':'Планка',
    'side plank':'Боковая планка'
  });

  const EXTRA=Object.freeze([
    {title:'Ягодичный мостик в тренажёре',body:'Бёдра',equipment:'Тренажёр',target:'Ягодичные',extra:true},
    {title:'Ягодичный мостик в Смите',body:'Бёдра',equipment:'Смит',target:'Ягодичные',extra:true},
    {title:'Присед со штангой с высокой постановкой грифа',body:'Бёдра',equipment:'Штанга',target:'Квадрицепсы',extra:true},
    {title:'Присед со штангой с низкой постановкой грифа',body:'Бёдра',equipment:'Штанга',target:'Ягодичные',extra:true}
  ]);

  const ALIASES=Object.freeze({
    'Присед со штангой с высокой постановкой грифа':['high bar','high-bar','хай бар','высокая постановка','высокий гриф'],
    'Присед со штангой с низкой постановкой грифа':['low bar','low-bar','лоу бар','низкая постановка','низкий гриф'],
    'Ягодичный мостик в тренажёре':['ягодичный мост','ягодичный мостик','хип траст','hip thrust','hip thrust machine','machine hip thrust'],
    'Ягодичный мостик в Смите':['ягодичный мост смит','ягодичный мостик смит','хип траст смит','hip thrust smith','smith hip thrust'],
    'Лестница / StairMaster':['лестница','stairmaster','stair master','степпер'],
    'Молотковые сгибания с гантелями':['молотки','hammer curl','hammer curls'],
    'Лыжный тренажёр':['лыжи','ski erg','skierg'],
    'Аэробайк':['airbike','air bike','assault bike']
  });

  const BODY_RU=Object.freeze({
    'upper legs':'Бёдра','lower legs':'Голени','chest':'Грудь','back':'Спина','shoulders':'Плечи',
    'upper arms':'Руки','lower arms':'Предплечья','waist':'Кор','cardio':'Кардио','neck':'Шея'
  });
  const EQ_RU=Object.freeze({
    'barbell':'Штанга','olympic barbell':'Олимпийская штанга','ez barbell':'EZ-штанга','dumbbell':'Гантели',
    'cable':'Блок','body weight':'Свой вес','leverage machine':'Тренажёр','sled machine':'Жим-платформа',
    'smith machine':'Смит','assisted':'С поддержкой','kettlebell':'Гиря','weighted':'Отягощение','rope':'Канат',
    'band':'Резина','medicine ball':'Медбол'
  });
  const TARGET_RU=Object.freeze({
    'abs':'Пресс','pectorals':'Грудные','pectoralis major':'Грудные','lats':'Широчайшие','upper back':'Верх спины',
    'spine':'Разгибатели спины','glutes':'Ягодичные','quads':'Квадрицепсы','hamstrings':'Бицепс бедра',
    'calves':'Икроножные','triceps':'Трицепс','biceps':'Бицепс','delts':'Дельты','forearms':'Предплечья',
    'traps':'Трапеции','adductors':'Приводящие','abductors':'Отводящие','hip flexors':'Сгибатели бедра',
    'cardiovascular system':'Кардио','serratus anterior':'Передняя зубчатая'
  });

  function sourceRows(){
    try{
      const fn=W.UNVRSL_FINAL_EXERCISES;
      const rows=typeof fn==='function'?fn():[];
      return Array.isArray(rows)?rows:[];
    }catch(_){return[]}
  }

  async function waitForFinalLibrary(){
    let rows=sourceRows();
    if(rows.length>100)return rows;
    try{
      const load=typeof W.loadExerciseDB==='function'?W.loadExerciseDB:(typeof loadExerciseDB==='function'?loadExerciseDB:null);
      if(load)await load();
    }catch(_){ }
    for(let i=0;i<60;i++){
      rows=sourceRows();
      if(rows.length>100)return rows;
      await sleep(100);
    }
    return rows;
  }

  function sourceTitle(e){
    const raw=String(e?.n||e?.name||'').trim();
    const key=norm(raw);
    if(EXACT[key])return EXACT[key];
    try{
      if(typeof W.UNVRSL_CLEAN_TITLE==='function'){
        const t=String(W.UNVRSL_CLEAN_TITLE(e)||'').trim();
        if(t)return t;
      }
    }catch(_){ }
    try{
      if(typeof W.ruExerciseName==='function'){
        const t=String(W.ruExerciseName(raw)||'').trim();
        if(t)return t;
      }
    }catch(_){ }
    return raw;
  }

  function canonicalTitle(value){
    let title=String(value||'').trim().replace(/\s+/g,' ');
    if(!title)return'';
    const k=norm(title);
    if(k==='прим')return'';
    // Служебные подписи из программ не должны попадать в справочник.
    if(/^(?:\d+[a-zа-я]?|[a-zа-я]\d+)\s*(?:·|\.|:|-)/iu.test(title))return'';
    if(/^кардио\s*(?:·|:|-)/iu.test(title))return'';
    if(/^аэробайк\s+a2$/iu.test(title))return'Аэробайк';

    if(k==='присед со штангой high bar'||k==='приседания со штангой high bar')return'Присед со штангой с высокой постановкой грифа';
    if(k==='присед со штангой low bar'||k==='приседания со штангой low bar')return'Присед со штангой с низкой постановкой грифа';
    // Общий присед без постановки грифа не нужен в силовом трекинге.
    if(k==='приседания со штангой'||k==='присед со штангой'||k==='глубокий присед со штангой')return'';
    return title;
  }

  function itemFromRecord(e){
    const title=canonicalTitle(sourceTitle(e));
    if(!title)return null;
    const body=BODY_RU[String(e?.bp||e?.body_part||'').toLowerCase()]||String(e?.bp||e?.body_part||'').trim()||'—';
    const equipment=EQ_RU[String(e?.eq||e?.equipment||'').toLowerCase()]||String(e?.eq||e?.equipment||'').trim()||'—';
    const target=TARGET_RU[String(e?.tg||e?.target||'').toLowerCase()]||String(e?.tg||e?.target||'').trim()||'—';
    return{title,body,equipment,target,raw:String(e?.n||e?.name||''),extra:false};
  }

  function buildItems(rows){
    const map=new Map();
    rows.map(itemFromRecord).filter(Boolean).forEach(item=>{
      map.set(`${norm(item.title)}|${norm(item.equipment)}`,item);
    });
    EXTRA.forEach(item=>{
      const title=canonicalTitle(item.title);
      const next={...item,title};
      const exactKey=`${norm(title)}|${norm(item.equipment)}`;
      if(!map.has(exactKey))map.set(exactKey,next);
    });
    return[...map.values()].sort((a,b)=>a.title.localeCompare(b.title,'ru')||a.equipment.localeCompare(b.equipment,'ru'));
  }

  function aliasesFor(item){return ALIASES[item.title]||[]}
  function score(item,q){
    if(!q)return 100;
    const fields=[item.title,item.body,item.equipment,item.target,item.raw,...aliasesFor(item)].map(norm).filter(Boolean);
    const title=norm(item.title),aliases=aliasesFor(item).map(norm);
    if(title===q)return 0;
    if(title.startsWith(q))return 1;
    if(title.includes(q))return 2;
    if(aliases.some(x=>x===q))return 3;
    if(aliases.some(x=>x.startsWith(q)))return 4;
    if(aliases.some(x=>x.includes(q)))return 5;
    const tokens=q.split(' ').filter(Boolean);
    return tokens.length&&tokens.every(t=>fields.some(x=>x.includes(t)))?6:Infinity;
  }

  function ensureStyle(){
    if(D.getElementById('unvrsl-offline-strength-search-v343-style'))return;
    const s=D.createElement('style');
    s.id='unvrsl-offline-strength-search-v343-style';
    s.textContent=`
      .oss343-search{position:relative;margin:14px 0 10px}.oss343-search input{width:100%;min-height:50px;padding:14px 42px 14px 15px;border:1px solid #343438;border-radius:16px;background:#0f0f11;color:#f5f5f7;font-size:16px;outline:none}.oss343-search input:focus{border-color:rgba(191,90,242,.72);box-shadow:0 0 0 3px rgba(191,90,242,.13)}.oss343-search:after{content:'⌕';position:absolute;right:15px;top:50%;transform:translateY(-52%);color:#777780;font-size:22px;pointer-events:none}.oss343-meta{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 2px 8px;color:#777780;font-size:11px}.oss343-results{max-height:min(48vh,470px);overflow:auto;border:1px solid #303036;border-radius:17px;background:#151517;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}.oss343-results[hidden]{display:none}.oss343-option{display:block;width:100%;min-height:58px;padding:12px 14px;border-bottom:1px solid #29292e;color:#f1f1f3;text-align:left}.oss343-option:last-child{border-bottom:0}.oss343-option:active{background:#25252a}.oss343-option b{display:block;font-size:14px;line-height:1.3;overflow-wrap:anywhere}.oss343-option small{display:block;margin-top:4px;color:#85858d;font-size:11px;line-height:1.3}.oss343-empty{padding:24px 14px;color:#818188;text-align:center;font-size:13px}.oss343-selected{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:11px 0 4px;padding:13px 14px;border:1px solid rgba(191,90,242,.34);border-radius:16px;background:rgba(191,90,242,.09)}.oss343-selected[hidden]{display:none}.oss343-selected small{display:block;color:#9a7cab;font-size:10px;text-transform:uppercase;letter-spacing:.08em}.oss343-selected b{display:block;margin-top:4px;color:#f2e5f8;font-size:14px;line-height:1.3}.oss343-change{flex:0 0 auto;color:#d4a4ea;font-size:12px;font-weight:800}.oss343-submit[disabled]{opacity:.42;pointer-events:none}.oss343-loading{min-height:210px;display:grid;place-items:center;color:#85858d;font-size:13px;text-align:center}@media(max-width:430px){.oss343-results{max-height:42vh}.oss343-option{min-height:56px;padding:11px 12px}}
    `;
    D.head.appendChild(s);
  }

  function loadingSheet(id){
    W.modal?.(`<div class="sheet-grabber"></div><div class="ofp-add-head"><div><h2>Добавить упражнение</h2><div class="muted">Загружаю основную базу упражнений</div></div><button type="button" class="btn tiny" id="oss343LoadingClose">✕</button></div><div class="oss343-loading">Подтягиваю упражнения из раздела «Упражнения»…</div>`);
    D.getElementById('oss343LoadingClose')?.addEventListener('click',()=>W.offlineClientDetail?.(id));
  }

  async function openSearch(id){
    ensureStyle();loadingSheet(id);
    const rows=await waitForFinalLibrary();
    if(rows.length<100){
      const slot=D.querySelector('.oss343-loading');
      if(slot)slot.innerHTML='Не удалось загрузить основную базу упражнений.<br>Закрой окно и попробуй ещё раз.';
      return;
    }
    const sourceCount=rows.length,items=buildItems(rows);
    W.modal?.(`<div class="sheet-grabber"></div><div class="ofp-add-head"><div><h2>Добавить упражнение</h2><div class="muted">Та же база, что в разделе «Упражнения»</div></div><button type="button" class="btn tiny" id="oss343Close">✕</button></div><input id="ofpExerciseName" type="hidden" value=""><div class="oss343-search"><input id="oss343Input" type="search" inputmode="search" enterkeyhint="search" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Поиск упражнения..." aria-label="Поиск упражнения"></div><div class="oss343-selected" id="oss343Selected" hidden><div><small>Выбрано</small><b id="oss343SelectedName"></b></div><button type="button" class="oss343-change" id="oss343Change">Изменить</button></div><div class="oss343-meta"><span id="oss343Count"></span><span>Основная база: ${sourceCount}</span></div><div class="oss343-results" id="oss343Results" role="listbox" aria-label="Упражнения"></div><div class="field"><label>Тренажёр или вариант, если нужен</label><input id="ofpExerciseVariant" placeholder="Например, Matrix или Technogym"></div><div class="ofp-tip">Одинаковое упражнение на разных тренажёрах лучше вести как два показателя – их веса могут быть несопоставимы.</div><button type="button" id="oss343Submit" class="btn primary full oss343-submit" disabled>Добавить и записать результат</button>`);

    const input=D.getElementById('oss343Input'),results=D.getElementById('oss343Results'),count=D.getElementById('oss343Count'),hidden=D.getElementById('ofpExerciseName'),selected=D.getElementById('oss343Selected'),selectedName=D.getElementById('oss343SelectedName'),submit=D.getElementById('oss343Submit');
    if(!input||!results||!hidden||!submit)return;
    let visible=[];

    const render=()=>{
      const q=norm(input.value);
      const ranked=items.map(item=>({item,s:score(item,q)})).filter(x=>Number.isFinite(x.s)).sort((a,b)=>a.s-b.s||a.item.title.localeCompare(b.item.title,'ru')||a.item.equipment.localeCompare(b.item.equipment,'ru'));
      visible=ranked.map(x=>x.item);
      count.textContent=q?`Найдено: ${visible.length}`:`Доступно: ${visible.length}`;
      results.hidden=false;
      results.innerHTML=visible.length?visible.map((item,i)=>`<button type="button" class="oss343-option" data-oss343-index="${i}" role="option"><b>${esc(item.title)}</b><small>${esc(item.body)} · ${esc(item.equipment)} · ${esc(item.target)}</small></button>`).join(''):`<div class="oss343-empty">Ничего не найдено</div>`;
    };
    const choose=item=>{
      if(!item)return;
      hidden.value=item.title;selectedName.textContent=item.title;selected.hidden=false;submit.disabled=false;input.value=item.title;results.hidden=true;count.textContent='Упражнение выбрано';
    };
    const reset=()=>{hidden.value='';selected.hidden=true;submit.disabled=true};

    results.addEventListener('click',e=>{const b=e.target.closest('[data-oss343-index]');if(b)choose(visible[Number(b.dataset.oss343Index)]||null)});
    input.addEventListener('input',()=>{if(hidden.value&&norm(input.value)!==norm(hidden.value))reset();render()});
    input.addEventListener('keydown',e=>{if(e.key==='Enter'&&visible.length){e.preventDefault();choose(visible[0])}});
    D.getElementById('oss343Change')?.addEventListener('click',()=>{reset();input.value='';render();input.focus({preventScroll:true})});
    D.getElementById('oss343Close')?.addEventListener('click',()=>W.offlineClientDetail?.(id));
    submit.addEventListener('click',()=>{if(!hidden.value)return W.toast?.('Выбери упражнение');W.offlineProgressOpenStrengthV321?.(id)});
    render();setTimeout(()=>input.focus({preventScroll:true}),80);
  }

  function install(){
    const cur=W.offlineCustomStrengthSheet;
    if(typeof cur!=='function')return false;
    if(cur.__offlineStrengthSearchV343)return true;
    const patched=id=>openSearch(String(id||''));
    patched.__offlineStrengthSearchV343=true;
    patched.__offlineProgressV328=true;patched.__offlineProgressV324=true;patched.__offlineProgressV323=true;patched.__offlineProgressV322=true;patched.__offlineProgressV321=true;
    W.offlineCustomStrengthSheet=patched;
    return true;
  }

  let tries=0;const timer=setInterval(()=>{tries++;install();if(tries>300)clearInterval(timer)},50);
  [0,150,400,900,1800,3500,7000,12000].forEach(ms=>setTimeout(install,ms));
  W.addEventListener('unvrsl:deferred-modules-ready',install,{passive:true});
  W.UNVRSL_OFFLINE_STRENGTH_SEARCH_V343=Object.freeze({revision:REV,open:openSearch,sourceRows,buildItems});
})();