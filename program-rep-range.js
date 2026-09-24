'use strict';
(()=>{
  const W=window,D=document,REV=373;
  if(W.__unvrslProgramRepAuthorityV373)return;
  W.__unvrslProgramRepAuthorityV373=true;
  W.__unvrslProgramRepRangeV266=true;

  const PRESETS=[
    {hi:65,base:[12,15],iso:[15,20]},
    {hi:70,base:[10,12],iso:[12,15]},
    {hi:75,base:[8,10],iso:[12,15]},
    {hi:80,base:[6,8],iso:[10,12]},
    {hi:85,base:[5,7],iso:[8,12]},
    {hi:88,base:[4,6],iso:[8,10]},
    {hi:90,base:[3,5],iso:[6,10]},
    {hi:95,base:[2,4],iso:[6,8]},
    {hi:101,base:[1,3],iso:[4,6]}
  ];
  const N=v=>{if(v===''||v==null)return null;const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:null};
  const state=()=>{try{return typeof st!=='undefined'?st:W.st}catch(_){return W.st}};
  const saveState=()=>{try{if(typeof save==='function')save();else W.save?.()}catch(_){}};
  const program=id=>{const s=state();try{return typeof programById==='function'?programById(id):(s?.programs||[]).find(p=>String(p?.id)===String(id))||null}catch(_){return null}};
  const label=(a,b,arrow=false)=>a===b?String(a):`${a}${arrow?'→':'–'}${b}`;

  function kindOf(ex){
    const k=String(ex?.kind||D.getElementById('pmKind')?.value||'').toLowerCase();
    if(k==='compound'||k==='isolation')return k;
    const s=String(ex?.n||'').toLowerCase();
    return /(разгибан|сгибан|подъ[её]м|мах|разведен|сведен|бицеп|трицеп|кроссов|икр|дельт|бабоч|канат|отведен|приведен)/.test(s)?'isolation':'compound'
  }
  function band(w){
    let lo=N(w?.intensityMin??w?.weekIntensityMin??w?.intensity?.min),hi=N(w?.intensityMax??w?.weekIntensityMax??w?.intensity?.max);
    if(lo!=null&&lo<=1)lo*=100;if(hi!=null&&hi<=1)hi*=100;
    if(lo==null||hi==null)return[70,75];
    return[Math.min(lo,hi),Math.max(lo,hi)]
  }
  function autoRange(p,wi,ex){
    const w=p?.weeks?.[Number(wi)];if(!w)return[8,10];
    const kind=kindOf(ex);
    const manualWeek=w.repGuidanceManual===true;
    const a=kind==='isolation'?[N(w.isolationRepMin),N(w.isolationRepMax)]:[N(w.baseRepMin),N(w.baseRepMax)];
    if(a[0]!=null&&a[1]!=null&&(manualWeek||w.repGuidanceRevision!=null))return[Math.min(a[0],a[1]),Math.max(a[0],a[1])];
    const b=band(w),mid=(b[0]+b[1])/2,pr=PRESETS.find(x=>mid<=x.hi)||PRESETS.at(-1);
    return(kind==='isolation'?pr.iso:pr.base).slice()
  }
  function ensureStyle(){
    if(D.getElementById('pr373-style'))return;
    const s=D.createElement('style');s.id='pr373-style';s.textContent=`
      .pr373-target::placeholder{color:#9b9ba0!important;opacity:.62!important;font-weight:720}
    `;D.head?.appendChild(s)
  }
  function installPrescription(){
    let cur=W.prescriptionText;try{if(typeof prescriptionText==='function')cur=prescriptionText}catch(_){ }
    if(typeof cur!=='function'||cur.__pr373)return false;
    const wrapped=function(e){
      const s=e?.sets||[],method=String(e?.method||'STANDARD').toUpperCase();if(!s.length)return cur.apply(this,arguments);
      let resolved=null;try{const u=typeof programUi!=='undefined'?programUi:null,p=u?.pid?program(u.pid):null;if(p&&typeof W.programResolveExerciseParametersV381==='function')resolved=W.programResolveExerciseParametersV381(p.id,Number(u.week)||0,e)}catch(_){ }
      const repMin=resolved?.reps?.min??N(e.repMin)??N(s[0]?.r)??0,repMax=resolved?.reps?.max??N(e.repMax)??N(s[0]?.r)??0,rpe=resolved?.effort?label(resolved.effort.rpeMin,resolved.effort.rpeMax):e.rpe||8,weight=resolved?.weight?.mode==='auto'?'Авто':`${s[0]?.w||0} кг`;
      if(method==='STANDARD')return `${s.length}×${label(repMin,repMax)} · ${weight} · RPE ${rpe}`;
      if(method==='FST-7')return `7×${label(repMin,repMax)} · ${weight} · RPE ${rpe}`;
      if(method==='DS'&&N(e.dsRepStart)!=null&&N(e.dsRepEnd)!=null)return `${s.length} ступеней · ${label(e.dsRepStart,e.dsRepEnd,true)} · ${s[0]?.w||0} кг`;
      if(method==='SLDR'&&e.sldrPattern)return `${e.sldrPattern} · ${s[0]?.w||0} кг · 15 сек`;
      return cur.apply(this,arguments)
    };
    wrapped.__pr373=true;wrapped.__pr373Base=cur;W.prescriptionText=wrapped;try{prescriptionText=wrapped}catch(_){ }return true
  }

  function sourceTargets(p,wi,di,current){
    const d=p?.weeks?.[Number(wi)]?.days?.[Number(di)];if(!d||!current)return false;let cursor=0;
    const snapshot=()=>JSON.stringify((current.ex||[]).map(e=>({rpe:[e.targetRpeMin,e.targetRpeMax],sets:(e.set||[]).map(s=>[s.targetRepMin,s.targetRepMax,s.targetRepLabel,s.targetRpeMin,s.targetRpeMax,s.repMode,s.r])})));
    const before=snapshot();
    (d.ex||[]).forEach(block=>{
      const method=String(block?.method||'STANDARD').toUpperCase(),auto=autoRange(p,wi,block),sets=block?.sets||[];
      const resolved=typeof W.programResolveExerciseParametersV381==='function'?W.programResolveExerciseParametersV381(p.id,wi,block):null;
      const rpeMin=resolved?.effort?.rpeMin,rpeMax=resolved?.effort?.rpeMax;
      if(method==='STANDARD'||method==='FST-7'){
        const e=current.ex?.[cursor++];if(!e)return;const lo=resolved?.reps?.min??(block.repMode==='manual'?N(block.repMin):null)??auto[0],hi=resolved?.reps?.max??(block.repMode==='manual'?N(block.repMax):null)??auto[1],lab=label(lo,hi);
        if(rpeMin!=null&&rpeMax!=null){e.targetRpeMin=rpeMin;e.targetRpeMax=rpeMax;e.targetRirMin=Math.max(0,10-rpeMax);e.targetRirMax=Math.max(0,10-rpeMin)}
        (e.set||[]).forEach(set=>{set.targetRepMin=lo;set.targetRepMax=hi;set.targetRepLabel=lab;set.repMode=resolved?.reps?.mode||block.repMode||'auto';if(rpeMin!=null&&rpeMax!=null){set.targetRpeMin=rpeMin;set.targetRpeMax=rpeMax;set.targetRirMin=Math.max(0,10-rpeMax);set.targetRirMax=Math.max(0,10-rpeMin)}if(!set.ok&&!set.manualFields?.r&&!set.repEntered)set.r=''})
      }else{
        sets.forEach((src)=>{
          const e=current.ex?.[cursor++],set=e?.set?.[0];if(!set)return;
          const r=Math.max(1,N(src?.r)||1);set.targetRepMin=N(src.targetRepMin)??r;set.targetRepMax=N(src.targetRepMax)??r;set.targetRepLabel=src.targetRepLabel||String(r);set.repMode=block.repMode||'method';
          if(rpeMin!=null&&rpeMax!=null){e.targetRpeMin=rpeMin;e.targetRpeMax=rpeMax;e.targetRirMin=Math.max(0,10-rpeMax);e.targetRirMax=Math.max(0,10-rpeMin);set.targetRpeMin=rpeMin;set.targetRpeMax=rpeMax;set.targetRirMin=Math.max(0,10-rpeMax);set.targetRirMax=Math.max(0,10-rpeMin)}
          if(!set.ok&&!set.manualFields?.r&&!set.repEntered)set.r=''
        })
      }
    });
    current.repPolicyRevision=REV;return before!==snapshot()
  }
  function findCurrentDay(p,s){
    const wi=Math.max(0,Number(s?.w||1)-1),w=p?.weeks?.[wi];if(!w)return null;
    let di=w.days?.findIndex(d=>String(d?.name||'')===String(s?.c||''));if(di==null||di<0)di=0;return{wi,di}
  }
  function repairCurrent(){
    const s=state()?.current;if(!s?.programId)return false;const p=program(s.programId);if(!p)return false;const x=findCurrentDay(p,s);if(!x)return false;const ok=sourceTargets(p,x.wi,x.di,s);if(ok){saveState();W.dispatchEvent?.(new CustomEvent('unvrsl:prescription-updated'));W.startPage?.()}return ok
  }
  function installBegin(){
    let cur=W.beginProgramDay;try{if(typeof beginProgramDay==='function')cur=beginProgramDay}catch(_){ }
    if(typeof cur!=='function'||cur.__pr373)return false;
    const wrapped=function(pid,wi,di){const out=cur.apply(this,arguments),s=state()?.current,p=program(pid);if(s&&p&&String(s.programId)===String(pid)){if(sourceTargets(p,wi,di,s)){saveState();W.dispatchEvent?.(new CustomEvent('unvrsl:prescription-updated'))}try{W.startPage?.()}catch(_){ }}return out};
    wrapped.__pr373=true;wrapped.__pr373Base=cur;W.beginProgramDay=wrapped;try{beginProgramDay=wrapped}catch(_){ }return true
  }

  function targetText(set){
    if(set?.targetRepLabel)return String(set.targetRepLabel);
    const lo=N(set?.targetRepMin),hi=N(set?.targetRepMax);if(lo==null&&hi==null)return'';return label(lo??hi,hi??lo)
  }
  function decorateWorkoutHtml(html,sets){
    if(!html||!sets?.length)return html;const t=D.createElement('template');t.innerHTML=html,rows=[...t.content.querySelectorAll('.setrow:not(.cardiorow)')];
    rows.forEach((row,i)=>{const set=sets[i],lab=targetText(set);if(!set||!lab)return;const inp=row.querySelectorAll('input')?.[1];if(!inp)return;inp.placeholder=lab;inp.setAttribute('data-pr373-target','1');inp.setAttribute('aria-label',`Повторы, цель ${lab}`);inp.classList.add('pr373-target');if(!set.ok&&!set.manualFields?.r&&!set.repEntered)inp.value=''});
    t.content.querySelectorAll('.unvrsl-active-rep-range-v282,.unvrsl-program-rep-target-v371').forEach(n=>n.remove());return t.innerHTML
  }
  function installGroupCard(){
    let cur=W.exerciseGroupCard;try{if(typeof exerciseGroupCard==='function')cur=exerciseGroupCard}catch(_){ }
    if(typeof cur!=='function'||cur.__pr373)return false;
    const wrapped=function(s,group){const html=cur.apply(this,arguments);if(!s?.programId)return html;const sets=[];(group?.entries||[]).forEach(e=>(e?.set||[]).forEach(set=>sets.push(set)));return decorateWorkoutHtml(html,sets)};
    wrapped.__pr373=true;wrapped.__pr373Base=cur;W.exerciseGroupCard=wrapped;try{exerciseGroupCard=wrapped}catch(_){ }return true
  }
  function installCard(){
    let cur=W.exerciseCard;try{if(typeof exerciseCard==='function')cur=exerciseCard}catch(_){ }
    if(typeof cur!=='function'||cur.__pr373)return false;
    const wrapped=function(s,e){const html=cur.apply(this,arguments);if(!s?.programId)return html;return decorateWorkoutHtml(html,e?.set||[])};
    wrapped.__pr373=true;wrapped.__pr373Base=cur;W.exerciseCard=wrapped;try{exerciseCard=wrapped}catch(_){ }return true
  }
  function installEdit(){
    let cur=W.editSet;try{if(typeof editSet==='function')cur=editSet}catch(_){ }
    if(typeof cur!=='function'||cur.__pr373)return false;
    const wrapped=function(ei,si,k,v){if(k==='r'){const set=state()?.current?.ex?.[Number(ei)]?.set?.[Number(si)];if(set){set.repEntered=String(v).trim()!=='';set.manualFields={...(set.manualFields||{}),r:set.repEntered}}}return cur.apply(this,arguments)};
    wrapped.__pr373=true;wrapped.__pr373Base=cur;W.editSet=wrapped;try{editSet=wrapped}catch(_){ }return true
  }
  function installToggle(){
    let cur=W.toggleSet;try{if(typeof toggleSet==='function')cur=toggleSet}catch(_){ }
    if(typeof cur!=='function'||cur.__pr373)return false;
    const wrapped=function(ei,si){const s=state()?.current,set=s?.ex?.[Number(ei)]?.set?.[Number(si)];if(s?.programId&&set&&!set.ok&&(set.r===''||set.r==null)){try{W.toast?.('Укажи фактически выполненные повторы')}catch(_){ }return}return cur.apply(this,arguments)};
    wrapped.__pr373=true;wrapped.__pr373Base=cur;W.toggleSet=wrapped;try{toggleSet=wrapped}catch(_){ }return true
  }

  function install(){ensureStyle();installPrescription();installBegin();installGroupCard();installCard();installEdit();installToggle();repairCurrent()}
  let queued=false;const queue=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;install()})};
  const mo=typeof MutationObserver==='function'?new MutationObserver(queue):null;mo?.observe(D.documentElement,{childList:true,subtree:true});
  ['unvrsl:modules-ready','unvrsl:app-ready','unvrsl:cloud-ready','unvrsl:training-engine-ready'].forEach(ev=>W.addEventListener?.(ev,queue,{passive:true}));
  [0,60,140,300,700,1400,2600,5000].forEach(ms=>setTimeout(install,ms));setInterval(install,1200)
})();
