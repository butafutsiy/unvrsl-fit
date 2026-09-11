'use strict';
(()=>{
  const W=window,D=document;
  if(W.__unvrslRestore187V351)return;
  W.__unvrslRestore187V351=true;

  const EXTRA=[
    {id:'unvrsl:hip-thrust-machine',strictName:'Ягодичный мост в тренажёре',n:'Ягодичный мост в тренажёре',bp:'upper legs',eq:'leverage machine',tg:'glutes',custom:false},
    {id:'unvrsl:hip-thrust-smith',strictName:'Ягодичный мост в Смите',n:'Ягодичный мост в Смите',bp:'upper legs',eq:'smith machine',tg:'glutes',custom:false}
  ];
  const norm=s=>String(s||'').toLowerCase().replace(/ё/g,'е').trim();
  const title=e=>String(e?.strictName||e?.n||'').trim();

  async function boot(){
    const load=W.loadExternalScript||globalThis.loadExternalScript;
    if(typeof load!=='function')return;
    W.__unvrslCuratedExerciseLibrary=false;
    W.__unvrslExerciseStrict=false;
    await load('exercise-library-curated.js?v=351');
    await load('exercise-library-strict.js?v=351');

    const strict=W.UNVRSL_STRICT_CATALOG_V331;
    if(typeof strict!=='function')return;
    const baseRender=W.renderExerciseResults;
    const records=()=>{
      const rows=strict().slice(),seen=new Set(rows.map(x=>norm(title(x))));
      for(const x of EXTRA)if(!seen.has(norm(x.strictName)))rows.push({...x});
      return rows;
    };

    W.UNVRSL_STRICT_CATALOG_V331=records;
    W.UNVRSL_FINAL_EXERCISES=records;
    W.catalogRecords=records;
    try{catalogRecords=records}catch(_){ }

    function allowed(x){
      try{
        if(typeof exBody!=='undefined'&&!['all','favorites','recent','frequent'].includes(exBody)&&x.bp!==exBody)return false;
        if(typeof exEquipment!=='undefined'&&exEquipment!=='all'&&typeof equipmentGroup==='function'&&equipmentGroup(x)!==exEquipment)return false;
        const q=String(typeof exQuery==='undefined'?'':exQuery).trim().toLowerCase();
        return !q||x.strictName.toLowerCase().includes(q);
      }catch(_){return true}
    }
    function appendExtras(){
      const list=D.querySelector('#exList');if(!list)return;
      for(const x of EXTRA){
        if(!allowed(x)||list.querySelector(`[data-extra-id="${x.id}"]`))continue;
        const card=D.createElement('div');card.className='card exlib exlib-btn smart-ex-row';card.dataset.extraId=x.id;
        const eq=x.eq==='smith machine'?'Смит':'Тренажёр';
        card.innerHTML=`<div class="exercise-list-row"><div class="grow"><b>${x.strictName}</b><div class="catalog-meta">Бёдра · ${eq} · Ягодичные</div></div><span class="chev">›</span></div>`;
        list.appendChild(card);
      }
      const c=D.querySelector('#catalogCount');
      if(c){const n=records().length;c.textContent=`Основная база · ${n} упражнений`;}
    }
    W.renderExerciseResults=function(){if(typeof baseRender==='function')baseRender();appendExtras();};
    try{renderExerciseResults=W.renderExerciseResults}catch(_){ }
    W.renderExerciseResults();
  }
  boot().catch(e=>console.warn('restore exercise catalog',e));
})();