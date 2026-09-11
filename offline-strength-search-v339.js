'use strict';
(()=>{
  const W=window,D=document,REV=342;
  if(W.__unvrslOfflineStrengthSearchV342)return;
  W.__unvrslOfflineStrengthSearchV342=true;

  const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const norm=v=>String(v??'').toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/[‐‑‒–—-]+/g,' ').replace(/[()]/g,' ').replace(/[·•:]+/g,' ').replace(/\s+/g,' ').trim();

  const REQUIRED=[
    'Присед со штангой с высокой постановкой грифа',
    'Присед со штангой с низкой постановкой грифа',
    'Ягодичный мостик в тренажёре'
  ];

  const CANONICAL=new Map([
    ['присед со штангой high bar','Присед со штангой с высокой постановкой грифа'],
    ['приседания со штангой high bar','Присед со штангой с высокой постановкой грифа'],
    ['присед со штангой с высокой постановкой грифа','Присед со штангой с высокой постановкой грифа'],
    ['присед со штангой low bar','Присед со штангой с низкой постановкой грифа'],
    ['приседания со штангой low bar','Присед со штангой с низкой постановкой грифа'],
    ['присед со штангой с низкой постановкой грифа','Присед со штангой с низкой постановкой грифа'],
    ['зашагивания с гантелями','Зашагивания на платформу с гантелями'],
    ['зашагивания на платформу с гантелями','Зашагивания на платформу с гантелями'],
    ['махи гантелей в стороны','Махи гантелями в стороны'],
    ['махи гантелями в стороны','Махи гантелями в стороны'],
    ['разведение на заднюю дельту','Разведение гантелей на заднюю дельту'],
    ['разведение гантелей на заднюю дельту','Разведение гантелей на заднюю дельту'],
    ['кардио лестница','Лестница / StairMaster'],
    ['лестница stairmaster','Лестница / StairMaster'],
    ['ягодичный мост в тренажере','Ягодичный мостик в тренажёре'],
    ['ягодичный мостик в тренажере','Ягодичный мостик в тренажёре'],
    ['хип траст в тренажере','Ягодичный мостик в тренажёре'],
    ['machine hip thrust','Ягодичный мостик в тренажёре']
  ]);

  const ALIASES={
    'Присед со штангой с высокой постановкой грифа':['high bar','high-bar','хай бар','высокая постановка'],
    'Присед со штангой с низкой постановкой грифа':['low bar','low-bar','лоу бар','низкая постановка'],
    'Ягодичный мостик в тренажёре':['ягодичный мост','хип траст','hip thrust','hip thrust machine'],
    'Лестница / StairMaster':['лестница','stairmaster','степпер'],
    'Молотковые сгибания с гантелями':['молотки','hammer curl'],
    'Лыжный тренажёр':['лыжи','ski erg','skierg'],
    'Аэробайк':['airbike','air bike','assault bike']
  };

  function stripProgramPrefix(value){
    let s=String(value||'').trim().replace(/\s+/g,' ');
    // 1 ·, 1., 1A ·, A1 ·, 6 · и похожие обозначения из программы.
    for(let i=0;i<3;i++){
      const before=s;
      s=s.replace(/^\s*(?:\d+[A-Za-zА-Яа-я]?|[A-Za-zА-Яа-я]\d+)\s*(?:[·•.:)\-]|\s+-\s+)\s*/u,'').trim();
      if(s===before)break;
    }
    s=s.replace(/^\s*кардио\s*(?:[·•.:)\-])\s*/iu,'').trim();
    return s;
  }

  function cleanName(value){
    let name=stripProgramPrefix(value);
    if(!name)return'';
    if(/^аэробайк\s+a2$/iu.test(name))name='Аэробайк';
    const key=norm(name);
    if(!key||key==='прим')return'';
    // Обычный присед без положения грифа убираем: остаются high-bar и low-bar.
    if(key==='приседания со штангой'||key==='присед со штангой')return'';
    return CANONICAL.get(key)||name;
  }

  function finalize(source){
    const seen=new Map();
    [...(Array.isArray(source)?source:[]),...REQUIRED].forEach(raw=>{
      const name=cleanName(raw);
      if(!name)return;
      seen.set(norm(name),name);
    });
    return [...seen.values()].sort((a,b)=>a.localeCompare(b,'ru'));
  }

  function catalogNames(){
    let names=[];
    try{
      const fn=typeof W.catalogRecords==='function'?W.catalogRecords:(typeof catalogRecords==='function'?catalogRecords:null);
      const rows=fn?fn():[];
      if(Array.isArray(rows))names=rows.map(x=>{
        if(!x)return'';
        if(x.strictName)return x.strictName;
        if(x.custom)return x.n||'';
        try{return typeof W.ruExerciseName==='function'?W.ruExerciseName(x.n):x.n}catch(_){return x.n||''}
      }).filter(Boolean);
    }catch(_){ }
    try{
      const list=W.UNVRSL_EXERCISE_PICKER_V331?.list;
      if(typeof list==='function')names=list(names);
    }catch(_){ }
    return finalize(names);
  }

  function aliasesFor(name){return ALIASES[name]||[]}
  function score(name,q){
    if(!q)return 100;
    const n=norm(name),a=aliasesFor(name).map(norm),hay=[n,...a];
    if(n===q)return 0;
    if(n.startsWith(q))return 1;
    if(n.includes(q))return 2;
    if(a.some(x=>x===q))return 3;
    if(a.some(x=>x.startsWith(q)))return 4;
    if(a.some(x=>x.includes(q)))return 5;
    const tokens=q.split(' ').filter(Boolean);
    return tokens.length&&tokens.every(t=>hay.some(x=>x.includes(t)))?6:Infinity;
  }

  function ensureStyle(){
    if(D.getElementById('unvrsl-offline-strength-search-v342-style'))return;
    const s=D.createElement('style');
    s.id='unvrsl-offline-strength-search-v342-style';
    s.textContent=`
      .oss342-search{position:relative;margin:14px 0 10px}.oss342-search input{width:100%;min-height:50px;padding:14px 42px 14px 15px;border:1px solid #343438;border-radius:16px;background:#0f0f11;color:#f5f5f7;font-size:16px;outline:none}.oss342-search input:focus{border-color:rgba(191,90,242,.72);box-shadow:0 0 0 3px rgba(191,90,242,.13)}.oss342-search:after{content:'⌕';position:absolute;right:15px;top:50%;transform:translateY(-52%);color:#777780;font-size:22px;pointer-events:none}.oss342-meta{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 2px 8px;color:#777780;font-size:11px}.oss342-results{max-height:min(44vh,430px);overflow:auto;border:1px solid #303036;border-radius:17px;background:#151517;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}.oss342-results[hidden]{display:none}.oss342-option{display:flex;width:100%;min-height:51px;align-items:center;padding:12px 14px;border-bottom:1px solid #29292e;color:#f1f1f3;text-align:left;font-size:14px;line-height:1.3}.oss342-option:last-child{border-bottom:0}.oss342-option:active{background:#25252a}.oss342-option span{display:block;min-width:0;overflow-wrap:anywhere}.oss342-empty{padding:22px 14px;color:#818188;text-align:center;font-size:13px}.oss342-selected{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:11px 0 4px;padding:13px 14px;border:1px solid rgba(191,90,242,.34);border-radius:16px;background:rgba(191,90,242,.09)}.oss342-selected[hidden]{display:none}.oss342-selected small{display:block;color:#9a7cab;font-size:10px;text-transform:uppercase;letter-spacing:.08em}.oss342-selected b{display:block;margin-top:4px;color:#f2e5f8;font-size:14px;line-height:1.3}.oss342-change{flex:0 0 auto;color:#d4a4ea;font-size:12px;font-weight:800}.oss342-submit[disabled]{opacity:.42;pointer-events:none}@media(max-width:430px){.oss342-results{max-height:39vh}.oss342-option{min-height:49px;padding:11px 12px}}
    `;
    D.head.appendChild(s);
  }

  function openSearch(id){
    ensureStyle();
    const names=catalogNames();
    W.modal?.(`<div class="sheet-grabber"></div><div class="ofp-add-head"><div><h2>Добавить упражнение</h2><div class="muted">Поиск по общей базе упражнений</div></div><button type="button" class="btn tiny" id="oss342Close">✕</button></div><input id="ofpExerciseName" type="hidden" value=""><div class="oss342-search"><input id="oss342Input" type="search" inputmode="search" enterkeyhint="search" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Поиск упражнения..." aria-label="Поиск упражнения"></div><div class="oss342-selected" id="oss342Selected" hidden><div><small>Выбрано</small><b id="oss342SelectedName"></b></div><button type="button" class="oss342-change" id="oss342Change">Изменить</button></div><div class="oss342-meta"><span id="oss342Count"></span><span>Поиск по названию и алиасам</span></div><div class="oss342-results" id="oss342Results" role="listbox" aria-label="Упражнения"></div><div class="field"><label>Тренажёр или вариант, если нужен</label><input id="ofpExerciseVariant" placeholder="Например, Matrix или Technogym"></div><div class="ofp-tip">Одинаковое упражнение на разных тренажёрах лучше вести как два показателя – их веса могут быть несопоставимы.</div><button type="button" id="oss342Submit" class="btn primary full oss342-submit" disabled>Добавить и записать результат</button>`);

    const input=D.getElementById('oss342Input'),results=D.getElementById('oss342Results'),count=D.getElementById('oss342Count'),hidden=D.getElementById('ofpExerciseName'),selected=D.getElementById('oss342Selected'),selectedName=D.getElementById('oss342SelectedName'),submit=D.getElementById('oss342Submit');
    if(!input||!results||!hidden||!submit)return;
    let visible=[];

    const render=()=>{
      const q=norm(input.value);
      const ranked=names.map(name=>({name,s:score(name,q)})).filter(x=>Number.isFinite(x.s)).sort((a,b)=>a.s-b.s||a.name.localeCompare(b.name,'ru'));
      visible=ranked.map(x=>x.name);
      count.textContent=q?`Найдено: ${visible.length}`:`Упражнений: ${visible.length}`;
      results.hidden=false;
      results.innerHTML=visible.length?visible.map((name,i)=>`<button type="button" class="oss342-option" data-oss342-index="${i}" role="option"><span>${esc(name)}</span></button>`).join(''):`<div class="oss342-empty">Ничего не найдено</div>`;
    };
    const choose=name=>{
      if(!name)return;
      hidden.value=name;selectedName.textContent=name;selected.hidden=false;submit.disabled=false;input.value=name;results.hidden=true;count.textContent='Упражнение выбрано';
    };
    const reset=()=>{hidden.value='';selected.hidden=true;submit.disabled=true};

    results.addEventListener('click',e=>{const b=e.target.closest('[data-oss342-index]');if(b)choose(visible[Number(b.dataset.oss342Index)]||'')});
    input.addEventListener('input',()=>{if(hidden.value&&norm(input.value)!==norm(hidden.value))reset();render()});
    input.addEventListener('keydown',e=>{if(e.key==='Enter'&&visible.length){e.preventDefault();choose(visible[0])}});
    D.getElementById('oss342Change')?.addEventListener('click',()=>{reset();input.value='';render();input.focus({preventScroll:true})});
    D.getElementById('oss342Close')?.addEventListener('click',()=>W.offlineClientDetail?.(id));
    submit.addEventListener('click',()=>{if(!hidden.value)return W.toast?.('Выбери упражнение');W.offlineProgressOpenStrengthV321?.(id)});
    render();setTimeout(()=>input.focus({preventScroll:true}),80);
  }

  function install(){
    const cur=W.offlineCustomStrengthSheet;
    if(typeof cur!=='function')return false;
    if(cur.__offlineStrengthSearchV342)return true;
    const patched=id=>openSearch(String(id||''));
    patched.__offlineStrengthSearchV342=true;
    patched.__offlineProgressV328=true;patched.__offlineProgressV324=true;patched.__offlineProgressV323=true;patched.__offlineProgressV322=true;patched.__offlineProgressV321=true;
    W.offlineCustomStrengthSheet=patched;
    return true;
  }

  let tries=0;const timer=setInterval(()=>{tries++;install();if(tries>300)clearInterval(timer)},50);
  [0,150,400,900,1800,3500,7000,12000].forEach(ms=>setTimeout(install,ms));
  W.addEventListener('unvrsl:deferred-modules-ready',install,{passive:true});
  W.UNVRSL_OFFLINE_STRENGTH_SEARCH_V342=Object.freeze({revision:REV,open:openSearch,catalogNames,cleanName});
})();