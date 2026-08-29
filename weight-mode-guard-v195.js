'use strict';
(()=>{
  if(window.__unvrslWeightModeGuardV195)return;window.__unvrslWeightModeGuardV195=true;
  const root=window;
  const N=v=>{if(v===''||v==null)return null;const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:null};
  const n=v=>N(v)??0;
  let lastId='';

  function restoreAwaitingPrescribed(){
    const cur=root.st?.current;if(!cur)return false;
    let changed=false;
    (cur.ex||[]).forEach(ex=>{
      if(ex?.programWeightMode!=='prescribed'||ex?.weightDecision!=='awaiting_choice')return;
      (ex.set||[]).forEach(set=>{
        if(set?.ok||set?.manualOverride)return;
        const w=n(set?.programW);
        if(w>0&&n(set.w)!==w){set.w=w;changed=true}
        if(w>0&&n(set.plannedW)!==w){set.plannedW=w;changed=true}
        if(w>0&&n(set.baselineW)!==w){set.baselineW=w;changed=true}
        if(w>0)set.baselineSource='program';
      });
    });
    if(changed){try{root.save?.()}catch(_){}}
    return changed;
  }

  function hideLegacyRecommendation(){
    const cur=root.st?.current;if(!cur)return;
    const cards=[...document.querySelectorAll('#start .exercise')];
    cards.forEach((card,i)=>{
      const ex=cur.ex?.[i];
      if(ex?.programWeightMode==='prescribed'&&ex?.weightDecision==='awaiting_choice'){
        card.querySelectorAll('.smart-suggest').forEach(el=>{el.style.display='none'});
      }
    });
  }

  async function ensureFlow(){
    const cur=root.st?.current;if(!cur?.id)return;
    const id=String(cur.id);
    if(id!==lastId){lastId=id;cur.readinessAsked=false;cur.weightsPrepared194=false}
    if(!cur.weightsPrepared194&&typeof root.advPrepareBaseline==='function'){
      try{await root.advPrepareBaseline()}catch(e){console.warn('weight mode guard prepare',e)}
    }
    const changed=restoreAwaitingPrescribed();
    if(changed){try{root.startPage?.()}catch(_){}}
    hideLegacyRecommendation();
  }

  const oldStart=root.startPage;
  if(typeof oldStart==='function'&&!oldStart.__weightGuard195){
    const wrapped=function(){
      const r=oldStart.apply(this,arguments);
      setTimeout(()=>{restoreAwaitingPrescribed();hideLegacyRecommendation()},0);
      return r;
    };
    wrapped.__weightGuard195=true;root.startPage=wrapped;try{startPage=wrapped}catch(_){}
  }

  const oldApply=root.applySuggestion;
  if(typeof oldApply==='function'&&!oldApply.__weightGuard195){
    const wrapped=function(indices,weight){
      const cur=root.st?.current;
      const blocked=(indices||[]).some(i=>cur?.ex?.[i]?.programWeightMode==='prescribed'&&cur?.ex?.[i]?.weightDecision==='awaiting_choice');
      if(blocked){root.toast?.('Сначала выбери: рекомендации или веса программы');return}
      return oldApply.apply(this,arguments);
    };
    wrapped.__weightGuard195=true;root.applySuggestion=wrapped;try{applySuggestion=wrapped}catch(_){}
  }

  setInterval(ensureFlow,180);
  [0,80,250,700,1500,3000].forEach(t=>setTimeout(ensureFlow,t));
})();
