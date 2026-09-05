'use strict';
(()=>{
  const W=window,REV=302;
  if(W.__unvrslTemplateLoadProfileV302)return;
  W.__unvrslTemplateLoadProfileV302=true;

  const state=()=>{try{return typeof st!=='undefined'?st:W.st}catch(_){return W.st||null}};
  const saveState=()=>{try{if(typeof save==='function')save();else W.save?.()}catch(_){ }};
  const mid=(a,b)=>Math.round(((Number(a)+Number(b))/2)*2)/2;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

  const TABLES=Object.freeze({
    hypertrophy:Object.freeze({
      6:[[65,70,6,7],[68,73,7,7.5],[70,75,7.5,8],[72,77,8,8.5],[75,80,8,9],[60,65,6,7]],
      8:[[65,70,6,7],[68,73,7,7.5],[70,75,7.5,8],[60,65,6,7],[72,77,7.5,8],[75,80,8,8.5],[78,83,8,9],[65,70,6,7]],
      10:[[65,70,6,7],[68,73,7,7.5],[70,75,7.5,8],[72,77,8,8.5],[60,65,6,7],[72,77,7.5,8],[75,80,8,8.5],[77,82,8,9],[80,85,8.5,9],[65,70,6,7]]
    }),
    strength:Object.freeze({
      6:[[70,75,6,7],[72,77,7,7.5],[75,80,7.5,8],[78,83,8,8.5],[82,87,8,9],[65,70,6,7]],
      8:[[70,75,6,7],[72,77,7,7.5],[75,80,7.5,8],[65,70,6,7],[80,84,8,8.5],[82,86,8,9],[85,90,8.5,9.5],[70,75,6,7]],
      10:[[70,75,6,7],[72,77,7,7.5],[75,80,7.5,8],[78,82,8,8.5],[65,70,6,7],[80,84,8,8.5],[82,86,8,9],[85,88,8.5,9],[88,92,9,9.5],[70,75,6,7]]
    }),
    beginner:Object.freeze({
      6:[[55,65,5.5,6.5],[60,67,6,7],[62,70,6.5,7],[65,72,7,7.5],[67,75,7,8],[55,62,5.5,6.5]],
      8:[[55,65,5.5,6.5],[60,67,6,7],[62,70,6.5,7],[58,65,6,6.5],[65,72,7,7.5],[67,75,7,8],[70,77,7.5,8],[55,62,5.5,6.5]],
      10:[[55,65,5.5,6.5],[60,67,6,7],[62,70,6.5,7],[65,72,7,7.5],[58,65,6,6.5],[65,72,7,7.5],[67,75,7,8],[70,77,7.5,8],[72,80,8,8.5],[55,62,5.5,6.5]]
    })
  });

  function isTemplate(p){return !!p&&(p.internetTemplate===true||p.femaleTemplate===true||p.templateKey||p.sourceName||p.templateSource)}
  function kindFor(p){
    const x=`${p?.name||''} ${p?.meta||''} ${p?.sourceName||''}`.toLowerCase();
    if(/нович|beginner|собственн.*вес|bodyweight/.test(x))return'beginner';
    if(/stronglifts|phul|powerbuild|strength|\bсила\b|силов/.test(x))return'strength';
    return'hypertrophy'
  }
  function nearestTable(kind,total){
    const pool=TABLES[kind]||TABLES.hypertrophy;
    if(pool[total])return pool[total];
    const keys=Object.keys(pool).map(Number).sort((a,b)=>Math.abs(a-total)-Math.abs(b-total));
    return pool[keys[0]]
  }
  function profileFor(p,index){
    const total=Math.max(1,p?.weeks?.length||1),kind=kindFor(p),table=nearestTable(kind,total);
    if(table.length===total)return{kind,row:table[index]||table.at(-1)};
    const pos=total<=1?0:index/(total-1),src=Math.round(pos*(table.length-1));
    return{kind,row:table[src]||table.at(-1)}
  }
  function put(o,k,v){if(!o||o[k]===v)return false;o[k]=v;return true}
  function applyProgram(p){
    if(!isTemplate(p)||!Array.isArray(p.weeks)||!p.weeks.length)return false;
    let changed=false;
    p.weeks.forEach((w,wi)=>{
      if(!w||w.loadProfileManual===true)return;
      const {kind,row}=profileFor(p,wi),[imin,imax,rmin,rmax]=row,target=mid(rmin,rmax);
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
