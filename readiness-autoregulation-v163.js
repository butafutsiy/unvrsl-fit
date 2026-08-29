'use strict';
(()=>{
  if(window.__unvrslTrainingEngineV200||document.querySelector('script[data-unvrsl-training-engine-v200]'))return;
  const s=document.createElement('script');
  s.src='training-engine-v200.js';
  s.async=false;
  s.dataset.unvrslTrainingEngineV200='1';
  document.body.appendChild(s);
})();