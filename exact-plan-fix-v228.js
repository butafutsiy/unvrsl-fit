'use strict';
(()=>{
  if(window.__unvrslExactPlanFixV230)return;
  window.__unvrslExactPlanFixV230=true;
  const W=window;
  const n=v=>{const x=Number(v);return Number.isFinite(x)?x:0};
  const baseName=name=>String(name||'').replace(/\s+—\s+(?:UNVRSL\s+\d+\/\d+|SLDR\s+\d+\/\d+|DS\s+DS?\d+|FST-7(?:\s+\d+\/\d+)?|тест.*|back-off.*|тяжёлый.*|лёгкие.*|субмакс.*|W\d+).*$/i,'').trim().toLowerCase();
  const exactName=name=>String(name||'').trim().toLowerCase();

  function groupEntries(entries){
    const out=[];let i=0;
    while(i<entries.length){
      const first=entries[i],idx=[i],base=baseName(first?.n),group=first?.g||null;let j=i+1;
      while(j<entries.length){
        const next=entries[j],sameGroup=group&&next?.g===group,sameBase=!group&&!next?.g&&baseName(next?.n)===base;
        if(!sameGroup&&!sameBase)break;idx.push(j);j++;
      }
      out.push(idx.map(k=>entries[k]));i=j;
    }
    return out;
  }

  function expandBuiltIn(cur){
    const routines=Array.isArray(W.UNVRSL_ROUTINES)?W.UNVRSL_ROUTINES:[];
    const r=routines.find(x=>Number(x?.w)===Number(cur?.w)&&String(x?.c||'')===String(cur?.c||''));
    if(!r)return null;
    const additions=(W.st?.planAdds||{})[`${r.w}-${r.c}`]||[];
    const entries=[...(r.e||[]),...(Array.isArray(additions)?additions:[])],out=[];
    for(const group of groupEntries(entries)){
      const names=group.map(x=>String(x?.n||'')).join(' '),isUnvrsl=/UNVRSL/i.test(names),compressed=isUnvrsl&&(group.length===2||group.length===3)&&Number(group[0]?.s||1)===1&&Number(group[1]?.s||1)===1;
      if(!compressed){out.push(...group);continue}
      for(let round=0;round<3;round++){out.push(group[0]);out.push(group[1])}
      if(group[2])out.push(group[2]);
    }
    return out;
  }

  function sourceSets(entry){
    if(!entry)return[];
    if(Array.isArray(entry.sets)&&entry.sets.length)return entry.sets.map(x=>({w:n(x?.w),r:n(x?.r)}));
    const count=Math.max(1,Number(entry.s)||1);
    return Array.from({length:count},()=>({w:n(entry.w),r:n(entry.r)}));
  }

  function findSourceForExercise(planEntries,curEx,index,used){
    const direct=planEntries[index];
    if(direct&&!used.has(index)&&(exactName(direct?.n)===exactName(curEx?.n)||baseName(direct?.n)===baseName(curEx?.n))){used.add(index);return direct}
    let found=planEntries.findIndex((p,i)=>!used.has(i)&&exactName(p?.n)===exactName(curEx?.n));
    if(found<0)found=planEntries.findIndex((p,i)=>!used.has(i)&&baseName(p?.n)===baseName(curEx?.n));
    if(found>=0){used.add(found);return planEntries[found]}
    return null;
  }

  function restoreFromOriginalRoutine(cur){
    const planEntries=expandBuiltIn(cur);
    if(!planEntries?.length)return 0;
    const used=new Set();let changed=0;
    (cur.ex||[]).forEach((ex,ei)=>{
      const src=findSourceForExercise(planEntries,ex,ei,used);if(!src)return;
      const sets=sourceSets(src);let hasPlan=false;
      (ex.set||[]).forEach((s,si)=>{
        if(!s||s.ok||s.manualOverride)return;
        const p=sets[si]||sets.at(-1);if(!p)return;
        if(p.w>0){
          s.programW=p.w;s.plannedW=p.w;s.baselineW=p.w;s.w=p.w;s.baselineSource='original_routine_plan';
          hasPlan=true;changed++;
        }
        if(p.r>0)s.r=p.r;
      });
      if(hasPlan){ex.weightDecision='program';ex.programWeightMode='prescribed'}
    });
    return changed;
  }

  function restoreFallback(cur){
    let changed=0;
    (cur.ex||[]).forEach(ex=>{
      let hasPlan=false;
      (ex.set||[]).forEach(s=>{
        if(!s||s.ok||s.manualOverride)return;
        const program=n(s.programW),launch=s.launchWeightCaptured206?n(s.launchW):0,plan=program>0?program:(launch>0?launch:(n(s.plannedW)||n(s.baselineW)||n(s.w)));
        if(plan>0){s.programW=program>0?program:plan;s.plannedW=plan;s.baselineW=plan;s.w=plan;s.baselineSource='program_fallback';hasPlan=true;changed++}
      });
      if(hasPlan){ex.weightDecision='program';ex.programWeightMode='prescribed'}
    });
    return changed;
  }

  function restore(cur){
    if(!cur)return false;
    let changed=0;
    const hasExplicitProgram=!!(cur.programId||cur.planId||cur.programName);
    if(!hasExplicitProgram)changed=restoreFromOriginalRoutine(cur);
    if(!changed)changed=restoreFallback(cur);
    cur.readiness={sleep:null,energy:null,soreness:null,stress:null,score:null,percent:0,factor:1,skipped:true,exactPlan:true,at:new Date().toISOString()};
    cur.readinessUsed=false;cur.readinessAdjusted=false;cur.trainingReadinessDone=true;cur.trainingReadinessPromptShown=true;cur.exactPlanWeights=true;cur.exactPlanSource=changed&&!hasExplicitProgram?'original_routine':'program';
    try{W.save?.();W.startPage?.()}catch(_){ }
    setTimeout(()=>{try{W.trainingEngine200Tick?.()}catch(_){ }},60);
    return changed>0;
  }

  function install(){
    const old=W.readinessUiStartV227;
    if(typeof old!=='function'||old.__exactPlanV230)return false;
    const wrapped=function(usePlan){
      if(!usePlan)return old.apply(this,arguments);
      const before=W.st?.current||null;
      old.apply(this,arguments);
      let tries=0;
      const timer=setInterval(()=>{
        tries++;
        const cur=W.st?.current,isNew=!!cur?.id&&cur!==before,ready=isNew&&cur.trainingReadinessDone&&(cur.trainingEngineRevision||tries>20);
        if(ready){clearInterval(timer);setTimeout(()=>{const ok=restore(cur);W.toast?.(ok?'Вес восстановлен из исходного плана':'План без автокоррекции')},80)}
        else if(tries>60)clearInterval(timer);
      },80);
    };
    wrapped.__exactPlanV230=true;wrapped.__exactPlanBase=old;W.readinessUiStartV227=wrapped;try{readinessUiStartV227=wrapped}catch(_){ }
    return true;
  }
  if(!install()){
    const t=setInterval(()=>{if(install())clearInterval(t)},100);
    setTimeout(()=>clearInterval(t),15000);
  }
})();
