'use strict';
(()=>{
  if(window.__unvrslStatsAuthorityV254)return;
  window.__unvrslStatsAuthorityV254=true;

  const root=()=>document.getElementById('stats');
  const FORBIDDEN='.profile-card-head,.profile-overview,.own-body-progress,.stats-muscle-week,.stats-last-session-v104-wrap,#statsWorkoutHistory208,.sd2-heat-wrap,.sd2-weight-head';
  let reconciling=false,queued=false;

  function hasCore(r){
    const text=r?.textContent||'';
    return !!(r&&r.dataset.statsAuthority==='254'&&r.querySelector('.sd2-head')&&r.querySelector('.sd2-grid')&&r.querySelector('.sd2-strength-host')&&!r.querySelector(FORBIDDEN)&&!/Вес тела|Вес 30 дн\.|Вес и обхваты|ИСТОРИЯ ТРЕНИРОВОК/i.test(text));
  }
  function isFinal(r){return !!(hasCore(r)&&r.querySelector('#anatomeMuscleCard'))}

  function reconcile(){
    const r=root();if(!r||reconciling)return;
    reconciling=true;
    try{
      if(!hasCore(r)){
        r.__statsDashboardHtml=null;
        window.statsDashboardRender?.();
      }
      window.statsCleanupPatchV254?.();
      window.anatomeMountCardV254?.();
    }catch(e){console.warn('stats v254 reconcile',e)}finally{reconciling=false}
  }

  const canonicalStatsPage=function(){
    reconcile();
    Promise.resolve(window.statsProgressRefresh?.(false)).then(reconcile).catch(e=>console.warn('stats v254 refresh',e));
  };
  canonicalStatsPage.__statsAuthorityV254=true;
  function installOwner(){window.statsPage=canonicalStatsPage;try{statsPage=canonicalStatsPage}catch(e){}}
  installOwner();
  window.statsEnsureCanonicalV254=reconcile;

  function repair(){queued=false;const r=root();if(!r||!r.classList.contains('active')||isFinal(r))return;reconcile()}
  function schedule(){if(queued||reconciling)return;queued=true;requestAnimationFrame(repair)}

  const r=root();
  if(r&&!r.__statsAuthorityV254Observer){
    const observer=new MutationObserver(schedule);observer.observe(r,{childList:true,subtree:true,characterData:true});r.__statsAuthorityV254Observer=observer;
  }
  const baseNav=window.nav;
  if(typeof baseNav==='function'&&!baseNav.__statsAuthorityV254){
    const wrappedNav=function(p){const out=baseNav.apply(this,arguments);if(p==='stats')requestAnimationFrame(()=>{installOwner();reconcile()});return out};
    wrappedNav.__statsAuthorityV254=true;window.nav=wrappedNav;try{nav=wrappedNav}catch(e){}
  }
  document.addEventListener('click',e=>{if(e.target?.closest?.('.nav button[data-p="stats"]'))requestAnimationFrame(()=>{installOwner();reconcile()})},true);
  [0,120,500,1500,3500].forEach(t=>setTimeout(()=>{installOwner();schedule()},t));
  window.addEventListener('pageshow',()=>{installOwner();schedule()},{passive:true});
  window.addEventListener('focus',()=>{installOwner();schedule()},{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){installOwner();schedule()}},{passive:true});
  schedule();
})();
