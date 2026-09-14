'use strict';
(()=>{
  const W=window,D=document;
  if(W.__unvrslWorkoutCompletionV385)return;
  W.__unvrslWorkoutCompletionV385=true;

  const state=()=>{try{return typeof st!=='undefined'?st:W.st}catch(_){return W.st}};
  const number=value=>{if(value===''||value==null)return null;const parsed=Number(String(value).replace(',','.'));return Number.isFinite(parsed)?parsed:null};
  const completedSets=session=>(session?.ex||[]).flatMap(exercise=>(exercise?.set||[]).filter(set=>set?.ok).map(set=>({exercise,set})));
  const completedCount=session=>completedSets(session).length;
  const baseName=name=>{try{return W.baseExerciseName?.(name)||String(name||'').split(' – ')[0].split(' — ')[0].trim()}catch(_){return String(name||'').trim()}};
  const roundWeight=(weight,step)=>{try{return W.roundLoad?.(weight,step)??Math.round(weight/step)*step}catch(_){return Math.round(weight/step)*step}};
  const escape=value=>{try{return typeof W.esc==='function'?W.esc(String(value??'')):String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}catch(_){return String(value??'')}};

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
      let step=2.5;try{step=number(W.loadStepFor?.(group.name,group.sourceId))||step}catch(_){}
      let delta=0;if(average<=target-1.5)delta=step*2;else if(average<=target-.75)delta=step;else if(average>=target+1.25)delta=-step*2;else if(average>=target+.75)delta=-step;
      const next=Math.max(0,roundWeight(baseWeight+delta,step));
      result.push({n:group.name,r:+average.toFixed(1),a:delta>0?`+${delta} кг`:delta<0?`${delta} кг`:'оставить',next})
    });
    return result
  }

  function durationText(session){
    const ms=Math.max(0,(Number(session?.ended)||Date.now())-(Number(session?.started)||Date.now()));
    const total=Math.floor(ms/1000),hours=Math.floor(total/3600),minutes=Math.floor(total%3600/60),seconds=total%60;
    return hours?`${hours}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`:`${minutes}:${String(seconds).padStart(2,'0')}`
  }
  function tonnage(session){return completedSets(session).reduce((sum,row)=>sum+(number(row.set?.w)||0)*(number(row.set?.r)||0),0)}
  function averageRpe(session){
    const values=completedSets(session).map(row=>number(row.set?.actualRpe??row.set?.rpe)??(number(row.set?.actualRir??row.set?.rir)!=null?10-number(row.set?.actualRir??row.set?.rir):null)).filter(value=>value!=null);
    return values.length?values.reduce((sum,value)=>sum+value,0)/values.length:null
  }
  function weightText(value){if(value>=1000)return`${String(Math.round(value/100)/10).replace('.',',')} т`;return`${Math.round(value).toLocaleString('ru-RU')} кг`}

  function compactSummary(session){
    const count=completedCount(session),avg=averageRpe(session),name=session?.c||session?.name||'Тренировка';
    W.modal?.(`<div class="wc385" data-compact-completion-v385="1"><div class="wc385-head"><div><h2>Тренировка завершена</h2><div class="muted">${escape(name)} · ${count} выполненных подходов</div></div><button class="btn tiny wc385-close" onclick="closeModal()" aria-label="Закрыть">✕</button></div><div class="wc385-metrics"><div class="wc385-metric"><span>Длительность</span><b>${durationText(session)}</b></div><div class="wc385-metric"><span>Тоннаж</span><b>${weightText(tonnage(session))}</b></div><div class="wc385-metric"><span>Подходы</span><b>${count}</b></div><div class="wc385-metric"><span>Средний RPE</span><b>${avg==null?'Не указан':String(Math.round(avg*10)/10).replace('.',',')}</b></div></div><button class="btn primary full wc385-primary" onclick="closeModal();nav('stats')">К статистике</button></div>`);
  }
  W.summary=compactSummary;try{summary=compactSummary}catch(_){}

  if(!D.getElementById('workout-completion-v385-style')){
    const style=D.createElement('style');style.id='workout-completion-v385-style';style.textContent=`
      #sheet:has(.wc385){padding-bottom:calc(26px + env(safe-area-inset-bottom));overflow:auto}
      .wc385{padding:2px 0 4px}.wc385-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:20px}
      .wc385-head h2{font-size:30px;line-height:1.05;margin:0 0 8px;letter-spacing:-1px}.wc385-close{width:48px;height:48px;padding:0;flex:none}
      .wc385-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
      .wc385-metric{min-height:104px;padding:16px;border-radius:20px;background:#1d1d20;border:1px solid #303137;display:flex;flex-direction:column;justify-content:space-between;min-width:0}
      .wc385-metric span{color:#8e8e93;font-size:13px}.wc385-metric b{font-size:24px;line-height:1.05;letter-spacing:-.5px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
      .wc385-primary{margin-top:14px;min-height:58px;font-size:18px}
    `;D.head?.appendChild(style)
  }

  function completionVisible(){const modal=D.getElementById?.('modal'),sheet=D.getElementById?.('sheet');return!!modal?.classList?.contains?.('show')&&!!sheet?.querySelector?.('[data-compact-completion-v385]')}
  function fallback(session){
    const store=state();if(!store||store.current!==session)return false;
    session.ended=Date.now();session.suggest=recommendations(session);
    store.sessions=Array.isArray(store.sessions)?store.sessions:[];
    if(!store.sessions.some(item=>String(item?.id)===String(session.id)))store.sessions.push(session);
    store.current=null;
    try{W.save?.()}catch(error){console.error('UNVRSL workout save',error)}
    try{W.stopTimer?.()}catch(_){}
    compactSummary(session);
    try{if(typeof W.cloudSyncSession==='function')setTimeout(()=>W.cloudSyncSession(session),0)}catch(_){}
    W.dispatchEvent?.(new CustomEvent('unvrsl:workout-completed',{detail:{sessionId:String(session.id||''),fallback:true}}));
    return true
  }
  function complete(button){
    const store=state(),session=store?.current;if(!session)return false;
    const count=completedCount(session);
    if(!count&&!W.confirm?.('Ни один подход не отмечен. Завершить тренировку?'))return false;
    const label=button?.textContent;button?.setAttribute('aria-busy','true');if(button)button.textContent='Завершаю…';
    let error=null;
    try{if(typeof W.finish==='function')W.finish();else error=new Error('finish is unavailable')}catch(caught){error=caught;console.error('UNVRSL workout finish',caught)}
    if(state()?.current===session)fallback(session);
    else if(!completionVisible()){try{W.stopTimer?.()}catch(_){}compactSummary(session)}
    if(state()?.current===session&&button){button.removeAttribute('aria-busy');button.textContent=label||'Завершить тренировку';W.toast?.('Не удалось завершить тренировку')}
    return !error||state()?.current!==session
  }
  function finishButton(target){
    const button=target?.closest?.('#start [data-workout-finish],#start .workout-finish-card button:first-child,#start button[onclick="finish()"]');
    if(!button||!/завершить тренировку/i.test(button.textContent||''))return null;
    return button
  }
  D.addEventListener('click',event=>{const button=finishButton(event.target);if(!button)return;event.preventDefault();event.stopImmediatePropagation();complete(button)},true);
  W.completeWorkoutV385=complete;W.completeWorkoutV384=complete;
})();
