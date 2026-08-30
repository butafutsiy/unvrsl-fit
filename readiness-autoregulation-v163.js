'use strict';
(()=>{
  if(window.__unvrslTrainingEngineV200)return;
  let attempts=0;
  function load(){
    if(window.__unvrslTrainingEngineV200||attempts>=3)return;
    document.querySelectorAll('script[data-unvrsl-training-engine-v200]').forEach(x=>x.remove());
    const s=document.createElement('script');attempts++;
    s.src=`training-engine-v200.js?v=228-${attempts}`;
    s.async=false;s.dataset.unvrslTrainingEngineV200='1';
    s.onload=()=>{if(!window.__unvrslTrainingEngineV200)setTimeout(load,250)};
    s.onerror=()=>setTimeout(load,700);
    document.body.appendChild(s)
  }
  function loadQuestionnaire(){
    if(window.__unvrslReadinessQuestionnaireV227||document.querySelector('script[data-unvrsl-readiness-v227]'))return;
    const q=document.createElement('script');
    q.src='readiness-questionnaire-v227.js?v=228';q.async=false;q.dataset.unvrslReadinessV227='1';
    document.body.appendChild(q)
  }
  function loadExactPlanFix(){
    if(window.__unvrslExactPlanFixV228||document.querySelector('script[data-unvrsl-exact-plan-v228]'))return;
    const f=document.createElement('script');
    f.src='exact-plan-fix-v228.js?v=228';f.async=false;f.dataset.unvrslExactPlanV228='1';
    document.body.appendChild(f)
  }
  load();
  loadQuestionnaire();
  loadExactPlanFix();
})();
