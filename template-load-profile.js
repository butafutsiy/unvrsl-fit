'use strict';
(()=>{
  const W=window,REV=302;
  if(W.__unvrslTemplateLoadProfileV302)return;
  W.__unvrslTemplateLoadProfileV302=true;

  const state=()=>{try{return typeof st!=='undefined'?st:W.st}catch(_){return W.st||null}};
  const saveState=()=>{try{if(typeof save==='function')save();else W.save?.()}catch(_){ }};
  const mid=(a,b)=>Math.round(((Number(a)+Number(b))/2)*2)/2;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

  function isTemplate(p){return !!p&&(p.internetTemplate===true||p.femaleTemplate===true||p.templateKey||p.sourceName||p.templateSource)}
  function kindFor(p){
    const x=`${p?.name||''} ${p?.meta||''} ${p?.sourceName||''}`.toLowerCase();
    if(/нович|beginner|собственн.*вес|bodyweight/.test(x))return'beginner';
    if(/stronglifts|phul|powerbuild|strength|\bсила\b|силов/.test(x))return'strength';
    return'hypertrophy'
  }
  function profileFor(p,index){
    const kind=kindFor(p);
    try{const pr=W.WorkoutDomain.cycleProfiles(p.weeks.length,{testWeek:p.cycleOptions?.testWeek===true,priority:kind==='strength'?'strength':'hypertrophy'})[index];return {kind,row:[...pr.pct,...pr.rpe]};}catch(_){return null;}
  }
  function put(o,k,v){if(!o||o[k]===v)return false;o[k]=v;return true}
  function applyProgram(p){
    if(!isTemplate(p)||!Array.isArray(p.weeks)||!p.weeks.length)return false;
    if(p.cycleOptions)return false;
    let changed=false;
    p.weeks.forEach((w,wi)=>{
      if(!w||w.loadProfileManual===true)return;
      const chosen=profileFor(p,wi);if(!chosen)return;const {kind,row}=chosen,[imin,imax,rmin,rmax]=row,target=mid(rmin,rmax);
      const values={
        intensityMin:imin,intensityMax:imax,useIntensity:true,
        rpeMin:rmin,rpeMax:rmax,rirMin:Math.max(0,10-rmax),rirMax:Math.max(0,10-rmin),
        loadProfileAuto:true,loadProfileRevision:REV,loadProfileSource:`template-${kind}-v${REV}`
      };
      Object.entries(values).forEach(([k,v])=>{changed=put(w,k,v)||changed});
      (w.days||[]).forEach(d=>(d.ex||[]).forEach(e=>{
        if(!e||e.rpeManual===true||e.manualRpe===true)return;
        changed=put(e,'rpe',target)||changed;
        changed=put(e,'templateWeekRpeTarget',target)||changed;
      }));
    });
    changed=put(p,'templateLoadProfileRevision',REV)||changed;
    changed=put(p,'templateLoadProfileKind',kindFor(p))||changed;
    if(changed)p.updated=Date.now();
    return changed
  }
  W.unvrslApplyTemplateLoadProfileV302=applyProgram;

  function patchAll(){
    const s=state();if(!s)return false;let changed=false;
    for(const list of [s.programTemplates,s.programs]){
      if(!Array.isArray(list))continue;
      list.forEach(p=>{if(applyProgram(p))changed=true})
    }
    if(changed)saveState();
    const cur=s.current;if(cur?.id&&!cur.ended){
      const p=(s.programs||[]).find(x=>String(x?.id||'')===String(cur.programId||'')||String(x?.cloudPlanId||'')===String(cur.planId||''));
      if(p&&isTemplate(p))queueMicrotask(async()=>{try{W.unvrslTrainingPrescriptionPrepareV292?.(cur);await W.trainingLoadModel292?.run?.(true)}catch(_){}})
    }
    return changed
  }
  W.unvrslTemplateLoadProfileSyncV302=patchAll;

  function wrapCreator(name){
    const fn=W[name];if(typeof fn!=='function'||fn.__templateLoadV302)return false;
    const wrapped=function(){
      const before=new Set((state()?.programs||[]).map(p=>String(p?.id||''))),out=fn.apply(this,arguments);
      queueMicrotask(()=>{const s=state();let changed=false;(s?.programs||[]).filter(p=>!before.has(String(p?.id||''))).forEach(p=>{if(applyProgram(p))changed=true});if(changed)saveState()});
      return out
    };
    wrapped.__templateLoadV302=true;wrapped.__templateLoadBase=fn;W[name]=wrapped;
    try{globalThis[name]=wrapped}catch(_){ }
    return true
  }
  function hooks(){['createPopularProgram','createFemaleTemplateProgram','createFromTemplate'].forEach(wrapCreator)}

  patchAll();hooks();
  ['unvrsl:modules-ready','unvrsl:app-ready','unvrsl:cloud-modules-settled','unvrsl:training-engine-ready'].forEach(ev=>W.addEventListener?.(ev,()=>{patchAll();hooks()},{passive:true}));
  [100,400,900,1800,3500,7000].forEach(ms=>setTimeout(()=>{patchAll();hooks()},ms));
})();

