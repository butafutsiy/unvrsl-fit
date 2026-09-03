'use strict';
(()=>{
  const W=window,D=document;
  if(W.__unvrslBuiltInMobileRepUiV271)return;
  W.__unvrslBuiltInMobileRepUiV271=true;

  const SPECIAL=/UNVRSL|SLDR|\bDS\b|FST-7/i;
  const finite=v=>Number.isFinite(Number(v));
  const routines=()=>{try{return typeof ROUTINES!=='undefined'?ROUTINES:(W.UNVRSL_ROUTINES||[])}catch(_){return W.UNVRSL_ROUTINES||[]}};
  const state=()=>{try{return typeof st!=='undefined'?st:W.st}catch(_){return W.st}};
  const saver=()=>{try{if(typeof save==='function')save();else W.save?.()}catch(_){}};

  function ensureRangeEngine(){
    if(W.__unvrslBuiltInPlanRepRangesV267)return;
    if(D.getElementById('unvrsl-built-in-ranges-v271-loader'))return;
    const s=D.createElement('script');
    s.id='unvrsl-built-in-ranges-v271-loader';
    s.src='built-in-plan-rep-ranges-v267.js?v=271';
    s.async=false;
    (D.head||D.documentElement).appendChild(s);
  }

  function sourceFor(s,ei){
    const r=routines().find(x=>Number(x?.w)===Number(s?.w)&&String(x?.c)===String(s?.c));
    return r?.e?.[Number(ei)]||null;
  }

  function targetFor(s,e,ei){
    if(!e||SPECIAL.test(String(e.n||'')))return null;
    const first=e?.set?.[0];
    let lo=finite(first?.targetRepMin)?Number(first.targetRepMin):null;
    let hi=finite(first?.targetRepMax)?Number(first.targetRepMax):null;
    const src=sourceFor(s,ei);
    if(lo==null&&finite(src?.rMin))lo=Number(src.rMin);
    if(hi==null&&finite(src?.rMax))hi=Number(src.rMax);
    if(lo==null||hi==null)return null;
    if(src?.sd){lo/=2;hi/=2;return {lo,hi,suffix:' на ногу'}}
    return {lo,hi,suffix:''}
  }

  function rangeLabel(t){
    if(!t)return '';
    const lo=Number(t.lo),hi=Number(t.hi);
    return `${lo===hi?lo:`${lo}–${hi}`}${t.suffix||''}`
  }

  function syncCurrent(){
    const s=state()?.current;if(!s?.ex)return false;
    const r=routines().find(x=>Number(x?.w)===Number(s.w)&&String(x?.c)===String(s.c));
    if(!r)return false;
    let changed=false;
    r.e?.forEach((src,ei)=>{
      if(!src||SPECIAL.test(String(src.n||''))||!finite(src.rMin)||!finite(src.rMax))return;
      const ex=s.ex?.[ei];if(!ex)return;
      (ex.set||[]).forEach(set=>{
        const lo=Number(src.rMin),hi=Number(src.rMax);
        if(Number(set.targetRepMin)!==lo){set.targetRepMin=lo;changed=true}
        if(Number(set.targetRepMax)!==hi){set.targetRepMax=hi;changed=true}
      })
    });
    if(changed){s.repRangeRevision=271;saver()}
    return changed
  }

  function patchExerciseCard(){
    let cur=null;
    try{cur=typeof exerciseCard==='function'?exerciseCard:W.exerciseCard}catch(_){cur=W.exerciseCard}
    if(typeof cur!=='function'||cur.__mobileRange271)return false;
    const wrapped=function(s,e,ei){
      let html=cur.apply(this,arguments);
      const t=targetFor(s,e,ei);
      if(!t||!html||SPECIAL.test(String(e?.n||'')))return html;
      const note=`<div class="unvrsl-rep-target-v271" style="margin:9px 0 3px;color:var(--green);font-size:13px;font-weight:750">Цель повторов · ${rangeLabel(t)}</div>`;
      return html.replace('<div class="sethead">',`${note}<div class="sethead">`)
    };
    wrapped.__mobileRange271=true;
    wrapped.__mobileRange271Base=cur;
    W.exerciseCard=wrapped;
    try{exerciseCard=wrapped}catch(_){ }
    return true
  }

  function refreshStart(){
    try{
      const page=D.getElementById('start');
      if(page?.classList.contains('active')&&typeof startPage==='function')startPage()
    }catch(_){ }
  }

  function install(){
    ensureRangeEngine();
    const patched=patchExerciseCard();
    const synced=W.__unvrslBuiltInPlanRepRangesAppliedV267?syncCurrent():false;
    if(patched||synced)refreshStart()
  }

  install();
  [50,120,250,500,900,1500,2500,4000].forEach(ms=>setTimeout(install,ms));
  const id=setInterval(()=>{
    install();
    if(W.__unvrslBuiltInPlanRepRangesAppliedV267&&patchExerciseCard())refreshStart()
  },1200);
  setTimeout(()=>clearInterval(id),15000);
  for(const ev of ['unvrsl:modules-ready','unvrsl:app-ready'])W.addEventListener?.(ev,install,{passive:true});
})();
