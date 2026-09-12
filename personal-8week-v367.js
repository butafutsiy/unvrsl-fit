'use strict';
(()=>{
  if(window.__unvrslPersonal8WeekRollbackV371)return;
  window.__unvrslPersonal8WeekRollbackV371=true;
  const BUILTIN='__builtin_cycle__';
  function state(){try{return typeof st!=='undefined'?st:window.st}catch(_){return window.st||null}}
  function persist(){try{if(typeof save==='function')save()}catch(_){}}
  function restorePrimary(){
    const s=state();if(!s)return;
    const p=(Array.isArray(s.programs)?s.programs:[]).find(x=>x?.systemKey==='semen-8week-v2'||x?.systemKey==='editable-builtin-cycle-v370'||x?.name==='Мой план · 8 недель v2');
    if(p&&String(s.primaryProgramId||'')===String(p.id)){s.primaryProgramId=BUILTIN;s.startProgramId=BUILTIN;persist()}
  }
  window.editPersonal8WeekV367=function(){
    restorePrimary();
    if(typeof cloneBuiltInCycle==='function')cloneBuiltInCycle();
    else if(typeof toast==='function')toast('Редактор программы не загрузился');
  };
  window.editPersonal8WeekV369=window.editPersonal8WeekV367;
  restorePrimary();
})();
