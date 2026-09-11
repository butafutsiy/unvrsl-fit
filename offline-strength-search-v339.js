'use strict';
(()=>{
  const W=window,D=document,REV=341;
  if(W.__unvrslOfflineStrengthSearchV341)return;
  W.__unvrslOfflineStrengthSearchV341=true;

  const E=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const norm=v=>String(v??'').toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/[‐‑‒–—-]+/g,' ').replace(/[()]/g,' ').replace(/[·•]/g,' ').replace(/\s+/g,' ').trim();

  const REQUIRED=Object.freeze([
    'Присед со штангой с высокой постановкой грифа',
    'Присед со штангой с низкой постановкой грифа',
    'Ягодичный мостик в тренажёре'
  ]);

  const CANONICAL=Object.freeze({
    'присед со штангой high bar':'Присед со штангой с высокой постановкой грифа',
    'приседания со штангой high bar':'Присед со штангой с высокой постановкой грифа',
    'присед со штангой с высокой постановкой грифа':'Присед со штангой с высокой постановкой грифа',
    'присед со штангой low bar':'Присед со штангой с низкой постановкой грифа',
    'приседания со штангой low bar':'Присед со штангой с низкой постановкой грифа',
    'присед со штангой с низкой постановкой грифа':'Присед со штангой с низкой постановкой грифа',
    'зашагивания с гантелями':'Зашагивания на платформу с гантелями',
    'зашагивания на платформу с гантелями':'Зашагивания на платформу с гантелями',
    'махи гантелей в стороны':'Махи гантелями в стороны',
    'махи гантелями в стороны':'Махи гантелями в стороны',
    'разведение на заднюю дельту':'Разведение гантелей на заднюю дельту',
    'разведение гантелей на заднюю дельту':'Разведение гантелей на заднюю дельту',
    'лестница / stairmaster':'Лестница / StairMaster',
    'лестница stairmaster':'Лестница / StairMaster',
    'кардио лестница':'Лестница / StairMaster',
    'ягодичный мост в тренажере':'Ягодичный мостик в тренажёре',
    'ягодичный мостик в тренажере':'Ягодичный мостик в тренажёре',
    'хип траст в тренажере':'Ягодичный мостик в тренажёре',
    'machine hip thrust':'Ягодичный мостик в тренажёре'
  });

  const ALIASES=Object.freeze({
    'Присед со штангой с высокой постановкой грифа':['high bar','high-bar','хай бар','высокая постановка','высокий гриф'],
    'Присед со штангой с низкой постановкой грифа':['low bar','low-bar','лоу бар','низкая постановка','низкий гриф'],
    'Лестница / StairMaster':['stairmaster','stair master','лестница','степпер'],
    'Молотковые сгибания с гантелями':['молотки','hammer curl','hammer curls'],
    'Лыжный тренажёр':['лыжи','ski erg','skierg'],
    'Аэробайк':['air bike','airbike','assault bike'],
    'Ягодичный мостик в тренажёре':['ягодичный мост','ягодичный мостик','hip thrust machine','machine hip thrust','хип траст тренажер']
  });

  function cleanName(value){
    let name=String(value||'').trim().replace(/\s+/g,' ');
    if(!name)return'';

    // Убираем служебные обозначения, случайно попавшие из тренировочных программ.
    name=name.replace(/^\s*\d+\s*[A-Za-zА-Яа-я]?\s*[·.):-]\s*/u,'').trim();
    name=name.replace(/^\s*кардио\s*[·:)-]\s*/iu,'').trim();
    if(/^аэробайк\s+a2$/iu.test(name))name='Аэробайк';

    const key=norm(name);
    if(!key||key==='прим')return'';

    // Обычный присед без указания положения грифа больше не используем.
    if(key==='приседания со штангой'||key==='присед со штангой')return'';

    return CANONICAL[key]||name;
  }

  function finalizeNames(source){
    const seen=new Map();
    [...(Array.isArray(source)?source:[]),...REQUIRED].forEach(value=>{
      const name=cleanName(value);
      if(!name)return;
      seen.set(norm(name),name);
    });
    return [...seen.values()].sort((a,b)=>a.localeCompare(b,'ru'));
  }

  function catalogNames(){
    try{
      const fn=typeof W.catalogRecords==='function'?W.catalogRecords:(typeof catalogRecords==='function'?catalogRecords:null);
      const rows=fn?fn():[];
      const names=Array.isArray(rows)?rows.map(x=>{
        if(!x)return'';
        if(x.strictName)return x.strictName;
        if(x.custom)return x.n||'';
        try{return typeof W.ruExerciseName==='function'?W.ruExerciseName(x.n):x.n}catch(_){return x.n||''}
      }).filter(Boolean):[];
      const list=W.UNVRSL_EXERCISE_PICKER_V331?.list;
      const merged=typeof list==='function'?list(names):names;
      return finalizeNames(merged);
    }catch(_){
      const list=W.UNVRSL_EXERCISE_PICKER_V331?.list;
      return finalizeNames(typeof list==='function'?list():[]);
    }
  }

  function aliasesFor(name){
    const key=Object.keys(ALIASES).find(k=>norm(k)===norm(name));
    return key?ALIASES[key]:[];
  }

  function score(name,query){
    if(!query)return 100;
    const n=norm(name),aliases=aliasesFor(name).map(norm);
    if(n===query)return 0;
    if(n.startsWith(query))return 1;
    if(n.includes(query))return 2;
    if(aliases.some(a=>a===query))return 3;
    if(aliases.some(a=>a.startsWith(query)))return 4;
    if(aliases.some(a=>a.includes(query)))return 5;
    const tokens=query.split(' ').filter(Boolean),hay=[n,...aliases].join(' ');
    if(tokens.length&&tokens.every(t=>hay.includes(t)))return 6;
    return Infinity;
  }

  function ensureStyle(){
    if(D.getElementById('unvrsl-offline-strength-search-v339-style'))return;
    const style=D.createElement('style');
    style.id='unvrsl-offline-strength-search-v339-style';
    style.textContent=`
      .oss339-search{position:relative;margin:14px 0 10px}.oss339-search input{width:100%;min-height:50px;padding:14px 42px 14px 15px;border:1px solid #343438;border-radius:16px;background:#0f0f11;color:#f5f5f7;font-size:16px;outline:none}.oss339-search input:focus{border-color:rgba(191,90,242,.72);box-shadow:0 0 0 3px rgba(191,90,242,.13)}.oss339-search:after{content:'⌕';position:absolute;right:15px;top:50%;transform:translateY(-52%);color:#777780;font-size:22px;pointer-events:none}.oss339-meta{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 2px 8px;color:#777780;font-size:11px}.oss339-results{max-height:min(44vh,430px);overflow:auto;border:1px solid #303036;border-radius:17px;background:#151517;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}.oss339-results[hidden]{display:none}.oss339-option{display:flex;width:100%;min-height:51px;align-items:center;padding:12px 14px;border-bottom:1px solid #29292e;color:#f1f1f3;text-align:left;font-size:14px;line-height:1.3}.oss339-option:last-child{border-bottom:0}.oss339-option:active{background:#25252a}.oss339-option span{display:block;min-width:0;overflow-wrap:anywhere}.oss339-empty{padding:22px 14px;color:#818188;text-align:center;font-size:13px}.oss339-selected{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:11px 0 4px;padding:13px 14px;border:1px solid rgba(191,90,242,.34);border-radius:16px;background:rgba(191,90,242,.09)}.oss339-selected[hidden]{display:none}.oss339-selected>div{min-width:0}.oss339-selected small{display:block;color:#9a7cab;font-size:10px;text-transform:uppercase;letter-spacing:.08em}.oss339-selected b{display:block;margin-top:4px;color:#f2e5f8;font-size:14px;line-height:1.3;overflow-wrap:anywhere}.oss339-change{flex:0 0 auto;color:#d4a4ea;font-size:12px;font-weight:800}.oss339-submit[disabled]{opacity:.42;pointer-events:none}.oss339-help{margin:8px 2px 0;color:#777780;font-size:11px;line-height:1.35}@media(max-width:430px){.oss339-results{max-height:39vh}.oss339-option{min-height:49px;padding:11px 12px}}
    `;
    D.head.appendChild(style);
  }

  function openSearch(id){
    ensureStyle();
    const names=catalogNames();
    W.modal?.(`<div class="sheet-grabber"></div><div class="ofp-add-head"><div><h2>Добавить упражнение</h2><div class="muted">Поиск по общей базе упражнений</div></div><button type="button" class="btn tiny" id="oss339Close">✕</button></div><input id="ofpExerciseName" type="hidden" value=""><div class="oss339-search"><input id="oss339Input" type="search" inputmode="search" enterkeyhint="search" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Поиск упражнения..." aria-label="Поиск упражнения"></div><div class="oss339-selected" id="oss339Selected" hidden><div><small>Выбрано</small><b id="oss339SelectedName"></b></div><button type="button" class="oss339-change" id="oss339Change">Изменить</button></div><div class="oss339-meta"><span id="oss339Count"></span><span>Поиск по названию и алиасам</span></div><div class="oss339-results" id="oss339Results" role="listbox" aria-label="Упражнения"></div><div class="field"><label>Тренажёр или вариант, если нужен</label><input id="ofpExerciseVariant" placeholder="Например, Matrix или Technogym"></div><div class="ofp-tip">Одинаковое упражнение на разных тренажёрах лучше вести как два показателя – их веса могут быть несопоставимы.</div><button type="button" id="oss339Submit" class="btn primary full oss339-submit" disabled>Добавить и записать результат</button>`);

    const input=D.getElementById('oss339Input'),results=D.getElementById('oss339Results'),count=D.getElementById('oss339Count'),hidden=D.getElementById('ofpExerciseName'),selected=D.getElementById('oss339Selected'),selectedName=D.getElementById('oss339SelectedName'),submit=D.getElementById('oss339Submit');
    if(!input||!results||!hidden||!submit)return;

    let visible=[];
    const render=()=>{
      const q=norm(input.value),ranked=names.map(name=>({name,score:score(name,q)})).filter(x=>Number.isFinite(x.score)).sort((a,b)=>a.score-b.score||a.name.localeCompare(b.name,'ru'));
      visible=ranked.map(x=>x.name);
      count.textContent=q?`Найдено: ${visible.length}`:`Упражнений: ${visible.length}`;
      results.hidden=false;
      results.innerHTML=visible.length?visible.map((name,i)=>`<button type="button" class="oss339-option" data-oss339-index="${i}" role="option"><span>${E(name)}</span></button>`).join(''):`<div class="oss339-empty">Ничего не найдено</div>`;
    };
    const choose=name=>{
      if(!name)return;
      hidden.value=name;
      selectedName.textContent=name;
      selected.hidden=false;
      submit.disabled=false;
      input.value=name;
      results.hidden=true;
      count.textContent='Упражнение выбрано';
    };
    const resetSelection=()=>{hidden.value='';selected.hidden=true;submit.disabled=true};

    results.addEventListener('click',event=>{
      const button=event.target.closest('[data-oss339-index]');
      if(!button)return;
      choose(visible[Number(button.dataset.oss339Index)]||'');
    });
    input.addEventListener('input',()=>{if(hidden.value&&norm(input.value)!==norm(hidden.value))resetSelection();render()});
    input.addEventListener('keydown',event=>{if(event.key==='Enter'&&visible.length){event.preventDefault();choose(visible[0])}});
    D.getElementById('oss339Change')?.addEventListener('click',()=>{resetSelection();input.value='';render();input.focus({preventScroll:true})});
    D.getElementById('oss339Close')?.addEventListener('click',()=>W.offlineClientDetail?.(id));
    submit.addEventListener('click',()=>{if(!hidden.value)return W.toast?.('Выбери упражнение');W.offlineProgressOpenStrengthV321?.(id)});
    render();
    setTimeout(()=>input.focus({preventScroll:true}),80);
  }

  function install(){
    const current=W.offlineCustomStrengthSheet;
    if(typeof current!=='function')return false;
    if(current.__offlineStrengthSearchV341)return true;
    const patched=function(id){return openSearch(String(id||''))};
    patched.__offlineStrengthSearchV341=true;
    patched.__offlineProgressV328=true;
    patched.__offlineProgressV324=true;
    patched.__offlineProgressV323=true;
    patched.__offlineProgressV322=true;
    patched.__offlineProgressV321=true;
    W.offlineCustomStrengthSheet=patched;
    return true;
  }

  let attempts=0;
  const timer=setInterval(()=>{attempts++;install();if(attempts>300)clearInterval(timer)},50);
  [0,150,400,900,1800,3500,7000,12000].forEach(ms=>setTimeout(install,ms));
  W.addEventListener('unvrsl:deferred-modules-ready',install,{passive:true});
  W.UNVRSL_OFFLINE_STRENGTH_SEARCH_V339=Object.freeze({revision:REV,open:openSearch,catalogNames});
})();