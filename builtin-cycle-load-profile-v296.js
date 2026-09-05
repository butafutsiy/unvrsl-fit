'use strict';
(()=>{
  const W=window,D=document,REV=299,BUILTIN='__builtin_cycle__';
  if(W.__unvrslBuiltinCycleLoadProfileV296)return;
  W.__unvrslBuiltinCycleLoadProfileV296=true;

  const PROFILE=Object.freeze({
    1:Object.freeze({pct:[70,75],rpe:[6,8],focus:'Техника, базовый объём'}),
    2:Object.freeze({pct:[75,80],rpe:[7,8],focus:'Рабочий объём'}),
    3:Object.freeze({pct:[80,85],rpe:[8,9],focus:'Механика и метаболика'}),
    4:Object.freeze({pct:[60,65],rpe:[4,6],focus:'Плотность и памп'}),
    5:Object.freeze({pct:[85,88],rpe:[8,9],focus:'Тяжёлый стимул'}),
    6:Object.freeze({pct:[60,65],rpe:[4,6],focus:'Разгрузка и памп'}),
    7:Object.freeze({pct:[88,90],rpe:[8.5,9.5],focus:'Сила'}),
    8:Object.freeze({pct:[90,100],rpe:[9,10],focus:'Контроль результатов',test:true})
  });
  W.UNVRSL_BUILTIN_LOAD_PROFILE=PROFILE;
  W.unvrslBuiltinLoadProfileV296=week=>PROFILE[Math.max(1,Math.min(8,Number(week)||1))]||null;

  const N=v=>{if(v===''||v==null)return null;const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:null};
  const mid=a=>Math.round((((Number(a?.[0])||0)+(Number(a?.[1])||0))/2)*2)/2;
  const fmt=v=>String(v).replace('.',',');
  const range=a=>`${fmt(a[0])}–${fmt(a[1])}`;
  const state=()=>{try{if(typeof st!=='undefined'){W.st=st;return st}}catch(_){ }return W.st||null};
  const saveState=()=>{try{if(typeof save==='function')save();else W.save?.()}catch(_){ }};
  const builtInName=()=>{try{return typeof W.unvrslBuiltInProgramName==='function'?W.unvrslBuiltInProgramName():String(state()?.builtinProgramName||'Встроенный цикл · 8 недель')}catch(_){return'Встроенный цикл · 8 недель'}};

  function isBuiltinWorkout(cur){
    if(!cur||cur.programId||cur.planId||cur.programName)return false;
    const w=N(cur.w);if(!(w>=1&&w<=8)||!cur.c)return false;
    try{return (W.UNVRSL_ROUTINES||[]).some(r=>Number(r?.w)===w&&String(r?.c||'')===String(cur.c||''))}catch(_){return true}
  }
  function put(obj,key,value){if(obj[key]===value)return false;obj[key]=value;return true}
  function annotate(cur){
    if(!isBuiltinWorkout(cur))return false;
    const p=PROFILE[Number(cur.w)];if(!p)return false;
    const target=mid(p.rpe),targetRir=Math.max(0,10-target);let changed=false;
    const fields={
      programWeekIntensityMin:p.pct[0],programWeekIntensityMax:p.pct[1],programWeekUseIntensity:true,
      programWeekRpeMin:p.rpe[0],programWeekRpeMax:p.rpe[1],
      programWeekRirMin:Math.max(0,10-p.rpe[1]),programWeekRirMax:Math.max(0,10-p.rpe[0]),
      target,builtinLoadProfileRevision:REV,builtinLoadProfileSource:'UNVRSL_BUILTIN_LOAD_PROFILE',
      builtinIntensityLabel:`${range(p.pct)}%`,builtinRpeLabel:`RPE ${range(p.rpe)}`
    };
    Object.entries(fields).forEach(([k,v])=>{changed=put(cur,k,v)||changed});
    (cur.ex||[]).forEach(ex=>{
      if(ex?.mode==='cardio')return;
      (ex.set||[]).forEach(set=>{
        changed=put(set,'targetRpeResolved',target)||changed;
        changed=put(set,'targetRir',targetRir)||changed;
      });
    });
    if(changed)saveState();
    return changed
  }
  W.unvrslApplyBuiltinLoadProfileV296=annotate;

  function installSessionHook(){
    const fn=W.session;if(typeof fn!=='function'||fn.__builtinLoadProfileV296)return;
    const wrapped=function(){const s=fn.apply(this,arguments);annotate(s);return s};
    wrapped.__builtinLoadProfileV296=true;wrapped.__builtinLoadProfileBase=fn;
    W.session=wrapped;try{session=wrapped}catch(_){ }
  }
  function installBeginHook(){
    const fn=W.begin;if(typeof fn!=='function'||fn.__builtinLoadProfileV296)return;
    const wrapped=function(){
      const out=fn.apply(this,arguments);
      try{annotate(state()?.current)}catch(_){ }
      scheduleUi();
      return out
    };
    wrapped.__builtinLoadProfileV296=true;wrapped.__builtinLoadProfileBase=fn;
    W.begin=wrapped;try{begin=wrapped}catch(_){ }
  }

  let calculating=false;
  async function sync(force=false){
    installSessionHook();installBeginHook();
    const cur=state()?.current,changed=annotate(cur),preparing=D.documentElement?.classList?.contains('te200-preparing');
    if((changed||force)&&isBuiltinWorkout(cur)&&!calculating&&!preparing){
      const model=W.trainingLoadModel292;
      if(model?.run){calculating=true;try{await model.run(true)}catch(e){console.warn('UNVRSL builtin load profile v299',e)}finally{calculating=false}}
    }
    scheduleUi()
  }

  function ensureStyle(){
    if(D.getElementById('builtin-cycle-load-profile-v296-style'))return;
    const s=D.createElement('style');s.id='builtin-cycle-load-profile-v296-style';s.textContent=`
      .builtin-load-v296{margin-top:13px;padding-top:12px;border-top:1px solid #303034}
      .builtin-load-v296-title{font-size:11px;font-weight:800;color:#8e8e93;margin-bottom:8px;text-transform:uppercase;letter-spacing:.03em}
      .builtin-load-v296-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}
      .builtin-load-v296-cell{min-width:0;padding:8px 5px;border-radius:12px;background:#242428;border:1px solid #343438;text-align:center}
      .builtin-load-v296-cell b{display:block;font-size:11px}.builtin-load-v296-cell span{display:block;margin-top:2px;font-size:9px;color:#b4b4b9;white-space:nowrap}
      .builtin-load-v296-cell .pct{color:var(--green);font-weight:800;font-size:10px}
      .builtin-week-profile-v296{margin:10px 0 2px;padding:10px 12px;border-radius:14px;background:rgba(48,209,88,.08);border:1px solid rgba(48,209,88,.22)}
      .builtin-week-profile-v296 b{font-size:12px;color:var(--green)}.builtin-week-profile-v296 span{display:block;margin-top:3px;color:#9a9aa0;font-size:11px}
      @media(max-width:390px){.builtin-load-v296-grid{gap:5px}.builtin-load-v296-cell{padding:7px 3px}.builtin-load-v296-cell span{font-size:8px}}
    `;
    D.head?.appendChild(s)
  }
  function gridHtml(){
    const cells=Object.entries(PROFILE).map(([w,p])=>`<div class="builtin-load-v296-cell"><b>W${w}</b><span class="pct">${range(p.pct)}%</span><span>RPE ${range(p.rpe)}</span></div>`).join('');
    return `<div class="builtin-load-v296" data-builtin-load-profile="296"><div class="builtin-load-v296-title">Интенсивность и RPE по неделям</div><div class="builtin-load-v296-grid">${cells}</div></div>`
  }
  function weekHtml(w){
    const p=PROFILE[w];if(!p)return'';
    return `<div class="builtin-week-profile-v296" data-builtin-week-profile="${w}"><b>W${w} · ${range(p.pct)}% · RPE ${range(p.rpe)}</b><span>${p.focus}</span></div>`
  }
  function activeWeek(root){
    const m=String(root?.querySelector('.weekbtn.on')?.textContent||'').match(/W\s*(\d+)/i);
    return Math.max(1,Math.min(8,Number(m?.[1])||Number(state()?.week)||1))
  }
  function setRpeChips(root,p){
    root?.querySelectorAll('.chip').forEach(ch=>{
      if(!/^RPE\s+/i.test(String(ch.textContent||'').trim()))return;
      const text=`RPE ${range(p.rpe)}`;if(ch.textContent!==text)ch.textContent=text
    })
  }
  function enhanceRoutinePreview(sh){
    const preview=sh?.querySelector('.routine-preview-v281');if(!preview)return false;
    const meta=preview.querySelector('.rp281-meta');if(!meta)return false;
    const raw=String(meta.textContent||'').trim(),m=raw.match(/W\s*(\d+)/i),w=Math.max(1,Math.min(8,Number(m?.[1])||0)),p=PROFILE[w];if(!p)return false;
    const tempoMatch=raw.match(/темп\s+(.+)$/i),tempoText=tempoMatch?.[1]?.trim();
    const next=`W${w} · ${range(p.pct)}% · RPE ${range(p.rpe)}${tempoText?` · темп ${tempoText}`:''}`;
    if(meta.textContent!==next)meta.textContent=next;
    preview.querySelectorAll('.rp281-rule').forEach(el=>{
      const text=String(el.textContent||'');
      const replaced=text.replace(/RPE\s+\d+(?:[.,]\d+)?(?:\s*[–-]\s*\d+(?:[.,]\d+)?)?/i,`RPE ${range(p.rpe)}`);
      if(replaced!==text)el.textContent=replaced
    });
    preview.dataset.loadProfileTextRevision=String(REV);
    return true
  }
  function enhancePrograms(){
    const root=D.getElementById('programs');if(!root)return;
    const open=[...root.querySelectorAll('button')].find(b=>(b.getAttribute('onclick')||'').includes('openBuiltinProgramViewer'));
    const card=open?.closest('.coach-program,.card');if(!card||card.querySelector('[data-builtin-load-profile="296"]'))return;
    const actions=card.querySelector('.coach-actions');
    if(actions)actions.insertAdjacentHTML('beforebegin',gridHtml());else card.insertAdjacentHTML('beforeend',gridHtml())
  }
  function isBuiltinPrimary(){
    const s=state();return String(s?.primaryProgramId||BUILTIN)===BUILTIN&&!s?.builtinProgramHidden
  }
  function enhancePlan(){
    const root=D.getElementById('plan');if(!root||!isBuiltinPrimary())return;
    const w=activeWeek(root),p=PROFILE[w];if(!p)return;
    setRpeChips(root,p);
    const weekTitle=[...root.querySelectorAll('.title')].find(x=>new RegExp(`Неделя\\s*${w}(?:\\D|$)`,'i').test(x.textContent||''));
    const card=weekTitle?.closest('.card');
    if(card&&!card.querySelector('[data-builtin-week-profile]'))card.insertAdjacentHTML('beforeend',weekHtml(w))
  }
  function enhanceSheet(){
    const sh=D.getElementById('sheet');if(!sh)return;
    if(enhanceRoutinePreview(sh))return;
    const text=String(sh.textContent||'');
    if(text.includes('Встроенная программа · 8 недель')||text.includes(builtInName())){
      const w=activeWeek(sh),p=PROFILE[w];
      if(p){setRpeChips(sh,p);const weekbar=sh.querySelector('.weekbar');if(weekbar&&!sh.querySelector('[data-builtin-week-profile]'))weekbar.insertAdjacentHTML('afterend',weekHtml(w))}
    }
    if(!/Выбрать тренировку/i.test(text))return;
    const selected=sh.querySelector('.start-program-choice.on b');
    if(!selected||String(selected.textContent||'').trim()!==builtInName())return;
    const w=activeWeek(sh),p=PROFILE[w];if(!p)return;
    sh.querySelectorAll('.start-picker-day .muted.small').forEach(el=>{
      const m=String(el.textContent||'').match(/·\s*(\d+)\s+упражнен/i);
      const next=`${range(p.pct)}% · RPE ${range(p.rpe)}${m?` · ${m[1]} упражнений`:''}`;
      if(el.textContent!==next)el.textContent=next
    })
  }

  let uiQueued=false;
  function enhanceUi(){uiQueued=false;ensureStyle();enhancePrograms();enhancePlan();enhanceSheet()}
  function scheduleUi(){if(uiQueued)return;uiQueued=true;requestAnimationFrame(enhanceUi)}
  function observe(){
    ensureStyle();
    for(const id of ['programs','plan','sheet']){
      const node=D.getElementById(id);if(!node||node.__builtinLoadProfileV296Observer)continue;
      const o=new MutationObserver(scheduleUi);o.observe(node,{childList:true,subtree:true});node.__builtinLoadProfileV296Observer=o
    }
    scheduleUi()
  }

  if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',()=>{observe();sync(false)},{once:true});else{observe();sync(false)}
  ['unvrsl:training-engine-ready','unvrsl:modules-ready','unvrsl:app-ready','unvrsl:readiness-ready','unvrsl:cloud-modules-settled'].forEach(ev=>W.addEventListener?.(ev,()=>sync(false),{passive:true}));
  D.addEventListener?.('visibilitychange',()=>{if(!D.hidden)sync(false)},{passive:true});
  [0,120,400,900,1800,3200].forEach(ms=>setTimeout(()=>sync(ms===900),ms));
})();