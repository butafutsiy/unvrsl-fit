'use strict';
(()=>{
  const W=window,D=document,READY_CLASS='unvrsl-app-ready-v260',RELEASE=291;
  if(W.__unvrslStartupOrchestratorV260)return;
  W.__unvrslStartupOrchestratorV260=true;
  W.__unvrslStartupOrchestratorV291=true;
  W.__unvrslStartupComplete=false;
  const started=performance.now();

  const baseRender=W.render;
  let unlocked=false,pending=false,releasing=false,released=false;
  if(typeof baseRender==='function'){
    const gated=function(){
      if(!unlocked){pending=true;return}
      return baseRender.apply(this,arguments)
    };
    gated.__unvrslBootRenderGateV260=true;
    gated.__unvrslBootRenderGateV291=true;
    gated.__unvrslBootRenderBaseV260=baseRender;
    W.render=gated;try{render=gated}catch(_){ }
  }

  const trainer=()=>{
    const c=W.cloud,email=String(c?.user?.email||'').trim().toLowerCase();
    if(email==='butafutsiy@mail.ru'||String(c?.profile?.role||'').toLowerCase()==='trainer')return true;
    try{return typeof W.unvrslTrainerMode==='function'&&W.unvrslTrainerMode()}catch(_){return false}
  };
  const client=()=>!!W.cloud?.user&&!trainer();
  const elapsed=()=>performance.now()-started;
  const frame=()=>new Promise(resolve=>requestAnimationFrame(resolve));

  function baseUiExists(){
    const app=D.querySelector('.app'),home=D.getElementById('home');
    return !!app&&!!home&&typeof W.render==='function';
  }
  function roleSettled(){
    const c=W.cloud;
    if(c?.initSettled||W.__unvrslCloudModulesSettledV260)return true;
    // Local shell is already useful. Never hold a full-screen splash for slow network.
    return elapsed()>=420;
  }
  function fastReady(force=false){
    if(force)return baseUiExists();
    if(!baseUiExists())return false;
    if(elapsed()>=620)return true;
    if(D.readyState!=='loading'&&roleSettled())return true;
    if(roleSettled()&&elapsed()>=320)return true;
    return false
  }

  async function paint(){
    unlocked=true;W.__unvrslBootRenderUnlockedV260=true;W.__unvrslBootRenderUnlockedV291=true;
    try{W.render?.()}catch(e){console.warn('UNVRSL fast final render v291',e)}
    try{W.unvrslTrainerShellSyncV260?.(true)}catch(_){ }
    if(client()){
      try{W.clientCleanHome?.()}catch(_){ }
      if(D.getElementById('plan')?.classList.contains('active'))try{W.clientCleanPlanPage?.()}catch(_){ }
    }
    try{W.unvrslLegacyCleanV291?.()}catch(_){try{W.unvrslLegacyCleanV260?.()}catch(__){ }}
    await frame()
  }

  async function release(force=false,reason='ready'){
    if(released||releasing||!fastReady(force))return false;
    releasing=true;
    try{
      await paint();
      D.documentElement?.classList.add(READY_CLASS);
      D.body?.classList.add(READY_CLASS);
      W.__unvrslStartupComplete=true;
      W.__unvrslStartupReleaseReasonV260=reason;
      W.__unvrslStartupReleaseReasonV291=reason;
      const splash=D.getElementById('unvrsl-startup-v258');
      requestAnimationFrame(()=>{
        splash?.classList.add('out');
        setTimeout(()=>{splash?.remove();D.getElementById('unvrsl-startup-v258-style')?.remove()},150)
      });
      released=true;clearInterval(poll);
      W.dispatchEvent?.(new CustomEvent('unvrsl:app-ready',{detail:{release:RELEASE,queuedRender:pending,reason}}));
      scheduleCanonicalTrainingModules();
      return true
    }finally{releasing=false}
  }
  W.unvrslTryFinalizeStartupV260=()=>release(false,'ready');
  W.unvrslTryFinalizeStartupV291=W.unvrslTryFinalizeStartupV260;

  function addScript(src,flag,selector){
    if(flag&&W[flag])return;
    if(selector&&D.querySelector(selector))return;
    const s=D.createElement('script');s.src=src;s.async=true;
    if(selector){const attr=selector.match(/data-([^\]]+)/)?.[1]?.split('=')[0];if(attr)s.dataset[attr.replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]='1'}
    s.onerror=()=>console.warn('UNVRSL deferred module failed',src);
    D.body?.appendChild(s)
  }
  function loadTrainingLoadModel(){addScript('training-load-model-v258.js?v=260','__unvrslTrainingLoadModelV258','script[data-unvrsl-load-model-v258]')}
  function loadProgramIntensity(){addScript('program-intensity-autoweight-v261.js?v=261','__unvrslProgramIntensityAutoWeightV261','script[data-unvrsl-program-intensity-v261]')}
  function loadTrainerClientProgramEdit(){addScript('trainer-client-program-edit-v262.js?v=262','__unvrslTrainerClientProgramEditV262','script[data-unvrsl-trainer-client-edit-v262]')}
  function loadProgramWeekRpeRir(){addScript('program-week-rpe-rir-v263.js?v=266','__unvrslProgramWeekRpeRirV263','script[data-unvrsl-week-rpe-rir-v263]')}
  function loadProgramRepRange(){addScript('program-rep-range-v266.js?v=266','__unvrslProgramRepRangeV266','script[data-unvrsl-program-rep-range-v266]')}
  function loadBuiltInPlanRepRanges(){addScript('built-in-plan-rep-ranges-v267.js?v=267','__unvrslBuiltInPlanRepRangesV267','script[data-unvrsl-built-in-ranges-v267]')}
  function loadProgramWeekRepGuidance(){addScript('program-week-rep-guidance-v268.js?v=268','__unvrslProgramWeekRepGuidanceV268','script[data-unvrsl-week-rep-guidance-v268]')}
  let trainingScheduled=false;
  function scheduleCanonicalTrainingModules(){
    if(trainingScheduled)return;trainingScheduled=true;
    // Recommendation math is useful quickly, editor-only helpers can wait until after first paint.
    setTimeout(loadTrainingLoadModel,0);
    setTimeout(loadProgramIntensity,35);
    const idle=cb=>typeof requestIdleCallback==='function'?requestIdleCallback(cb,{timeout:900}):setTimeout(cb,120);
    idle(()=>{
      loadProgramWeekRpeRir();loadProgramRepRange();loadBuiltInPlanRepRanges();loadProgramWeekRepGuidance();loadTrainerClientProgramEdit()
    })
  }

  const events=['DOMContentLoaded','load','unvrsl:cloud-ready','unvrsl:cloud-modules-settled','unvrsl:client-ready','unvrsl:client-settled','unvrsl:modules-ready','unvrsl:readiness-ready'];
  events.forEach(name=>W.addEventListener?.(name,()=>release(false,name),{passive:true}));
  const poll=setInterval(()=>release(false,'poll'),45);
  // Hard cap: the splash is cosmetic and must never wait for the whole application graph.
  setTimeout(()=>release(true,'fast-cap'),650);
  // If the browser is busy on a parser-blocking script, this fires as soon as the main thread is available.
  setTimeout(()=>release(true,'fallback-cap'),1100);
  release(false,'initial');
})();
