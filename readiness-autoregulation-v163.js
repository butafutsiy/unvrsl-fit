'use strict';
(()=>{
  if(window.__unvrslReadinessAutoregulationV257)return;
  window.__unvrslReadinessAutoregulationV257=true;
  const ready={engine:false,questionnaire:false,exact:false};
  function mark(name){ready[name]=true;if(Object.values(ready).every(Boolean)){window.__unvrslReadinessStackReadyV257=true;window.__unvrslReadinessStackReadyV260=true;window.dispatchEvent(new CustomEvent('unvrsl:readiness-ready',{detail:{release:296}}))}}
  function loadBuiltinProfile(){
    if(window.__unvrslBuiltinCycleLoadProfileV296||document.querySelector('script[data-unvrsl-builtin-load-profile-v296]'))return;
    const x=document.createElement('script');x.src='builtin-cycle-load-profile-v296.js?v=296';x.async=false;x.dataset.unvrslBuiltinLoadProfileV296='1';x.onerror=()=>console.warn('UNVRSL built-in load profile v296 failed to load');document.body.appendChild(x)
  }
  let attempts=0;
  function load(){
    loadBuiltinProfile();
    if(window.__unvrslTrainingEngineV257){mark('engine');loadPrescriptionBridge();return}
    if(attempts>=3)return;
    document.querySelectorAll('script[data-unvrsl-training-engine-v200]').forEach(x=>x.remove());
    const s=document.createElement('script');attempts++;
    s.src=attempts===1?'training-engine-v200.js?v=295':`training-engine-v200.js?v=295-${attempts}`;
    s.async=false;s.dataset.unvrslTrainingEngineV200='1';
    s.onload=()=>{if(window.__unvrslTrainingEngineV257){mark('engine');loadPrescriptionBridge();loadBuiltinProfile()}else setTimeout(load,250)};
    s.onerror=()=>setTimeout(load,700);
    document.body.appendChild(s)
  }
  function loadQuestionnaire(){
    if(window.__unvrslReadinessQuestionnaireV227){mark('questionnaire');return}
    if(document.querySelector('script[data-unvrsl-readiness-v227]'))return;
    const q=document.createElement('script');q.src='readiness-questionnaire-v227.js?v=295';q.async=false;q.dataset.unvrslReadinessV227='1';q.onload=()=>{if(window.__unvrslReadinessQuestionnaireV227)mark('questionnaire')};document.body.appendChild(q)
  }
  function loadExactPlanFix(){
    if(window.__unvrslExactPlanFixV257){mark('exact');return}
    if(document.querySelector('script[data-unvrsl-exact-plan-v230]'))return;
    const f=document.createElement('script');f.src='exact-plan-fix-v228.js?v=295';f.async=false;f.dataset.unvrslExactPlanV230='1';f.onload=()=>{if(window.__unvrslExactPlanFixV257)mark('exact')};document.body.appendChild(f)
  }
  function loadWorkoutShare(){
    if(window.__unvrslShareProgressV264||document.querySelector('script[data-unvrsl-share-v264]'))return;
    document.querySelectorAll('script[data-unvrsl-share-v262],script[data-unvrsl-share-v263]').forEach(x=>x.remove());
    const x=document.createElement('script');x.src='share-progress-template-v264.js?v=264';x.async=false;x.dataset.unvrslShareV264='1';document.body.appendChild(x)
  }
  function loadPrescriptionBridge(){
    if(window.__unvrslTrainingPrescriptionBridgeV288||document.querySelector('script[data-unvrsl-prescription-bridge-v288]'))return;
    const x=document.createElement('script');x.src='training-prescription-bridge-v288.js?v=295';x.async=false;x.dataset.unvrslPrescriptionBridgeV288='1';x.onerror=()=>console.warn('UNVRSL prescription bridge v288 failed to load');document.body.appendChild(x)
  }
  loadBuiltinProfile();load();loadQuestionnaire();loadExactPlanFix();loadWorkoutShare();loadPrescriptionBridge();
  ['unvrsl:training-engine-ready','unvrsl:modules-ready','unvrsl:app-ready','unvrsl:cloud-modules-settled'].forEach(ev=>window.addEventListener(ev,()=>{loadBuiltinProfile();loadPrescriptionBridge()},{passive:true}));
})();
