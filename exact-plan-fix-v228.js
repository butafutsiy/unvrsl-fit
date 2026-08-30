'use strict';
(()=>{
  if(window.__unvrslExactPlanFixV228)return;
  window.__unvrslExactPlanFixV228=true;
  const W=window;
  const n=v=>{const x=Number(v);return Number.isFinite(x)?x:0};
  function restore(cur){
    if(!cur)return false;
    let changed=0;
    (cur.ex||[]).forEach(ex=>{
      let hasPlan=false;
      (ex.set||[]).forEach(s=>{
        if(!s||s.ok||s.manualOverride)return;
        const launch=s.launchWeightCaptured206?n(s.launchW):0;
        const plan=launch>0?launch:(n(s.programW)||n(s.plannedW)||n(s.baselineW)||n(s.w));
        s.programW=plan;s.plannedW=plan;s.baselineW=plan;s.w=plan;
        s.baselineSource=plan>0?'exact_plan':'exact_plan_empty';
        if(plan>0){hasPlan=true;changed++}
      });
      ex.weightDecision=hasPlan?'program':'calibration';
      if(hasPlan)ex.programWeightMode='prescribed';
    });
    cur.readiness={sleep:null,energy:null,soreness:null,stress:null,score:null,percent:0,factor:1,skipped:true,exactPlan:true,at:new Date().toISOString()};
    cur.readinessUsed=false;cur.readinessAdjusted=false;cur.trainingReadinessDone=true;cur.trainingReadinessPromptShown=true;cur.exactPlanWeights=true;
    try{W.save?.();W.startPage?.()}catch(_){ }
    setTimeout(()=>{try{W.trainingEngine200Tick?.()}catch(_){ }},60);
    return changed>0;
  }
  function install(){
    const old=W.readinessUiStartV227;
    if(typeof old!=='function'||old.__exactPlanV228)return false;
    const wrapped=function(usePlan){
      if(!usePlan)return old.apply(this,arguments);
      const before=W.st?.current||null;
      old.apply(this,arguments);
      let tries=0;
      const timer=setInterval(()=>{
        tries++;
        const cur=W.st?.current;
        const ready=cur?.id&&cur.trainingReadinessDone&&(cur.trainingEngineRevision||tries>20);
        if(ready){
          clearInterval(timer);
          setTimeout(()=>{const ok=restore(cur);W.toast?.(ok?'Точные веса из плана':'План без автокоррекции')},80);
        }else if(tries>60)clearInterval(timer);
      },80);
    };
    wrapped.__exactPlanV228=true;wrapped.__exactPlanBase=old;
    W.readinessUiStartV227=wrapped;
    try{readinessUiStartV227=wrapped}catch(_){ }
    return true;
  }
  if(!install()){
    const t=setInterval(()=>{if(install())clearInterval(t)},100);
    setTimeout(()=>clearInterval(t),15000);
  }
})();
