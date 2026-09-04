'use strict';
(()=>{
  const W=window,D=document,REV=279;
  if(W.__unvrslWorkoutWeightIntegrityV279)return;
  W.__unvrslWorkoutWeightIntegrityV279=true;

  const N=v=>{if(v===''||v==null)return null;const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:null};
  const base=n=>String(n||'').replace(/\s+—\s+.*$/,'').trim().toLowerCase();
  const state=()=>{try{if(typeof st!=='undefined'){W.st=st;return st}}catch(_){ }return W.st||null};
  const saveState=()=>{try{if(typeof save==='function')save();else W.save?.()}catch(_){ }};

  function ownerRoutine(cur){
    if(!cur||cur.programId||cur.planId||cur.programName)return null;
    const w=N(cur.w);if(!(w>=1&&w<=8)||!cur.c)return null;
    return (W.UNVRSL_ROUTINES||[]).find(r=>Number(r?.w)===w&&String(r?.c||'')===String(cur.c||''))||null
  }

  function sourceWeights(r,ex){
    if(!r||!ex)return[];
    const exact=(r.e||[]).filter(x=>String(x?.n||'').trim()===String(ex?.n||'').trim());
    const list=exact.length?exact:(r.e||[]).filter(x=>base(x?.n)===base(ex?.n));
    const out=[];
    for(const e of list){
      const count=Math.max(1,Number(e?.s)||1),w=N(e?.w);
      for(let i=0;i<count;i++)out.push(w)
    }
    return out
  }

  function repairState(){
    const s=state(),cur=s?.current,r=ownerRoutine(cur);if(!cur||!r)return false;
    let changed=false;
    (cur.ex||[]).forEach(ex=>{
      if(ex?.mode==='cardio'||ex?.weightDecision==='recommendation')return;
      const expected=sourceWeights(r,ex);if(!expected.length)return;
      (ex.set||[]).forEach((set,si)=>{
        if(!set||set.ok||set.manualOverride)return;
        const p=N(expected[si]??expected.at(-1));if(!(p>0))return;
        const w=N(set.w),bad=w>0&&(w>p*1.7||w<p*.58);
        const pw=N(set.programW),badProgram=pw>0&&(pw>p*1.7||pw<p*.58);
        if(!bad&&!badProgram)return;
        if(badProgram||!(pw>0))set.programW=p;
        set.plannedW=p;set.baselineW=p;set.baselineSource='weight_integrity_v279';set.w=p;
        changed=true
      })
    });
    if(changed){cur.weightIntegrityRevision=REV;saveState()}
    return changed
  }

  function parseWeightIndex(input){
    const raw=input?.getAttribute('onchange')||'';
    const m=raw.match(/editSet\((\d+)\s*,\s*(\d+)\s*,\s*['\"]w['\"]/);
    return m?{ei:Number(m[1]),si:Number(m[2])}:null
  }

  function syncDom(){
    const cur=state()?.current;if(!cur)return;
    D.querySelectorAll('#start .setrow').forEach(row=>{
      const input=[...row.querySelectorAll('input')].find(i=>parseWeightIndex(i));
      if(!input||D.activeElement===input)return;
      const idx=parseWeightIndex(input),v=N(cur.ex?.[idx.ei]?.set?.[idx.si]?.w);if(v==null)return;
      if(String(input.value)!==String(v))nativeSet(input,v)
    })
  }

  const desc=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value');
  const nativeSet=(el,v)=>desc?.set?desc.set.call(el,String(v)):el.setAttribute('value',String(v));
  if(desc?.get&&desc?.set&&!HTMLInputElement.prototype.__unvrslWeightGuardV279){
    Object.defineProperty(HTMLInputElement.prototype,'value',{
      configurable:true,enumerable:desc.enumerable,get:desc.get,
      set:function(v){
        try{
          if(D.activeElement!==this&&this.closest?.('#start .setrow')){
            const idx=parseWeightIndex(this),cur=state()?.current,x=idx?cur?.ex?.[idx.ei]?.set?.[idx.si]:null,sv=N(x?.w);
            if(sv!=null)v=String(sv)
          }
        }catch(_){ }
        return desc.set.call(this,v)
      }
    });
    HTMLInputElement.prototype.__unvrslWeightGuardV279=true
  }

  function installStartGuard(){
    const cur=W.startPage; if(typeof cur!=='function'||cur.__weightIntegrityV279)return false;
    const wrapped=function(){repairState();const out=cur.apply(this,arguments);requestAnimationFrame(syncDom);return out};
    wrapped.__weightIntegrityV279=true;wrapped.__weightIntegrityBase=cur;W.startPage=wrapped;try{startPage=wrapped}catch(_){ }
    return true
  }

  function boot(){repairState();installStartGuard();syncDom()}
  boot();[80,250,700,1500,3000].forEach(ms=>setTimeout(boot,ms));
  ['unvrsl:training-engine-ready','unvrsl:modules-ready','unvrsl:app-ready'].forEach(ev=>W.addEventListener?.(ev,boot,{passive:true}));
  D.addEventListener?.('visibilitychange',()=>{if(!D.hidden)boot()},{passive:true});
  setInterval(()=>{if(D.getElementById('start')?.classList.contains('active'))syncDom()},900);
})();
