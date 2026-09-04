'use strict';
(()=>{
  const W=window,D=document,REV=288;
  if(W.__unvrslTrainingPrescriptionBridgeV288)return;
  W.__unvrslTrainingPrescriptionBridgeV288=true;

  const SPECIAL=/UNVRSL|SLDR|\bDS\b|FST-?7/i;
  const N=v=>{if(v===''||v==null)return null;const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:null};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const base=n=>String(n||'').split(' — ')[0].trim();
  const state=()=>{try{if(typeof st!=='undefined'){W.st=st;return st}}catch(_){ }return W.st||null};
  const saveState=()=>{try{if(typeof save==='function')save();else W.save?.()}catch(_){ }};
  const cache=new Map();

  function isBuiltIn(cur){
    if(!cur||cur.programId||cur.planId||cur.programName)return false;
    const week=N(cur.w);
    return week>=1&&week<=8&&!!cur.c;
  }

  function captureBuiltInRanges(cur){
    if(!isBuiltIn(cur))return null;
    const key=`${cur.w}:${cur.c}`;
    if(cache.has(key))return cache.get(key);
    const fn=W.preview;
    if(typeof fn!=='function'||!fn.__unvrslPreviewAuthorityV281)return null;

    let html='';
    const capture=x=>{html=String(x||'');return html};
    const oldWindowModal=W.modal;
    let oldBinding=null,hasBinding=false;
    try{oldBinding=modal;hasBinding=true;modal=capture}catch(_){ }
    try{W.modal=capture;fn(cur.w,cur.c)}catch(_){html=''}finally{
      W.modal=oldWindowModal;
      if(hasBinding)try{modal=oldBinding}catch(_){ }
    }
    if(!html)return null;

    const t=D.createElement('template');t.innerHTML=html;
    const out=new Map();
    t.content.querySelectorAll('.rp281-item').forEach(item=>{
      const name=base(item.querySelector('.rp281-name')?.textContent||'');
      const text=String(item.querySelector('.rp281-prescription')?.textContent||'').trim();
      const m=text.match(/^\s*\d+\s*[×x]\s*(\d+(?:[.,]\d+)?)\s*[–-]\s*(\d+(?:[.,]\d+)?)/);
      if(!name||!m||out.has(name))return;
      const lo=N(m[1]),hi=N(m[2]);
      if(lo>0&&hi>=lo)out.set(name,[lo,hi]);
    });
    if(out.size)cache.set(key,out);
    return out.size?out:null;
  }

  function explicitTargetRpe(ex,set,cur){
    return [N(set?.targetRpe),N(ex?.targetRpe),N(ex?.rpeTarget),N(ex?.target),N(ex?.rpe),N(cur?.target),8]
      .find(x=>x!=null&&x>0)||8;
  }

  function programWeekTarget(cur){
    if(!cur?.programId)return null;
    const a=N(cur.programWeekRpeMin),b=N(cur.programWeekRpeMax);
    if(!(a>0)||!(b>0))return null;
    return Math.round(((Math.min(a,b)+Math.max(a,b))/2)*2)/2;
  }

  function repsAreManual(set){
    return !!(set?.ok||set?.manualFields?.r||set?.__repManualV272||set?.__repManualV283||set?.__repManualV287);
  }

  function annotateProgramRanges(cur){
    let changed=false;
    const weekTarget=programWeekTarget(cur);
    if(weekTarget!=null&&Math.abs((N(cur.target)||0)-weekTarget)>.001){
      cur.target=weekTarget;changed=true;
    }
    (cur.ex||[]).forEach(ex=>{
      if(ex?.mode==='cardio'||SPECIAL.test(String(ex?.n||'')))return;
      (ex.set||[]).forEach(set=>{
        const lo=N(set?.targetRepMin??set?.rMin),hi=N(set?.targetRepMax??set?.rMax);
        if(lo>0){
          if(N(set.targetRepMin)!==lo){set.targetRepMin=lo;changed=true}
          const top=hi>=lo?hi:lo;
          if(N(set.targetRepMax)!==top){set.targetRepMax=top;changed=true}
          if(!repsAreManual(set)&&N(set.r)!==lo){set.r=lo;changed=true}
        }
      })
    });
    return changed;
  }

  function annotateBuiltInRanges(cur){
    const ranges=captureBuiltInRanges(cur);if(!ranges)return false;
    let changed=false;
    (cur.ex||[]).forEach(ex=>{
      if(ex?.mode==='cardio'||SPECIAL.test(String(ex?.n||'')))return;
      const range=ranges.get(base(ex.n));if(!range)return;
      const [lo,hi]=range;
      (ex.set||[]).forEach(set=>{
        if(N(set.targetRepMin)!==lo){set.targetRepMin=lo;changed=true}
        if(N(set.targetRepMax)!==hi){set.targetRepMax=hi;changed=true}
        set.repPrescriptionSource='built_in_preview_v281';
        if(!repsAreManual(set)&&N(set.r)!==lo){set.r=lo;changed=true}
      })
    });
    return changed;
  }

  function annotateEffort(cur){
    let changed=false;
    (cur?.ex||[]).forEach(ex=>{
      if(ex?.mode==='cardio')return;
      (ex.set||[]).forEach(set=>{
        const rpe=clamp(explicitTargetRpe(ex,set,cur),1,10),rir=clamp(10-rpe,0,9);
        if(N(set.targetRpeResolved)!==rpe){set.targetRpeResolved=rpe;changed=true}
        if(N(set.targetRir)!==rir){set.targetRir=rir;changed=true}
      })
    });
    return changed;
  }

  function prepare(cur=state()?.current){
    if(!cur||cur.ended)return false;
    let changed=false;
    if(cur.programId)changed=annotateProgramRanges(cur)||changed;
    else if(isBuiltIn(cur))changed=annotateBuiltInRanges(cur)||changed;
    changed=annotateEffort(cur)||changed;
    if(changed){cur.trainingPrescriptionRevision=REV;saveState()}
    return changed;
  }

  function wrapLoadModel(){
    const model=W.trainingLoadModel258;
    if(!model||typeof model.run!=='function'||model.run.__prescriptionBridgeV288)return false;
    const old=model.run;
    const wrapped=async function(){prepare();return old.apply(this,arguments)};
    wrapped.__prescriptionBridgeV288=true;wrapped.__prescriptionBridgeBase=old;
    model.run=wrapped;
    return true;
  }

  let recalculating=false;
  async function sync(force=false){
    wrapLoadModel();
    const changed=prepare();
    const model=W.trainingLoadModel258;
    if((changed||force)&&model?.run&&!recalculating){
      recalculating=true;
      try{await model.run(true)}catch(e){console.warn('UNVRSL prescription bridge v288',e)}finally{recalculating=false}
    }
    try{W.trainingEngine200Tick?.()}catch(_){ }
  }

  W.unvrslTrainingPrescriptionSyncV288=sync;
  W.unvrslTrainingPrescriptionPrepareV288=prepare;
  ['unvrsl:training-engine-ready','unvrsl:modules-ready','unvrsl:app-ready','unvrsl:cloud-modules-settled'].forEach(ev=>W.addEventListener?.(ev,()=>sync(true),{passive:true}));
  D.addEventListener?.('visibilitychange',()=>{if(!D.hidden)sync(false)},{passive:true});
  [0,120,350,800,1600,3200,6000].forEach(ms=>setTimeout(()=>sync(ms===800),ms));
  setInterval(()=>sync(false),1600);
})();