'use strict';
(()=>{
  const W=window,D=document,READY='unvrsl-ui-stable-v313',START=W.performance?.now?.()||Date.now();
  if(W.__unvrslUiStabilityV313)return;W.__unvrslUiStabilityV313=true;

  const style=D.createElement('style');
  style.id='unvrsl-ui-stability-v313-style';
  style.textContent=`
    html:not(.${READY}) .app,
    html:not(.${READY}) body>.nav,
    html:not(.${READY}) body>.timer,
    html:not(.${READY}) body>.modal,
    html:not(.${READY}) body>.toast{visibility:hidden!important;opacity:0!important;pointer-events:none!important}
    #unvrsl-stability-v313{position:fixed;inset:0;z-index:2147483647;background:#000;display:grid;place-items:center;opacity:1;visibility:visible;pointer-events:auto;touch-action:none;transition:opacity .2s ease,visibility 0s linear .2s}
    #unvrsl-stability-v313.out{opacity:0;visibility:hidden;pointer-events:none}
    #unvrsl-stability-v313 .us313-inner{display:flex;flex-direction:column;align-items:center;justify-content:center;width:240px;min-height:100px;transform:translateY(-1vh)}
    #unvrsl-stability-v313 .us313-brand{font:900 42px/.95 -apple-system,BlinkMacSystemFont,"SF Pro Display","SF Pro Text",system-ui,sans-serif;letter-spacing:-2.2px;color:#f7f7f8;white-space:nowrap}
    #unvrsl-stability-v313 .us313-dot{width:16px;height:16px;margin-top:30px;border-radius:50%;background:var(--green,#30d158);box-shadow:0 0 18px color-mix(in srgb,var(--green,#30d158) 42%,transparent);animation:us313Blink .9s ease-in-out infinite alternate}
    @keyframes us313Blink{from{opacity:.35}to{opacity:1}}
    .page:not(.active){pointer-events:none!important;visibility:hidden!important}
    .page.active{pointer-events:auto!important;visibility:visible!important}
    .modal:not(.show),.toast:not(.show),.timer:not(.show){pointer-events:none!important;visibility:hidden!important}
    .modal.show{pointer-events:auto!important;visibility:visible!important}
    html.${READY} .nav{z-index:2000!important;pointer-events:auto!important}
    html.${READY} .nav button{position:relative;z-index:1;pointer-events:auto!important;touch-action:manipulation!important}
    html.${READY} button,html.${READY} [onclick],html.${READY} input,html.${READY} select,html.${READY} a{touch-action:manipulation}
    @media(prefers-reduced-motion:reduce){#unvrsl-stability-v313{transition:none}}
  `;
  D.head.appendChild(style);

  const cover=D.createElement('div');
  cover.id='unvrsl-stability-v313';cover.setAttribute('aria-hidden','true');
  cover.innerHTML='<div class="us313-inner"><div class="us313-brand">UNVRSL FIT</div><div class="us313-dot"></div></div>';
  D.body.appendChild(cover);

  const elapsed=()=>((W.performance?.now?.()||Date.now())-START);
  const trainer=()=>{
    const c=W.cloud,email=String(c?.user?.email||'').trim().toLowerCase();
    if(email==='butafutsiy@mail.ru'||String(c?.profile?.role||'').toLowerCase()==='trainer')return true;
    try{return typeof W.unvrslTrainerMode==='function'&&W.unvrslTrainerMode()}catch(_){return false}
  };
  const client=()=>!!W.cloud?.user&&!trainer();
  function cachedSession(){
    try{
      if(W.cloud?.user)return true;
      const s=(()=>{try{return typeof st!=='undefined'?st:W.st}catch(_){return W.st}})();
      if(s?.clientAssignedUserId)return true;
      return Object.keys(localStorage).some(k=>{
        if(!/^sb-.*-auth-token$/i.test(k))return false;
        const v=localStorage.getItem(k)||'';return /"access_token"\s*:/.test(v)
      })
    }catch(_){return false}
  }
  function modernUiReady(){
    return D.readyState==='complete'&&
      !!W.__unvrslDynamicModulesReadyV260&&
      !!W.__unvrslReadinessStackReadyV260&&
      !!W.__unvrslPremiumStable&&
      !!W.__unvrslStableUi&&
      !!W.__unvrslMockupUi&&
      !!W.__unvrslDensityUi&&
      !!W.__unvrslMobileFinalFix&&
      !!W.__unvrslStatsAuthorityV254&&
      !!W.__unvrslTrainerShellV252&&
      !!W.__unvrslClientWorkoutScrollV261
  }
  function roleReady(){
    if(client())return !!D.body?.classList.contains('client-runtime-ready-v260');
    if(cachedSession()&&!W.cloud?.initSettled&&elapsed()<10000)return false;
    if(W.cloud?.initSettled)return true;
    if(W.__unvrslCloudModulesSettledV260&&!cachedSession())return true;
    return elapsed()>=1200
  }
  function cleanInactiveLayers(){
    const modal=D.getElementById('modal'),sheet=D.getElementById('sheet');
    if(modal&&!modal.classList.contains('show')){
      modal.style.background='';
      if(sheet){sheet.style.transform='';sheet.classList.remove('sheet-dragging','sheet-snapping')}
    }
  }

  let released=false,queued=false;
  async function release(force=false){
    if(released)return true;
    const modern=modernUiReady();
    if(!modern&&!(force&&elapsed()>=12000))return false;
    if(!force&&!roleReady())return false;
    if(client()){
      try{W.clientCleanHome?.()}catch(_){ }
      if(D.getElementById('plan')?.classList.contains('active'))try{W.clientCleanPlanPage?.()}catch(_){ }
    }
    try{W.unvrslTrainerShellSyncV260?.(false)}catch(_){ }
    try{W.unvrslLegacyCleanV260?.()}catch(_){ }
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    cleanInactiveLayers();
    D.head.appendChild(style);
    D.documentElement.classList.add(READY);D.body?.classList.add(READY);
    cover.classList.add('out');released=true;clearInterval(poll);
    setTimeout(()=>cover.remove(),240);
    W.dispatchEvent(new CustomEvent('unvrsl:ui-stable',{detail:{release:313,forced:!modern}}));
    return true
  }
  function schedule(){if(released||queued)return;queued=true;requestAnimationFrame(()=>{queued=false;release(false)})}
  W.unvrslUiStabilityReleaseV313=release;
  ['load','pageshow','unvrsl:modules-ready','unvrsl:readiness-ready','unvrsl:cloud-modules-settled','unvrsl:client-ready','unvrsl:client-settled','unvrsl:app-ready'].forEach(name=>W.addEventListener(name,schedule,{passive:true}));
  const poll=setInterval(schedule,80);
  setTimeout(()=>release(true),12000);
  new MutationObserver(()=>{if(released)cleanInactiveLayers();else schedule()}).observe(D.body,{childList:true,subtree:false});
  schedule();
})();
