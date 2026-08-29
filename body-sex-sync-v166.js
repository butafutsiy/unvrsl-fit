'use strict';
(()=>{
  if(window.__unvrslBodySexSyncV167)return;
  window.__unvrslBodySexSyncV167=true;

  function state(){
    try{
      if(typeof st!=='undefined'){
        window.st=st;
        return st;
      }
    }catch(e){}
    return window.st||null;
  }
  function normalizedSex(){
    const s=state();
    const sex=String(s?.profileBio?.sex||'').toLowerCase();
    return sex==='female'?'female':'male';
  }
  function syncBodySex(forceRender=false){
    const s=state();
    if(!s)return false;
    const next=normalizedSex();
    const changed=s.body!==next;
    s.body=next;
    if(changed){
      try{localStorage.removeItem('unvrsl-anatome-svg-v1')}catch(e){}
      try{save()}catch(e){}
      const fig=document.querySelector('#anatomeMuscleCard .anatome-figure');
      if(fig)delete fig.dataset.localSig;
    }
    if((changed||forceRender)&&typeof statsPage==='function'){
      try{statsPage()}catch(e){}
    }
    return changed;
  }

  window.syncBodySex=syncBodySex;
  state();
  syncBodySex(false);

  const wrapSave=()=>{
    const f=typeof profileSaveBio==='function'?profileSaveBio:window.profileSaveBio;
    if(typeof f!=='function'||f.__bodySexSyncV167)return false;
    const wrapped=async function(){
      const out=await f.apply(this,arguments);
      syncBodySex(true);
      return out;
    };
    wrapped.__bodySexSyncV167=true;
    window.profileSaveBio=wrapped;
    try{profileSaveBio=wrapped}catch(e){}
    return true;
  };

  if(!wrapSave()){
    const t=setInterval(()=>{if(wrapSave())clearInterval(t)},120);
    setTimeout(()=>clearInterval(t),15000);
  }

  const wrapStats=()=>{
    const f=typeof statsPage==='function'?statsPage:window.statsPage;
    if(typeof f!=='function'||f.__bodySexSyncV167)return false;
    const wrapped=function(){
      const s=state();
      if(s)s.body=normalizedSex();
      return f.apply(this,arguments);
    };
    wrapped.__bodySexSyncV167=true;
    window.statsPage=wrapped;
    try{statsPage=wrapped}catch(e){}
    return true;
  };
  wrapStats();

  const observer=new MutationObserver(()=>{
    const s=state();
    if(!s)return;
    const next=normalizedSex();
    if(s.body!==next){s.body=next;try{save()}catch(e){}}
  });
  if(document.documentElement)observer.observe(document.documentElement,{childList:true,subtree:true});

  window.addEventListener('focus',()=>syncBodySex(false));
})();
