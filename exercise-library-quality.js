'use strict';
(()=>{
  if(window.__unvrslSingleExerciseCatalogLoaderV352)return;
  window.__unvrslSingleExerciseCatalogLoaderV352=true;

  const css=document.createElement('style');
  css.textContent='#exercises .quality-media-line,#exercises .catalog-head .chip{display:none!important}';
  document.head.appendChild(css);

  async function boot(){
    const load=window.loadExternalScript||globalThis.loadExternalScript;
    if(typeof load!=='function')return;
    await load('exercise-library-strict.js?v=352');
    await load('exercise-library-additions-v347.js?v=352');
  }
  boot().catch(e=>console.warn('exercise catalog loader',e));
})();
