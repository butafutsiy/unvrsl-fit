'use strict';
(function(root,factory){
  const api=factory(root||{});
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root&&root.document)api.boot();
})(typeof window!=='undefined'?window:globalThis,function(W){
  const D=W.document,VERSION=314;
  const num=v=>{if(v===''||v==null)return null;const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:null};
  const fmt=v=>String(Math.round(Number(v)*100)/100).replace('.',',');
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
    const snapshot=cur?.weeklyLoadProfile?.rpe;if(Array.isArray(snapshot))return {min:snapshot[0],max:snapshot[1]};
    const stored=storedProgramRange(cur);if(stored)return stored;
    const p=W.UNVRSL_BUILTIN_LOAD_PROFILE?.[Number(cur?.w)]?.rpe;
    if(Array.isArray(p)&&num(p[0])!=null&&num(p[1])!=null)return {min:Math.min(+p[0],+p[1]),max:Math.max(+p[0],+p[1])};
    return null;
  }
  function setRange(cur,ex,set){
    const base=currentRange(cur);
    if(W.WorkoutDomain?.effortTarget&&ex&&set){
      const r=W.WorkoutDomain.effortTarget(ex,set,{...cur,programWeekRpeMin:cur?.programWeekRpeMin??base?.min,programWeekRpeMax:cur?.programWeekRpeMax??base?.max});
      return {min:r.lo,max:r.hi};
    }
    const ownMin=num(set?.targetRpeMin??ex?.targetRpeMin),ownMax=num(set?.targetRpeMax??ex?.targetRpeMax);
    return ownMin!=null&&ownMax!=null?{min:Math.min(ownMin,ownMax),max:Math.max(ownMin,ownMax)}:base;
  }
  function annotate(cur){
    const range=currentRange(cur);if(!range||cur?.ended)return false;let changed=false;
    const put=(o,k,v)=>{if(o[k]===v)return;o[k]=v;changed=true};
    const store=(o,r)=>{put(o,'targetRpeMin',r.min);put(o,'targetRpeMax',r.max);put(o,'targetRpeLabel',label(r.min,r.max));put(o,'targetRirMin',Math.max(0,10-r.max));put(o,'targetRirMax',Math.max(0,10-r.min));put(o,'targetRirLabel',label(Math.max(0,10-r.max),Math.max(0,10-r.min)))};
    store(cur,range);
    for(const ex of cur.ex||[]){
      if(ex.kind==='cardio'||ex.mode==='cardio'||ex.mode==='timer'||ex.loadType==='time')continue;
      const hadOwn=num(ex.targetRpeMin)!=null||num(ex.targetRpeMax)!=null;
      if(!hadOwn&&!ex.effortTargetSource&&ex.parameterOverrides?.effort?.mode!=='manual'&&ex.effortSourceMode!=='manual'){
        put(ex,'effortTargetSource','week_inherited');put(ex,'effortBaseMin',range.min);put(ex,'effortBaseMax',range.max);
      }
      for(const set of ex.set||[]){
        if(set.ok||set.skipped)continue;
        const own=num(set.targetRpeMin)!=null||num(set.targetRpeMax)!=null;
        if(!own&&!set.effortTargetSource){
          put(set,'effortTargetSource',ex.effortTargetSource==='week_inherited'?'week_inherited':'exercise_override');
          if(ex.effortTargetSource==='week_inherited'){put(set,'effortBaseMin',ex.effortBaseMin??range.min);put(set,'effortBaseMax',ex.effortBaseMax??range.max);}
        }
        store(set,setRange(cur,ex,set)||range);
      }
      const pending=(ex.set||[]).find(s=>!s.ok&&!s.skipped);
      const r=pending?setRange(cur,ex,pending):{min:num(ex.targetRpeMin)??range.min,max:num(ex.targetRpeMax)??range.max};
      store(ex,r||range);
    }
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
      const ranges=[...card.querySelectorAll('.setrow input')].map(input=>{const idx=parseIndex(input);return idx?setRange(cur,cur.ex?.[idx.ei],cur.ex?.[idx.ei]?.set?.[idx.si]):null}).filter(Boolean);
      if(ranges.length){const cardLabel=label(Math.min(...ranges.map(r=>r.min)),Math.max(...ranges.map(r=>r.max)));card.querySelectorAll('.chip').forEach(ch=>{const t=String(ch.textContent||'').trim();if(/^RPE\s+\d+(?:[.,]\d+)?(?:\s*[–-]\s*\d+(?:[.,]\d+)?)?$/i.test(t))ch.textContent='RPE '+cardLabel});}
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
