'use strict';
(()=>{
  const W=window,D=document,REV=297,SEED='sergey-8-week-training-plan',NAME='Тренировочный план (Сергей)';
  if(W.__unvrslSergeyLoadProfileV297)return;
  W.__unvrslSergeyLoadProfileV297=true;

  const PROFILE=Object.freeze({
    1:Object.freeze({pct:[70,75],rpe:[7,7],focus:'Техника и базовый объём'}),
    2:Object.freeze({pct:[75,80],rpe:[8,8],focus:'Накопление объёма'}),
    3:Object.freeze({pct:[78,83],rpe:[8,9],focus:'Повышение интенсивности'}),
    4:Object.freeze({pct:[65,70],rpe:[6,7],focus:'Разгрузка'}),
    5:Object.freeze({pct:[78,83],rpe:[8,9],focus:'Тяжёлая гипертрофия'}),
    6:Object.freeze({pct:[65,70],rpe:[7,7],focus:'Восстановительный объём'}),
    7:Object.freeze({pct:[82,87],rpe:[8,9],focus:'Силовой акцент'}),
    8:Object.freeze({pct:[70,78],rpe:[7,8],focus:'Контрольная неделя'})
  });
  W.UNVRSL_SERGEY_LOAD_PROFILE=PROFILE;
  W.unvrslSergeyLoadProfileV297=week=>PROFILE[Math.max(1,Math.min(8,Number(week)||1))]||null;

  const state=()=>{try{if(typeof st!=='undefined'){W.st=st;return st}}catch(_){ }return W.st||null};
  const saveState=()=>{try{if(typeof save==='function')save();else W.save?.()}catch(_){ }};
  const fmt=v=>String(v).replace('.',',');
  const range=a=>a[0]===a[1]?fmt(a[0]):`${fmt(a[0])}–${fmt(a[1])}`;
  const isSergey=p=>!!p&&(String(p.seedId||'')===SEED||String(p.name||'').trim()===NAME);
  const put=(obj,key,value)=>{if(!obj||obj[key]===value)return false;obj[key]=value;return true};

  function patchProgram(p){
    if(!isSergey(p)||!Array.isArray(p.weeks))return false;
    let changed=false;
    p.weeks.forEach((week,index)=>{
      const n=Math.max(1,Math.min(8,Number(week?.n)||index+1)),pr=PROFILE[n];if(!week||!pr)return;
      const values={
        intensityMin:pr.pct[0],intensityMax:pr.pct[1],useIntensity:true,
        rpeMin:pr.rpe[0],rpeMax:pr.rpe[1],
        rirMin:Math.max(0,10-pr.rpe[1]),rirMax:Math.max(0,10-pr.rpe[0]),
        loadProfileManual:true,loadProfileRevision:REV,loadProfileSource:'sergey-specific-v297'
      };
      Object.entries(values).forEach(([k,v])=>{changed=put(week,k,v)||changed});
    });
    changed=put(p,'loadProfileRevision',REV)||changed;
    changed=put(p,'loadProfileSource','sergey-specific-v297')||changed;
    if(changed){p.updated=Date.now();p.sourceRevision=Math.max(Number(p.sourceRevision)||0,3)}
    return changed
  }

  function patchAll(){
    const s=state();if(!Array.isArray(s?.programs))return false;
    let changed=false;s.programs.forEach(p=>{if(patchProgram(p))changed=true});
    if(changed)saveState();return changed
  }

  function currentIsSergey(){
    const s=state(),cur=s?.current;if(!cur)return false;
    if(String(cur.programId||'')===SEED)return true;
    if(String(cur.programName||'').trim()===NAME)return true;
    const p=(s?.programs||[]).find(x=>String(x?.id||'')===String(cur.programId||'')||String(x?.cloudPlanId||'')===String(cur.planId||''));
    return isSergey(p)
  }

  let recalculating=false;
  async function sync(force=false){
    const changed=patchAll();
    if((changed||force)&&currentIsSergey()&&!recalculating){
      recalculating=true;
      try{
        if(typeof W.unvrslTrainingPrescriptionSyncV292==='function')await W.unvrslTrainingPrescriptionSyncV292(true);
        else if(W.trainingLoadModel292?.run)await W.trainingLoadModel292.run(true)
      }catch(e){console.warn('UNVRSL Sergey load profile v297',e)}finally{recalculating=false}
    }
    scheduleUi()
  }
  W.unvrslSergeyLoadProfileSyncV297=sync;

  function ensureStyle(){
    if(D.getElementById('sergey-load-profile-v297-style'))return;
    const s=D.createElement('style');s.id='sergey-load-profile-v297-style';s.textContent=`
      .sergey-load-v297{margin:12px 0 2px;padding-top:10px;border-top:1px solid #303034}
      .sergey-load-v297-title{font-size:10px;font-weight:800;color:#8e8e93;margin-bottom:7px;text-transform:uppercase;letter-spacing:.04em}
      .sergey-load-v297-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}
      .sergey-load-v297-cell{min-width:0;padding:7px 4px;border-radius:11px;background:#242428;border:1px solid #343438;text-align:center}
      .sergey-load-v297-cell b{display:block;font-size:10px}.sergey-load-v297-cell span{display:block;margin-top:2px;font-size:8px;color:#b4b4b9;white-space:nowrap}.sergey-load-v297-cell .pct{color:var(--green);font-size:9px;font-weight:800}
      .sergey-week-v297{margin:9px 0 3px;padding:9px 11px;border-radius:13px;background:rgba(48,209,88,.08);border:1px solid rgba(48,209,88,.22)}
      .sergey-week-v297 b{font-size:11px;color:var(--green)}.sergey-week-v297 span{display:block;margin-top:3px;color:#9a9aa0;font-size:10px}
      @media(max-width:390px){.sergey-load-v297-grid{gap:4px}.sergey-load-v297-cell{padding:6px 2px}.sergey-load-v297-cell span{font-size:7px}}
    `;D.head?.appendChild(s)
  }
  function gridHtml(){return `<div class="sergey-load-v297" data-sergey-load-profile-v297="grid"><div class="sergey-load-v297-title">Интенсивность и RPE</div><div class="sergey-load-v297-grid">${Object.entries(PROFILE).map(([w,p])=>`<div class="sergey-load-v297-cell"><b>W${w}</b><span class="pct">${range(p.pct)}%</span><span>RPE ${range(p.rpe)}</span></div>`).join('')}</div></div>`}
  function weekHtml(w){const p=PROFILE[w];return p?`<div class="sergey-week-v297" data-sergey-load-profile-v297="week"><b>W${w} · ${range(p.pct)}% · RPE ${range(p.rpe)}</b><span>${p.focus}</span></div>`:''}
  function selectedWeek(root){const m=String(root?.querySelector('.weekbtn.on')?.textContent||'').match(/W\s*(\d+)/i);return Math.max(1,Math.min(8,Number(m?.[1])||1))}

  function enhanceTrainerClientCard(){
    const sh=D.getElementById('sheet');if(!sh)return;
    sh.querySelectorAll('.tcv3-program').forEach(card=>{
      if(!String(card.textContent||'').includes(NAME)||card.querySelector('[data-sergey-load-profile-v297="grid"]'))return;
      const actions=card.querySelector('.tcv3-program-actions,.trainer-plan-actions,.coach-actions');
      if(actions)actions.insertAdjacentHTML('beforebegin',gridHtml());else card.insertAdjacentHTML('beforeend',gridHtml())
    })
  }
  function enhanceWeekSheet(){
    const sh=D.getElementById('sheet');if(!sh||!String(sh.textContent||'').includes(NAME))return;
    const bar=sh.querySelector('.weekbar');if(!bar)return;const w=selectedWeek(sh);
    const old=sh.querySelector('[data-sergey-load-profile-v297="week"]');
    if(old&&old.dataset.week===String(w))return;
    old?.remove();bar.insertAdjacentHTML('afterend',weekHtml(w));const fresh=sh.querySelector('[data-sergey-load-profile-v297="week"]');if(fresh)fresh.dataset.week=String(w)
  }
  function enhancePlanPage(){
    const root=D.getElementById('plan');if(!root||!String(root.textContent||'').includes(NAME))return;
    const bar=root.querySelector('.weekbar');if(!bar)return;const w=selectedWeek(root);
    const old=root.querySelector('[data-sergey-load-profile-v297="week"]');
    if(old&&old.dataset.week===String(w))return;
    old?.remove();bar.insertAdjacentHTML('afterend',weekHtml(w));const fresh=root.querySelector('[data-sergey-load-profile-v297="week"]');if(fresh)fresh.dataset.week=String(w)
  }
  let uiQueued=false;
  function enhanceUi(){uiQueued=false;ensureStyle();enhanceTrainerClientCard();enhanceWeekSheet();enhancePlanPage()}
  function scheduleUi(){if(uiQueued)return;uiQueued=true;requestAnimationFrame(enhanceUi)}
  function observe(){
    ensureStyle();
    for(const id of ['sheet','plan']){const node=D.getElementById(id);if(!node||node.__sergeyLoadProfileV297Observer)continue;const o=new MutationObserver(scheduleUi);o.observe(node,{childList:true,subtree:true,characterData:true});node.__sergeyLoadProfileV297Observer=o}
    scheduleUi()
  }

  if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',()=>{observe();sync(false)},{once:true});else{observe();sync(false)}
  ['unvrsl:modules-ready','unvrsl:app-ready','unvrsl:cloud-modules-settled','unvrsl:readiness-ready','unvrsl:training-engine-ready'].forEach(ev=>W.addEventListener?.(ev,()=>sync(false),{passive:true}));
  D.addEventListener?.('visibilitychange',()=>{if(!D.hidden)sync(false)},{passive:true});
  [0,200,700,1500,3000].forEach(ms=>setTimeout(()=>sync(ms===700),ms));
})();
