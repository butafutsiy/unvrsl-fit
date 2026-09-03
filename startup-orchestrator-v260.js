'use strict';
(()=>{
  const W=window,D=document,READY_CLASS='unvrsl-app-ready-v260';
  if(W.__unvrslStartupOrchestratorV260)return;W.__unvrslStartupOrchestratorV260=true;
  W.__unvrslStartupComplete=false;

  // Load the canonical math layer independently from the workout UI. It waits
  // for the training engine and updates weight data without rebuilding pages.
  function loadTrainingLoadModel(){
    if(W.__unvrslTrainingLoadModelV258||D.querySelector('script[data-unvrsl-load-model-v258]'))return;
    const s=D.createElement('script');s.src='training-load-model-v258.js?v=260';s.async=false;s.dataset.unvrslLoadModelV258='1';s.onerror=()=>console.warn('UNVRSL load model v258 failed to load');D.body?.appendChild(s)
  }
  function loadProgramIntensity(){
    if(W.__unvrslProgramIntensityAutoWeightV261||D.querySelector('script[data-unvrsl-program-intensity-v261]'))return;
    const s=D.createElement('script');s.src='program-intensity-autoweight-v261.js?v=261';s.async=false;s.dataset.unvrslProgramIntensityV261='1';s.onerror=()=>console.warn('UNVRSL program intensity v261 failed to load');D.body?.appendChild(s)
  }
  function loadTrainerClientProgramEdit(){
    if(W.__unvrslTrainerClientProgramEditV262||D.querySelector('script[data-unvrsl-trainer-client-edit-v262]'))return;
    const s=D.createElement('script');s.src='trainer-client-program-edit-v262.js?v=262';s.async=false;s.dataset.unvrslTrainerClientEditV262='1';s.onerror=()=>console.warn('UNVRSL trainer client program edit v262 failed to load');D.body?.appendChild(s)
  }
  function loadProgramWeekRpeRir(){
    if(W.__unvrslProgramWeekRpeRirV263||D.querySelector('script[data-unvrsl-week-rpe-rir-v263]'))return;
    const s=D.createElement('script');s.src='program-week-rpe-rir-v263.js?v=266';s.async=false;s.dataset.unvrslWeekRpeRirV263='1';s.onerror=()=>console.warn('UNVRSL week RPE RIR v263 failed to load');D.body?.appendChild(s)
  }
  function loadProgramRepRange(){
    if(W.__unvrslProgramRepRangeV266||D.querySelector('script[data-unvrsl-program-rep-range-v266]'))return;
    const s=D.createElement('script');s.src='program-rep-range-v266.js?v=266';s.async=false;s.dataset.unvrslProgramRepRangeV266='1';s.onerror=()=>console.warn('UNVRSL program rep range v266 failed to load');D.body?.appendChild(s)
  }
  function loadBuiltInPlanRepRanges(){
    if(W.__unvrslBuiltInPlanRepRangesV267||D.querySelector('script[data-unvrsl-built-in-ranges-v267]'))return;
    const s=D.createElement('script');s.src='built-in-plan-rep-ranges-v267.js?v=267';s.async=false;s.dataset.unvrslBuiltInRangesV267='1';s.onerror=()=>console.warn('UNVRSL built-in plan rep ranges v267 failed to load');D.body?.appendChild(s)
  }
  loadTrainingLoadModel();loadProgramIntensity();loadTrainerClientProgramEdit();loadProgramWeekRpeRir();loadProgramRepRange();loadBuiltInPlanRepRanges();

  // app.js paints a harmless base DOM once. Every later full render is queued
  // until all canonical owners, cloud data and the current role are settled.
  const baseRender=W.render;
  let unlocked=false,pending=false,finalizing=false,released=false;
  if(typeof baseRender==='function'){
    const gated=function(){
      if(!unlocked){pending=true;return}
      return baseRender.apply(this,arguments)
    };
    gated.__unvrslBootRenderGateV260=true;gated.__unvrslBootRenderBaseV260=baseRender;
    W.render=gated;try{render=gated}catch(_){ }
  }

  const trainer=()=>{
    const c=W.cloud,email=String(c?.user?.email||'').trim().toLowerCase();
    if(email==='butafutsiy@mail.ru'||String(c?.profile?.role||'').toLowerCase()==='trainer')return true;
    try{return typeof W.unvrslTrainerMode==='function'&&W.unvrslTrainerMode()}catch(_){return false}
  };
  const client=()=>!!W.cloud?.user&&!trainer();
  function coreReady(){
    const c=W.cloud;
    if(D.readyState!=='complete'||!W.__unvrslDynamicModulesReadyV260||!W.__unvrslReadinessStackReadyV260)return false;
    if(!W.__unvrslCloudModulesSettledV260||!c?.initSettled)return false;
    if(!W.__unvrslStatsAuthorityV254||!W.__unvrslTrainerShellV252||!W.__unvrslClientWorkoutScrollV261)return false;
    if(client()&&(!W.__unvrslClientRuntimeSettledV260||!D.body?.classList.contains('client-runtime-ready-v260')))return false;
    return true
  }
  const frames=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  async function paintFinalInterface(){
    unlocked=true;W.__unvrslBootRenderUnlockedV260=true;
    try{W.render?.()}catch(e){console.warn('UNVRSL final render v260',e)}
    try{W.unvrslTrainerShellSyncV260?.(true)}catch(_){ }
    if(client()){
      try{W.clientCleanHome?.()}catch(_){ }
      if(D.getElementById('plan')?.classList.contains('active'))try{W.clientCleanPlanPage?.()}catch(_){ }
    }
    try{W.statsEnsureCanonicalV254?.()}catch(_){ }
    try{W.unvrslLegacyCleanV260?.()}catch(_){ }
    await frames();
    await new Promise(resolve=>setTimeout(resolve,90));
    try{W.unvrslTrainerShellSyncV260?.(false)}catch(_){ }
    try{W.unvrslLegacyCleanV260?.()}catch(_){ }
    await frames()
  }
  async function finalize(){
    if(finalizing||released||!coreReady())return false;
    finalizing=true;
    try{
      await paintFinalInterface();
      D.documentElement?.classList.add(READY_CLASS);
      D.body?.classList.add(READY_CLASS);
      W.__unvrslStartupComplete=true;W.__unvrslStartupReleaseReasonV260='ready';
      const splash=D.getElementById('unvrsl-startup-v258');
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        splash?.classList.add('out');
        setTimeout(()=>{splash?.remove();D.getElementById('unvrsl-startup-v258-style')?.remove()},240)
      }));
      released=true;clearInterval(poll);W.dispatchEvent?.(new CustomEvent('unvrsl:app-ready',{detail:{release:260,queuedRender:pending}}));
      return true
    }finally{finalizing=false}
  }
  W.unvrslTryFinalizeStartupV260=finalize;
  for(const name of ['load','unvrsl:modules-ready','unvrsl:cloud-ready','unvrsl:client-ready','unvrsl:client-settled','unvrsl:readiness-ready'])W.addEventListener?.(name,finalize,{passive:true});
  for(const name of ['unvrsl:modules-ready','unvrsl:training-engine-ready','unvrsl:app-ready']){
    W.addEventListener?.(name,loadTrainingLoadModel,{passive:true});
    W.addEventListener?.(name,loadProgramIntensity,{passive:true});
    W.addEventListener?.(name,loadTrainerClientProgramEdit,{passive:true});
    W.addEventListener?.(name,loadProgramWeekRpeRir,{passive:true});
    W.addEventListener?.(name,loadProgramRepRange,{passive:true});
    W.addEventListener?.(name,loadBuiltInPlanRepRanges,{passive:true})
  }
  [400,1200,3000].forEach(ms=>{setTimeout(loadTrainingLoadModel,ms);setTimeout(loadProgramIntensity,ms);setTimeout(loadTrainerClientProgramEdit,ms);setTimeout(loadProgramWeekRpeRir,ms);setTimeout(loadProgramRepRange,ms);setTimeout(loadBuiltInPlanRepRanges,ms)});
  const poll=setInterval(finalize,80);finalize();
})();
