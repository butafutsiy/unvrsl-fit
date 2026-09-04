'use strict'; // Canonical retirement registry for release v292.
(()=>{
  if(window.__unvrslLegacyRetirementV257)return;
  window.__unvrslLegacyRetirementV257=true;
  window.__unvrslLegacyRetirementV292=true;
  window.__unvrslLegacyRetirementV291=true;
  window.__unvrslLegacyRetirementV260=true;
  window.__unvrslLegacyRetirementV256=true;
  window.__unvrslLegacyRetirementV255=true;
  window.__unvrslLegacyRetirementV254=true;

  const retired=[
    'legacy-retirement-v253.js','legacy-retirement-v254.js','legacy-retirement-v255.js','legacy-retirement-v256.js','og-style-legacy-v157.js',
    'stats-dashboard-v2.js','home-stats-v2.js','stats-cleanup.js','stats-authority-v253.js',
    'stats-authority-v247.js','stats-authority-v252.js','stats-integrity-v104.js','profile-stats.js',
    'trainer-client-detail-v2.js','trainer-client-guard-v117.js','client-experience-v2.js','client-plan-profile-first-v198.js',
    'startup-splash-v156.js','layout-fix.js','home-dashboard.js','body-sex-sync-v166.js',
    'progression-engine-v182.js','progression-engine-v184.js','progression-engine-v185.js','progression-engine-v186.js',
    'workout-recommendation-v177.js','workout-recommendation-v180.js','workout-recommendation-v185.js',
    'adaptive-effort-safety-v170.js','adaptive-effort-v2.js','rpe-auto-progression.js',
    'training-load-model-v258.js','training-progression-gate-v290.js','training-progression-gate-v291.js',
    'exercise-audit-v1.js','exercise-cleanup-v2.js','exercise-system-clean-v1.js','exercise-unified-v1.js',
    'exercise-tabs-v1.js','exercise-cardio-quality-v2.js','exercise-source-lock-v1.js','exercise-title-consistency-v3.js',
    'exercise-format-v5.js','exercise-cardio-fix-v6.js','ru-only.js'
  ];
  const names=new Set(retired);
  const file=src=>String(src||'').split(/[?#]/)[0].replace(/\\/g,'/').split('/').pop();
  const isRetired=src=>names.has(file(src));
  window.UNVRSL_RETIRED_SCRIPTS_V292=Object.freeze(retired.slice());
  window.UNVRSL_RETIRED_SCRIPTS_V291=window.UNVRSL_RETIRED_SCRIPTS_V292;
  window.UNVRSL_RETIRED_SCRIPTS_V257=window.UNVRSL_RETIRED_SCRIPTS_V292;
  window.UNVRSL_RETIRED_SCRIPTS_V256=window.UNVRSL_RETIRED_SCRIPTS_V292;
  window.UNVRSL_RETIRED_SCRIPTS_V255=window.UNVRSL_RETIRED_SCRIPTS_V292;
  window.UNVRSL_RETIRED_SCRIPTS_V254=window.UNVRSL_RETIRED_SCRIPTS_V292;
  window.unvrslScriptRetiredV292=isRetired;
  window.unvrslScriptRetiredV291=isRetired;
  window.unvrslScriptRetiredV257=isRetired;
  window.unvrslScriptRetiredV256=isRetired;
  window.unvrslScriptRetiredV255=isRetired;
  window.unvrslScriptRetiredV254=isRetired;
  window.unvrslScriptRetiredV253=isRetired;

  // One recommendation owner only. Old model/finalizer versions are permanently blocked.
  window.__unvrslCanonicalRecommendationOwner='training-load-model-v292';
  window.__unvrslSmartRecommendationRetiredV292=true;
  window.__unvrslSmartRecommendationRetiredV291=true;
  window.__unvrslAdaptiveEffortV2=true;
  window.__unvrslTrainingProgressionGateV290=true;
  window.__unvrslTrainingProgressionGateV291=true;

  // Block every superseded owner before any delayed loader can execute it.
  window.__unvrslLegacyRetirementV253=true;
  window.__unvrslStatsDashboardV2=true;
  window.__unvrslHomeStatsV2=true;
  window.__unvrslStatsCleanup=true;
  window.__unvrslStatsAuthorityV247=true;
  window.__unvrslStatsAuthorityV252=true;
  window.__unvrslStatsAuthorityV253=true;
  window.__unvrslStatsIntegrityV104=true;
  window.__unvrslTrainerClientDetailV2=true;
  window.__trainerClientGuardV117=true;
  window.__unvrslAdaptiveEffortSafetyV170=true;
  window.__unvrslClientPlanProfileFirstV198=true;

  const OLD_REC_SELECTOR=[
    '#start .smart-suggest','#start .u177-rec','#start .wr180','#start .wr185',
    '#start .adaptive-choice-btn','#start .adaptive-load-chip','#start .unvrsl-auto-load',
    '#start .auto-progression:not(.focus-auto)','#start .adaptive-effort-card','#start .adaptive-rec',
    '#start [data-adaptive-recommendation]','#start [data-legacy-recommendation]',
    '#sheet .unvrsl174-rec'
  ].join(',');

  const style=document.createElement('style');
  style.id='legacy-retirement-v257-style';
  style.textContent=`
    #unvrsl-startup-splash,#unvrsl-startup-splash-v156,#unvrsl-startup-splash-final,#unvrsl-startup-v256,#unvrslBoot,#unvrsl-boot-cover,
    #stats .profile-card-head,#stats .profile-overview,#stats .own-body-progress,
    #stats .stats-muscle-week,#stats .stats-last-session-v104-wrap,
    #stats #statsWorkoutHistory208,#stats #statsWorkoutHistory208 + .sd2-card,
    #stats .sd2-heat-wrap,#stats .sd2-card:has(.sd2-weight-head),
    #home > .card:has(> .weight-top),
    ${OLD_REC_SELECTOR}{display:none!important}
  `;
  document.head.appendChild(style);

  const obsolete='#unvrsl-startup-splash,#unvrsl-startup-splash-v156,#unvrsl-startup-splash-final,#unvrsl-startup-v256,#unvrslBoot,#unvrsl-startup-splash-style,#unvrsl-startup-splash-v156-style,#unvrsl-startup-splash-final-style,#unvrsl-startup-v256-style,#unvrsl-boot-style,#unvrsl-boot-cover,#unvrsl-boot-cover-style,#stats .profile-card-head,#stats .profile-overview,#stats .own-body-progress,#stats .stats-muscle-week,#stats .stats-last-session-v104-wrap';
  const oldGlobals=['anatomeMuscleCardHtmlV253','anatomeMountCardV253','unvrslStatsSessions208','statsOpenWorkout208','statsWeightRange','statsWeightSheet','statsSaveWeight','statsGoalSheet','statsSaveGoal','statsEnsureCanonicalV253','clientPlanProfileInjectV222','clientPlanProfileRefresh198','clientPlanOpenProfile198','clientPlanMeasure198'];
  let queued=false,lastLockedSession='';

  function appState(){try{if(typeof st!=='undefined'){window.st=st;return st}}catch(_){ }return window.st||null}
  function removeHistory(root){const head=root?.querySelector('#statsWorkoutHistory208');if(!head)return;const card=head.nextElementSibling;if(card?.classList.contains('sd2-card'))card.remove();head.remove()}
  function retireGlobals(){oldGlobals.forEach(key=>{try{delete window[key]}catch(e){window[key]=undefined}})}

  function lockLegacyWeightState(){
    const s=appState();if(!s)return false;let changed=false;
    if(s.nextSuggestions&&typeof s.nextSuggestions==='object'&&Object.keys(s.nextSuggestions).length){s.nextSuggestions={};changed=true}
    const cur=s.current;if(!cur)return changed;
    const sid=String(cur.id||'');
    if(cur.unvrslAdaptive174Applied!==true){cur.unvrslAdaptive174Applied=true;changed=true}
    if(cur.adaptiveEffortV2Applied!==true){cur.adaptiveEffortV2Applied=true;changed=true}
    if(cur.adaptiveDecision!=='engine292'){cur.adaptiveDecision='engine292';changed=true}
    if(cur.adaptivePrompted!==true){cur.adaptivePrompted=true;changed=true}
    (cur.ex||[]).forEach(ex=>{
      for(const k of ['recommendation194','engine196Recommendation','progression187','adaptiveEffort','trainingProgression290','trainingProgression291']){
        if(Object.prototype.hasOwnProperty.call(ex,k)){delete ex[k];changed=true}
      }
      if(ex?.trainingEstimate200&&ex.trainingEstimate200.mathOwner&&ex.trainingEstimate200.mathOwner!=='training-load-model-v292'){
        ex.trainingEstimate200.mathOwner='training-load-model-v292';changed=true
      }
      (ex.set||[]).forEach(set=>{
        for(const k of ['adaptiveSuggestedW','adaptiveRecommendation','recommendation194','engine196Recommendation']){
          if(Object.prototype.hasOwnProperty.call(set,k)){delete set[k];changed=true}
        }
        // A persisted recommendation from an old runtime must never flash before v292 recalculates it.
        if(set?.recommendedW!=null&&!set?.trainingIntensity292){delete set.recommendedW;changed=true}
        if(Object.prototype.hasOwnProperty.call(set,'progressionGateV290')){delete set.progressionGateV290;changed=true}
        if(Object.prototype.hasOwnProperty.call(set,'progressionGateV291')){delete set.progressionGateV291;changed=true}
      })
    });
    if(cur.trainingMathOwner&&cur.trainingMathOwner!=='training-load-model-v292'){cur.trainingMathOwner='training-load-model-v292';changed=true}
    if(sid&&sid!==lastLockedSession)lastLockedSession=sid;
    if(changed){try{if(typeof save==='function')save();else window.save?.()}catch(_){ }}
    return changed
  }

  function retireFunction(name,returnValue=null){
    try{
      const fn=window[name];if(typeof fn!=='function'||fn.__unvrslRetiredV292)return;
      const off=function(){return returnValue};off.__unvrslRetiredV292=true;window[name]=off;
      try{globalThis[name]=off}catch(_){ }
    }catch(_){ }
  }
  function retireOldRecommendationApi(){
    retireFunction('suggestionFor',null);
    retireFunction('applySuggestion',undefined);
    retireFunction('applyAdaptiveLoads',0);
    retireFunction('adaptiveChoiceSheet',undefined);
    retireFunction('chooseAdaptiveMode',undefined);
    // Legacy readiness from advanced-training must not change weights; current readiness lives in training-engine/questionnaire.
    try{if(typeof window.advAskReadiness==='function'&&!window.advAskReadiness.__te205){const bypass=(fn,args)=>typeof fn==='function'?fn.apply(window,Array.isArray(args)?args:[]):undefined;bypass.__te205=true;window.advAskReadiness=bypass;try{advAskReadiness=bypass}catch(_){ }}}catch(_){ }
    retireFunction('advConfirmReadiness',undefined);
    retireFunction('advApplyReadinessToCurrent',false);
  }
  function clean(){
    queued=false;retireGlobals();retireOldRecommendationApi();lockLegacyWeightState();document.body?.classList.remove('unvrsl-booting');document.querySelectorAll(obsolete).forEach(el=>el.remove());document.querySelectorAll(OLD_REC_SELECTOR).forEach(el=>el.remove());
    const stats=document.getElementById('stats');removeHistory(stats);if(stats){[...stats.querySelectorAll('.sd2-card')].forEach(card=>{const text=(card.textContent||'').trim();if(card.querySelector('.sd2-weight-head')||/^Активность\s*—\s*последние 12 месяцев/i.test(text))card.remove()})}
    const home=document.getElementById('home');[...(home?.children||[])].forEach(card=>{if(card.classList?.contains('card')&&card.querySelector(':scope > .weight-top'))card.remove()});
    const sheet=document.getElementById('sheet');if(sheet?.querySelector('.tcv3-head'))sheet.querySelectorAll('.trainer-remove-programs-block,.trainer-live-programs,.trainer-program-control-v2').forEach(el=>el.remove())
  }
  window.unvrslLegacyCleanV292=clean;window.unvrslLegacyCleanV291=clean;window.unvrslLegacyCleanV260=clean;
  window.unvrslLegacyWeightLockV292=lockLegacyWeightState;
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(clean)}
  function install(){
    for(const id of ['home','stats','sheet','start']){const node=document.getElementById(id);if(!node||node.__legacyRetirementV292Observer)continue;const observer=new MutationObserver(schedule);observer.observe(node,{childList:true,subtree:true});node.__legacyRetirementV292Observer=observer}
    const body=document.body;if(body&&!body.__legacySplashRetirementV292Observer){const observer=new MutationObserver(schedule);observer.observe(body,{childList:true});body.__legacySplashRetirementV292Observer=observer}schedule()
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
  ['pageshow','unvrsl:modules-ready','unvrsl:training-engine-ready','unvrsl:app-ready','unvrsl:readiness-ready','unvrsl:cloud-modules-settled'].forEach(ev=>window.addEventListener(ev,schedule,{passive:true}));
  [0,80,240,700,1200,2200,4000,7000].forEach(ms=>setTimeout(()=>{retireOldRecommendationApi();lockLegacyWeightState()},ms));
})();