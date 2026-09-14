'use strict';
(function(root,factory){
  const api=factory(root||{});
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root&&root.document)api.boot();
})(typeof window!=='undefined'?window:globalThis,function(W){
  const D=W.document,VERSION=314;
  const num=v=>{if(v===''||v==null)return null;const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:null};
  const fmt=v=>Number(v).toFixed(1).replace('.0','').replace('.',',');
  const state=()=>{try{if(typeof st!=='undefined'){W.st=st;return st}}catch(_){ }return W.st||null};
  const saveState=()=>{try{if(typeof save==='function')save();else W.save?.()}catch(_){ }};
  const label=(a,b)=>{const lo=Math.min(Number(a),Number(b)),hi=Math.max(Number(a),Number(b));return Math.abs(lo-hi)<.001?fmt(lo):`${fmt(lo)}–${fmt(hi)}`};
  function storedProgramRange(cur){
    const s=state(),programs=Array.isArray(s?.programs)?s.programs:[];
    const p=programs.find(x=>cur?.programId&&String(x?.id||'')===String(cur.programId))
      ||programs.find(x=>cur?.planId&&String(x?.cloudPlanId||'')===String(cur.planId))
      ||programs.find(x=>cur?.programName&&String(x?.name||'')===String(cur.programName));
    if(!p)return null;
    const wi=Math.max(0,(num(cur?.programWeekNumber)??num(cur?.w)??1)-1),week=p.weeks?.[wi];
    const lo=num(week?.rpeMin??week?.weekRpeMin),hi=num(week?.rpeMax??week?.weekRpeMax);
    return lo!=null&&hi!=null?{min:Math.min(lo,hi),max:Math.max(lo,hi)}:null;
  }
  function currentRange(cur){
    const lo=num(cur?.programWeekRpeMin),hi=num(cur?.programWeekRpeMax);
    if(lo!=null&&hi!=null)return {min:Math.min(lo,hi),max:Math.max(lo,hi)};
    const stored=storedProgramRange(cur);if(stored)return stored;
    const p=W.UNVRSL_BUILTIN_LOAD_PROFILE?.[Number(cur?.w)]?.rpe;
    if(Array.isArray(p)&&num(p[0])!=null&&num(p[1])!=null)return {min:Math.min(+p[0],+p[1]),max:Math.max(+p[0],+p[1])};
    return null;
  }
  function setRange(cur,ex,set){
    const ownMin=num(set?.targetRpeMin??ex?.targetRpeMin),ownMax=num(set?.targetRpeMax??ex?.targetRpeMax),base=currentRange(cur);
    return ownMin!=null&&ownMax!=null?{min:Math.min(ownMin,ownMax),max:Math.max(ownMin,ownMax)}:base;
  }
  function annotate(cur){
    const range=currentRange(cur);if(!range)return false;let changed=false;
    const rpeLabel=label(range.min,range.max),rirMin=Math.max(0,10-range.max),rirMax=Math.max(0,10-range.min),rirLabel=label(rirMin,rirMax);
    const put=(o,k,v)=>{if(o[k]===v)return;o[k]=v;changed=true};
    put(cur,'targetRpeMin',range.min);put(cur,'targetRpeMax',range.max);put(cur,'targetRpeLabel',rpeLabel);put(cur,'targetRirMin',rirMin);put(cur,'targetRirMax',rirMax);put(cur,'targetRirLabel',rirLabel);
    (cur.ex||[]).forEach(ex=>{const ownMin=num(ex?.targetRpeMin),ownMax=num(ex?.targetRpeMax),own=ownMin!=null&&ownMax!=null?{min:Math.min(ownMin,ownMax),max:Math.max(ownMin,ownMax)}:range,ownRpeLabel=label(own.min,own.max),ownRirMin=Math.max(0,10-own.max),ownRirMax=Math.max(0,10-own.min),ownRirLabel=label(ownRirMin,ownRirMax);put(ex,'targetRpeMin',own.min);put(ex,'targetRpeMax',own.max);put(ex,'targetRpeLabel',ownRpeLabel);put(ex,'targetRirMin',ownRirMin);put(ex,'targetRirMax',ownRirMax);put(ex,'targetRirLabel',ownRirLabel);(ex.set||[]).forEach(set=>{put(set,'targetRpeMin',own.min);put(set,'targetRpeMax',own.max);put(set,'targetRpeLabel',ownRpeLabel);put(set,'targetRirMin',ownRirMin);put(set,'targetRirMax',ownRirMax);put(set,'targetRirLabel',ownRirLabel)})});
    if(changed){cur.rpeRangeDisplayRevision=VERSION;saveState()}return changed;
  }
  function parseIndex(input){
    const ei=num(input?.dataset?.u174Ei),si=num(input?.dataset?.u174Si);if(ei!=null&&si!=null)return {ei,si};
    const raw=input?.getAttribute('onchange')||'',m=raw.match(/(?:editSet|unvrslEditEffort174)\((\d+)\s*,\s*(\d+)/);return m?{ei:+m[1],si:+m[2]}:null;
  }
  function patchDom(){
    if(!D)return;const cur=state()?.current,range=currentRange(cur);if(!cur||!range)return;annotate(cur);
    const rpeText=label(range.min,range.max);
    D.querySelectorAll('#start .workout-head .muted,#start .rule-line,#start .unvrsl-auto-load').forEach(el=>{
      const before=String(el.textContent||'');
      const after=before.replace(/((?:целевой|цель)\s+RPE\s*)\d+(?:[.,]\d+)?(?:\s*[–-]\s*\d+(?:[.,]\d+)?)?/ig,`$1${rpeText}`);
      if(after!==before)el.textContent=after;
    });
    D.querySelectorAll('#start .exercise').forEach(card=>{
      card.querySelectorAll('.chip').forEach(ch=>{const t=String(ch.textContent||'').trim();if(/^RPE\s+\d+(?:[.,]\d+)?(?:\s*[–-]\s*\d+(?:[.,]\d+)?)?$/i.test(t))ch.textContent='RPE '+rpeText});
      card.querySelectorAll('.setrow input').forEach(input=>{
        const idx=parseIndex(input);if(!idx)return;const set=cur.ex?.[idx.ei]?.set?.[idx.si],r=setRange(cur,cur.ex?.[idx.ei],set)||range;
        const kind=input.dataset.effort||input.dataset.u174Kind||(input.classList.contains('u174-rir-input')||input.classList.contains('rir-input')?'rir':((input.getAttribute('onchange')||'').includes("'rpe'")?'rpe':''));
        if(kind==='rpe'){const v=label(r.min,r.max);input.placeholder=v;input.setAttribute('aria-label',`Фактический RPE, цель ${v}`);input.title=`Целевой RPE ${v}`}
        if(kind==='rir'){const v=label(Math.max(0,10-r.max),Math.max(0,10-r.min));input.placeholder=v;input.setAttribute('aria-label',`Фактический RIR, цель ${v}`);input.title=`Целевой RIR ${v}`}
      });
    });
  }
  function boot(){
    if(!D||W.__unvrslRpeRangeDisplayV314)return;W.__unvrslRpeRangeDisplayV314=true;W.__unvrslRpeRangeDisplayV311=true;
    W.unvrslRpeRangeDisplayV314={currentRange,storedProgramRange,setRange,label,annotate,patchDom,version:VERSION};
    W.unvrslRpeRangeDisplayV311=W.unvrslRpeRangeDisplayV314;
    let rendering=false;
    const sync=()=>{const cur=state()?.current;if(cur&&annotate(cur)&&typeof W.startPage==='function'&&!rendering){rendering=true;try{W.startPage()}finally{rendering=false};return}patchDom()};
    if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',sync,{once:true});else sync();
    ['unvrsl:workout-rendered','unvrsl:workout-set-changed','unvrsl:training-engine-ready','unvrsl:readiness-ready'].forEach(ev=>W.addEventListener?.(ev,sync,{passive:true}));
  }
  return {label,currentRange,storedProgramRange,setRange,annotate,boot,version:VERSION};
});
