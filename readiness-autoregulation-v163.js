'use strict';
(()=>{
  if(window.__unvrslTrainingEngineV200)return;
  let attempts=0;
  function load(){
    if(window.__unvrslTrainingEngineV200||attempts>=3)return;
    document.querySelectorAll('script[data-unvrsl-training-engine-v200]').forEach(x=>x.remove());
    const s=document.createElement('script');attempts++;
    s.src=`training-engine-v200.js?v=227-${attempts}`;
    s.async=false;s.dataset.unvrslTrainingEngineV200='1';
    s.onload=()=>{if(!window.__unvrslTrainingEngineV200)setTimeout(load,250)};
    s.onerror=()=>setTimeout(load,700);
    document.body.appendChild(s)
  }
  function loadQuestionnaire(){
    if(window.__unvrslReadinessQuestionnaireV227||document.querySelector('script[data-unvrsl-readiness-v227]'))return;
    const q=document.createElement('script');
    q.src='readiness-questionnaire-v227.js?v=227';q.async=false;q.dataset.unvrslReadinessV227='1';
    document.body.appendChild(q)
  }
  load();
  loadQuestionnaire();
})();
