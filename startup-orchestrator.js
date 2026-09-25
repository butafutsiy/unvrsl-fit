'use strict';
(()=>{
  const W=window,D=document,RELEASE=425,READY_CLASS='unvrsl-shell-ready-v316',LEGACY_READY_CLASS='unvrsl-app-ready-v260';
  if(W.__unvrslStartupOrchestratorV321)return;W.__unvrslStartupOrchestratorV321=true;W.__unvrslStartupOrchestratorV320=true;W.__unvrslStartupOrchestratorV319=true;W.__unvrslStartupOrchestratorV260=true;
  W.__unvrslStartupComplete=false;

  // Startup must never be held hostage by a slow cloud session refresh.
  // Give Supabase a short grace period, then paint the local app and hydrate
  // cloud/profile/role in the background when the service recovers.
  const bootStarted=(W.performance?.now?.()||Date.now());
  const CLOUD_GRACE_MS=850;
  const AUTH_GRACE_MS=5000;
  const elapsed=()=>((W.performance?.now?.()||Date.now())-bootStarted);
  let progressValue=8,loadedAssets=0;
  function setProgress(value){
    const next=Math.max(progressValue,Math.min(100,Math.round(Number(value)||0))),splash=D.getElementById('unvrsl-startup-v258'),track=splash?.querySelector('.u-progress'),bar=track?.querySelector('i'),label=splash?.querySelector('.u-status');
    progressValue=next;if(bar&&bar.style.width!==`${next}%`)bar.style.width=`${next}%`;if(track){track.setAttribute('aria-valuenow',String(next));track.dataset.progress=String(next)}if(label&&label.textContent!==`${next}%`)label.textContent=`${next}%`
  }
  W.unvrslStartupAssetLoadedV320=()=>{loadedAssets+=1;setProgress(Math.min(80,24+loadedAssets*1.1))};
  W.unvrslStartupAssetLoadedV319=W.unvrslStartupAssetLoadedV320;
  setProgress(progressValue);

  // Program model, migration, range resolution and readiness are part of
  // the critical shell in v390. They are loaded once from index.html before
  // the shell can be revealed; no feature module may replace them later.

  // app.js does not paint its legacy base DOM during boot. Its first render is
  // released here only after every local UI owner has finished loading.
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
  function cachedAuth(){
    try{
      for(let i=0;i<localStorage.length;i++){
        const key=String(localStorage.key(i)||'');
        if((/^sb-.*-auth-token$/i.test(key)||/supabase.*auth/i.test(key))&&localStorage.getItem(key))return true
      }
    }catch(_){ }
    return false
  }

  function localCoreReady(){
    if(D.readyState==='loading'||!W.__unvrslCriticalModulesReadyV320)return false;
    if(!W.__unvrslUiStabilityV316||!W.__unvrslTrainerShellV252)return false;
    if(!W.unvrslProgramModelV386||!W.__unvrslProgramsMigratedV386)return false;
    if(W.__unvrslStorageHydrationSettledV386!==true)return false;
    if(!W.__unvrslReadinessStackReadyV386||typeof W.trainingRequestProgramStartV382!=='function')return false;
    return true
  }
  function coreReady(){
    if(!localCoreReady())return false;
    if(!cloudSettled()&&(cloudCanWait()||(cachedAuth()&&elapsed()<AUTH_GRACE_MS)))return false;
    if(!cloudSettled()){
      W.__unvrslStartupCloudBypassedV260=true;
      W.__unvrslStartupCloudBypassMsV260=Math.round(elapsed());
    }
    if(cloudSettled()&&trainer()&&!W.__unvrslTrainerClientsCanonicalV391)return false;
    // Only wait for client-specific cloud runtime when cloud actually resolved
    // a signed-in client. An unavailable cloud must not block the local shell.
    if(cloudSettled()&&client()&&(!W.__unvrslClientRuntimeSettledV260||!D.body?.classList.contains('client-runtime-ready-v260')))return false;
    return true
  }
  function syncProgress(){
    let next=10;if(D.readyState!=='loading')next=22;if(W.__unvrslUiStabilityV316)next=Math.max(next,42);if(W.__unvrslCriticalModulesReadyV320)next=Math.max(next,84);if(next>=84&&(cloudSettled()||elapsed()>=AUTH_GRACE_MS||(!cachedAuth()&&elapsed()>=CLOUD_GRACE_MS)))next=Math.max(next,91);if(next>=91&&(!client()||W.__unvrslClientRuntimeSettledV260))next=Math.max(next,94);setProgress(Math.min(next,96))
  }
  const frames=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  async function paintFinalInterface(){
    unlocked=true;W.__unvrslBootRenderUnlockedV260=true;
    try{W.unvrslUiStabilityPrepareV316?.()}catch(_){ }
    try{W.render?.()}catch(e){console.warn('UNVRSL final render v260',e)}
    try{W.unvrslTrainerShellSyncV260?.(true)}catch(_){ }
    if(client()){
      try{W.clientCleanHome?.()}catch(_){ }
      if(D.getElementById('plan')?.classList.contains('active'))try{W.clientCleanPlanPage?.()}catch(_){ }
    }
    try{W.statsEnsureCanonicalV254?.()}catch(_){ }
    try{W.unvrslUiStabilityPrepareV316?.()}catch(_){ }
    await frames();
    await new Promise(resolve=>setTimeout(resolve,60));
    try{W.unvrslTrainerShellSyncV260?.(false)}catch(_){ }
    try{W.unvrslUiStabilityPrepareV316?.()}catch(_){ }
    await frames()
  }
  async function finalize(){
    syncProgress();
    if(finalizing||released)return false;
    if(!coreReady())return false;
    finalizing=true;setProgress(97);
    try{
      await paintFinalInterface();
      D.getElementById('unvrsl-stability-v313')?.remove();
      D.getElementById('unvrsl-ui-stability-v313-style')?.remove();
      D.documentElement?.classList.add(READY_CLASS,LEGACY_READY_CLASS);
      D.body?.classList.add(READY_CLASS,LEGACY_READY_CLASS);
      W.__unvrslStartupComplete=true;
      W.__unvrslStartupReleaseReasonV260=W.__unvrslStartupCloudBypassedV260?'local-first':'ready';
      setProgress(100);
      const splash=D.getElementById('unvrsl-startup-v258');
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        splash?.classList.add('out');
        setTimeout(()=>{splash?.remove();D.getElementById('unvrsl-startup-v258-style')?.remove()},220)
      }));
      released=true;clearInterval(poll);W.dispatchEvent?.(new CustomEvent('unvrsl:app-ready',{detail:{release:RELEASE,queuedRender:pending,cloudBypassed:!!W.__unvrslStartupCloudBypassedV260}}));
      return true
    }finally{finalizing=false}
  }
  W.unvrslTryFinalizeStartupV260=finalize;
  for(const name of ['load','unvrsl:modules-ready','unvrsl:cloud-ready','unvrsl:client-ready','unvrsl:client-settled','unvrsl:readiness-ready','unvrsl:ui-stability-ready','unvrsl:trainer-clients-ready'])W.addEventListener?.(name,finalize,{passive:true});
  // Never expose a half-built shell. The fixed progress surface remains in
  // place while slow modules finish, without inserting controls or moving it.
  setTimeout(finalize,CLOUD_GRACE_MS+30);
  const poll=setInterval(finalize,80);finalize();
})();
