'use strict';
(()=>{
  if(window.__unvrslReadinessAutoregulationV257)return;
  window.__unvrslReadinessAutoregulationV257=true;
  const ready={engine:false,questionnaire:false,exact:false};
  function mark(name){ready[name]=true;if(Object.values(ready).every(Boolean)){window.__unvrslReadinessStackReadyV257=true;window.__unvrslReadinessStackReadyV260=true;window.dispatchEvent(new CustomEvent('unvrsl:readiness-ready',{detail:{release:260}}))}}
  let attempts=0;
  function load(){
    if(window.__unvrslTrainingEngineV257){mark('engine');return}
    if(attempts>=3)return;
    document.querySelectorAll('script[data-unvrsl-training-engine-v200]').forEach(x=>x.remove());
    const s=document.createElement('script');attempts++;
    s.src=attempts===1?'training-engine-v200.js?v=260':`training-engine-v200.js?v=260-${attempts}`;
    s.async=false;s.dataset.unvrslTrainingEngineV200='1';
    s.onload=()=>{if(window.__unvrslTrainingEngineV257)mark('engine');else setTimeout(load,250)};
    s.onerror=()=>setTimeout(load,700);
    document.body.appendChild(s)
  }
  function loadQuestionnaire(){
    if(window.__unvrslReadinessQuestionnaireV227){mark('questionnaire');return}
    if(document.querySelector('script[data-unvrsl-readiness-v227]'))return;
    const q=document.createElement('script');
    q.src='readiness-questionnaire-v227.js?v=260';q.async=false;q.dataset.unvrslReadinessV227='1';q.onload=()=>{if(window.__unvrslReadinessQuestionnaireV227)mark('questionnaire')};
    document.body.appendChild(q)
  }
  function loadExactPlanFix(){
    if(window.__unvrslExactPlanFixV257){mark('exact');return}
    if(document.querySelector('script[data-unvrsl-exact-plan-v230]'))return;
    const f=document.createElement('script');
    f.src='exact-plan-fix-v228.js?v=260';f.async=false;f.dataset.unvrslExactPlanV230='1';f.onload=()=>{if(window.__unvrslExactPlanFixV257)mark('exact')};
    document.body.appendChild(f)
  }
  function loadWorkoutShare(){
    if(window.__unvrslShareProgressV263||document.querySelector('script[data-unvrsl-share-v263]'))return;
    document.querySelectorAll('script[data-unvrsl-share-v262]').forEach(x=>x.remove());
    const x=document.createElement('script');x.src='share-progress-template-v262.js?v=263';x.async=false;x.dataset.unvrslShareV263='1';document.body.appendChild(x)
  }
  load();
  loadQuestionnaire();
  loadExactPlanFix();
  loadWorkoutShare();
})();
