'use strict';
(()=>{
  const W=window,D=document,REV=263,TRAINER='Семён';
  if(W.__unvrslProgramWeekRpeRirV263)return;
  W.__unvrslProgramWeekRpeRirV263=true;

  const CYCLE=Object.freeze({
    1:{pct:[70,75],rpe:[6,8]},
    2:{pct:[75,80],rpe:[7,8]},
    3:{pct:[80,85],rpe:[8,9]},
    4:{pct:[60,65],rpe:[4,6]},
    5:{pct:[85,88],rpe:[8,9]},
    6:{pct:[60,65],rpe:[4,6]},
    7:{pct:[88,90],rpe:[8.5,9.5]},
    8:{pct:[90,100],rpe:[9,10]}
  });
  const N=v=>{if(v===''||v==null)return null;const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:null};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const fmt=v=>v==null?'–':Number(v).toFixed(1).replace('.0','').replace('.',',');
  const state=()=>{try{return typeof st!=='undefined'?st:W.st}catch(_){return W.st}};
  const ui=()=>{try{return typeof programUi!=='undefined'?programUi:null}catch(_){return null}};
  const program=id=>{const s=state();try{return typeof programById==='function'?programById(id):(s?.programs||[]).find(p=>String(p?.id)===String(id))||null}catch(_){return null}};
  const saveState=()=>{try{if(typeof save==='function')save();else W.save?.()}catch(_){}};
  const isEightWeek=p=>Array.isArray(p?.weeks)&&p.weeks.length===8;

  function weekProfile(p,wi,useDefaults=true){
    const w=p?.weeks?.[Number(wi)];if(!w)return null;
    const wn=Number(w.n)||Number(wi)+1,d=useDefaults&&isEightWeek(p)?CYCLE[wn]:null;
    let lo=N(w.intensityMin??w.weekIntensityMin??w.intensity?.min),hi=N(w.intensityMax??w.weekIntensityMax??w.intensity?.max);
    if(lo!=null&&lo<=1)lo*=100;if(hi!=null&&hi<=1)hi*=100;
    if(lo==null||hi==null){lo=d?.pct?.[0]??null;hi=d?.pct?.[1]??null}
    let rpeMin=N(w.rpeMin??w.weekRpeMin),rpeMax=N(w.rpeMax??w.weekRpeMax);
    if(rpeMin==null||rpeMax==null){rpeMin=d?.rpe?.[0]??null;rpeMax=d?.rpe?.[1]??null}
    if(rpeMin!=null&&rpeMax!=null){const a=Math.min(rpeMin,rpeMax),b=Math.max(rpeMin,rpeMax);rpeMin=a;rpeMax=b}
    const rirHigh=rpeMin==null?null:Math.max(0,10-rpeMin),rirLow=rpeMax==null?null:Math.max(0,10-rpeMax);
    return {week:wn,intensityMin:lo,intensityMax:hi,rpeMin,rpeMax,rirHigh,rirLow,stored:!!(N(w.rpeMin??w.weekRpeMin)!=null&&N(w.rpeMax??w.weekRpeMax)!=null)}
  }
  W.unvrslWeekLoadProfileV263=weekProfile;

  function ensureStyle(){
    if(D.getElementById('program-week-rpe-rir-v263-style'))return;
    const s=D.createElement('style');s.id='program-week-rpe-rir-v263-style';s.textContent=`
      .wr263-box{margin-top:12px;padding-top:12px;border-top:1px solid #303034}
      .wr263-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:9px}.wr263-head b{font-size:14px}.wr263-rir{font-size:12px;font-weight:800;color:var(--green)}
      .wr263-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.wr263-grid .field{margin:0}.wr263-help{margin-top:8px;color:#85858b;font-size:11px;line-height:1.4}
      .wr263-cycle{margin-top:9px;width:100%}
      .wr263-client{margin:9px 0 13px;padding:12px 13px;border-radius:16px;background:#1a1a1d;border:1px solid #303034}
      .wr263-client-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.wr263-client-title{font-size:14px;font-weight:850}.wr263-client-pct{color:var(--green);font-size:13px;font-weight:850;white-space:nowrap}
      .wr263-client-chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}.wr263-client-chip{display:inline-flex;padding:5px 8px;border-radius:999px;background:#29292d;color:#d3d3d7;font-size:11px;font-weight:800}
      .wr263-trainer{margin-top:8px;color:#8e8e93;font-size:11px;font-weight:700}
    `;D.head?.appendChild(s)
  }

  function currentEditorContext(){
    const u=ui(),p=u?.pid?program(u.pid):null,wi=Number(u?.week)||0;
    return {u,p,wi,w:p?.weeks?.[wi]||null}
  }
  function syncRirPreview(){
    const a=N(D.getElementById('wr263RpeMin')?.value),b=N(D.getElementById('wr263RpeMax')?.value),out=D.getElementById('wr263Rir');if(!out)return;
    if(a==null||b==null){out.textContent='RIR –';return}
    const lo=Math.min(a,b),hi=Math.max(a,b);out.textContent=`RIR ${fmt(10-lo)}→${fmt(10-hi)}`
  }
  W.programWeekRpeChangedV263=syncRirPreview;

  function injectEditor(){
    ensureStyle();
    const {p,wi}=currentEditorContext(),card=D.querySelector('#sheet .pi261-week');if(!p||!card)return;
    card.querySelector('.wr263-box')?.remove();
    const pr=weekProfile(p,wi,true);if(!pr)return;
    if(isEightWeek(p)&&pr.intensityMin!=null&&pr.intensityMax!=null){
      const min=card.querySelector('#pi261Min'),max=card.querySelector('#pi261Max'),band=card.querySelector('.pi261-band');
      if(min&&N(min.value)==null)min.value=pr.intensityMin;
      if(max&&N(max.value)==null)max.value=pr.intensityMax;
      if(band&&(band.textContent||'').trim()==='Не задана')band.textContent=`${fmt(pr.intensityMin)}–${fmt(pr.intensityMax)}%`
    }
    const box=D.createElement('div');box.className='wr263-box';box.innerHTML=`
      <div class="wr263-head"><b>RPE / RIR недели</b><span id="wr263Rir" class="wr263-rir">RIR ${fmt(pr.rirHigh)}→${fmt(pr.rirLow)}</span></div>
      <div class="wr263-grid">
        <div class="field"><label>RPE от</label><input id="wr263RpeMin" inputmode="decimal" min="1" max="10" step="0.5" value="${pr.rpeMin??''}" oninput="programWeekRpeChangedV263()"></div>
        <div class="field"><label>RPE до</label><input id="wr263RpeMax" inputmode="decimal" min="1" max="10" step="0.5" value="${pr.rpeMax??''}" oninput="programWeekRpeChangedV263()"></div>
      </div>
      <div class="wr263-help">RIR связан автоматически: RIR = 10 − RPE. Интенсивность недели задаёт коридор % e1RM, а конкретная связка с RPE/RIR проверяется вместе с количеством повторений.</div>
      ${isEightWeek(p)?'<button class="btn wr263-cycle" type="button" onclick="programApplyEightWeekLoadCycleV263()">Применить схему W1–W8</button>':''}`;
    const toggle=card.querySelector('.pi261-toggle');if(toggle)toggle.insertAdjacentElement('beforebegin',box);else card.appendChild(box);
  }

  function patchSave(){
    const cur=W.programWeekIntensitySaveV261;if(typeof cur!=='function'||cur.__wr263)return false;
    const wrapped=function(){
      const a=D.getElementById('wr263RpeMin')?.value,b=D.getElementById('wr263RpeMax')?.value;
      const r=cur.apply(this,arguments);
      const {p,w}=currentEditorContext();let lo=N(a),hi=N(b);
      if(p&&w&&lo!=null&&hi!=null){lo=clamp(lo,1,10);hi=clamp(hi,1,10);w.rpeMin=Math.min(lo,hi);w.rpeMax=Math.max(lo,hi);w.rirMin=Math.max(0,10-w.rpeMax);w.rirMax=Math.max(0,10-w.rpeMin);w.loadProfileRevision=REV;p.updated=Date.now();saveState()}
      setTimeout(()=>{try{typeof renderProgramEditor==='function'&&renderProgramEditor()}catch(_){}setTimeout(injectEditor,0)},0);return r
    };wrapped.__wr263=true;W.programWeekIntensitySaveV261=wrapped;return true
  }

  function patchPreset(){
    const cur=W.programWeekIntensityPresetV261;if(typeof cur!=='function'||cur.__wr263)return false;
    const wrapped=function(lo,hi){const r=cur.apply(this,arguments);const match=Object.values(CYCLE).find(x=>Number(x.pct[0])===Number(lo)&&Number(x.pct[1])===Number(hi));if(match){const a=D.getElementById('wr263RpeMin'),b=D.getElementById('wr263RpeMax');if(a)a.value=match.rpe[0];if(b)b.value=match.rpe[1];syncRirPreview()}return r};wrapped.__wr263=true;W.programWeekIntensityPresetV261=wrapped;return true
  }

  W.programApplyEightWeekLoadCycleV263=function(){
    const {p}=currentEditorContext();if(!p||!isEightWeek(p))return;
    p.weeks.forEach((w,i)=>{const x=CYCLE[Number(w.n)||i+1];if(!x)return;w.intensityMin=x.pct[0];w.intensityMax=x.pct[1];w.useIntensity=true;w.rpeMin=x.rpe[0];w.rpeMax=x.rpe[1];w.rirMin=Math.max(0,10-x.rpe[1]);w.rirMax=Math.max(0,10-x.rpe[0]);w.loadProfileRevision=REV});
    p.updated=Date.now();saveState();try{typeof toast==='function'&&toast('Схема W1–W8 применена')}catch(_){};try{typeof renderProgramEditor==='function'&&renderProgramEditor()}catch(_){};setTimeout(injectEditor,0)
  };

  function selectedClientProgram(){
    const s=state(),key=String(s?.clientPlanViewKey||s?.clientPrimaryProgramKey||'');if(!key.startsWith('coach:'))return null;
    const id=key.slice(6),p=(s?.programs||[]).find(x=>String(x?.id)===id);if(!p)return null;
    const saved=Number(s?.clientProgramWeeks?.[key]||1),wi=Math.max(0,Math.min((p.weeks?.length||1)-1,saved-1));return {p,wi,profile:weekProfile(p,wi,true)}
  }
  function clientCard(profile){
    if(!profile)return null;const node=D.createElement('div');node.className='wr263-client';
    node.innerHTML=`<div class="wr263-client-top"><div><div class="wr263-client-title">W${profile.week} · нагрузка недели</div></div><div class="wr263-client-pct">${profile.intensityMin!=null&&profile.intensityMax!=null?`${fmt(profile.intensityMin)}–${fmt(profile.intensityMax)}%`:'–'}</div></div><div class="wr263-client-chips"><span class="wr263-client-chip">RPE ${fmt(profile.rpeMin)}–${fmt(profile.rpeMax)}</span><span class="wr263-client-chip">RIR ${fmt(profile.rirHigh)}→${fmt(profile.rirLow)}</span></div><div class="wr263-trainer">Тренер ${TRAINER}</div>`;return node
  }
  function decorateClientPlan(){
    if(!W.cloud?.user)return;let isClient=true;try{if(typeof W.unvrslTrainerMode==='function')isClient=!W.unvrslTrainerMode();else isClient=W.cloud?.profile?.role!=='trainer'}catch(_){}if(!isClient)return;
    const ctx=selectedClientProgram(),weeks=D.getElementById('clientPlanWeeks');if(ctx&&weeks){D.querySelector('#plan .wr263-client')?.remove();const card=clientCard(ctx.profile);if(card)weeks.insertAdjacentElement('afterend',card)}
  }
  function decorateStartPicker(){
    if(!W.cloud?.user)return;const weeks=D.getElementById('clientPickerWeeks');if(!weeks)return;
    const s=state(),key=String(s?.clientLastProgramKey||s?.clientPrimaryProgramKey||'');let p=null;if(key.startsWith('coach:'))p=(s?.programs||[]).find(x=>String(x?.id)===key.slice(6));
    if(!p){const on=D.querySelector('.client-program-choice.on b')?.textContent?.trim();if(on)p=(s?.programs||[]).find(x=>String(x?.name||'').trim()===on)}if(!p)return;
    const active=D.querySelector('#clientPickerWeeks .weekbtn.on')?.textContent||'W1',wi=Math.max(0,(Number(active.replace(/\D/g,''))||1)-1),pr=weekProfile(p,wi,true);
    D.querySelector('#sheet .wr263-client')?.remove();const card=clientCard(pr);if(card)weeks.insertAdjacentElement('afterend',card)
  }

  function annotateCurrent(){
    const s=state(),cur=s?.current;if(!cur?.programId)return;
    const p=program(cur.programId);if(!p)return;const wi=Math.max(0,Number(cur.programWeekNumber||cur.w||1)-1),pr=weekProfile(p,wi,true);if(!pr)return;
    const sig=`${pr.week}|${pr.intensityMin}|${pr.intensityMax}|${pr.rpeMin}|${pr.rpeMax}`;if(cur.weekLoadProfileSigV263===sig)return;
    cur.weekLoadProfileSigV263=sig;cur.programWeekRpeMin=pr.rpeMin;cur.programWeekRpeMax=pr.rpeMax;cur.programWeekRirMin=pr.rirLow;cur.programWeekRirMax=pr.rirHigh;cur.programWeekLoadProfileRevision=REV;
    if(!(N(cur.target)>0)&&pr.rpeMin!=null&&pr.rpeMax!=null)cur.target=Math.round(((pr.rpeMin+pr.rpeMax)/2)*2)/2;
    saveState()
  }

  let queued=false;
  function decorate(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;ensureStyle();patchSave();patchPreset();injectEditor();decorateClientPlan();decorateStartPicker();annotateCurrent()})}
  const mo=typeof MutationObserver==='function'?new MutationObserver(decorate):null;mo?.observe(D.documentElement,{childList:true,subtree:true});
  for(const e of ['unvrsl:modules-ready','unvrsl:app-ready','unvrsl:cloud-ready','unvrsl:client-ready','unvrsl:training-engine-ready'])W.addEventListener?.(e,decorate,{passive:true});
  [0,120,400,900,1800,3200].forEach(ms=>setTimeout(decorate,ms));
  setInterval(()=>{patchSave();patchPreset();decorateClientPlan();annotateCurrent()},1200)
})();
