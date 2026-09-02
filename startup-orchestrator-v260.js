'use strict';
(()=>{
  const W=window,D=document,READY_CLASS='unvrsl-app-ready-v260';
  if(W.__unvrslStartupOrchestratorV260)return;W.__unvrslStartupOrchestratorV260=true;
  W.__unvrslStartupComplete=false;

  // Load the v258 math layer independently from the workout UI. It waits for
  // the canonical training engine and only updates weight data, never rebuilds
  // the workout page or intercepts set check buttons.
  function loadTrainingLoadModel(){
    if(W.__unvrslTrainingLoadModelV258||D.querySelector('script[data-unvrsl-load-model-v258]'))return;
    const s=D.createElement('script');s.src='training-load-model-v258.js?v=258';s.async=false;s.dataset.unvrslLoadModelV258='1';s.onerror=()=>console.warn('UNVRSL load model v258 failed to load');D.body?.appendChild(s)
  }
  loadTrainingLoadModel();

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
    // Flush zero-delay decorators created by the one final render while the
    // application shell is still invisible behind the startup surface.
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
  for(const name of ['unvrsl:modules-ready','unvrsl:training-engine-ready','unvrsl:app-ready'])W.addEventListener?.(name,loadTrainingLoadModel,{passive:true});
  [400,1200,3000].forEach(ms=>setTimeout(loadTrainingLoadModel,ms));
  const poll=setInterval(finalize,80);finalize();
})();
