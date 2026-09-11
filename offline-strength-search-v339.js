'use strict';
(()=>{
  const W=window,D=document,REV=345;
  if(W.__unvrslOfflineStrengthSearchV345)return;
  W.__unvrslOfflineStrengthSearchV345=true;

  const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const norm=v=>String(v??'').toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/[‐‑‒–—-]+/g,' ').replace(/[()]/g,' ').replace(/[·•:]+/g,' ').replace(/\s+/g,' ').trim();
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));

  // База в этом окне должна быть той же самой, что и в разделе «Упражнения».
  // Отдельный curated/picker список здесь больше не используется.
  const EXTRA=Object.freeze([
    {title:'Ягодичный мост в тренажёре',body:'Бёдра',equipment:'Тренажёр',target:'Ягодичные',raw:'machine hip thrust',extra:true},
    {title:'Ягодичный мост в Смите',body:'Бёдра',equipment:'Смит',target:'Ягодичные',raw:'smith hip thrust',extra:true}
  ]);

  const LOCAL_ALIASES=Object.freeze({
    'Ягодичный мост в тренажёре':['ягодичный мостик в тренажере','ягодичный мост тренажер','хип траст в тренажере','hip thrust machine','machine hip thrust'],
    'Ягодичный мост в Смите':['ягодичный мостик в смите','ягодичный мост смит','хип траст в смите','hip thrust smith','smith hip thrust'],
    'Присед со штангой high-bar':['high bar','high-bar','хай бар','высокая постановка','высокий гриф'],
    'Присед со штангой low-bar':['low bar','low-bar','лоу бар','низкая постановка','низкий гриф']
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

  function readCatalog(){
    const candidates=[W.UNVRSL_STRICT_CATALOG_V331,W.catalogRecords,W.UNVRSL_FINAL_EXERCISES];
    for(const source of candidates){
      try{
        const rows=typeof source==='function'?source():Array.isArray(source)?source:[];
        if(Array.isArray(rows)&&rows.length)return rows;
      }catch(_){ }
    }
    return [];
  }

  async function waitForCatalog(){
    let rows=readCatalog();
    if(rows.length>100)return rows;
    try{
      const load=typeof W.loadExerciseDB==='function'?W.loadExerciseDB:(typeof loadExerciseDB==='function'?loadExerciseDB:null);
      if(load)await load();
    }catch(_){ }
    for(let i=0;i<80;i++){
      rows=readCatalog();
      if(rows.length>100)return rows;
      await sleep(100);
    }
    return rows;
  }

  function ruBody(e){
    const key=String(e?.bp||e?.body_part||'').toLowerCase();
    try{if(typeof BP_RU==='object'&&BP_RU?.[key])return BP_RU[key]}catch(_){ }
    return BODY_RU[key]||String(e?.bp||e?.body_part||'').trim()||'—';
  }
  function ruEquipment(e){
    const key=String(e?.eq||e?.equipment||'').toLowerCase();
    try{if(typeof EQ_RU==='object'&&EQ_RU?.[key])return EQ_RU[key]}catch(_){ }
    return EQ_RU[key]||String(e?.eq||e?.equipment||'').trim()||'—';
  }
  function ruTargetName(e){
    const key=String(e?.tg||e?.target||'').toLowerCase();
    try{if(typeof ruTarget==='function'){const v=ruTarget(key);if(v)return v}}catch(_){ }
    return TARGET_RU[key]||String(e?.tg||e?.target||'').trim()||'—';
  }
  function titleOf(e){
    let title=String(e?.strictName||'').trim();
    if(!title){
      const raw=String(e?.n||e?.name||'').trim();
      try{title=String(typeof W.ruExerciseName==='function'?W.ruExerciseName(raw):raw).trim()}catch(_){title=raw}
    }
    if(!title)return'';
    if(/^(?:\d+[a-zа-я]?|[a-zа-я]\d+)\s*(?:·|\.|:|-)/iu.test(title))return'';
    if(norm(title)==='прим')return'';
    return title.replace(/\s+/g,' ').trim();
  }
  function itemFromRecord(e){
    const title=titleOf(e);if(!title)return null;
    return{title,body:ruBody(e),equipment:ruEquipment(e),target:ruTargetName(e),raw:String(e?.n||e?.name||''),extra:false};
  }
  function buildItems(rows){
    const map=new Map();
    (Array.isArray(rows)?rows:[]).map(itemFromRecord).filter(Boolean).forEach(item=>{
      map.set(`${norm(item.title)}|${norm(item.equipment)}`,item);
    });
    EXTRA.forEach(item=>{
      const key=`${norm(item.title)}|${norm(item.equipment)}`;
      if(!map.has(key))map.set(key,item);
    });
    return[...map.values()].sort((a,b)=>a.title.localeCompare(b.title,'ru')||a.equipment.localeCompare(b.equipment,'ru'));
  }
  function aliasesFor(item){
    const own=LOCAL_ALIASES[item.title]||[];
    let registry=[];
    try{registry=W.UNVRSL_EXERCISE_REGISTRY_V331?.aliases?.(item.title)||[]}catch(_){ }
    return[...own,...(Array.isArray(registry)?registry:[])];
  }
  function score(item,q){
    if(!q)return 100;
    const title=norm(item.title),aliases=aliasesFor(item).map(norm),fields=[item.title,item.body,item.equipment,item.target,item.raw,...aliases].map(norm).filter(Boolean);
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
    if(D.getElementById('unvrsl-offline-strength-search-v345-style'))return;
    const s=D.createElement('style');s.id='unvrsl-offline-strength-search-v345-style';s.textContent=`
      .oss345-search{position:relative;margin:14px 0 10px}.oss345-search input{width:100%;min-height:50px;padding:14px 42px 14px 15px;border:1px solid #343438;border-radius:16px;background:#0f0f11;color:#f5f5f7;font-size:16px;outline:none}.oss345-search input:focus{border-color:rgba(191,90,242,.72);box-shadow:0 0 0 3px rgba(191,90,242,.13)}.oss345-search:after{content:'⌕';position:absolute;right:15px;top:50%;transform:translateY(-52%);color:#777780;font-size:22px;pointer-events:none}.oss345-meta{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 2px 8px;color:#777780;font-size:11px}.oss345-results{max-height:min(48vh,470px);overflow:auto;border:1px solid #303036;border-radius:17px;background:#151517;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}.oss345-results[hidden]{display:none}.oss345-option{display:block;width:100%;min-height:58px;padding:12px 14px;border-bottom:1px solid #29292e;color:#f1f1f3;text-align:left}.oss345-option:last-child{border-bottom:0}.oss345-option:active{background:#25252a}.oss345-option b{display:block;font-size:14px;line-height:1.3;overflow-wrap:anywhere}.oss345-option small{display:block;margin-top:4px;color:#85858d;font-size:11px;line-height:1.3}.oss345-empty{padding:24px 14px;color:#818188;text-align:center;font-size:13px}.oss345-selected{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:11px 0 4px;padding:13px 14px;border:1px solid rgba(191,90,242,.34);border-radius:16px;background:rgba(191,90,242,.09)}.oss345-selected[hidden]{display:none}.oss345-selected small{display:block;color:#9a7cab;font-size:10px;text-transform:uppercase;letter-spacing:.08em}.oss345-selected b{display:block;margin-top:4px;color:#f2e5f8;font-size:14px;line-height:1.3}.oss345-change{flex:0 0 auto;color:#d4a4ea;font-size:12px;font-weight:800}.oss345-submit[disabled]{opacity:.42;pointer-events:none}.oss345-loading{min-height:210px;display:grid;place-items:center;color:#85858d;font-size:13px;text-align:center}@media(max-width:430px){.oss345-results{max-height:42vh}.oss345-option{min-height:56px;padding:11px 12px}}
    `;D.head.appendChild(s);
  }

  function loadingSheet(id){
    W.modal?.(`<div class="sheet-grabber"></div><div class="ofp-add-head"><div><h2>Добавить упражнение</h2><div class="muted">Загружаю общую базу упражнений</div></div><button type="button" class="btn tiny" id="oss345LoadingClose">✕</button></div><div class="oss345-loading">Подтягиваю упражнения из раздела «Упражнения»…</div>`);
    D.getElementById('oss345LoadingClose')?.addEventListener('click',()=>W.offlineClientDetail?.(id));
  }

  async function openSearch(id){
    ensureStyle();loadingSheet(id);
    const rows=await waitForCatalog(),items=buildItems(rows);
    W.modal?.(`<div class="sheet-grabber"></div><div class="ofp-add-head"><div><h2>Добавить упражнение</h2><div class="muted">Та же база, что в разделе «Упражнения»</div></div><button type="button" class="btn tiny" id="oss345Close">✕</button></div><input id="ofpExerciseName" type="hidden" value=""><div class="oss345-search"><input id="oss345Input" type="search" inputmode="search" enterkeyhint="search" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Поиск упражнения..." aria-label="Поиск упражнения"></div><div class="oss345-selected" id="oss345Selected" hidden><div><small>Выбрано</small><b id="oss345SelectedName"></b></div><button type="button" class="oss345-change" id="oss345Change">Изменить</button></div><div class="oss345-meta"><span id="oss345Count"></span><span>Поиск по названию и алиасам</span></div><div class="oss345-results" id="oss345Results" role="listbox" aria-label="Упражнения"></div><div class="field"><label>Тренажёр или вариант, если нужен</label><input id="ofpExerciseVariant" placeholder="Например, Matrix или Technogym"></div><div class="ofp-tip">Одинаковое упражнение на разных тренажёрах лучше вести как два показателя – их веса могут быть несопоставимы.</div><button type="button" id="oss345Submit" class="btn primary full oss345-submit" disabled>Добавить и записать результат</button>`);

    const input=D.getElementById('oss345Input'),results=D.getElementById('oss345Results'),count=D.getElementById('oss345Count'),hidden=D.getElementById('ofpExerciseName'),selected=D.getElementById('oss345Selected'),selectedName=D.getElementById('oss345SelectedName'),submit=D.getElementById('oss345Submit');
    if(!input||!results||!hidden||!submit)return;
    let visible=[];
    const render=()=>{
      const q=norm(input.value),ranked=items.map(item=>({item,s:score(item,q)})).filter(x=>Number.isFinite(x.s)).sort((a,b)=>a.s-b.s||a.item.title.localeCompare(b.item.title,'ru'));
      visible=ranked.map(x=>x.item);
      count.textContent=q?`Найдено: ${visible.length}`:`Упражнений: ${items.length}`;
      results.hidden=false;
      results.innerHTML=visible.length?visible.map((item,i)=>`<button type="button" class="oss345-option" data-oss345-index="${i}" role="option"><b>${esc(item.title)}</b><small>${esc(item.body)} · ${esc(item.equipment)} · ${esc(item.target)}</small></button>`).join(''):`<div class="oss345-empty">Ничего не найдено</div>`;
    };
    const choose=item=>{
      if(!item)return;hidden.value=item.title;selectedName.textContent=item.title;selected.hidden=false;submit.disabled=false;input.value=item.title;results.hidden=true;count.textContent='Упражнение выбрано';
    };
    const reset=()=>{hidden.value='';selected.hidden=true;submit.disabled=true};
    results.addEventListener('click',e=>{const b=e.target.closest('[data-oss345-index]');if(b)choose(visible[Number(b.dataset.oss345Index)]||null)});
    input.addEventListener('input',()=>{if(hidden.value&&norm(input.value)!==norm(hidden.value))reset();render()});
    input.addEventListener('keydown',e=>{if(e.key==='Enter'&&visible.length){e.preventDefault();choose(visible[0])}});
    D.getElementById('oss345Change')?.addEventListener('click',()=>{reset();input.value='';render();input.focus({preventScroll:true})});
    D.getElementById('oss345Close')?.addEventListener('click',()=>W.offlineClientDetail?.(id));
    submit.addEventListener('click',()=>{if(!hidden.value)return W.toast?.('Выбери упражнение');W.offlineProgressOpenStrengthV321?.(id)});
    render();setTimeout(()=>input.focus({preventScroll:true}),80);
  }

  function install(){
    const cur=W.offlineCustomStrengthSheet;
    if(typeof cur!=='function')return false;
    if(cur.__offlineStrengthSearchV345)return true;
    const patched=id=>openSearch(String(id||''));
    patched.__offlineStrengthSearchV345=true;
    patched.__offlineProgressV328=true;patched.__offlineProgressV324=true;patched.__offlineProgressV323=true;patched.__offlineProgressV322=true;patched.__offlineProgressV321=true;
    W.offlineCustomStrengthSheet=patched;
    return true;
  }

  let tries=0;const timer=setInterval(()=>{tries++;install();if(tries>400)clearInterval(timer)},50);
  [0,120,300,700,1400,2800,5000,9000,14000].forEach(ms=>setTimeout(install,ms));
  W.addEventListener('unvrsl:deferred-modules-ready',install,{passive:true});
  W.UNVRSL_OFFLINE_STRENGTH_SEARCH_V345=Object.freeze({revision:REV,open:openSearch,readCatalog,buildItems});
})();