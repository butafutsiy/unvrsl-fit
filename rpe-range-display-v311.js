'use strict';
(function(root,factory){
  const api=factory(root||{});
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root&&root.document)api.boot();
})(typeof window!=='undefined'?window:globalThis,function(W){
  const D=W.document,VERSION=311;
  const num=v=>{if(v===''||v==null)return null;const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:null};
  const fmt=v=>Number(v).toFixed(1).replace('.0','').replace('.',',');
  const state=()=>{try{if(typeof st!=='undefined'){W.st=st;return st}}catch(_){ }return W.st||null};
  const saveState=()=>{try{if(typeof save==='function')save();else W.save?.()}catch(_){ }};
  const label=(a,b)=>{const lo=Math.min(Number(a),Number(b)),hi=Math.max(Number(a),Number(b));return Math.abs(lo-hi)<.001?fmt(lo):`${fmt(lo)}–${fmt(hi)}`};
  function currentRange(cur){
    const lo=num(cur?.programWeekRpeMin),hi=num(cur?.programWeekRpeMax);
    if(lo!=null&&hi!=null)return {min:Math.min(lo,hi),max:Math.max(lo,hi)};
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
    (cur.ex||[]).forEach(ex=>{if(ex?.mode==='cardio')return;(ex.set||[]).forEach(set=>{put(set,'targetRpeMin',range.min);put(set,'targetRpeMax',range.max);put(set,'targetRpeLabel',rpeLabel);put(set,'targetRirMin',rirMin);put(set,'targetRirMax',rirMax);put(set,'targetRirLabel',rirLabel)})});
    if(changed){cur.rpeRangeDisplayRevision=VERSION;saveState()}return changed;
  }
  function parseIndex(input){
    const ei=num(input?.dataset?.u174Ei),si=num(input?.dataset?.u174Si);if(ei!=null&&si!=null)return {ei,si};
    const raw=input?.getAttribute('onchange')||'',m=raw.match(/(?:editSet|unvrslEditEffort174)\((\d+)\s*,\s*(\d+)/);return m?{ei:+m[1],si:+m[2]}:null;
  }
  function patchDom(){
    if(!D)return;const cur=state()?.current,range=currentRange(cur);if(!cur||!range)return;annotate(cur);
    D.querySelectorAll('#start .exercise').forEach(card=>{
      card.querySelectorAll('.chip').forEach(ch=>{const t=String(ch.textContent||'').trim();if(/^RPE\s+\d+(?:[.,]\d+)?$/i.test(t))ch.textContent='RPE '+label(range.min,range.max)});
      card.querySelectorAll('.setrow input').forEach(input=>{
        const idx=parseIndex(input);if(!idx)return;const set=cur.ex?.[idx.ei]?.set?.[idx.si],r=setRange(cur,cur.ex?.[idx.ei],set)||range;
        const kind=input.dataset.u174Kind||(input.classList.contains('u174-rir-input')?'rir':((input.getAttribute('onchange')||'').includes("'rpe'")?'rpe':''));
        if(kind==='rpe'&&!input.value)input.placeholder=label(r.min,r.max);
        if(kind==='rir'&&!input.value)input.placeholder=label(Math.max(0,10-r.max),Math.max(0,10-r.min));
      });
    });
  }
  function boot(){
    if(!D||W.__unvrslRpeRangeDisplayV311)return;W.__unvrslRpeRangeDisplayV311=true;
    W.unvrslRpeRangeDisplayV311={currentRange,setRange,label,annotate,patchDom,version:VERSION};
    const start=()=>{patchDom();setTimeout(patchDom,120)};
    if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',start,{once:true});else start();
    let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;patchDom()})}).observe(D.documentElement,{childList:true,subtree:true});
    D.addEventListener('click',e=>{if(e.target?.closest?.('[data-p="start"],.routine,.today-card,.plus'))setTimeout(patchDom,80)},true);
  }
  return {label,currentRange,setRange,annotate,boot,version:VERSION};
});
