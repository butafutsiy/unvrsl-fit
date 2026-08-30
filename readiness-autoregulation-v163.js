'use strict';
(()=>{
  if(window.__unvrslTrainingEngineV200)return;
  let attempts=0;
  function load(){
    if(window.__unvrslTrainingEngineV200||attempts>=3)return;
    document.querySelectorAll('script[data-unvrsl-training-engine-v200]').forEach(x=>x.remove());
    const s=document.createElement('script');attempts++;
    s.src=`training-engine-v200.js?v=208-${attempts}`;
    s.async=false;s.dataset.unvrslTrainingEngineV200='1';
    s.onerror=()=>setTimeout(load,700);
    document.body.appendChild(s)
  }
  load();
})();
