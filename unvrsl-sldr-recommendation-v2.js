'use strict';
(()=>{
  const W=window,D=document,PROGRAM_ID='prog-unvrsl-sldr',PROGRAM_KEY='unvrsl-sldr-program-v1';
  if(W.__unvrslSldrRecommendationV2)return;
  W.__unvrslSldrRecommendationV2=true;
  const N=v=>{if(v===''||v==null)return null;const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:null};
  const state=()=>{try{return typeof st!=='undefined'?st:W.st}catch(_){return W.st}};
  const saveState=()=>{try{if(typeof save==='function')save();else W.save?.()}catch(_){}};
  const isAuto=ex=>ex&&ex.mode!=='cardio'&&(ex.programWeightMode==='autoweight'||ex.programWeightMode==='adaptive'||ex.programWeightMode==='auto'||ex.weightDecision==='adaptive_auto'||ex.weightDecision==='adaptive_seed'||ex.weightDecision==='calibration');

  function cleanProgram(){
    const s=state(),p=(s?.programs||[]).find(x=>x?.id===PROGRAM_ID||x?.seedKey===PROGRAM_KEY||x?.name==='UNVRSL SLDR');
    if(!p)return false;
    let changed=false;
    (p.weeks||[]).forEach(w=>(w.days||[]).forEach(d=>(d.ex||[]).forEach(e=>{
      if(typeof e.prescription==='string'){
        const clean=e.prescription.replace(/^[✅☑️💧🔥]\s*/u,'');
        if(clean!==e.prescription){e.prescription=clean;changed=true}
      }
    })));
    if((p.seedVersion||0)<2){p.seedVersion=2;changed=true}
    if(changed){p.updated=Date.now();saveState()}
    return true
  }

  function markManualWeight(ev){
    const input=ev.target;if(!(input instanceof HTMLInputElement))return;
    const row=input.closest('#start .setrow'),card=input.closest('#start .exercise');if(!row||!card)return;
    const inputs=[...row.querySelectorAll('input')];if(inputs[0]!==input)return;
    const root=D.getElementById('start'),cards=[...(root?.querySelectorAll('.exercise')||[])],ci=cards.indexOf(card),ri=[...card.querySelectorAll('.setrow')].indexOf(row),cur=state()?.current,ex=cur?.ex?.[ci],set=ex?.set?.[ri];
    if(!set)return;set.manualOverride=true;set.w=N(input.value)??0;saveState()
  }

  function normalizeCurrent(){
    const cur=state()?.current;if(!cur||cur.ended)return false;
    let changed=false;
    (cur.ex||[]).forEach(ex=>{
      if(!isAuto(ex))return;
      ex.autoweightRecommendationOnly=true;
      (ex.set||[]).forEach(set=>{
        if(set.ok||set.manualOverride)return;
        if(N(set.w)!==0){set.w=0;changed=true}
        if(set.baselineSource&&set.baselineSource!=='recommendation_only'){set.baselineSource='recommendation_only';changed=true}
      })
    });
    if(changed)saveState();
    syncDom();
    return changed
  }

  function syncDom(){
    D.querySelectorAll('#start .te200-auto').forEach(el=>{el.textContent=String(el.textContent||'').replace(/^Автовес\s*·?/,'Рекомендация ·')});
    D.querySelectorAll('#pmWeightMode option[value="auto"]').forEach(o=>{o.textContent='Рекомендация'});
    const note=D.getElementById('pi261WeightNote'),sel=D.getElementById('pmWeightMode');
    if(note&&sel?.value==='auto')note.textContent='Вес рассчитывается как рекомендация и не подставляется в рабочий подход автоматически.';
    const cur=state()?.current,root=D.getElementById('start');if(!cur||!root)return;
    const cards=[...root.querySelectorAll('.exercise')];
    (cur.ex||[]).forEach((ex,ei)=>{
      if(!isAuto(ex))return;
      const rows=[...(cards[ei]?.querySelectorAll('.setrow')||[])];
      (ex.set||[]).forEach((set,si)=>{
        if(set.ok||set.manualOverride)return;
        const input=rows[si]?.querySelector('input');if(input&&D.activeElement!==input&&String(input.value)!=='')input.value=''
      })
    })
  }

  function wrapLoadModel(){
    const api=W.trainingLoadModel292||W.trainingLoadModel258;if(!api?.run||api.__recommendationOnlyV2)return false;
    const old=api.run.bind(api);api.run=async function(){const r=await old(...arguments);normalizeCurrent();setTimeout(normalizeCurrent,0);setTimeout(normalizeCurrent,80);return r};api.__recommendationOnlyV2=true;
    if(W.trainingLoadModel292)W.trainingLoadModel292=api;if(W.trainingLoadModel258)W.trainingLoadModel258=api;return true
  }

  function patchWeightModeCopy(){
    if(typeof W.programWeightModeChangedV261==='function'&&!W.programWeightModeChangedV261.__recommendationOnlyV2){
      const old=W.programWeightModeChangedV261;const wrapped=function(){const r=old.apply(this,arguments);setTimeout(syncDom,0);return r};wrapped.__recommendationOnlyV2=true;W.programWeightModeChangedV261=wrapped
    }
  }

  D.addEventListener('input',markManualWeight,true);
  const observer=new MutationObserver(()=>{cleanProgram();wrapLoadModel();patchWeightModeCopy();syncDom()});
  if(D.documentElement)observer.observe(D.documentElement,{childList:true,subtree:true});
  const events=['unvrsl:app-ready','unvrsl:modules-ready','unvrsl:training-engine-ready','unvrsl:cloud-modules-settled','unvrsl:readiness-ready'];
  events.forEach(ev=>W.addEventListener?.(ev,()=>{[0,50,180,500,1000].forEach(ms=>setTimeout(()=>{cleanProgram();wrapLoadModel();patchWeightModeCopy();normalizeCurrent()},ms))},{passive:true}));
  [0,100,300,700,1200,2200,4000].forEach(ms=>setTimeout(()=>{cleanProgram();wrapLoadModel();patchWeightModeCopy();normalizeCurrent()},ms));
})();
