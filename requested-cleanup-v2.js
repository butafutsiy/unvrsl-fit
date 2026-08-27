'use strict';
(()=>{
  if(window.__unvrslRequestedCleanupV2)return;
  window.__unvrslRequestedCleanupV2=true;

  const BUILTIN='__builtin_cycle__';
  const DELETE_STORE='unvrsl-fit-deleted-programs-v2';

  function normalizedName(v){
    return String(v||'').toLowerCase().replace(/[·•]/g,' ').replace(/\s+/g,' ').trim();
  }
  function isRequestedOldPlan(p){
    if(!p||p.seedId==='anton-gorkusha-training-plan')return false;
    const n=normalizedName(p.name);
    return n==='мой план 8 недель';
  }
  function tombstone(p){
    if(!p)return;
    const set=new Set(Array.isArray(st.deletedProgramKeys)?st.deletedProgramKeys:[]);
    try{(JSON.parse(localStorage.getItem(DELETE_STORE)||'[]')||[]).forEach(x=>set.add(String(x)))}catch(e){}
    if(p.id)set.add('id:'+p.id);
    if(p.seedId)set.add('seed:'+p.seedId);
    if(p.cloudPlanId)set.add('cloud:'+p.cloudPlanId);
    const arr=[...set];st.deletedProgramKeys=arr;
    try{localStorage.setItem(DELETE_STORE,JSON.stringify(arr))}catch(e){}
  }
  function fallbackProgramId(){
    const p=(Array.isArray(st.programs)?st.programs:[]).find(x=>x&&!x.archived&&!isRequestedOldPlan(x));
    if(p)return String(p.id);
    return st.builtinProgramHidden?'':BUILTIN;
  }
  function removeRequestedOldPlan(){
    if(!Array.isArray(st.programs))return;
    const removed=st.programs.filter(isRequestedOldPlan);
    if(!removed.length)return;
    removed.forEach(tombstone);
    const ids=new Set(removed.map(x=>String(x.id)));
    st.programs=st.programs.filter(x=>!ids.has(String(x?.id)));
    if(ids.has(String(st.primaryProgramId||'')))st.primaryProgramId=fallbackProgramId();
    if(ids.has(String(st.startProgramId||'')))st.startProgramId=st.primaryProgramId||fallbackProgramId();
    try{save()}catch(e){}
    try{if(typeof trainerProgramsPage==='function')trainerProgramsPage()}catch(e){}
    try{if(typeof planPage==='function')planPage()}catch(e){}
  }

  function cleanLegacyClientButtons(){
    const root=document.getElementById('clients');if(!root)return;
    const slots=[...root.querySelectorAll('.clients-add-action')];
    slots.slice(1).forEach(x=>x.remove());
    const slot=slots[0]||null;
    if(slot){
      const online=[...slot.querySelectorAll('[data-client-add-online]')];online.slice(1).forEach(x=>x.remove());
      const offline=[...slot.querySelectorAll('[data-client-add-offline]')];offline.slice(1).forEach(x=>x.remove());
    }
    const off=document.getElementById('offlineClientsPane');
    if(off){
      [...off.querySelectorAll('button')].forEach(b=>{
        const t=String(b.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
        if(/добавить\s+офлайн[-‑ ]клиента/.test(t))b.remove();
      });
    }
    const header=root.querySelector(':scope > .card:first-child');
    if(header){
      [...header.querySelectorAll('button')].forEach(b=>{
        const t=String(b.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
        if(/^[＋+]?\s*план$/.test(t))b.remove();
      });
    }
  }

  let raf=0;
  function scheduleClean(){
    cancelAnimationFrame(raf);
    raf=requestAnimationFrame(()=>{removeRequestedOldPlan();cleanLegacyClientButtons()});
  }
  const root=document.getElementById('clients');
  if(root)new MutationObserver(scheduleClean).observe(root,{childList:true,subtree:true});
  [0,80,250,700,1500,3000,6000].forEach(t=>setTimeout(scheduleClean,t));
  window.addEventListener('pageshow',scheduleClean,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)scheduleClean()},{passive:true});
})();
