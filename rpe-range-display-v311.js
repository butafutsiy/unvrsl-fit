'use strict';
(function(root,factory){
  const api=factory(root||{});
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root&&root.document)api.boot();
})(typeof window!=='undefined'?window:globalThis,function(W){
  const D=W.document,VERSION=366;
  const num=v=>{if(v===''||v==null)return null;const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:null};
  const fmt=v=>Number(v).toFixed(1).replace('.0','').replace('.',',');
  const state=()=>{try{if(typeof st!=='undefined'){W.st=st;return st}}catch(_){ }return W.st||null};
  const saveState=()=>{try{if(typeof save==='function')save();else W.save?.()}catch(_){ }};
  const label=(a,b)=>{const lo=Math.min(Number(a),Number(b)),hi=Math.max(Number(a),Number(b));return Math.abs(lo-hi)<.001?fmt(lo):`${fmt(lo)}–${fmt(hi)}`};
  const ISO_RX=/(разгибан|сгибан|подъём|подъем|мах|разведен|сведен|бицеп|трицеп|кроссов|икр|дельт|француз)/i;
  const BASE_RPE={1:[7,8],2:[8,8],3:[8.5,9],4:[6.5,7.5],5:[8.5,9],6:[7,8],7:[8.5,9.5],8:[6,7]};
  const ISO_RPE={1:[8,8],2:[8,8.5],3:[9,9],4:[7,8],5:[8.5,9],6:[8,8],7:[8.5,9],8:[7,8]};
  const WEEK_HEAD={1:[7,8],2:[8,8.5],3:[8.5,9],4:[6.5,7.5],5:[8.5,9],6:[7,8],7:[8.5,9.5],8:[9.5,10]};

  function storedProgramRange(cur){
    const s=state(),programs=Array.isArray(s?.programs)?s.programs:[];
    const p=programs.find(x=>cur?.programId&&String(x?.id||'')===String(cur.programId))
      ||programs.find(x=>cur?.planId&&String(x?.cloudPlanId||'')===String(cur.planId))
      ||programs.find(x=>cur?.programName&&String(x?.name||'')===String(cur.programName));
    if(!p)return null;
    const wi=Math.max(0,(num(cur?.programWeekNumber)??num(cur?.w)??1)-1),week=p.weeks?.[wi];
    const lo=num(week?.rpeMin??week?.weekRpeMin),hi=num(week?.rpeMax??week?.weekRpeMax);
    return lo!=null&&hi!=null?{min:Math.min(lo,hi),max:Math.max(lo,hi)}:null
  }
  function isBuiltin(cur){
    if(!cur||cur.programId||cur.planId||cur.programName)return false;
    const w=num(cur.w);return !!(w>=1&&w<=8&&cur.c)
  }
  function currentRange(cur){
    const lo=num(cur?.programWeekRpeMin),hi=num(cur?.programWeekRpeMax);
    if(lo!=null&&hi!=null)return {min:Math.min(lo,hi),max:Math.max(lo,hi)};
    const stored=storedProgramRange(cur);if(stored)return stored;
    if(isBuiltin(cur)){
      const p=WEEK_HEAD[Number(cur.w)];if(p)return{min:p[0],max:p[1]}
    }
    const p=W.UNVRSL_BUILTIN_LOAD_PROFILE?.[Number(cur?.w)]?.rpe;
    if(Array.isArray(p)&&num(p[0])!=null&&num(p[1])!=null)return {min:Math.min(+p[0],+p[1]),max:Math.max(+p[0],+p[1])};
    return null
  }
  function builtinSetRange(cur,ex,set,si=0){
    const n=String(ex?.n||''),w=Number(cur?.w)||1;
    if(/\bDS\b/i.test(n))return /DS1/i.test(n)?{min:9,max:9}:{min:9,max:10};
    if(/FST-7/i.test(n))return si<2?{min:7.5,max:8}:si<5?{min:8,max:8.5}:{min:9,max:9.5};
    if(/UNVRSL/i.test(n)){
      if(/1\/(?:2|3)/.test(n))return{min:8.5,max:9};
      if(/2\/(?:2|3)/.test(n))return{min:9,max:9.5};
      return{min:8,max:9}
    }
    if(/SLDR/i.test(n)){
      if(/1\/3/.test(n))return{min:7.5,max:8};
      if(/2\/3/.test(n))return{min:8,max:8.5};
      return{min:9,max:9}
    }
    if(w===8&&/(тест|максимума|тяжёлый)/i.test(n))return{min:9.5,max:10};
    if(w===8&&/(back-off|лёгкие)/i.test(n))return{min:6,max:7};
    const p=(ISO_RX.test(n)?ISO_RPE:BASE_RPE)[w]||[8,8];return{min:p[0],max:p[1]}
  }
  function setRange(cur,ex,set,si=0){
    const ownMin=num(set?.targetRpeMin??ex?.targetRpeMin),ownMax=num(set?.targetRpeMax??ex?.targetRpeMax);
    if(ownMin!=null&&ownMax!=null)return{min:Math.min(ownMin,ownMax),max:Math.max(ownMin,ownMax)};
    if(isBuiltin(cur))return builtinSetRange(cur,ex,set,si);
    return currentRange(cur)
  }
  function put(o,k,v){if(o[k]===v)return false;o[k]=v;return true}
  function annotate(cur){
    const range=currentRange(cur);if(!cur||!range)return false;let changed=false;
    const rpeLabel=label(range.min,range.max),rirMin=Math.max(0,10-range.max),rirMax=Math.max(0,10-range.min),rirLabel=label(rirMin,rirMax);
    changed=put(cur,'targetRpeMin',range.min)||changed;changed=put(cur,'targetRpeMax',range.max)||changed;changed=put(cur,'targetRpeLabel',rpeLabel)||changed;
    changed=put(cur,'targetRirMin',rirMin)||changed;changed=put(cur,'targetRirMax',rirMax)||changed;changed=put(cur,'targetRirLabel',rirLabel)||changed;
    (cur.ex||[]).forEach(ex=>(ex.set||[]).forEach((set,si)=>{
      const r=setRange(cur,ex,set,si)||range,rl=label(r.min,r.max),rlo=Math.max(0,10-r.max),rhi=Math.max(0,10-r.min);
      changed=put(set,'targetRpeMin',r.min)||changed;changed=put(set,'targetRpeMax',r.max)||changed;changed=put(set,'targetRpeLabel',rl)||changed;
      changed=put(set,'targetRirMin',rlo)||changed;changed=put(set,'targetRirMax',rhi)||changed;changed=put(set,'targetRirLabel',label(rlo,rhi))||changed
    }));
    if(changed){cur.rpeRangeDisplayRevision=VERSION;saveState()}return changed
  }
  function parseIndex(input){
    const ei=num(input?.dataset?.u174Ei),si=num(input?.dataset?.u174Si);if(ei!=null&&si!=null)return {ei,si};
    const raw=input?.getAttribute('onchange')||'',m=raw.match(/(?:editSet|unvrslEditEffort174)\((\d+)\s*,\s*(\d+)/);return m?{ei:+m[1],si:+m[2]}:null
  }
  function patchDom(){
    if(!D)return;const cur=state()?.current,range=currentRange(cur);if(!cur||!range)return;annotate(cur);
    const rpeText=label(range.min,range.max),rirText=label(Math.max(0,10-range.max),Math.max(0,10-range.min));
    D.querySelectorAll('#start .workout-head .muted,#start .rule-line,#start .unvrsl-auto-load').forEach(el=>{
      const before=String(el.textContent||'');let after=before.replace(/((?:целевой|цель)\s+RPE\s*)\d+(?:[.,]\d+)?(?:\s*[–-]\s*\d+(?:[.,]\d+)?)?/ig,`$1${rpeText}`);
      after=after.replace(/((?:целевой|цель)\s+RIR\s*)\d+(?:[.,]\d+)?(?:\s*[–-]\s*\d+(?:[.,]\d+)?)?/ig,`$1${rirText}`);if(after!==before)el.textContent=after
    });
    D.querySelectorAll('#start .exercise').forEach((card,ei)=>{
      const ex=cur.ex?.[ei];card.querySelectorAll('.setrow input').forEach(input=>{
        const idx=parseIndex(input);if(!idx)return;const set=cur.ex?.[idx.ei]?.set?.[idx.si],r=setRange(cur,cur.ex?.[idx.ei],set,idx.si)||range;
        const kind=input.dataset.u174Kind||(input.classList.contains('u174-rir-input')?'rir':((input.getAttribute('onchange')||'').includes("'rpe'")?'rpe':''));
        if(kind==='rpe'){const v=label(r.min,r.max);input.placeholder=v;input.setAttribute('aria-label',`Фактический RPE, цель ${v}`);input.title=`Целевой RPE ${v}`}
        if(kind==='rir'){const v=label(Math.max(0,10-r.max),Math.max(0,10-r.min));input.placeholder=v;input.setAttribute('aria-label',`Фактический RIR, цель ${v}`);input.title=`Целевой RIR ${v}`}
      });
      if(ex){const first=setRange(cur,ex,ex.set?.[0],0);card.querySelectorAll('.chip').forEach(ch=>{const t=String(ch.textContent||'').trim();if(/^RPE\s+/i.test(t)&&first)ch.textContent='RPE '+label(first.min,first.max)})}
    })
  }
  function boot(){
    if(!D||W.__unvrslRpeRangeDisplayV366)return;W.__unvrslRpeRangeDisplayV366=true;W.__unvrslRpeRangeDisplayV314=true;W.__unvrslRpeRangeDisplayV311=true;
    W.unvrslRpeRangeDisplayV314={currentRange,storedProgramRange,setRange,label,annotate,patchDom,version:VERSION};W.unvrslRpeRangeDisplayV311=W.unvrslRpeRangeDisplayV314;
    const start=()=>{patchDom();setTimeout(patchDom,120)};if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',start,{once:true});else start();
    let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;patchDom()})}).observe(D.documentElement,{childList:true,subtree:true});
    D.addEventListener('click',e=>{if(e.target?.closest?.('[data-p="start"],.routine,.today-card,.plus'))setTimeout(patchDom,80)},true);
    ['unvrsl:training-engine-ready','unvrsl:modules-ready','unvrsl:app-ready','unvrsl:client-ready','unvrsl:cloud-modules-settled','unvrsl:readiness-ready'].forEach(ev=>W.addEventListener?.(ev,()=>{patchDom();setTimeout(patchDom,120)},{passive:true}));
    [300,700,1200,2200,3600].forEach(ms=>setTimeout(patchDom,ms));setInterval(()=>{if(!D.hidden&&D.getElementById('start')?.classList.contains('active'))patchDom()},1000)
  }
  return {label,currentRange,storedProgramRange,setRange,annotate,boot,version:VERSION};
});
