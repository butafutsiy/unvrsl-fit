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
    if(!s||!Array.isArray(s.ex)||typeof suggestionFor!=='function')return 0;
    let changed=0;
    s.ex.forEach(e=>{
      if(rpeAutoSpecial(e)||!Array.isArray(e.set)||!e.set.length)return;
      const empty=e.set.filter(x=>x&&x.mode!=='cardio'&&(!Number(x.w)||Number(x.w)===0));
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
    const wrapped=function(){
      const r=base.apply(this,arguments);
      setTimeout(()=>rpeAutoRefresh(rpeAutoFillCurrent()),0);
      return r;
    };
    wrapped.__rpeAutoWrapped=true;
    window[name]=wrapped;
    try{if(name==='begin')begin=wrapped;if(name==='beginProgramDay')beginProgramDay=wrapped;if(name==='beginRemotePlan')beginRemotePlan=wrapped}catch(e){}
  }

  wrapStart('begin');
  wrapStart('beginProgramDay');
  wrapStart('beginRemotePlan');

  // Облачные модули могут объявить/обернуть старт позже — подхватываем их без дублей.
  let tries=0;
  const timer=setInterval(()=>{
    wrapStart('beginProgramDay');
    wrapStart('beginRemotePlan');
    if(++tries>20)clearInterval(timer);
  },700);

  // Показываем, откуда взялся автоматически рассчитанный вес.
  const baseCard=window.exerciseGroupCard;
  if(typeof baseCard==='function'&&!baseCard.__rpeAutoUi){
    const wrapped=function(s,group){
      let html=baseCard.apply(this,arguments);
      const info=group?.entries?.find(e=>e?.rpeAuto)?.rpeAuto;
      if(info){
        const chip=`<span class="chip green">Авто по RPE · ${info.weight} кг</span>`;
        html=html.replace('<div class="chips compact">','<div class="chips compact">'+chip);
      }
      return html;
    };
    wrapped.__rpeAutoUi=true;
    window.exerciseGroupCard=wrapped;
    try{exerciseGroupCard=wrapped}catch(e){}
  }
})();
