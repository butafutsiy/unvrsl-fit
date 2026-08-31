'use strict';
(()=>{
  if(window.__unvrslRpeAutoProgression)return;
  window.__unvrslRpeAutoProgression=true;

  function rpeAutoSpecial(e){
    const n=String(e?.n||'');
    return e?.mode==='cardio'||/\s—\s(?:UNVRSL|SLDR|DS|FST-7|тест|back-off)/i.test(n);
  }

  function rpeAutoFillCurrent(){
    const s=window.st?.current;
    if(!s||s.adaptiveDecision!=='previous'||!Array.isArray(s.ex)||typeof suggestionFor!=='function')return 0;
    let changed=0;
    s.ex.forEach(e=>{
      if(rpeAutoSpecial(e)||!Array.isArray(e.set)||!e.set.length)return;
      const empty=e.set.filter(x=>x&&!x.manualOverride&&x.mode!=='cardio'&&(!Number(x.w)||Number(x.w)===0));
      if(!empty.length)return;
      const base=typeof baseExerciseName==='function'?baseExerciseName(e.n):String(e.n||'');
      const target=Number(e.target||s.target||8);
      let sug=null;
      try{sug=suggestionFor(base,e.sourceId||null,target)}catch(err){sug=null}
      if(!sug||!Number(sug.weight)||sug.weight<=0)return;
      empty.forEach(x=>{if(Number(x.r)>0)x.w=sug.weight});
      if(empty.some(x=>Number(x.w)>0)){
        e.rpeAuto={weight:sug.weight,avg:sug.avg,target,from:sug.from,delta:sug.delta};
        changed++;
      }
    });
    if(changed&&typeof save==='function')save();
    return changed;
  }

  function rpeAutoRefresh(n){
    if(!n)return;
    try{if(typeof startPage==='function')startPage()}catch(e){}
    try{if(typeof toast==='function')toast(`Вес рассчитан по прошлому RPE · ${n} упр.`)}catch(e){}
  }

  function wrapStart(name){
    const base=window[name];
    if(typeof base!=='function'||base.__rpeAutoWrapped)return;
    const wrapped=function(){const r=base.apply(this,arguments);setTimeout(()=>rpeAutoRefresh(rpeAutoFillCurrent()),0);return r};
    wrapped.__rpeAutoWrapped=true;
    window[name]=wrapped;
    try{if(name==='begin')begin=wrapped;if(name==='beginProgramDay')beginProgramDay=wrapped;if(name==='beginRemotePlan')beginRemotePlan=wrapped}catch(e){}
  }

  wrapStart('begin');wrapStart('beginProgramDay');wrapStart('beginRemotePlan');
  let tries=0;
  const timer=setInterval(()=>{wrapStart('beginProgramDay');wrapStart('beginRemotePlan');if(++tries>20)clearInterval(timer)},700);

  const baseCard=window.exerciseGroupCard;
  if(typeof baseCard==='function'&&!baseCard.__rpeAutoUi){
    const wrapped=function(s,group){
      let html=baseCard.apply(this,arguments);
      const info=group?.entries?.find(e=>e?.rpeAuto)?.rpeAuto;
      if(info){const chip=`<span class="chip green">По прошлому RPE · ${info.weight} кг</span>`;html=html.replace('<div class="chips compact">','<div class="chips compact">'+chip)}
      return html;
    };
    wrapped.__rpeAutoUi=true;window.exerciseGroupCard=wrapped;try{exerciseGroupCard=wrapped}catch(e){}
  }
})();

// Correct UNVRSL structure: 3 rounds of heavy + 30s + light, then 2 intermediate top-off sets.
(()=>{
  // The current program editor and training engine own UNVRSL expansion.
  // Keep this migration only as a fallback for older standalone builds.
  if(window.__unvrslProgramExerciseRulesV162)return;
  if(window.__unvrslRoundWaveFix)return;window.__unvrslRoundWaveFix=true;

  const clone=x=>JSON.parse(JSON.stringify(x));
  const isUnvrsl=n=>/UNVRSL/i.test(String(n||''));
  const baseName=n=>String(n||'').replace(/\s+—\s+UNVRSL.*$/i,'').trim();
  const clampTopReps=r=>Math.max(3,Math.min(5,Number(r)||5));

  function patternFromRoutine(r,name,groupId){
    if(!r||!Array.isArray(r.e))return null;
    const target=baseName(name).toLowerCase();
    let list=r.e.filter(x=>isUnvrsl(x?.n)&&baseName(x.n).toLowerCase()===target);
    if(groupId){const same=list.filter(x=>x?.g===groupId);if(same.length)list=same}
    if(list.length<2)return null;
    const heavy=list[0],light=list[1],finish=list[2]||light;
    let fullRest=0;
    try{const idx=r.e.indexOf(finish);if(typeof rest==='function'&&idx>=0)fullRest=Number(rest(r,finish,idx)||0)}catch(e){}
    return{heavy:{w:Number(heavy.w||0),r:Number(heavy.r||0)},light:{w:Number(light.w||0),r:Number(light.r||0)},finish:{w:Number(finish.w||light.w||0),r:clampTopReps(finish.r)},fullRest:fullRest||120}
  }

  function routineFor(week,code){try{return (ROUTINES||[]).find(r=>Number(r.w)===Number(week)&&String(r.c)===String(code))||null}catch(e){return null}}
  function formatScheme(p){return `3 круга (${p.heavy.w}×${p.heavy.r} + 30с + ${p.light.w}×${p.light.r}), затем 2×3–5 · ${p.finish.w} кг`}

  function makeSessionItem(src,base,preset,index,restSec,note){
    const e=clone(src||{});
    e.n=`${base} — UNVRSL ${index}/8`;e.s=1;e.rest=Number(restSec||0);e.d=note;
    e.unvrslRoundWave='3rounds+2topoff';e.unvrslRoundIndex=index;
    e.set=[{n:1,w:Number(preset.w||0),r:Number(preset.r||0),rpe:'',ok:false}];
    return e
  }

  function correctSession(s){
    if(!s||!Array.isArray(s.ex))return false;
    const r=routineFor(s.w,s.c);if(!r)return false;
    const out=[];let changed=false;
    for(let i=0;i<s.ex.length;){
      const e=s.ex[i];
      if(!isUnvrsl(e?.n)){out.push(e);i++;continue}
      const group=[];let j=i;
      while(j<s.ex.length&&isUnvrsl(s.ex[j]?.n)&&((e?.g&&s.ex[j]?.g===e.g)||(!e?.g&&baseName(s.ex[j].n)===baseName(e.n)))){group.push(s.ex[j]);j++}
      if(group.length===8&&group.every(x=>x?.unvrslRoundWave==='3rounds+2topoff')){out.push(...group);i=j;continue}
      if(group.some(x=>x?.manualOverride||(x.set||[]).some(y=>y.ok||y.manualOverride))){out.push(...group);i=j;continue}
      const p=patternFromRoutine(r,e.n,e.g);if(!p){out.push(...group);i=j;continue}
      const b=baseName(e.n),full=p.fullRest||Math.max(0,...group.map(x=>Number(x.rest)||0))||120;
      const seq=[
        [p.heavy,30,'Круг 1/3 · тяжёлый подход. Далее 30 сек.'],
        [p.light,full,'Круг 1/3 · облегчённый подход. Далее полный отдых.'],
        [p.heavy,30,'Круг 2/3 · тяжёлый подход. Далее 30 сек.'],
        [p.light,full,'Круг 2/3 · облегчённый подход. Далее полный отдых.'],
        [p.heavy,30,'Круг 3/3 · тяжёлый подход. Далее 30 сек.'],
        [p.light,full,'Круг 3/3 · облегчённый подход. Далее полный отдых.'],
        [p.finish,full,'Финал 1/2 · 3–5 повторов.'],
        [p.finish,full,'Финал 2/2 · 3–5 повторов.']
      ];
      seq.forEach((x,k)=>out.push(makeSessionItem(group[Math.min(k,group.length-1)]||e,b,x[0],k+1,x[1],`UNVRSL · ${x[2]}`)));
      changed=true;i=j;
    }
    if(changed)s.ex=out;
    return changed;
  }

  function correctProgramExercise(e,p){
    if(!e||e.method!=='UNVRSL'||!p)return false;
    const old=Array.isArray(e.sets)?e.sets:[],tpl=i=>clone(old[i]||old[0]||{}),full=p.fullRest||Number(e.rest)||120;
    const specs=[[p.heavy,30],[p.light,full],[p.heavy,30],[p.light,full],[p.heavy,30],[p.light,full],[p.finish,full],[p.finish,full]];
    e.sets=specs.map((sp,i)=>({...tpl(i),label:`${i+1}/8`,w:sp[0].w,r:sp[0].r,rest:sp[1]}));
    e.waveScheme='3rounds+2topoff';
    const clean=String(e.note||'').replace(/\s*·?\s*UNVRSL:.*$/i,'').trim();
    e.note=[clean,`UNVRSL: ${formatScheme(p)}.`].filter(Boolean).join(' · ');e.displayPrescription=formatScheme(p);
    return true;
  }

  function codeFromDay(d){const raw=String(d?.c||d?.code||d?.name||'').trim();return raw.split('·')[0].trim().split(/\s+/)[0]}
  function migratePrograms(){
    let changed=false;const all=[...(st?.programs||[]),...(st?.programTemplates||[])];
    all.forEach(p=>(p.weeks||[]).forEach((w,wi)=>(w.days||[]).forEach(d=>{const r=routineFor(w?.n||wi+1,codeFromDay(d));if(!r)return;(d.ex||[]).forEach(e=>{if(e?.method==='UNVRSL'){const pat=patternFromRoutine(r,e.n);if(pat&&correctProgramExercise(e,pat))changed=true}})})));
    if(changed)try{save()}catch(e){};return changed;
  }

  function patchSession(){
    const current=window.session||(()=>{try{return session}catch(e){return null}})();
    if(typeof current!=='function'||current.__unvrslRoundWaveFix)return false;
    const wrapped=function(){const s=current.apply(this,arguments);correctSession(s);return s};
    wrapped.__unvrslRoundWaveFix=true;window.session=wrapped;try{session=wrapped}catch(e){};return true;
  }

  function patchBuiltInCopy(){
    const current=window.builtInGroupToProgramExercise||(()=>{try{return builtInGroupToProgramExercise}catch(e){return null}})();
    if(typeof current!=='function'||current.__unvrslRoundWaveFix)return false;
    const wrapped=function(r,g){
      const e=current.apply(this,arguments);
      if(e?.method==='UNVRSL'){
        let p=null;
        if(r&&g?.entries?.length){const heavy=g.entries[0],light=g.entries[1],finish=g.entries[2]||light;let full=0;try{const idx=(r.e||[]).indexOf(finish);if(typeof rest==='function'&&idx>=0)full=Number(rest(r,finish,idx)||0)}catch(err){}p={heavy:{w:Number(heavy?.w||0),r:Number(heavy?.r||0)},light:{w:Number(light?.w||0),r:Number(light?.r||0)},finish:{w:Number(finish?.w||light?.w||0),r:clampTopReps(finish?.r)},fullRest:full||120}}
        if(!p&&r)p=patternFromRoutine(r,e.n,g?.g||g?.entries?.[0]?.g);if(p)correctProgramExercise(e,p);
      }
      return e;
    };
    wrapped.__unvrslRoundWaveFix=true;window.builtInGroupToProgramExercise=wrapped;try{builtInGroupToProgramExercise=wrapped}catch(e){};return true;
  }

  function correctCurrent(){const cur=st?.current;if(!cur)return false;const changed=correctSession(cur);if(changed){try{save()}catch(e){};try{startPage()}catch(e){}}return changed}
  function wrapStartFix(name){
    const current=window[name];if(typeof current!=='function'||current.__unvrslRoundStartFix)return false;
    const wrapped=function(){const r=current.apply(this,arguments);setTimeout(()=>{migratePrograms();correctCurrent()},0);return r};
    wrapped.__unvrslRoundStartFix=true;window[name]=wrapped;try{if(name==='begin')begin=wrapped;if(name==='beginProgramDay')beginProgramDay=wrapped;if(name==='beginRemotePlan')beginRemotePlan=wrapped}catch(e){};return true;
  }

  migratePrograms();correctCurrent();patchSession();patchBuiltInCopy();wrapStartFix('begin');wrapStartFix('beginProgramDay');wrapStartFix('beginRemotePlan');
  let tries=0;const timer=setInterval(()=>{patchSession();patchBuiltInCopy();wrapStartFix('beginProgramDay');wrapStartFix('beginRemotePlan');correctCurrent();if(++tries>45)clearInterval(timer)},300);
})();
