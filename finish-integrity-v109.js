'use strict';
(()=>{
  if(window.__unvrslFinishIntegrityV109)return;
  window.__unvrslFinishIntegrityV109=true;

  const sameId=(a,b)=>a!=null&&b!=null&&String(a)===String(b);
  const sessions=()=>Array.isArray(window.st?.sessions)?window.st.sessions:[];

  function endedSession(id){
    if(id==null)return null;
    return sessions().find(s=>sameId(s?.id,id)&&s?.ended)||null;
  }

  function canonicalize(s){
    if(!s?.started||!s?.ended)return false;
    const duration=Math.max(0,Number(s.ended)-Number(s.started));
    let changed=false;
    if(Number(s.durationMs)!==duration){s.durationMs=duration;changed=true}
    if(Number(s.finalDurationMs)!==duration){s.finalDurationMs=duration;changed=true}
    if(s.advancedMetrics&&Number(s.advancedMetrics.duration)!==duration){s.advancedMetrics={...s.advancedMetrics,duration};changed=true}
    return changed;
  }

  function saveQuietly(){try{if(typeof save==='function')save()}catch(e){}}

  function clearCompletedCurrent(){
    const cur=window.st?.current;
    if(!cur?.id)return false;
    const finished=endedSession(cur.id);
    if(!finished)return false;
    canonicalize(finished);
    window.st.current=null;
    try{if(typeof stopTimer==='function')stopTimer()}catch(e){}
    saveQuietly();
    return true;
  }

  function finalizeAfterFinish(id){
    const finished=endedSession(id);
    if(!finished)return false;
    const changed=canonicalize(finished);
    if(window.st?.current&&sameId(window.st.current.id,id))window.st.current=null;
    try{if(typeof stopTimer==='function')stopTimer()}catch(e){}
    if(changed||!window.st?.current)saveQuietly();
    return true;
  }

  function patchFinish(){
    const base=window.finish||(()=>{try{return finish}catch(e){return null}})();
    if(typeof base!=='function'||base.__finishIntegrityV109)return false;
    const wrapped=function(){
      const id=window.st?.current?.id??null;
      const result=base.apply(this,arguments);
      if(id!=null){
        queueMicrotask(()=>finalizeAfterFinish(id));
        setTimeout(()=>finalizeAfterFinish(id),80);
        setTimeout(()=>finalizeAfterFinish(id),700);
      }
      return result;
    };
    wrapped.__finishIntegrityV109=true;
    window.finish=wrapped;
    try{finish=wrapped}catch(e){}
    return true;
  }

  function patchSummaryDuration(){
    const base=window.summary;
    if(typeof base!=='function'||base.__canonicalDurationV109)return false;
    const wrapped=function(s){
      if(s?.ended)canonicalize(s);
      return base.apply(this,arguments);
    };
    wrapped.__canonicalDurationV109=true;
    window.summary=wrapped;
    try{summary=wrapped}catch(e){}
    return true;
  }

  function installStartButton(){
    if(window.__unvrslStartButtonPickerV109)return;
    window.__unvrslStartButtonPickerV109=true;
    document.addEventListener('click',ev=>{
      const btn=ev.target?.closest?.('.nav button[data-p="start"]');
      if(!btn||window.st?.current)return;
      ev.preventDefault();
      ev.stopPropagation();
      ev.stopImmediatePropagation();
      if(typeof window.openStartProgramPicker==='function')window.openStartProgramPicker();
      else if(typeof window.quick==='function')window.quick();
    },true);
  }

  // A stale local/cloud backup must not revive a workout that already exists in completed history.
  clearCompletedCurrent();
  installStartButton();
  patchFinish();
  patchSummaryDuration();

  let ticks=0;
  const id=setInterval(()=>{
    patchFinish();
    patchSummaryDuration();
    clearCompletedCurrent();
    if(++ticks>240)clearInterval(id);
  },500);

  document.addEventListener('visibilitychange',()=>{if(!document.hidden)clearCompletedCurrent()});
  window.addEventListener('focus',clearCompletedCurrent);
})();
