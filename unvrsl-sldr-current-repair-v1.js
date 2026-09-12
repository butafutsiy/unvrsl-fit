'use strict';
(()=>{
  const W=window,KEY='unvrsl-sldr-current-repair-v1';if(W.__unvrslSldrCurrentRepairV1)return;W.__unvrslSldrCurrentRepairV1=true;
  const state=()=>{try{return typeof st!=='undefined'?st:W.st}catch(_){return W.st}};
  const saveState=()=>{try{if(typeof save==='function')save();else W.save?.()}catch(_){}};
  const N=v=>{const n=Number(v);return Number.isFinite(n)?n:0};
  const target=p=>p&&(String(p.id||'')==='prog-unvrsl-sldr'||String(p.name||'').trim()==='UNVRSL SLDR');
  function flat(block){
    const sets=block?.sets||[],m=String(block?.method||'STANDARD');
    if(m==='SLDR'&&sets?.[0]?.mini)return sets.flatMap(r=>r.mini.map(x=>({...x})));
    if(m==='UNVRSL'&&sets?.[0]?.heavy){const a=[];sets.forEach(r=>{a.push({...r.heavy});a.push({...r.light})});const f=sets[0];a.push({w:f.finishWeight||0,r:f.finishReps||6},{w:f.finishWeight||0,r:f.finishReps||6});return a}
    return sets.map(x=>({...x}))
  }
  function repair(){
    const s=state(),cur=s?.current;if(!cur||cur.ended||!/UNVRSL\s+SLDR/i.test(String(cur.programName||cur.name||'')))return false;
    if((cur.ex||[]).some(ex=>(ex.set||[]).some(set=>set?.ok)))return false;
    const p=(s.programs||[]).find(target);if(!p)return false;
    const wi=Math.max(0,Math.min(7,(Number(cur.programWeekNumber||cur.w)||1)-1));
    const week=p.weeks?.[wi];if(!week)return false;
    const day=(week.days||[]).find(d=>String(d.name||'')===String(cur.c||''))||(week.days||[]).find(d=>String(cur.c||'').startsWith(String(d.name||'').split(' · ')[0]));if(!day)return false;
    let cursor=0;
    (day.ex||[]).forEach(block=>{
      const mode=block.weightMode==='auto'?'autoweight':'prescribed',m=String(block.method||'STANDARD'),src=flat(block);
      if(m==='STANDARD'||m==='FST-7'){
        const ex=cur.ex?.[cursor++];if(!ex)return;ex.programWeightMode=mode;
        (ex.set||[]).forEach((set,i)=>{const plan=src[i]||src[0]||{},w=N(plan.w);delete set.recommendedW;delete set.plannedW;delete set.baselineW;delete set.baselineSource;set.programW=mode==='prescribed'?w:0;set.w=mode==='prescribed'?w:0;if(plan.targetRepMin!=null)set.targetRepMin=plan.targetRepMin;if(plan.targetRepMax!=null)set.targetRepMax=plan.targetRepMax;if(block.rpeMin!=null)set.targetRpeMin=block.rpeMin;if(block.rpeMax!=null)set.targetRpeMax=block.rpeMax;if(block.rirMin!=null)set.targetRirMin=block.rirMin;if(block.rirMax!=null)set.targetRirMax=block.rirMax})
      }else{
        src.forEach(plan=>{const ex=cur.ex?.[cursor++];if(!ex)return;ex.programWeightMode=mode;const set=ex.set?.[0];if(!set)return;const w=N(plan.w);delete set.recommendedW;delete set.plannedW;delete set.baselineW;delete set.baselineSource;set.programW=mode==='prescribed'?w:0;set.w=mode==='prescribed'?w:0;if(plan.targetRepMin!=null)set.targetRepMin=plan.targetRepMin;if(plan.targetRepMax!=null)set.targetRepMax=plan.targetRepMax;if(block.rpeMin!=null)set.targetRpeMin=block.rpeMin;if(block.rpeMax!=null)set.targetRpeMax=block.rpeMax;if(block.rirMin!=null)set.targetRirMin=block.rirMin;if(block.rirMax!=null)set.targetRirMax=block.rirMax})
      }
    });
    cur.programWeekRpeMin=week.rpeMin;cur.programWeekRpeMax=week.rpeMax;cur.targetRpeMin=week.rpeMin;cur.targetRpeMax=week.rpeMax;cur.targetRirMin=week.rirMin;cur.targetRirMax=week.rirMax;cur.programWeekIntensityMin=week.intensityMin;cur.programWeekIntensityMax=week.intensityMax;cur.programWeekUseIntensity=true;cur[KEY]=true;saveState();
    try{W.startPage?.()}catch(_){ }setTimeout(()=>{try{W.trainingLoadModel292?.run?.(true)}catch(_){ }},120);return true
  }
  let n=0,t=setInterval(()=>{n++;if(repair()||n>30)clearInterval(t)},250);['unvrsl:app-ready','unvrsl:training-engine-ready'].forEach(e=>W.addEventListener?.(e,repair,{passive:true}));
})();