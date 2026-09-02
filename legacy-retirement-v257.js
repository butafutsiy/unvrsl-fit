'use strict'; // Canonical retirement registry for release v257.
(()=>{
  if(window.__unvrslLegacyRetirementV257)return;
  window.__unvrslLegacyRetirementV257=true;
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
    'workout-recommendation-v177.js','workout-recommendation-v180.js','workout-recommendation-v185.js','adaptive-effort-safety-v170.js',
    'exercise-audit-v1.js','exercise-cleanup-v2.js','exercise-system-clean-v1.js','exercise-unified-v1.js',
    'exercise-tabs-v1.js','exercise-cardio-quality-v2.js','exercise-source-lock-v1.js','exercise-title-consistency-v3.js',
    'exercise-format-v5.js','exercise-cardio-fix-v6.js','ru-only.js','rpe-auto-progression.js'
  ];
  const names=new Set(retired);
  const file=src=>String(src||'').split(/[?#]/)[0].replace(/\\/g,'/').split('/').pop();
  const isRetired=src=>names.has(file(src));
  window.UNVRSL_RETIRED_SCRIPTS_V257=Object.freeze(retired.slice());
  window.UNVRSL_RETIRED_SCRIPTS_V256=window.UNVRSL_RETIRED_SCRIPTS_V257;
  window.UNVRSL_RETIRED_SCRIPTS_V255=window.UNVRSL_RETIRED_SCRIPTS_V257;
  window.UNVRSL_RETIRED_SCRIPTS_V254=window.UNVRSL_RETIRED_SCRIPTS_V257;
  window.unvrslScriptRetiredV257=isRetired;
  window.unvrslScriptRetiredV256=isRetired;
  window.unvrslScriptRetiredV255=isRetired;
  window.unvrslScriptRetiredV254=isRetired;
  window.unvrslScriptRetiredV253=isRetired;

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

  const style=document.createElement('style');
  style.id='legacy-retirement-v257-style';
  style.textContent=`
    #unvrsl-startup-splash,#unvrsl-startup-splash-v156,#unvrsl-startup-splash-final,#unvrsl-startup-v256,#unvrsl-boot-cover,
    #stats .profile-card-head,#stats .profile-overview,#stats .own-body-progress,
    #stats .stats-muscle-week,#stats .stats-last-session-v104-wrap,
    #stats #statsWorkoutHistory208,#stats #statsWorkoutHistory208 + .sd2-card,
    #stats .sd2-heat-wrap,#stats .sd2-card:has(.sd2-weight-head),
    #home > .card:has(> .weight-top){display:none!important}
  `;
  document.head.appendChild(style);

  const obsolete='#unvrsl-startup-splash,#unvrsl-startup-splash-v156,#unvrsl-startup-splash-final,#unvrsl-startup-v256,#unvrsl-startup-splash-style,#unvrsl-startup-splash-v156-style,#unvrsl-startup-splash-final-style,#unvrsl-startup-v256-style,#unvrsl-boot-cover,#unvrsl-boot-cover-style,#stats .profile-card-head,#stats .profile-overview,#stats .own-body-progress,#stats .stats-muscle-week,#stats .stats-last-session-v104-wrap';
  const oldGlobals=['anatomeMuscleCardHtmlV253','anatomeMountCardV253','unvrslStatsSessions208','statsOpenWorkout208','statsWeightRange','statsWeightSheet','statsSaveWeight','statsGoalSheet','statsSaveGoal','statsEnsureCanonicalV253','clientPlanProfileInjectV222','clientPlanProfileRefresh198','clientPlanOpenProfile198','clientPlanMeasure198'];
  let queued=false;
  function removeHistory(root){
    const head=root?.querySelector('#statsWorkoutHistory208');if(!head)return;
    const card=head.nextElementSibling;if(card?.classList.contains('sd2-card'))card.remove();head.remove();
  }
  function retireGlobals(){oldGlobals.forEach(key=>{try{delete window[key]}catch(e){window[key]=undefined}})}
  function clean(){
    queued=false;retireGlobals();
    document.querySelectorAll(obsolete).forEach(el=>el.remove());
    const stats=document.getElementById('stats');removeHistory(stats);
    if(stats){
      [...stats.querySelectorAll('.sd2-card')].forEach(card=>{const text=(card.textContent||'').trim();if(card.querySelector('.sd2-weight-head')||/^Активность\s*—\s*последние 12 месяцев/i.test(text))card.remove()});
    }
    const home=document.getElementById('home');
    [...(home?.children||[])].forEach(card=>{if(card.classList?.contains('card')&&card.querySelector(':scope > .weight-top'))card.remove()});
    const sheet=document.getElementById('sheet');
    if(sheet?.querySelector('.tcv3-head'))sheet.querySelectorAll('.trainer-remove-programs-block,.trainer-live-programs,.trainer-program-control-v2').forEach(el=>el.remove());
  }
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(clean)}
  function install(){
    for(const id of ['home','stats','sheet']){
      const node=document.getElementById(id);if(!node||node.__legacyRetirementV257Observer)continue;
      const observer=new MutationObserver(schedule);observer.observe(node,{childList:true,subtree:true});node.__legacyRetirementV257Observer=observer;
    }
    const body=document.body;
    if(body&&!body.__legacySplashRetirementV257Observer){const observer=new MutationObserver(schedule);observer.observe(body,{childList:true});body.__legacySplashRetirementV257Observer=observer}
    schedule();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
  window.addEventListener('pageshow',schedule,{passive:true});
})();
