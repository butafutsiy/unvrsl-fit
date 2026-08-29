'use strict';
(()=>{
  const css=document.createElement('style');
  css.textContent='#exercises .quality-media-line,#exercises .catalog-head .chip{display:none!important}';
  document.head.appendChild(css);
  if(typeof loadExternalScript==='function')loadExternalScript('exercise-library-full.js').catch(e=>console.warn('full exercise library failed',e));
})();
