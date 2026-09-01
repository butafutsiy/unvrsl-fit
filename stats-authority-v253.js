'use strict';
(()=>{
  if(window.__unvrslStatsAuthorityV253)return;
  window.__unvrslStatsAuthorityV253=true;

  const root=()=>document.getElementById('stats');
  const LEGACY='.profile-card-head,.profile-overview,.own-body-progress,.stats-muscle-week,.stats-last-session-v104-wrap';
  let reconciling=false,queued=false;

  function hasCore(r){
    return !!(r&&r.dataset.statsAuthority==='253'&&r.querySelector('.sd2-head')&&r.querySelector('.sd2-grid')&&r.querySelector('.sd2-strength-host')&&r.querySelector('#statsWorkoutHistory208')&&!/Вес тела|Вес 30 дн\.|Вес и обхваты/i.test(r.textContent||''));
  }
  function isFinal(r){return !!(hasCore(r)&&r.querySelector('#anatomeMuscleCard')&&!r.querySelector(LEGACY))}

  function reconcile(){
    const r=root();if(!r||reconciling)return;
    reconciling=true;
    try{
      if(!hasCore(r)){
        r.__statsDashboardHtml=null;
        window.statsDashboardRender?.();
      }
      window.statsCleanupPatch?.();
      window.anatomeMountCardV253?.();
    }catch(e){console.warn('stats v253 reconcile',e)}finally{reconciling=false}
  }

  const canonicalStatsPage=function(){
    reconcile();
    Promise.resolve(window.statsProgressRefresh?.(false)).then(reconcile).catch(e=>console.warn('stats v253 refresh',e));
  };
  canonicalStatsPage.__statsAuthorityV253=true;
  function installOwner(){window.statsPage=canonicalStatsPage;try{statsPage=canonicalStatsPage}catch(e){}}
  installOwner();
  window.statsEnsureCanonicalV253=reconcile;

  function repair(){queued=false;const r=root();if(!r||!r.classList.contains('active')||isFinal(r))return;reconcile()}
  function schedule(){if(queued||reconciling)return;queued=true;requestAnimationFrame(repair)}

  const r=root();
  if(r&&!r.__statsAuthorityV253Observer){
    const observer=new MutationObserver(schedule);observer.observe(r,{childList:true,subtree:true,characterData:true});r.__statsAuthorityV253Observer=observer;
  }
  const baseNav=window.nav;
  if(typeof baseNav==='function'&&!baseNav.__statsAuthorityV253){
    const wrappedNav=function(p){const out=baseNav.apply(this,arguments);if(p==='stats')requestAnimationFrame(()=>{installOwner();reconcile()});return out};
    wrappedNav.__statsAuthorityV253=true;window.nav=wrappedNav;try{nav=wrappedNav}catch(e){}
  }
  document.addEventListener('click',e=>{if(e.target?.closest?.('.nav button[data-p="stats"]'))requestAnimationFrame(()=>{installOwner();reconcile()})},true);
  [0,120,500,1500,3500,7000].forEach(t=>setTimeout(()=>{installOwner();schedule()},t));
  window.addEventListener('pageshow',()=>{installOwner();schedule()},{passive:true});
  window.addEventListener('focus',()=>{installOwner();schedule()},{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){installOwner();schedule()}},{passive:true});
  schedule();
})();
