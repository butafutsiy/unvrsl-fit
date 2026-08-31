'use strict';
(()=>{
  if(window.__unvrslStatsAuthorityV247)return;
  window.__unvrslStatsAuthorityV247=true;

  let repairing=false,queued=false,lastRepair=0;
  const root=()=>document.getElementById('stats');
  const finalLayout=r=>!!(r&&r.classList.contains('stats-v2')&&r.querySelector('.sd2-grid'));
  const legacyLayout=r=>!!(r&&(r.querySelector('.profile-card-head')||r.querySelector(':scope > .profile-overview')||(!r.querySelector('.sd2-grid')&&r.children.length)));

  function repair(){
    queued=false;
    const r=root();
    if(!r||!r.classList.contains('active')||!window.__unvrslStatsDashboardV2)return;
    if(finalLayout(r)&&!r.querySelector('.profile-card-head'))return;
    if(!legacyLayout(r))return;
    const now=Date.now();if(repairing||now-lastRepair<120)return;
    repairing=true;lastRepair=now;
    try{
      if(typeof window.statsPage==='function')window.statsPage();
      else if(typeof window.statsProgressRefresh==='function')window.statsProgressRefresh(false);
    }catch(e){console.warn('stats authority repair',e)}
    requestAnimationFrame(()=>requestAnimationFrame(()=>{repairing=false}));
  }
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(repair)}
  function install(){
    const r=root();if(!r||r.__statsAuthorityObserver)return;
    const observer=new MutationObserver(schedule);
    observer.observe(r,{childList:true});
    r.__statsAuthorityObserver=observer;
  }

  install();schedule();
  window.addEventListener('pageshow',schedule,{passive:true});
  window.addEventListener('focus',schedule,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule()},{passive:true});
})();
