'use strict';
(()=>{
  const W=window,D=document,PID='prog-unvrsl-sldr';
  if(W.__unvrslSldrUiPolicyV3)return;W.__unvrslSldrUiPolicyV3=true;

  const PROFILE={
    1:{pct:[70,75],rpe:[7,8],rir:[2,3]},
    2:{pct:[75,80],rpe:[7.5,8],rir:[2,2]},
    3:{pct:[80,85],rpe:[8,9],rir:[1,2]},
    4:{pct:[60,65],rpe:[6,7],rir:[3,4]},
    5:{pct:[85,88],rpe:[8,9],rir:[1,2]},
    6:{pct:[60,65],rpe:[7,8],rir:[2,3]},
    7:{pct:[88,90],rpe:[8.5,9.5],rir:[0.5,1.5]},
    8:{pct:[90,100],rpe:[9,10],rir:[0,1]}
  };
  const state=()=>{try{return typeof st!=='undefined'?st:W.st}catch(_){return W.st}};
  const fmt=v=>Number(v).toFixed(1).replace('.0','').replace('.',',');
  const band=a=>Array.isArray(a)?(Number(a[0])===Number(a[1])?fmt(a[0]):`${fmt(a[0])}–${fmt(a[1])}`):'–';
  const targetProgram=p=>!!p&&(String(p.id||'')===PID||String(p.seedKey||'')==='unvrsl-sldr-program-v1'||String(p.name||'').trim()==='UNVRSL SLDR');
  const currentProgram=()=>{const s=state();return (s?.programs||[]).find(targetProgram)||null};

  function pickerWeek(sheet){
    const b=[...(sheet?.querySelectorAll?.('#startPickerWeeks .weekbtn')||[])].find(x=>x.classList.contains('on')||x.getAttribute('aria-pressed')==='true');
    const m=String(b?.textContent||'').match(/W\s*(\d+)/i);return m?Math.max(1,Math.min(8,+m[1])):null
  }
  function patchPicker(){
    const sheet=D.getElementById('sheet');if(!sheet||!/Выбрать тренировку/i.test(String(sheet.querySelector('h2')?.textContent||'')))return;
    if(!/UNVRSL\s+SLDR/i.test(String(sheet.querySelector('.start-picker-current')?.textContent||'')))return;
    const wn=pickerWeek(sheet),p=PROFILE[wn];if(!p)return;
    sheet.querySelectorAll('#startPickerDays .start-picker-day').forEach(row=>{
      const meta=row.querySelector('.muted.small');if(!meta)return;
      const count=String(meta.textContent||'').match(/(\d+)\s+упраж/i)?.[1]||'';
      const text=`RPE ${band(p.rpe)} · RIR ${band(p.rir)}${count?` · ${count} упражнений`:''}`;
      if(meta.textContent!==text)meta.textContent=text
    })
  }

  function patchActive(){
    const s=state(),cur=s?.current;if(!cur||!/UNVRSL\s+SLDR/i.test(String(cur.programName||'')))return;
    const p=PROFILE[Number(cur.programWeekNumber||cur.w)||1]||PROFILE[1],cards=[...D.querySelectorAll('#start .exercise')];
    (cur.ex||[]).forEach((ex,ei)=>{
      const card=cards[ei],set=ex?.set?.[0]||{};if(!card)return;
      const lo=Number(set.targetRepMin??set.rMin),hi=Number(set.targetRepMax??set.rMax),single=Number(set.r);
      let reps='';if(Number.isFinite(lo)&&lo>0)reps=Number.isFinite(hi)&&hi>0&&hi!==lo?`${fmt(lo)}–${fmt(hi)}`:fmt(lo);else if(single>0)reps=fmt(single);
      const text=`Цель: ${reps?`${reps} повт. · `:''}RPE ${band(p.rpe)} · RIR ${band(p.rir)}`;
      let note=card.querySelector('.usldr-target-v3');
      if(!note){note=D.createElement('div');note.className='usldr-target-v3 muted small';note.style.cssText='margin-top:7px;font-weight:650;letter-spacing:.01em';const anchor=card.querySelector('.rest-label')||card.querySelector('.exnote')||card.querySelector('.exname');anchor?.insertAdjacentElement('afterend',note)}
      if(note&&note.textContent!==text)note.textContent=text
    })
  }

  function applyWeightPolicy(){
    const s=state(),cur=s?.current;if(!cur||!/UNVRSL\s+SLDR/i.test(String(cur.programName||'')))return;
    const wn=Number(cur.programWeekNumber||cur.w)||1,p=PROFILE[wn]||PROFILE[1];
    cur.programWeekIntensityMin=p.pct[0];cur.programWeekIntensityMax=p.pct[1];cur.programWeekUseIntensity=true;
    cur.programWeekRpeMin=p.rpe[0];cur.programWeekRpeMax=p.rpe[1];cur.targetRpeMin=p.rpe[0];cur.targetRpeMax=p.rpe[1];
    (cur.ex||[]).forEach(ex=>{
      const sets=Array.isArray(ex?.set)?ex.set:[],hasWeight=sets.some(x=>Number(x?.programW)>0||Number(x?.w)>0);
      ex.programWeightMode=hasWeight?'prescribed':'autoweight';
      sets.forEach(set=>{
        const planned=Number(set?.programW)>0?Number(set.programW):(Number(set?.w)>0?Number(set.w):0);
        if(hasWeight){set.programW=planned;set.plannedW=planned;set.baselineW=planned;set.baselineSource='program_prescribed'}
        else{set.programW=0;if(!set.ok&&!set.manualOverride)set.w=0}
      })
    });
    try{typeof save==='function'?save():W.save?.()}catch(_){ }
    [50,180,500].forEach(ms=>setTimeout(()=>{try{W.trainingLoadModel292?.run?.(true)}catch(_){ }},ms))
  }

  function wrap(name,after){
    const fn=W[name];if(typeof fn!=='function'||fn.__usldrUiPolicyV3)return false;
    const wrapped=function(){const r=fn.apply(this,arguments);setTimeout(after,0);return r};
    wrapped.__usldrUiPolicyV3=true;wrapped.__base=fn;W[name]=wrapped;
    try{if(name==='startPage')startPage=wrapped}catch(_){ }
    return true
  }
  function wrapStart(){
    const fn=W.unvrslSldrStartV2;if(typeof fn!=='function'||fn.__usldrWeightPolicyV3)return false;
    const wrapped=function(){const r=fn.apply(this,arguments);setTimeout(()=>{applyWeightPolicy();patchActive()},0);return r};
    wrapped.__usldrWeightPolicyV3=true;wrapped.__base=fn;W.unvrslSldrStartV2=wrapped;return true
  }
  function install(){
    wrap('openStartProgramPicker',patchPicker);wrap('selectStartProgram',patchPicker);wrap('selectStartWeek',patchPicker);wrap('startPage',patchActive);wrapStart();patchPicker();patchActive()
  }
  D.addEventListener('pointerdown',install,{capture:true,passive:true});
  D.addEventListener('touchstart',install,{capture:true,passive:true});
  ['unvrsl:app-ready','unvrsl:modules-ready','unvrsl:training-engine-ready'].forEach(ev=>W.addEventListener?.(ev,install,{passive:true}));
  [0,400,900,1800,3200].forEach(ms=>setTimeout(install,ms));
})();