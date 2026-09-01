'use strict';
(()=>{
  if(window.__unvrslStatsAuthorityV252)return;
  window.__unvrslStatsAuthorityV252=true;

  const root=()=>document.getElementById('stats');
  let rendering=false,queued=false;

  function isCanonical(r){
    return !!(r&&r.dataset.statsAuthority==='252'&&r.querySelector('.sd2-head')&&r.querySelector('.sd2-grid')&&r.querySelector('.sd2-strength-host')&&r.querySelector('#statsWorkoutHistory208')&&!r.querySelector('.profile-card-head,.profile-overview,.own-body-progress')&&!/Вес тела|Вес 30 дн\.|Вес и обхваты/i.test(r.textContent||''));
  }

  function renderCanonical(){
    const r=root();if(!r||rendering)return;
    rendering=true;
    try{
      r.__statsDashboardHtml=null;
      if(typeof window.statsDashboardRender==='function')window.statsDashboardRender();
      window.statsCleanupPatch?.();
    }catch(e){console.warn('stats v252 render',e)}finally{rendering=false}
  }

  const canonicalStatsPage=function(){
    renderCanonical();
    Promise.resolve(window.statsProgressRefresh?.(false)).then(()=>{renderCanonical();window.statsCleanupPatch?.()}).catch(e=>console.warn('stats v252 refresh',e));
  };
  canonicalStatsPage.__statsAuthorityV252=true;
  function installOwner(){
    window.statsPage=canonicalStatsPage;
    try{statsPage=canonicalStatsPage}catch(e){}
  }
  installOwner();
  window.statsEnsureCanonicalV252=renderCanonical;

  function repair(){
    queued=false;
    const r=root();
    if(!r||!r.classList.contains('active')||isCanonical(r))return;
    renderCanonical();
  }
  function schedule(){if(queued||rendering)return;queued=true;requestAnimationFrame(repair)}

  const r=root();
  if(r&&!r.__statsAuthorityV252Observer){
    const observer=new MutationObserver(schedule);
    observer.observe(r,{childList:true,subtree:true,characterData:true});
    r.__statsAuthorityV252Observer=observer;
  }
  const baseNav=window.nav;
  if(typeof baseNav==='function'&&!baseNav.__statsAuthorityV252){
    const wrappedNav=function(p){const out=baseNav.apply(this,arguments);if(p==='stats')requestAnimationFrame(()=>{installOwner();renderCanonical()});return out};
    wrappedNav.__statsAuthorityV252=true;window.nav=wrappedNav;try{nav=wrappedNav}catch(e){}
  }
  document.addEventListener('click',e=>{if(e.target?.closest?.('.nav button[data-p="stats"]'))requestAnimationFrame(()=>{installOwner();renderCanonical()})},true);
  [0,120,500,1500,3500,7000].forEach(t=>setTimeout(()=>{installOwner();schedule()},t));
  window.addEventListener('pageshow',()=>{installOwner();schedule()},{passive:true});
  window.addEventListener('focus',()=>{installOwner();schedule()},{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){installOwner();schedule()}},{passive:true});
  schedule();
})();
