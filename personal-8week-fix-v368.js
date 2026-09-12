'use strict';
(()=>{
  const W=window,KEY='semen-8week-v2';
  function state(){try{if(typeof st!=='undefined')return st}catch(_){ }return W.st||null}
  function saveState(){try{if(typeof save==='function')save();else W.save?.()}catch(_){ }}
  function refresh(){
    const routines=Array.isArray(W.UNVRSL_ROUTINES)?W.UNVRSL_ROUTINES:[];
    const ready=[1,2,3,4,5,6,7,8].every(w=>routines.some(r=>Number(r?.w)===w))&&routines.every(r=>(r?.e||[]).every(e=>Number(e?.targetRevision)===366));
    if(!ready)return false;
    const s=state(),p=s?.programs?.find(x=>x?.systemKey===KEY);if(!p)return false;
    if(Number(p.personalPlanRevision)===367){p.personalPlanRevision=366;saveState()}
    return true
  }
  W.addEventListener?.('load',()=>setTimeout(refresh,0),{once:true});
  setTimeout(refresh,900);
})();
