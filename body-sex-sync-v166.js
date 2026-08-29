'use strict';
(()=>{
  if(window.__unvrslBodySexSyncV166)return;
  window.__unvrslBodySexSyncV166=true;

  function normalizedSex(){
    const sex=String(window.st?.profileBio?.sex||'').toLowerCase();
    return sex==='female'?'female':'male';
  }
  function syncBodySex(forceRender=false){
    if(!window.st)return false;
    const next=normalizedSex();
    const changed=st.body!==next;
    st.body=next;
    if(changed){
      try{localStorage.removeItem('unvrsl-anatome-svg-v1')}catch(e){}
      try{save()}catch(e){}
    }
    if((changed||forceRender)&&typeof window.statsPage==='function'){
      try{window.statsPage()}catch(e){}
    }
    return changed;
  }

  window.syncBodySex=syncBodySex;
  syncBodySex(false);

  const wrapSave=()=>{
    const f=window.profileSaveBio;
    if(typeof f!=='function'||f.__bodySexSyncV166)return false;
    const wrapped=async function(){
      const out=await f.apply(this,arguments);
      syncBodySex(true);
      return out;
    };
    wrapped.__bodySexSyncV166=true;
    window.profileSaveBio=wrapped;
    try{profileSaveBio=wrapped}catch(e){}
    return true;
  };

  if(!wrapSave()){
    const t=setInterval(()=>{if(wrapSave())clearInterval(t)},120);
    setTimeout(()=>clearInterval(t),12000);
  }

  const originalStats=window.statsPage;
  if(typeof originalStats==='function'&&!originalStats.__bodySexSyncV166){
    const wrappedStats=function(){
      if(window.st)st.body=normalizedSex();
      return originalStats.apply(this,arguments);
    };
    wrappedStats.__bodySexSyncV166=true;
    window.statsPage=wrappedStats;
    try{statsPage=wrappedStats}catch(e){}
  }

  window.addEventListener('focus',()=>syncBodySex(false));
})();
