'use strict';
(()=>{
  if(window.__unvrslLegacyRetirementV253)return;
  window.__unvrslLegacyRetirementV253=true;

  const retired=[
    'stats-authority-v247.js','stats-authority-v252.js','stats-integrity-v104.js','profile-stats.js',
    'trainer-client-detail-v2.js','trainer-client-guard-v117.js','client-experience-v2.js',
    'startup-splash-v156.js','layout-fix.js','home-dashboard.js','body-sex-sync-v166.js',
    'progression-engine-v182.js','progression-engine-v184.js','progression-engine-v185.js','progression-engine-v186.js',
    'workout-recommendation-v177.js','workout-recommendation-v180.js','workout-recommendation-v185.js','adaptive-effort-safety-v170.js',
    'exercise-audit-v1.js','exercise-cleanup-v2.js','exercise-system-clean-v1.js','exercise-unified-v1.js',
    'exercise-tabs-v1.js','exercise-cardio-quality-v2.js','exercise-source-lock-v1.js','exercise-title-consistency-v3.js',
    'exercise-format-v5.js','exercise-cardio-fix-v6.js','ru-only.js','rpe-auto-progression.js'
  ];
  const names=new Set(retired);
  const file=src=>String(src||'').split(/[?#]/)[0].replace(/\\/g,'/').split('/').pop();
  window.UNVRSL_RETIRED_SCRIPTS_V253=Object.freeze(retired.slice());
  window.unvrslScriptRetiredV253=src=>names.has(file(src));

  // Prevent a stale loader from reactivating renderers that have final owners.
  window.__unvrslStatsAuthorityV247=true;
  window.__unvrslStatsAuthorityV252=true;
  window.__unvrslStatsIntegrityV104=true;
  window.__unvrslTrainerClientDetailV2=true;
  window.__trainerClientGuardV117=true;
  window.__unvrslAdaptiveEffortSafetyV170=true;

  const style=document.createElement('style');
  style.id='legacy-retirement-v253-style';
  style.textContent=`
    #unvrsl-startup-splash,#unvrsl-startup-splash-v156,
    #stats .profile-card-head,#stats .profile-overview,#stats .own-body-progress,
    #stats .stats-muscle-week,#stats .stats-last-session-v104-wrap{display:none!important}
  `;
  document.head.appendChild(style);

  const obsolete='#unvrsl-startup-splash,#unvrsl-startup-splash-v156,#unvrsl-startup-splash-style,#unvrsl-startup-splash-v156-style,#stats .profile-card-head,#stats .profile-overview,#stats .own-body-progress,#stats .stats-muscle-week,#stats .stats-last-session-v104-wrap';
  let queued=false;
  function clean(){
    queued=false;
    document.querySelectorAll(obsolete).forEach(el=>el.remove());
    const sheet=document.getElementById('sheet');
    if(sheet?.querySelector('.tcv3-head'))sheet.querySelectorAll('.trainer-remove-programs-block,.trainer-live-programs,.trainer-program-control-v2').forEach(el=>el.remove());
  }
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(clean)}
  function install(){
    for(const id of ['stats','sheet']){
      const node=document.getElementById(id);if(!node||node.__legacyRetirementV253Observer)continue;
      const observer=new MutationObserver(schedule);observer.observe(node,{childList:true,subtree:true});node.__legacyRetirementV253Observer=observer;
    }
    schedule();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
  window.addEventListener('pageshow',schedule,{passive:true});
})();
