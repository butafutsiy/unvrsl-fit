'use strict';
(()=>{
  const W=window,D=document;
  if(W.__unvrslWorkoutCompletionV384)return;
  W.__unvrslWorkoutCompletionV384=true;

  const state=()=>{try{return typeof st!=='undefined'?st:W.st}catch(_){return W.st}};
  const completedCount=session=>(session?.ex||[]).reduce((sum,exercise)=>sum+(exercise?.set||[]).filter(set=>set?.ok).length,0);
  const number=value=>{if(value===''||value==null)return null;const parsed=Number(String(value).replace(',','.'));return Number.isFinite(parsed)?parsed:null};
  const baseName=name=>{try{return W.baseExerciseName?.(name)||String(name||'').split(' – ')[0].split(' — ')[0].trim()}catch(_){return String(name||'').trim()}};
  const roundWeight=(weight,step)=>{try{return W.roundLoad?.(weight,step)??Math.round(weight/step)*step}catch(_){return Math.round(weight/step)*step}};

  function recommendations(session){
    const groups=new Map();
    (session?.ex||[]).forEach(exercise=>{
      const key=String(exercise?.sourceId||baseName(exercise?.n)).toLowerCase();
      if(!groups.has(key))groups.set(key,{name:baseName(exercise?.n),sourceId:exercise?.sourceId||null,entries:[]});
      groups.get(key).entries.push(exercise)
    });
    const result=[];
    groups.forEach(group=>{
      const sets=group.entries.flatMap(exercise=>(exercise?.set||[]).filter(set=>set?.ok));
      const effort=sets.map(set=>number(set?.actualRpe??set?.rpe)??(number(set?.actualRir??set?.rir)!=null?10-number(set?.actualRir??set?.rir):null)).filter(value=>value!=null);
      if(!sets.length||!effort.length)return;
      const average=effort.reduce((sum,value)=>sum+value,0)/effort.length;
      const first=group.entries[0]||{},min=number(first.targetRpeMin??session?.targetRpeMin),max=number(first.targetRpeMax??session?.targetRpeMax),target=number(first.target??session?.target)??(min!=null&&max!=null?(min+max)/2:8);
      const baseWeight=Math.max(0,...sets.map(set=>number(set?.w)||0));
      let step=2.5;try{step=number(W.loadStepFor?.(group.name,group.sourceId))||step}catch(_){ }
      let delta=0;if(average<=target-1.5)delta=step*2;else if(average<=target-.75)delta=step;else if(average>=target+1.25)delta=-step*2;else if(average>=target+.75)delta=-step;
      const next=Math.max(0,roundWeight(baseWeight+delta,step));
      result.push({n:group.name,r:+average.toFixed(1),a:delta>0?`+${delta} кг`:delta<0?`${delta} кг`:'оставить',next})
    });
    return result
  }

  function showSummary(session){
    try{if(typeof W.summary==='function'){W.summary(session);return}}catch(error){console.error('UNVRSL workout summary',error)}
    const count=completedCount(session),message=session.suggest?.length?'Рекомендации сохранены.':'RPE и RIR не указаны, поэтому рекомендации не рассчитаны.';
    W.modal?.(`<div class="row between"><div><h2>Тренировка завершена</h2><div class="muted">${count} выполненных подходов</div></div><button class="btn tiny" onclick="closeModal()">✕</button></div><div class="card"><div class="muted">${message}</div></div><button class="btn primary full" onclick="closeModal();nav('stats')">К статистике</button>`)
  }
  function completionVisible(){const modal=D.getElementById?.('modal'),sheet=D.getElementById?.('sheet');return!!modal?.classList?.contains?.('show')&&/тренировка завершена/i.test(sheet?.textContent||'')}

  function fallback(session){
    const store=state();if(!store||store.current!==session)return false;
    session.ended=Date.now();session.suggest=recommendations(session);
    store.sessions=Array.isArray(store.sessions)?store.sessions:[];
    if(!store.sessions.some(item=>String(item?.id)===String(session.id)))store.sessions.push(session);
    store.current=null;
    try{W.save?.()}catch(error){console.error('UNVRSL workout save',error)}
    try{W.stopTimer?.()}catch(_){ }
    showSummary(session);
    try{if(typeof W.cloudSyncSession==='function')setTimeout(()=>W.cloudSyncSession(session),0)}catch(_){ }
    W.dispatchEvent?.(new CustomEvent('unvrsl:workout-completed',{detail:{sessionId:String(session.id||''),fallback:true}}));
    return true
  }

  function complete(button){
    const store=state(),session=store?.current;if(!session)return false;
    const count=completedCount(session);
    if(!count){if(!W.confirm?.('Ни один подход не отмечен. Завершить тренировку?'))return false;return fallback(session)}
    const label=button?.textContent;button?.setAttribute('aria-busy','true');if(button)button.textContent='Завершаю…';
    let error=null;
    try{if(typeof W.finish==='function')W.finish();else error=new Error('finish is unavailable')}catch(caught){error=caught;console.error('UNVRSL workout finish',caught)}
    if(state()?.current===session)fallback(session);
    else if(!completionVisible()){try{W.stopTimer?.()}catch(_){ }showSummary(session)}
    if(state()?.current===session&&button){button.removeAttribute('aria-busy');button.textContent=label||'Завершить тренировку';W.toast?.('Не удалось завершить тренировку')}
    return !error||state()?.current!==session
  }

  function finishButton(target){
    const button=target?.closest?.('#start [data-workout-finish],#start .workout-finish-card button:first-child,#start button[onclick="finish()"]');
    if(!button||!/завершить тренировку/i.test(button.textContent||''))return null;
    return button
  }
  D.addEventListener('click',event=>{const button=finishButton(event.target);if(!button)return;event.preventDefault();event.stopImmediatePropagation();complete(button)},true);
  W.completeWorkoutV384=complete;
})();
