'use strict';
(()=>{
  if(window.__unvrslStatsCleanupV254)return;
  window.__unvrslStatsCleanupV254=true;

  const style=document.createElement('style');
  style.id='stats-cleanup-v254-style';
  style.textContent=`
    #stats .profile-card-head,#stats .profile-overview,#stats .own-body-progress,
    #stats .stats-muscle-week,#stats .stats-last-session-v104-wrap,
    #stats #statsWorkoutHistory208,#stats #statsWorkoutHistory208 + .sd2-card,
    #stats .sd2-heat-wrap,#stats .sd2-card:has(.sd2-weight-head){display:none!important}
    #stats.stats-v254 .sd2-head{display:block;margin-bottom:20px}
    #stats.stats-v254 .sd2-metric-label{gap:9px;align-items:center}
    #stats.stats-v254 .sd2-metric-label .stats-metric-icon{width:24px;height:24px;display:grid;place-items:center;flex:0 0 24px;border-radius:8px}
    #stats.stats-v254 .sd2-metric-label .stats-metric-icon svg{width:17px;height:17px;display:block;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
    #stats.stats-v254 .stats-icon-workout{color:#0a84ff;background:rgba(10,132,255,.12)}
    #stats.stats-v254 .stats-icon-month{color:#64d2ff;background:rgba(100,210,255,.11)}
    #stats.stats-v254 .stats-icon-streak{color:#ff453a;background:rgba(255,69,58,.11)}
    #stats.stats-v254 .stats-icon-rpe{color:#ffd60a;background:rgba(255,214,10,.10)}
    #stats.stats-v254 .sd2-metric-label>span:last-child{line-height:1.1}
  `;
  document.head.appendChild(style);

  const icons={
    workout:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10v4M6 8v8M18 8v8M21 10v4M6 12h12"/></svg>',
    month:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4M17 3v4M3 10h18"/></svg>',
    streak:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 3.5c.7 3.2-1.8 4.4-1.8 6.4 0 1.2.8 2 1.9 2.6-.1-2.3 1.4-3.6 2.7-5.1 2.2 1.9 3.7 4.4 3.7 7.1A8 8 0 0 1 4 14.5c0-3.9 2.5-6.1 5.1-8.7.1 2.2 1.1 3.7 2.2 4.7.5-2.2.5-4.3 2.2-7Z"/></svg>',
    rpe:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 12l4-4M7 17h10"/></svg>'
  };
  let patching=false,queued=false;

  function removeLegacyCards(root){
    const history=root.querySelector('#statsWorkoutHistory208');
    if(history){const card=history.nextElementSibling;if(card?.classList.contains('sd2-card'))card.remove();history.remove()}
    [...root.querySelectorAll('.sd2-card')].forEach(card=>{
      const text=(card.textContent||'').trim();
      if(card.querySelector('.sd2-weight-head')||/^Активность\s*—\s*последние 12 месяцев/i.test(text))card.remove();
    });
    root.querySelectorAll('.stats-muscle-week,.stats-last-session-v104-wrap,.profile-card-head,.profile-overview,.own-body-progress').forEach(el=>el.remove());
  }
  function decorateMetrics(root){
    const defs=[['workout','stats-icon-workout'],['month','stats-icon-month'],['streak','stats-icon-streak'],['rpe','stats-icon-rpe']];
    [...root.querySelectorAll('.sd2-grid .sd2-metric')].forEach((card,i)=>{
      const first=card.querySelector('.sd2-metric-label')?.firstElementChild;if(!first)return;
      const [key,cls]=defs[i]||defs[0],want=`stats-metric-icon ${cls}`;
      if(first.className!==want)first.className=want;if(first.innerHTML!==icons[key])first.innerHTML=icons[key];
    });
  }
  function patchStats(){
    const root=document.getElementById('stats');if(!root||patching)return;
    patching=true;
    try{removeLegacyCards(root);decorateMetrics(root);window.anatomeMountCardV254?.()}finally{patching=false}
  }
  window.statsCleanupPatchV254=patchStats;
  function queuePatch(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;patchStats()})}
  function installObserver(){
    const root=document.getElementById('stats');if(!root||root.__statsCleanupV254Observer)return;
    const observer=new MutationObserver(queuePatch);observer.observe(root,{childList:true,subtree:true});root.__statsCleanupV254Observer=observer;
  }
  const base=window.statsPage;
  if(typeof base==='function'&&!base.__statsCleanupV254){
    const wrapped=function(){const r=base.apply(this,arguments);installObserver();queuePatch();return r};
    wrapped.__statsCleanupV254=true;window.statsPage=wrapped;try{statsPage=wrapped}catch(e){}
  }
  installObserver();queuePatch();
})();
