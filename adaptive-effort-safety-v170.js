'use strict';
(()=>{
  if(window.__unvrslAdaptiveEffortSafetyV170)return;
  window.__unvrslAdaptiveEffortSafetyV170=true;

  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const strictNum=v=>{
    if(v===null||v===undefined)return null;
    if(typeof v==='string'&&!v.trim())return null;
    const n=Number(v);
    return Number.isFinite(n)?n:null;
  };
  const round1=v=>Math.round(v*10)/10;
  const median=a=>{
    const x=(a||[]).filter(Number.isFinite).sort((p,q)=>p-q);
    if(!x.length)return null;
    const m=Math.floor(x.length/2);
    return x.length%2?x[m]:(x[m-1]+x[m])/2;
  };
  const state=()=>{
    try{if(typeof st!=='undefined'){window.st=st;return st}}catch(e){}
    return window.st||null;
  };
  const baseName=n=>{
    try{if(typeof baseExerciseName==='function')return baseExerciseName(n)}catch(e){}
    return String(n||'').replace(/\s+—\s+.*$/,'').trim();
  };
  const rpeToRir=rpe=>{
    const n=strictNum(rpe);
    return n==null||n<1||n>10?null:round1(clamp(10-n,0,10));
  };
  const rirToRpe=rir=>{
    const n=strictNum(rir);
    return n==null||n<0||n>10?null:round1(clamp(10-n,1,10));
  };
  const stepFor=(base,sourceId)=>{
    try{if(typeof loadStepFor==='function')return Number(loadStepFor(base,sourceId))||2.5}catch(e){}
    return 2.5;
  };
  const roundLoadSafe=(v,step)=>{
    try{if(typeof roundLoad==='function')return roundLoad(v,step)}catch(e){}
    step=Number(step)||2.5;
    return Math.max(0,Math.round(Number(v||0)/step)*step);
  };
  const sameExercise=(e,base,sourceId)=>{
    if(sourceId&&String(e?.sourceId||'')===String(sourceId))return true;
    return baseName(e?.n).toLowerCase()===String(base||'').toLowerCase();
  };

  function validEffort(set){
    let rpe=strictNum(set?.rpe),rir=strictNum(set?.rir);
    if(rpe!=null&&(rpe<1||rpe>10))rpe=null;
    if(rir!=null&&(rir<0||rir>10))rir=null;
    if(rpe==null&&rir==null)return null;
    if(rpe==null)rpe=rirToRpe(rir);
    if(rir==null)rir=rpeToRir(rpe);
    if(rpe==null||rir==null)return null;
    return{rpe,rir};
  }

  function latestRows(base,sourceId){
    const s=state(),sessions=Array.isArray(s?.sessions)?s.sessions:[];
    for(let i=sessions.length-1;i>=0;i--){
      const session=sessions[i],rows=[];
      (session?.ex||[]).forEach(ex=>{
        if(ex?.mode==='cardio'||!sameExercise(ex,base,sourceId))return;
        (ex.set||[]).forEach(set=>{
          if(!set?.ok||!(Number(set.w)>0)||!(Number(set.r)>0))return;
          const effort=validEffort(set);
          if(!effort)return;
          rows.push({
            w:Number(set.w),r:Number(set.r),rpe:effort.rpe,rir:effort.rir,
            date:session.date||'',target:strictNum(ex.target)??strictNum(session.target)??8
          });
        });
      });
      if(rows.length)return rows;
    }
    return[];
  }

  function capacity(rows){
    const estimates=(rows||[]).map(x=>x.w*(1+(x.r+x.rir)/30)).filter(v=>Number.isFinite(v)&&v>0);
    const e1rm=median(estimates);
    if(!e1rm)return null;
    const rpes=rows.map(x=>x.rpe).filter(v=>Number.isFinite(v));
    return{e1rm,avgRpe:rpes.length?round1(rpes.reduce((a,b)=>a+b,0)/rpes.length):null};
  }

  function targetWeight(e1rm,reps,targetRpe,step){
    reps=Math.max(1,Number(reps)||1);
    const targetRir=rpeToRir(targetRpe)??2;
    return roundLoadSafe(e1rm/(1+(reps+targetRir)/30),step);
  }

  function groups(session){
    try{if(typeof groupIndexedEntries==='function')return groupIndexedEntries(session?.ex||[])}catch(e){}
    return (session?.ex||[]).map((e,i)=>({indices:[i],entries:[e],base:baseName(e.n)}));
  }

  function adaptiveItems(session=state()?.current){
    const out=[];
    if(!session||!Array.isArray(session.ex))return out;
    groups(session).forEach(group=>{
      const entries=group.entries||[];
      if(!entries.length||entries.every(e=>e.mode==='cardio'))return;
      const first=entries[0],base=group.base||baseName(first.n),sourceId=first.sourceId||null;
      const hist=latestRows(base,sourceId),cap=capacity(hist);
      if(!cap)return;
      const sets=[];entries.forEach(e=>(e.set||[]).forEach(x=>sets.push({e,x})));
      const ref=sets.find(z=>Number(z.x?.w)>0&&Number(z.x?.r)>0)||sets.find(z=>Number(z.x?.r)>0);
      if(!ref)return;
      const planned=Number(ref.x?.w)||0;
      if(!(planned>0))return;
      const target=strictNum(first.target)??strictNum(session.target)??8,step=stepFor(base,sourceId);
      const rawWanted=targetWeight(cap.e1rm,ref.x.r,target,step);
      if(!(rawWanted>0))return;

      // One-session adaptation must be conservative. Never jump more than +7.5% / -10%.
      const ratio=clamp(rawWanted/planned,.90,1.075);
      const wanted=roundLoadSafe(planned*ratio,step);
      out.push({base,sourceId,group,planned,wanted,ratio,avgRpe:cap.avgRpe,date:hist[0]?.date||'',e1rm:round1(cap.e1rm),target});
    });
    return out;
  }

  function applySafeAdaptation(){
    const s=state(),session=s?.current;
    if(!session)return 0;
    const items=adaptiveItems(session);
    let changed=0;
    items.forEach(item=>{
      const ratio=item.ratio,base=item.base,sourceId=item.sourceId,step=stepFor(base,sourceId);
      (item.group.entries||[]).forEach(ex=>{
        let groupChanged=false;
        (ex.set||[]).forEach(set=>{
          if(!set||set.manualOverride||!(Number(set.r)>0)||!(Number(set.w)>0))return;
          const planned=Number(set.w);
          if(set.plannedW==null)set.plannedW=planned;
          const next=roundLoadSafe(planned*ratio,step);
          if(next>0&&Math.abs(next-planned)>=Math.max(.1,step*.45)){
            set.w=next;changed++;groupChanged=true;
          }
        });
        if(groupChanged)ex.adaptiveEffort={e1rm:item.e1rm,avgRpe:item.avgRpe,targetRpe:item.target,ratio:round1(ratio),sourceDate:item.date,mode:'actual-capacity-safe'};
      });
    });
    session.adaptiveEffortV2Applied=true;
    session.adaptiveDecision='previous';
    session.adaptiveEffortV2At=new Date().toISOString();
    try{save()}catch(e){}
    return changed;
  }

  function restorePlan(){
    const session=state()?.current;if(!session)return;
    (session.ex||[]).forEach(ex=>{
      (ex.set||[]).forEach(set=>{if(!set?.manualOverride&&set?.plannedW!=null)set.w=set.plannedW});
      delete ex.adaptiveEffort;
    });
    session.adaptiveEffortV2Applied=true;
    session.adaptiveDecision='plan';
    try{save()}catch(e){}
  }

  function install(){
    if(typeof window.adaptiveChoiceSheet!=='function')return false;

    window.adaptiveChoiceSheet=function(){
      const session=state()?.current;if(!session)return;
      const items=adaptiveItems(session);
      if(!items.length){
        if(typeof toast==='function')toast('Для адаптации нужен заполненный RPE или RIR прошлой тренировки');
        return;
      }
      const rows=items.slice(0,8).map(x=>`<div class="adaptive-preview-row"><div><b>${typeof esc==='function'?esc(x.base):x.base}</b><small>${x.date?`Прошлая: ${x.date}`:''}${x.avgRpe!=null?` · RPE ${x.avgRpe}`:''}</small></div><b>${x.planned} → ${x.wanted} кг</b></div>`).join('');
      modal(`<div class="sheet-grabber"></div><div class="row between"><div><h2>Адаптация тренировки</h2><div class="muted">По фактически заполненному RPE/RIR прошлой тренировки.</div></div><button class="btn tiny" onclick="closeModal()">✕</button></div><div class="card" style="margin-top:14px">${rows}</div><button class="btn primary full" style="margin-top:12px" onclick="chooseAdaptiveMode('previous')">По прошлому результату</button><button class="btn full" style="margin-top:8px" onclick="chooseAdaptiveMode('plan')">Оставить плановые веса</button><div class="muted small" style="margin-top:10px">Пустой RPE/RIR не участвует в расчёте. Повышение за одну тренировку ограничено 7,5%, снижение — 10%. Ручные изменения имеют приоритет.</div>`);
    };

    window.chooseAdaptiveMode=function(mode){
      if(mode==='previous'){
        const n=applySafeAdaptation();
        closeModal();
        try{startPage()}catch(e){}
        if(typeof toast==='function')toast(n?`Вес подстроен · ${n} подходов`:'Плановые веса уже подходят');
      }else{
        restorePlan();
        closeModal();
        try{startPage()}catch(e){}
        if(typeof toast==='function')toast('Оставлены плановые веса');
      }
    };
    try{adaptiveChoiceSheet=window.adaptiveChoiceSheet}catch(e){}
    try{chooseAdaptiveMode=window.chooseAdaptiveMode}catch(e){}
    window.applyAdaptiveLoads=()=>applySafeAdaptation();
    return true;
  }

  if(!install()){
    const t=setInterval(()=>{if(install())clearInterval(t)},100);
    setTimeout(()=>clearInterval(t),15000);
  }
})();
