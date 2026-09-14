'use strict';
(()=>{
  const W=window,D=document,RELEASE=389;
  const READY='unvrsl-shell-ready-v316',LEGACY_READY='unvrsl-app-ready-v260';
  if(W.__unvrslStartupOrchestratorV389)return;
  W.__unvrslStartupOrchestratorV389=true;
  W.__unvrslStartupOrchestratorV321=true;
  W.__unvrslStartupOrchestratorV320=true;
  W.__unvrslStartupOrchestratorV319=true;
  W.__unvrslStartupOrchestratorV260=true;
  W.__unvrslStartupComplete=false;

  // Remove the v387 workaround. v389 has one deterministic startup path.
  try{
    if(W.__unvrslBootWatchdogV387){
      clearTimeout(W.__unvrslBootWatchdogV387);
      W.__unvrslBootWatchdogV387=null;
    }
  }catch(_){ }

  const splash=()=>D.getElementById('unvrsl-startup-v258');
  let progress=0,target=0,animating=false;
  function paintProgress(value){
    const next=Math.max(0,Math.min(100,Math.round(Number(value)||0)));
    const root=splash(),track=root?.querySelector('.u-progress'),bar=track?.querySelector('i'),label=root?.querySelector('.u-status');
    progress=next;
    if(bar)bar.style.width=`${next}%`;
    if(track){track.setAttribute('aria-valuenow',String(next));track.dataset.progress=String(next)}
    if(label)label.textContent=`${next}%`;
  }
  function advance(value){
    target=Math.max(target,Math.min(100,Math.round(Number(value)||0)));
    if(animating)return;
    animating=true;
    const tick=()=>{
      if(progress>=target){animating=false;return}
      const gap=target-progress;
      paintProgress(progress+Math.max(1,Math.ceil(gap/7)));
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  paintProgress(0);

  // Asset callbacks may make the bar smoother, but never gate startup.
  let loadedAssets=0;
  W.unvrslStartupAssetLoadedV320=()=>{
    loadedAssets+=1;
    advance(Math.min(64,18+loadedAssets*1.15));
  };
  W.unvrslStartupAssetLoadedV319=W.unvrslStartupAssetLoadedV320;

  const baseRender=W.render;
  let unlocked=false,pending=false,finalizing=false,released=false;
  if(typeof baseRender==='function'){
    const gated=function(){
      if(!unlocked){pending=true;return}
      return baseRender.apply(this,arguments);
    };
    gated.__unvrslBootRenderGateV260=true;
    gated.__unvrslBootRenderBaseV260=baseRender;
    W.render=gated;
    try{render=gated}catch(_){ }
    advance(28);
  }

  function localCoreReady(){
    if(D.readyState==='loading')return false;
    if(typeof baseRender!=='function')return false;
    if(!W.__unvrslUiStabilityV316)return false;
    if(!D.querySelector('.app')||!D.querySelector('.nav'))return false;
    return true;
  }

  function syncProgress(){
    if(D.readyState!=='loading')advance(22);
    if(typeof baseRender==='function')advance(34);
    if(W.__unvrslUiStabilityV316)advance(76);
    if(D.querySelector('.app')&&D.querySelector('.nav'))advance(82);
  }

  const frames=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  async function paintFirstInterface(){
    unlocked=true;
    W.__unvrslBootRenderUnlockedV260=true;
    advance(88);
    try{W.unvrslUiStabilityPrepareV316?.()}catch(_){ }
    try{W.render?.()}catch(error){
      console.error('UNVRSL first render v389 failed',error);
      throw error;
    }
    advance(94);
    try{W.unvrslUiStabilityPrepareV316?.()}catch(_){ }
    await frames();
    advance(98);
    await frames();
  }

  function hydrateRuntime(){
    if(!released)return;
    try{W.render?.()}catch(error){console.warn('UNVRSL hydrate render v389',error)}
    try{W.unvrslTrainerShellSyncV260?.(false)}catch(_){ }
    try{W.statsEnsureCanonicalV254?.()}catch(_){ }
    try{W.clientCleanHome?.()}catch(_){ }
    try{W.unvrslUiStabilityPrepareV316?.()}catch(_){ }
  }

  async function finalize(){
    syncProgress();
    if(finalizing||released||!localCoreReady())return false;
    finalizing=true;
    try{
      await paintFirstInterface();
      D.documentElement?.classList.add(READY,LEGACY_READY);
      D.body?.classList.add(READY,LEGACY_READY);
      W.__unvrslStartupComplete=true;
      W.__unvrslStartupReleaseReasonV260='local-shell-ready';
      target=100;
      while(progress<100){
        paintProgress(progress+1);
        await new Promise(resolve=>requestAnimationFrame(resolve));
      }
      const root=splash();
      root?.classList.add('out');
      setTimeout(()=>{
        root?.remove();
        D.getElementById('unvrsl-startup-v258-style')?.remove();
      },220);
      released=true;
      clearInterval(poll);
      W.dispatchEvent?.(new CustomEvent('unvrsl:app-ready',{detail:{release:RELEASE,queuedRender:pending}}));
      setTimeout(hydrateRuntime,0);
      return true;
    }catch(error){
      // A real render error remains visible in the console and the splash stays.
      // There is intentionally no timeout/watchdog that hides a broken startup.
      console.error('UNVRSL startup v389 failed',error);
      return false;
    }finally{
      finalizing=false;
    }
  }

  // Cloud/auth/client data hydrate after the local shell opens. They are not
  // prerequisites for displaying the app and cannot stop progress at 84/91/94.
  for(const name of ['unvrsl:cloud-ready','unvrsl:cloud-modules-settled','unvrsl:client-ready','unvrsl:client-settled','unvrsl:modules-ready']){
    W.addEventListener?.(name,hydrateRuntime,{passive:true});
  }
  for(const name of ['DOMContentLoaded','load','unvrsl:ui-stability-ready']){
    W.addEventListener?.(name,finalize,{passive:true});
  }

  // Nonessential calculation/editor helpers warm only after the shell is usable.
  const featureSources=[
    ['training-load-model.js?v=389','__unvrslTrainingLoadModelV292'],
    ['program-intensity-autoweight.js?v=389','__unvrslProgramIntensityAutoWeightV261'],
    ['trainer-client-program-edit.js?v=389','__unvrslTrainerClientProgramEditV262'],
    ['program-week-rpe-rir.js?v=389','__unvrslProgramWeekRpeRirV263'],
    ['program-rep-range.js?v=389','__unvrslProgramRepRangeV266'],
    ['built-in-plan-rep-ranges.js?v=389','__unvrslBuiltInPlanRepRangesV267'],
    ['program-week-rep-guidance.js?v=389','__unvrslProgramWeekRepGuidanceV268']
  ];
  function warmFeatureModules(){
    featureSources.forEach(([src,flag])=>{
      if(W[flag]||D.querySelector(`script[src^="${src.split('?')[0]}"]`))return;
      const s=D.createElement('script');
      s.src=src;s.async=true;
      s.onerror=()=>console.warn('UNVRSL optional module failed',src);
      D.body?.appendChild(s);
    });
  }
  W.addEventListener?.('unvrsl:app-ready',()=>{
    if('requestIdleCallback'in W)W.requestIdleCallback(warmFeatureModules,{timeout:1200});
    else setTimeout(warmFeatureModules,250);
  },{once:true,passive:true});

  W.unvrslTryFinalizeStartupV260=finalize;
  const poll=setInterval(finalize,50);
  syncProgress();
  finalize();
})();
