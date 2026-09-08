'use strict';
(()=>{
  const W=window,D=document,READY_CLASS='unvrsl-app-ready-v260';
  if(W.__unvrslStartupOrchestratorV260)return;W.__unvrslStartupOrchestratorV260=true;
  W.__unvrslStartupComplete=false;

  // Startup must never be held hostage by a slow cloud session refresh.
  // Give Supabase a short grace period, then paint the local app and hydrate
  // cloud/profile/role in the background when the service recovers.
  const bootStarted=(W.performance?.now?.()||Date.now());
  const CLOUD_GRACE_MS=850;
  const HARD_RELEASE_MS=2600;
  const elapsed=()=>((W.performance?.now?.()||Date.now())-bootStarted);

  // Load the canonical math layer independently from the workout UI. It waits
  // for the training engine and updates weight data without rebuilding pages.
  function loadTrainingLoadModel(){
    if(W.__unvrslTrainingLoadModelV292||D.querySelector('script[data-unvrsl-load-model-v292]'))return;
    const s=D.createElement('script');s.src='training-load-model-v292.js?v=315';s.async=false;s.dataset.unvrslLoadModelV292='1';s.onerror=()=>console.warn('UNVRSL load model v292 failed to load');D.body?.appendChild(s)
  }
  function loadProgramIntensity(){
    if(W.__unvrslProgramIntensityAutoWeightV261||D.querySelector('script[data-unvrsl-program-intensity-v261]'))return;
    const s=D.createElement('script');s.src='program-intensity-autoweight-v261.js?v=292';s.async=false;s.dataset.unvrslProgramIntensityV261='1';s.onerror=()=>console.warn('UNVRSL program intensity UI failed to load');D.body?.appendChild(s)
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
  function loadProgramWeekRepGuidance(){
    if(W.__unvrslProgramWeekRepGuidanceV268||D.querySelector('script[data-unvrsl-week-rep-guidance-v268]'))return;
    const s=D.createElement('script');s.src='program-week-rep-guidance-v268.js?v=268';s.async=false;s.dataset.unvrslWeekRepGuidanceV268='1';s.onerror=()=>console.warn('UNVRSL weekly rep guidance v268 failed to load');D.body?.appendChild(s)
  }
  loadTrainingLoadModel();loadProgramIntensity();loadTrainerClientProgramEdit();loadProgramWeekRpeRir();loadProgramRepRange();loadBuiltInPlanRepRanges();loadProgramWeekRepGuidance();

  // app.js paints a harmless base DOM once. Every later full render is queued
  // until canonical local owners are ready. Cloud is now non-blocking after
  // the short grace period above.
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
  const cloudSettled=()=>!!(W.__unvrslCloudModulesSettledV260&&W.cloud?.initSettled);
  const cloudCanWait=()=>elapsed()<CLOUD_GRACE_MS;

  function localCoreReady(){
    if(D.readyState!=='complete'||!W.__unvrslDynamicModulesReadyV260||!W.__unvrslReadinessStackReadyV260)return false;
    if(!W.__unvrslStatsAuthorityV254||!W.__unvrslTrainerShellV252||!W.__unvrslClientWorkoutScrollV261)return false;
    return true
  }
  function coreReady(){
    if(!localCoreReady())return false;
    if(!cloudSettled()&&cloudCanWait())return false;
    if(!cloudSettled()){
      W.__unvrslStartupCloudBypassedV260=true;
      W.__unvrslStartupCloudBypassMsV260=Math.round(elapsed());
    }
    // Only wait for client-specific cloud runtime when cloud actually resolved
    // a signed-in client. An unavailable cloud must not block the local shell.
    if(cloudSettled()&&client()&&(!W.__unvrslClientRuntimeSettledV260||!D.body?.classList.contains('client-runtime-ready-v260')))return false;
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
    await new Promise(resolve=>setTimeout(resolve,60));
    try{W.unvrslTrainerShellSyncV260?.(false)}catch(_){ }
    try{W.unvrslLegacyCleanV260?.()}catch(_){ }
    await frames()
  }
  async function finalize(force=false){
    if(finalizing||released)return false;
    if(!force&&!coreReady())return false;
    if(force&&!localCoreReady()&&typeof baseRender!=='function')return false;
    finalizing=true;
    try{
      if(force&&!cloudSettled())W.__unvrslStartupCloudBypassedV260=true;
      await paintFinalInterface();
      D.documentElement?.classList.add(READY_CLASS);
      D.body?.classList.add(READY_CLASS);
      W.__unvrslStartupComplete=true;
      W.__unvrslStartupReleaseReasonV260=W.__unvrslStartupCloudBypassedV260?'local-first':'ready';
      const splash=D.getElementById('unvrsl-startup-v258');
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        splash?.classList.add('out');
        setTimeout(()=>{splash?.remove();D.getElementById('unvrsl-startup-v258-style')?.remove()},220)
      }));
      released=true;clearInterval(poll);W.dispatchEvent?.(new CustomEvent('unvrsl:app-ready',{detail:{release:260,queuedRender:pending,cloudBypassed:!!W.__unvrslStartupCloudBypassedV260}}));
      return true
    }finally{finalizing=false}
  }
  W.unvrslTryFinalizeStartupV260=finalize;
  for(const name of ['load','unvrsl:modules-ready','unvrsl:cloud-ready','unvrsl:client-ready','unvrsl:client-settled','unvrsl:readiness-ready'])W.addEventListener?.(name,()=>finalize(false),{passive:true});
  for(const name of ['unvrsl:modules-ready','unvrsl:training-engine-ready','unvrsl:app-ready']){
    W.addEventListener?.(name,loadTrainingLoadModel,{passive:true});
    W.addEventListener?.(name,loadProgramIntensity,{passive:true});
    W.addEventListener?.(name,loadTrainerClientProgramEdit,{passive:true});
    W.addEventListener?.(name,loadProgramWeekRpeRir,{passive:true});
    W.addEventListener?.(name,loadProgramRepRange,{passive:true});
    W.addEventListener?.(name,loadBuiltInPlanRepRanges,{passive:true});
    W.addEventListener?.(name,loadProgramWeekRepGuidance,{passive:true})
  }
  [400,1200,3000].forEach(ms=>{setTimeout(loadTrainingLoadModel,ms);setTimeout(loadProgramIntensity,ms);setTimeout(loadTrainerClientProgramEdit,ms);setTimeout(loadProgramWeekRpeRir,ms);setTimeout(loadProgramRepRange,ms);setTimeout(loadBuiltInPlanRepRanges,ms);setTimeout(loadProgramWeekRepGuidance,ms)});
  // Cloud grace expiry immediately retries startup. A hard cap prevents an
  // unrelated optional module from leaving users on the splash indefinitely.
  setTimeout(()=>finalize(false),CLOUD_GRACE_MS+30);
  setTimeout(()=>finalize(true),HARD_RELEASE_MS);
  const poll=setInterval(()=>finalize(false),80);finalize(false);
})();
