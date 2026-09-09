'use strict';
(()=>{
  if(window.__unvrslExerciseCatalogSyncV330)return;
  window.__unvrslExerciseCatalogSyncV330=true;

  const RELEASE=330;
  const ADDED=[
    {key:'cable_rope_hammer',name:'Молотковые сгибания на нижнем блоке с канатом',aliases:['Молотковые сгибания с канатом']},
    {key:'ez_lying_triceps',name:'Французский жим с EZ-штангой лёжа',aliases:['Французский жим EZ']},
    {key:'weighted_hyperextension',name:'Гиперэкстензия с дополнительным весом',aliases:['Гиперэкстензия с диском']},
    {key:'barbell_hip_thrust',name:'Хип-траст со штангой',aliases:['Ягодичный мост','Ягодичный мост со штангой','Хип траст','Хип-траст']},
    {key:'reverse_lunge_db',name:'Выпады назад с гантелями',aliases:['Выпады назад']},
    {key:'stepup_db',name:'Зашагивания на платформу с гантелями',aliases:['Зашагивания']},
    {key:'db_overhead_triceps',name:'Разгибание одной гантели из-за головы',aliases:['Разгибание гантели из-за головы']},
    {key:'db_supination_curl',name:'Сгибание гантелей с супинацией',aliases:[]},
    {key:'db_lying_triceps',name:'Французский жим с гантелями лёжа',aliases:['Французский жим с гантелями']},
    {key:'kettlebell_snatch',name:'Рывок гири',aliases:[]},
    {key:'cable_reverse_curl',name:'Сгибание рук на нижнем блоке обратным хватом',aliases:['Сгибание рук в блоке обратным хватом','Бицепс в блоке обратным хватом','Бицепс обратным хватом']},
    {key:'one_arm_lat_pulldown',name:'Тяга верхнего блока одной рукой',aliases:['Вертикальная тяга одной рукой']},
    {key:'decline_crunch',name:'Скручивания на наклонной скамье',aliases:['Скручивания на скамье','Скручивания с небольшим весом']},
    {key:'box_jump',name:'Запрыгивания на тумбу',aliases:['Запрыгивания']},
    {key:'one_arm_machine_row',name:'Горизонтальная тяга в тренажёре одной рукой',aliases:['Тяга в тренажёре одной рукой','Горизонтальная тяга одной рукой в тренажёре']},
    {key:'straight_bar_pushdown',name:'Разгибание рук на верхнем блоке с прямой рукоятью',aliases:['Разгибание рук с прямой рукоятью','Трицепс с прямой рукоятью']},
    {key:'captain_leg_raise',name:'Подъём ног в упоре на брусьях',aliases:['Подъём ног на брусьях']},
    {key:'smith_bent_row',name:'Тяга штанги в наклоне в Смите',aliases:['Тяга в наклоне в Смите','Тяга штанги в Смите в наклоне']},
    {key:'one_arm_db_row',name:'Тяга гантели к поясу одной рукой',aliases:['Тяга гантели одной рукой к поясу','Тяга гантели одной рукой','Тяга одной гантели к поясу']},
    {key:'db_pullover',name:'Пуловер с одной гантелью лёжа',aliases:['Пуловер с гантелью']},
    {key:'cable_pullover',name:'Пуловер с верхнего блока с рукояткой стоя',aliases:['Пуловер в кроссовере','Пуловер на верхнем блоке прямыми руками','Пуловер на верхнем блоке','Пуловер с верхнего блока стоя','Пулловер с верхнего блока с рукояткой стоя','Пулловер на верхнем блоке','Пулловер в кроссовере']},
    {key:'cable_one_arm_overhead_triceps',name:'Разгибание одной руки из-за головы на блоке',aliases:[]}
  ];

  const norm=s=>String(s||'').toLowerCase().replace(/ё/g,'е').replace(/[–—]/g,'-').replace(/[()]/g,' ').replace(/[_.:,/\\]+/g,' ').replace(/\s*-\s*/g,' ').replace(/\s+/g,' ').trim();
  const baseName=raw=>{
    let s=String(raw||'').trim();
    try{if(typeof baseExerciseName==='function')s=baseExerciseName(s)}catch(_){ }
    return s.replace(/^\s*(?:разминка|кардио)\s*·\s*/i,'').replace(/^\s*\d+\s*[A-CА-С]?\s*·\s*/i,'').trim()
  };
  const byKey=new Map(ADDED.map(x=>[x.key,x]));
  const byName=new Map();
  ADDED.forEach(x=>[x.name,...x.aliases].forEach(n=>byName.set(norm(baseName(n)),x)));

  const currentCatalog=()=>window.catalogRecords||(()=>{try{return catalogRecords}catch(_){return null}})();
  const currentFind=()=>window.findExercise||(()=>{try{return findExercise}catch(_){return null}})();

  function specFor(raw){return byName.get(norm(baseName(raw)))||null}
  function sourceCard(spec,findFn=currentFind()){
    if(!spec||typeof findFn!=='function')return null;
    let ex=null;try{ex=findFn(`canon:${spec.key}`)}catch(_){ }
    if(!ex)return null;
    const sid=String(ex.rawId||ex.sourceId||'');
    return {...ex,id:`canon:${spec.key}`,n:spec.name,raw:spec.name,rawId:sid,sourceId:sid,canonical:true,canonicalKey:spec.key,canonicalExerciseKey:spec.key,canonicalName:spec.name,custom:false}
  }

  function installFindExercise(){
    const base=currentFind();
    if(typeof base!=='function'||base.__catalogSyncV330)return;
    const wrapped=function(token){
      const id=decodeURIComponent(String(token||''));
      const direct=id.startsWith('canon:')?byKey.get(id.slice(6)):id.startsWith('custom:')?specFor(id.slice(7)):null;
      if(direct){const ex=sourceCard(direct,base);if(ex)return id.startsWith('custom:')?{...ex,id,custom:true,raw:id.slice(7)}:ex}
      const ex=base.apply(this,arguments);if(!ex)return ex;
      const spec=specFor(ex.raw||ex.n||'');
      if(!spec)return ex;
      const sid=String(ex.rawId||ex.sourceId||'');
      return {...ex,n:spec.name,canonicalKey:spec.key,canonicalExerciseKey:spec.key,canonicalName:spec.name,rawId:sid,sourceId:sid}
    };
    wrapped.__catalogSyncV330=true;wrapped.__catalogSyncBase=base;
    window.findExercise=wrapped;try{findExercise=wrapped}catch(_){ }
  }

  function installCatalog(){
    const base=currentCatalog();
    if(typeof base!=='function'||base.__catalogSyncV330)return;
    const findFn=currentFind();
    const wrapped=function(){
      let rows=base.apply(this,arguments)||[];
      for(const spec of ADDED){
        const card=sourceCard(spec,findFn);if(!card)continue;
        const sid=String(card.sourceId||card.rawId||''),names=new Set([spec.name,...spec.aliases].map(x=>norm(baseName(x))));
        rows=rows.filter(e=>{
          if(String(e?.id||'')===`canon:${spec.key}`)return false;
          const rowKey=String(e?.canonicalKey||e?.canonicalExerciseKey||'');if(rowKey===spec.key)return false;
          const rowSid=String(e?.rawId||e?.sourceId||'');if(sid&&rowSid===sid)return false;
          return !names.has(norm(baseName(e?.raw||e?.n||'')))
        });
        rows.push(card)
      }
      const seen=new Set();
      return rows.filter(e=>{
        const key=String(e?.canonicalKey||e?.canonicalExerciseKey||''),sid=String(e?.rawId||e?.sourceId||''),id=String(e?.id||''),name=norm(e?.n||e?.raw||'');
        const k=key?`canon:${key}`:sid?`sid:${sid}`:id?`id:${id}`:`name:${name}`;
        if(seen.has(k))return false;seen.add(k);return true
      })
    };
    wrapped.__catalogSyncV330=true;wrapped.__catalogSyncBase=base;
    window.catalogRecords=wrapped;try{catalogRecords=wrapped}catch(_){ }
  }

  function wordExercises(n){const x=Math.abs(Number(n)||0)%100,y=x%10;return x>=11&&x<=14?'упражнений':y===1?'упражнение':y>=2&&y<=4?'упражнения':'упражнений'}
  function syncCount(){
    const node=document.getElementById('catalogCount');if(!node)return;
    try{
      if(typeof ogLibraryLoaded!=='undefined'&&!ogLibraryLoaded)return;
      const fn=currentCatalog(),total=typeof fn==='function'?(fn()||[]).length:0;
      if(total)node.textContent=`База · ${total} ${wordExercises(total)}`
    }catch(_){ }
  }

  function wrapUi(name){
    const base=window[name]||(()=>{try{return globalThis[name]}catch(_){return null}})();
    if(typeof base!=='function'||base.__catalogSyncUiV330)return;
    const wrapped=function(){const out=base.apply(this,arguments);queueMicrotask(syncCount);return out};
    wrapped.__catalogSyncUiV330=true;wrapped.__catalogSyncBase=base;
    window[name]=wrapped;try{globalThis[name]=wrapped}catch(_){ }
  }

  function installSearch(){
    const base=window.setExerciseQuery||(()=>{try{return setExerciseQuery}catch(_){return null}})();
    if(typeof base!=='function'||base.__catalogSyncSearchV330)return;
    const wrapped=function(q){
      const raw=String(q||''),n=norm(raw);let spec=specFor(raw);
      if(!spec&&n.length>=8){
        const found=ADDED.filter(x=>[x.name,...x.aliases].some(a=>{const an=norm(a);return an.includes(n)||n.includes(an)}));
        if(found.length===1)spec=found[0]
      }
      return base.call(this,spec?spec.name:raw)
    };
    wrapped.__catalogSyncSearchV330=true;wrapped.__catalogSyncBase=base;
    window.setExerciseQuery=wrapped;try{setExerciseQuery=wrapped}catch(_){ }
  }

  function setIf(obj,key,value){if(value===undefined||value===null||obj[key]===value)return false;obj[key]=value;return true}
  function mapExercise(ex){
    if(!ex||typeof ex!=='object')return false;
    const raw=ex.cleanName||ex.canonicalName||ex.n||ex.name||'';
    const spec=specFor(raw);if(!spec)return false;
    const card=sourceCard(spec);if(!card)return false;
    const sid=String(card.sourceId||card.rawId||'');let changed=false;
    changed=setIf(ex,'sourceId',sid)||changed;
    changed=setIf(ex,'canonicalExerciseKey',spec.key)||changed;
    changed=setIf(ex,'canonicalName',spec.name)||changed;
    if(Object.prototype.hasOwnProperty.call(ex,'cleanName'))changed=setIf(ex,'cleanName',spec.name)||changed;
    if(!ex.bp&&card.bp){ex.bp=card.bp;changed=true}if(!ex.tg&&card.tg){ex.tg=card.tg;changed=true}if(!ex.eq&&card.eq){ex.eq=card.eq;changed=true}
    try{
      if(ex.n&&typeof st!=='undefined'&&st&&st.aliases&&typeof st.aliases==='object'){
        const b=baseName(ex.n);if(b&&norm(b)!==norm(spec.name)&&st.aliases[b]!==spec.name){st.aliases[b]=spec.name;changed=true}
      }
    }catch(_){ }
    return changed
  }
  function eachProgramExercise(program,fn){
    (program?.weeks||[]).forEach(w=>(w?.days||[]).forEach(d=>(d?.ex||d?.e||[]).forEach(fn)));
    const routines=program?.snapshot?.routines||program?.routines||[];(routines||[]).forEach(r=>(r?.e||r?.ex||[]).forEach(fn));
    (program?.days||[]).forEach(d=>(d?.ex||d?.e||[]).forEach(fn))
  }
  function syncPlans(){
    let changed=false;
    try{(Array.isArray(ROUTINES)?ROUTINES:[]).forEach(r=>(r?.e||[]).forEach(e=>{if(mapExercise(e))changed=true}))}catch(_){ }
    try{
      const state=typeof st!=='undefined'?st:window.st;
      (state?.programs||[]).forEach(p=>{eachProgramExercise(p,e=>{if(mapExercise(e))changed=true});p.exerciseMappingRevision=RELEASE});
      const mapSession=s=>(s?.ex||[]).forEach(e=>{if(mapExercise(e))changed=true});
      (state?.sessions||[]).forEach(mapSession);mapSession(state?.current);
      if(changed){try{typeof save==='function'?save():window.save?.()}catch(_){ }}
    }catch(_){ }
    return changed
  }

  function installOpenByName(){
    const base=window.openExerciseDetailByName||(()=>{try{return openExerciseDetailByName}catch(_){return null}})();
    if(typeof base!=='function'||base.__catalogSyncV330)return;
    const wrapped=function(raw){
      const decoded=decodeURIComponent(String(raw||'')),spec=specFor(decoded);
      if(spec){
        const card=sourceCard(spec);if(card&&typeof renderExerciseDetail==='function'){
          try{const best=typeof bestEstimateFor==='function'?bestEstimateFor(spec.name,card.sourceId):null;rmState={id:card.id,w:best?.w||20,r:best?.r||5}}catch(_){ }
          return renderExerciseDetail(card)
        }
      }
      return base.apply(this,arguments)
    };
    wrapped.__catalogSyncV330=true;wrapped.__catalogSyncBase=base;
    window.openExerciseDetailByName=wrapped;try{openExerciseDetailByName=wrapped}catch(_){ }
  }

  function refresh(){
    installFindExercise();installCatalog();installOpenByName();installSearch();
    ['exercisesPage','refreshCatalogUI','renderExerciseResults'].forEach(wrapUi);
    syncPlans();syncCount();
    try{if(document.querySelector('#exercises.page.active')&&typeof renderExerciseResults==='function')renderExerciseResults()}catch(_){ }
  }

  window.UNVRSL_ADDED_EXERCISES_V330=Object.freeze(ADDED.map(x=>({key:x.key,name:x.name,aliases:x.aliases.slice()})));
  window.UNVRSL_EXERCISE_CATALOG_AUDIT_V330=()=>ADDED.map(x=>{const c=sourceCard(x),fn=currentCatalog(),rows=typeof fn==='function'?fn():[];return{key:x.key,name:x.name,sourceId:c?.sourceId||null,gif:!!(c?.gif||c?.gif_url),inCatalog:!!rows.some(e=>String(e?.canonicalKey||e?.canonicalExerciseKey||'')===x.key)}});

  refresh();
  ['unvrsl:modules-ready','unvrsl:deferred-modules-ready','unvrsl:app-ready'].forEach(ev=>window.addEventListener(ev,()=>setTimeout(refresh,0),{passive:true}));
  let tries=0;const timer=setInterval(()=>{refresh();if(++tries>=60&&(()=>{try{return typeof ogLibraryLoaded!=='undefined'&&ogLibraryLoaded}catch(_){return false}})())clearInterval(timer)},300);
})();
