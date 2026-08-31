'use strict';
(()=>{
  if(window.__unvrslStatsAuthorityV247)return;
  window.__unvrslStatsAuthorityV247=true;

  let repairing=false,queued=false,lastRepair=0;
  const root=()=>document.getElementById('stats');
  const finalLayout=r=>!!(r&&r.classList.contains('stats-v2')&&r.querySelector('.sd2-grid')&&!r.querySelector('.profile-card-head'));
  const legacyLayout=r=>!!(r&&(r.querySelector('.profile-card-head')||r.querySelector(':scope > .profile-overview')||(!r.querySelector('.sd2-grid')&&r.children.length)));

  async function forceModern(r){
    if(!r)return;
    // Never trust the dashboard HTML memo after a foreign renderer touched #stats.
    r.__statsDashboardHtml=null;
    try{
      if(typeof window.statsProgressRefresh==='function')await window.statsProgressRefresh(false);
      else if(typeof window.statsPage==='function')window.statsPage();
    }catch(e){console.warn('stats authority repair',e)}
    try{window.statsCleanupPatch?.()}catch(_){}
  }

  function repair(){
    queued=false;
    const r=root();
    if(!r||!r.classList.contains('active')||!window.__unvrslStatsDashboardV2)return;
    if(finalLayout(r))return;
    if(!legacyLayout(r))return;
    const now=Date.now();if(repairing||now-lastRepair<120)return;
    repairing=true;lastRepair=now;
    Promise.resolve(forceModern(r)).finally(()=>requestAnimationFrame(()=>requestAnimationFrame(()=>{repairing=false})));
  }
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(repair)}
  function install(){
    const r=root();if(!r||r.__statsAuthorityObserver)return;
    const observer=new MutationObserver(schedule);
    observer.observe(r,{childList:true,subtree:false});
    r.__statsAuthorityObserver=observer;
  }

  install();schedule();
  window.addEventListener('pageshow',schedule,{passive:true});
  window.addEventListener('focus',schedule,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule()},{passive:true});
})();
