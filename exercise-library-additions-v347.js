'use strict';
(()=>{
  if(window.__unvrslExerciseLibraryAdditionsV347)return;
  window.__unvrslExerciseLibraryAdditionsV347=true;

  const EXTRA=[
    {
      id:'unvrsl:hip-thrust-machine',rawId:'unvrsl:hip-thrust-machine',
      n:'Ягодичный мост в тренажёре',name:'Ягодичный мост в тренажёре',strictName:'Ягодичный мост в тренажёре',sourceName:'machine hip thrust',
      bp:'upper legs',eq:'leverage machine',tg:'glutes',custom:false,
      instructions:{ru:'Выполняй разгибание таза в тренажёре с контролем амплитуды и фиксацией ягодичных в верхней точке.'}
    },
    {
      id:'unvrsl:hip-thrust-smith',rawId:'unvrsl:hip-thrust-smith',
      n:'Ягодичный мост в Смите',name:'Ягодичный мост в Смите',strictName:'Ягодичный мост в Смите',sourceName:'smith hip thrust',
      bp:'upper legs',eq:'smith machine',tg:'glutes',custom:false,
      instructions:{ru:'Выполняй ягодичный мост под грифом Смита, сохраняя устойчивое положение корпуса и полный контроль таза.'}
    }
  ];

  const norm=v=>String(v??'').toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/\s+/g,' ').trim();
  const titleOf=e=>String(e?.strictName||e?.prettyRu||e?.n||e?.name||'').trim();
  const filterAllows=e=>{
    try{
      if(typeof exEquipment==='undefined'||exEquipment==='all'||!document.querySelector('#exercises.page.active'))return true;
      if(typeof equipmentGroup==='function')return equipmentGroup(e)===exEquipment;
      return String(e?.eq||'')===exEquipment;
    }catch(_){return true}
  };

  function install(){
    let base=null;
    try{base=window.catalogRecords||((typeof catalogRecords==='function')?catalogRecords:null)}catch(_){base=window.catalogRecords}
    if(typeof base!=='function')return false;
    if(base.__unvrslGluteAdditionsV347)return true;

    const wrapped=function(){
      const rows=base.apply(this,arguments);
      const out=Array.isArray(rows)?rows.slice():[];
      const seen=new Set(out.map(e=>norm(titleOf(e))));
      for(const item of EXTRA){
        if(seen.has(norm(item.strictName))||!filterAllows(item))continue;
        out.push({...item});
        seen.add(norm(item.strictName));
      }
      return out;
    };
    wrapped.__unvrslGluteAdditionsV347=true;
    wrapped.__unvrslGluteAdditionsBaseV347=base;
    window.catalogRecords=wrapped;
    try{catalogRecords=wrapped}catch(_){ }
    window.UNVRSL_BASE_CATALOG_V347=wrapped;

    try{
      if(document.querySelector('#exercises.page.active'))window.renderExerciseResults?.();
    }catch(_){ }
    return true;
  }

  let tries=0;
  const timer=setInterval(()=>{
    tries++;
    if(install()||tries>400)clearInterval(timer);
  },25);
  install();
})();
