'use strict';
(()=>{
  const W=window,D=document,REV=269;
  if(W.__unvrslProgramIntensityRepGuidanceV269)return;
  W.__unvrslProgramIntensityRepGuidanceV269=true;
  W.__unvrslProgramWeekRepGuidanceV268=true;

  // Repetition corridors are derived from the week's selected intensity.
  // Week numbers only provide profile presets; they are not a repetition rule.
  const PRESETS=Object.freeze([
    {lo:60,hi:65,base:[12,15],iso:[15,20]},
    {lo:65,hi:70,base:[10,12],iso:[12,15]},
    {lo:70,hi:75,base:[8,10],iso:[12,15]},
    {lo:75,hi:80,base:[6,8],iso:[10,12]},
    {lo:80,hi:85,base:[5,7],iso:[8,12]},
    {lo:85,hi:88,base:[4,6],iso:[8,10]},
    {lo:88,hi:90,base:[3,5],iso:[6,10]},
    {lo:90,hi:95,base:[2,4],iso:[6,8]},
    {lo:95,hi:100,base:[1,3],iso:[4,6]},
    {lo:90,hi:100,base:[1,3],iso:[4,6]}
  ]);

  const N=v=>{if(v===''||v==null)return null;const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:null};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const state=()=>{try{return typeof st!=='undefined'?st:W.st}catch(_){return W.st}};
  const ui=()=>{try{return typeof programUi!=='undefined'?programUi:null}catch(_){return null}};
  const program=id=>{const s=state();try{return typeof programById==='function'?programById(id):(s?.programs||[]).find(p=>String(p?.id)===String(id))||null}catch(_){return null}};
  const saveState=()=>{try{if(typeof save==='function')save();else W.save?.()}catch(_){}};
  const weekNo=(w,wi)=>Number(w?.n)||Number(wi)+1;
  const pair=(a,b,fallback)=>{let x=N(a),y=N(b);if(x==null)x=fallback?.[0]??null;if(y==null)y=fallback?.[1]??x;if(x==null||y==null)return [null,null];x=clamp(Math.round(x),1,50);y=clamp(Math.round(y),1,50);return [Math.min(x,y),Math.max(x,y)]};
  const label=r=>Array.isArray(r)&&r[0]!=null&&r[1]!=null?(r[0]===r[1]?String(r[0]):`${r[0]}–${r[1]}`):'–';
  const pctLabel=b=>Array.isArray(b)&&b[0]!=null&&b[1]!=null?`${String(b[0]).replace('.',',')}–${String(b[1]).replace('.',',')}%`:'интенсивность не задана';
  const approx=(a,b,t=.15)=>Math.abs(Number(a)-Number(b))<=t;

  function normalizeBand(a,b){
    let lo=N(a),hi=N(b);if(lo==null||hi==null)return null;
    if(lo>0&&lo<=1)lo*=100;if(hi>0&&hi<=1)hi*=100;
    lo=clamp(lo,40,100);hi=clamp(hi,40,100);
    return [Math.min(lo,hi),Math.max(lo,hi)]
  }
  function storedBand(p,wi){
    const w=p?.weeks?.[Number(wi)];if(!w)return null;
    const direct=normalizeBand(w.intensityMin??w.weekIntensityMin??w.intensity?.min,w.intensityMax??w.weekIntensityMax??w.intensity?.max);
    if(direct)return direct;
    try{
      const pr=W.unvrslWeekLoadProfileV263?.(p,Number(wi),true);
      return normalizeBand(pr?.intensityMin,pr?.intensityMax)
    }catch(_){return null}
  }
  function liveBand(p,wi){
    const u=ui();if(String(u?.pid)!==String(p?.id)||Number(u?.week||0)!==Number(wi))return null;
    const a=D.getElementById('pi261Min'),b=D.getElementById('pi261Max');
    return a&&b?normalizeBand(a.value,b.value):null
  }
  function bandFor(p,wi,useLive=true){return (useLive?liveBand(p,wi):null)||storedBand(p,wi)||[70,75]}
  function defaultsForBand(band){
    const b=band||[70,75],lo=Number(b[0]),hi=Number(b[1]);
    const exact=PRESETS.find(x=>approx(lo,x.lo)&&approx(hi,x.hi));if(exact)return exact;
    const mid=(lo+hi)/2;
    if(mid<=65)return PRESETS[0];
    if(mid<=70)return PRESETS[1];
    if(mid<=75)return PRESETS[2];
    if(mid<=80)return PRESETS[3];
    if(mid<=85)return PRESETS[4];
    if(mid<=88)return PRESETS[5];
    if(mid<=90)return PRESETS[6];
    if(mid<=95)return PRESETS[7];
    return PRESETS[8]
  }
  function defaultsFor(p,wi,useLive=true){return defaultsForBand(bandFor(p,wi,useLive))}
  function repProfile(p,wi,useLive=true){
    const w=p?.weeks?.[Number(wi)];if(!w)return null;
    const band=bandFor(p,wi,useLive),d=defaultsForBand(band),manual=w.repGuidanceManual===true;
    const base=manual?pair(w.baseRepMin,w.baseRepMax,d.base):d.base;
    const iso=manual?pair(w.isolationRepMin,w.isolationRepMax,d.iso):d.iso;
    return {week:weekNo(w,wi),band,baseRepMin:base[0],baseRepMax:base[1],isolationRepMin:iso[0],isolationRepMax:iso[1],manual}
  }
  function ensureWeek(p,wi,force=false){
    const w=p?.weeks?.[Number(wi)];if(!w)return false;
    if(w.repGuidanceManual===true&&!force)return false;
    const d=defaultsFor(p,wi,false);let changed=false;
    const set=(k,v)=>{if(w[k]!==v){w[k]=v;changed=true}};
    set('baseRepMin',d.base[0]);set('baseRepMax',d.base[1]);set('isolationRepMin',d.iso[0]);set('isolationRepMax',d.iso[1]);
    set('repGuidanceRevision',REV);set('repGuidanceAuto',true);if(force)set('repGuidanceManual',false);
    if(changed)p.updated=Date.now();return changed
  }
  function ensureProgram(p){if(!p?.weeks)return false;let changed=false;p.weeks.forEach((_,i)=>{if(ensureWeek(p,i,false))changed=true});if(changed)saveState();return changed}

  function patchWeekProfile(){
    const cur=W.unvrslWeekLoadProfileV263;if(typeof cur!=='function'||cur.__wrg269)return false;
    const wrapped=function(p,wi,useDefaults){const out=cur.apply(this,arguments);if(!out)return out;const rp=repProfile(p,wi,false);if(rp)Object.assign(out,rp);return out};
    wrapped.__wrg269=true;wrapped.__wrg269Base=cur;W.unvrslWeekLoadProfileV263=wrapped;return true
  }

  function ensureStyle(){
    if(D.getElementById('program-week-rep-guidance-v268-style'))return;
    const s=D.createElement('style');s.id='program-week-rep-guidance-v268-style';s.textContent=`
      .wrg268-box{margin-top:12px;padding:12px;border-radius:16px;background:#1a1a1d;border:1px solid #303034}.wrg268-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:9px}.wrg268-head b{font-size:13px}.wrg268-head span{color:var(--green);font-size:11px;font-weight:800;text-align:right}.wrg268-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.wrg268-grid .field{margin:0}.wrg268-help{margin-top:8px;color:#85858b;font-size:11px;line-height:1.4}.wrg268-current{margin-top:5px;color:#d5d5d9;font-size:11px;font-weight:750}
    `;D.head?.appendChild(s)
  }
  function currentContext(){const u=ui(),p=u?.pid?program(u.pid):null,wi=Number(u?.week)||0;return {u,p,wi,w:p?.weeks?.[wi]||null}}
  function field(id){return D.getElementById(id)}
  function setVal(id,v,force=false){const el=field(id);if(el&&v!=null&&(force||D.activeElement!==el))el.value=v}
  function fillFields(rp,force=false){if(!rp)return;setVal('wrg268BaseMin',rp.baseRepMin,force);setVal('wrg268BaseMax',rp.baseRepMax,force);setVal('wrg268IsoMin',rp.isolationRepMin,force);setVal('wrg268IsoMax',rp.isolationRepMax,force)}
  function updateBoxLabel(box,rp){const s=box?.querySelector('.wrg268-head span');if(s&&rp)s.textContent=`по ${pctLabel(rp.band)}`}
  function markRepInputs(box){
    ['wrg268BaseMin','wrg268BaseMax','wrg268IsoMin','wrg268IsoMax'].forEach(id=>{
      const el=field(id);if(!el||el.dataset.wrg269TouchBound==='1')return;el.dataset.wrg269TouchBound='1';
      el.addEventListener('input',e=>{if(e.isTrusted){box.dataset.manualTouched='1';box.dataset.manual='1'}},{passive:true})
    })
  }
  function saveFields(p,wi){
    const w=p?.weeks?.[Number(wi)],box=D.querySelector('.wrg268-box');if(!w)return false;
    const auto=box?.dataset.manual!=='1'&&box?.dataset.manualTouched!=='1',d=defaultsFor(p,wi,true);
    const b=auto?d.base:pair(field('wrg268BaseMin')?.value,field('wrg268BaseMax')?.value,d.base),i=auto?d.iso:pair(field('wrg268IsoMin')?.value,field('wrg268IsoMax')?.value,d.iso);
    w.baseRepMin=b[0];w.baseRepMax=b[1];w.isolationRepMin=i[0];w.isolationRepMax=i[1];w.repGuidanceRevision=REV;w.repGuidanceManual=!auto;w.repGuidanceAuto=auto;p.updated=Date.now();saveState();return true
  }
  function resetFieldsForWeek(p,wi,save=false){
    const w=p?.weeks?.[Number(wi)];if(!w)return;w.repGuidanceManual=false;w.repGuidanceAuto=true;
    const rp=repProfile(p,wi,true),box=D.querySelector('.wrg268-box');if(box){box.dataset.manual='0';box.dataset.manualTouched='0';updateBoxLabel(box,rp)}fillFields(rp,true);
    if(save){ensureWeek(p,wi,true);saveState()}
  }
  function applyWholeCycle(p){if(!p?.weeks)return;p.weeks.forEach((w,i)=>{w.repGuidanceManual=false;ensureWeek(p,i,true)});p.updated=Date.now();saveState()}
  function refreshFromIntensity(p,wi,{persist=false,force=false}={}){
    const w=p?.weeks?.[Number(wi)],box=D.querySelector('.wrg268-box');if(!w||!box)return false;
    const manual=box.dataset.manual==='1'||box.dataset.manualTouched==='1'||w.repGuidanceManual===true;
    const rp=repProfile(p,wi,true);updateBoxLabel(box,rp);
    if(!manual||force){
      const d=defaultsFor(p,wi,true),autoRp={...rp,baseRepMin:d.base[0],baseRepMax:d.base[1],isolationRepMin:d.iso[0],isolationRepMax:d.iso[1],manual:false};
      fillFields(autoRp,true);box.dataset.manual='0';box.dataset.manualTouched='0';
      if(persist){w.repGuidanceManual=false;w.repGuidanceAuto=true;w.baseRepMin=d.base[0];w.baseRepMax=d.base[1];w.isolationRepMin=d.iso[0];w.isolationRepMax=d.iso[1];w.repGuidanceRevision=REV;p.updated=Date.now();saveState()}
    }
    return true
  }

  function bindIntensityInputs(p,wi){
    ['pi261Min','pi261Max'].forEach(id=>{
      const el=field(id);if(!el||el.dataset.wrg269IntensityBound==='1')return;el.dataset.wrg269IntensityBound='1';
      el.addEventListener('input',()=>refreshFromIntensity(p,wi,{persist:false,force:true}),{passive:true});
      el.addEventListener('change',()=>refreshFromIntensity(p,wi,{persist:false,force:true}),{passive:true})
    })
  }
  function patchIntensityApi(){
    const preset=W.programWeekIntensityPresetV261;
    if(typeof preset==='function'&&!preset.__wrg269){
      const wrapped=function(){const r=preset.apply(this,arguments);setTimeout(()=>{const {p,wi}=currentContext();if(p)refreshFromIntensity(p,wi,{persist:false,force:true})},0);return r};
      wrapped.__wrg269=true;wrapped.__wrg269Base=preset;W.programWeekIntensityPresetV261=wrapped
    }
    const saveIntensity=W.programWeekIntensitySaveV261;
    if(typeof saveIntensity==='function'&&!saveIntensity.__wrg269){
      const wrapped=function(pid,wi){const r=saveIntensity.apply(this,arguments);setTimeout(()=>{const p=program(pid);if(p){ensureWeek(p,Number(wi),true);refreshFromIntensity(p,Number(wi),{persist:true,force:true})}},0);return r};
      wrapped.__wrg269=true;wrapped.__wrg269Base=saveIntensity;W.programWeekIntensitySaveV261=wrapped
    }
  }

  function bindWeekActions(card,p,wi){
    bindIntensityInputs(p,wi);patchIntensityApi();
    const saveBtn=[...card.querySelectorAll('button')].find(b=>(b.textContent||'').includes('Сохранить профиль недели'));
    if(saveBtn&&saveBtn.dataset.wrg269Save!=='1'){
      saveBtn.dataset.wrg269Save='1';saveBtn.addEventListener('click',()=>saveFields(p,wi),{capture:true})
    }
    const reset=card.querySelector('[data-wr264-week]');if(reset&&reset.dataset.wrg269Reset!=='1'){
      reset.dataset.wrg269Reset='1';reset.addEventListener('click',()=>resetFieldsForWeek(p,wi,false),{passive:true})
    }
    const cycle=card.querySelector('[data-wr264-cycle]');if(cycle&&cycle.dataset.wrg269Cycle!=='1'){
      cycle.dataset.wrg269Cycle='1';cycle.addEventListener('click',()=>applyWholeCycle(p),{capture:true})
    }
  }
  function injectWeekEditor(){
    ensureStyle();const {p,wi,w}=currentContext(),card=D.querySelector('#sheet .pi261-week'),host=card?.querySelector('.wr264-box');if(!p||!w||!card||!host)return false;
    ensureProgram(p);const rp=repProfile(p,wi,true),key=`${p.id}|${wi}`;let box=host.querySelector('.wrg268-box');
    if(box&&box.dataset.key===key){updateBoxLabel(box,rp);if(box.dataset.manual!=='1'&&box.dataset.manualTouched!=='1')fillFields(rp);markRepInputs(box);bindWeekActions(card,p,wi);return true}
    box?.remove();box=D.createElement('div');box.className='wrg268-box';box.dataset.key=key;box.dataset.manual=rp.manual?'1':'0';box.dataset.manualTouched='0';box.innerHTML=`
      <div class="wrg268-head"><b>Рекомендуемые повторы</b><span>по ${pctLabel(rp.band)}</span></div>
      <div class="wrg268-grid">
        <div class="field"><label>База · от</label><input id="wrg268BaseMin" type="number" min="1" max="50" value="${rp.baseRepMin}"></div>
        <div class="field"><label>База · до</label><input id="wrg268BaseMax" type="number" min="1" max="50" value="${rp.baseRepMax}"></div>
        <div class="field"><label>Изоляция · от</label><input id="wrg268IsoMin" type="number" min="1" max="50" value="${rp.isolationRepMin}"></div>
        <div class="field"><label>Изоляция · до</label><input id="wrg268IsoMax" type="number" min="1" max="50" value="${rp.isolationRepMax}"></div>
      </div>
      <div class="wrg268-help">Автоматически считаются от выбранной интенсивности недели. Номер недели задаёт только профиль. После подстановки повторы упражнения можно менять вручную.</div>`;
    const focus=host.querySelector('.wr264-focus');if(focus)focus.insertAdjacentElement('beforebegin',box);else host.appendChild(box);markRepInputs(box);bindWeekActions(card,p,wi);return true
  }

  function inferKind(name=''){
    const explicit=field('pmKind')?.value;if(explicit==='compound'||explicit==='isolation')return explicit;
    try{if(typeof W.programInferExerciseKind==='function')return W.programInferExerciseKind(name)}catch(_){ }
    const s=String(name).toLowerCase();return /(разгибан|сгибан|сведен|разведен|мах|кроссов|икр|дельт)/.test(s)?'isolation':'compound'
  }
  function exerciseDefaults(x,kind){const p=program(x?.pid),w=p?.weeks?.[Number(x?.wi)];if(!p||!w)return null;const rp=repProfile(p,Number(x.wi),true);return kind==='isolation'?[rp.isolationRepMin,rp.isolationRepMax]:[rp.baseRepMin,rp.baseRepMax]}
  function setExerciseReps(x,force=false){
    const min=field('pmReps'),max=field('pmRepsMax');if(!min)return;const existing=x?.existingIndex!==null&&x?.existingIndex!==undefined;if(existing&&!force)return;
    if(!force&&(min.dataset.wrg268Touched==='1'||max?.dataset.wrg268Touched==='1'))return;
    const kind=inferKind(x?.n||x?.name||''),d=exerciseDefaults(x,kind);if(!d)return;min.value=d[0];if(max)max.value=d[1];
    const p=program(x?.pid),band=p?bandFor(p,Number(x?.wi),true):null,line=D.querySelector('.wrg268-current');if(line)line.textContent=`Рекомендация ${pctLabel(band)}: ${kind==='isolation'?'изоляция':'база'} ${label(d)} повт.`;
    try{min.dispatchEvent(new Event('change',{bubbles:true}));max?.dispatchEvent(new Event('change',{bubbles:true}))}catch(_){ }
  }
  function decorateExercise(x){
    const min=field('pmReps');if(!min)return false;const existing=x?.existingIndex!==null&&x?.existingIndex!==undefined;
    if(min.dataset.wrg268TouchBound!=='1'){min.dataset.wrg268TouchBound='1';min.addEventListener('input',e=>{if(e.isTrusted)min.dataset.wrg268Touched='1'},{passive:true})}
    const max=field('pmRepsMax');if(max&&max.dataset.wrg268TouchBound!=='1'){max.dataset.wrg268TouchBound='1';max.addEventListener('input',e=>{if(e.isTrusted)max.dataset.wrg268Touched='1'},{passive:true})}
    let note=D.querySelector('.wrg268-current');if(!note){note=D.createElement('div');note.className='wrg268-current';const anchor=D.querySelector('.pr266-range-note')||max?.closest('.field')||min.closest('.field');anchor?.insertAdjacentElement('afterend',note)}
    const p=program(x?.pid),kind=inferKind(x?.n||x?.name||''),d=exerciseDefaults(x,kind),band=p?bandFor(p,Number(x?.wi),true):null;if(d)note.textContent=`Рекомендация ${pctLabel(band)}: ${kind==='isolation'?'изоляция':'база'} ${label(d)} повт.`;
    if(!existing)setExerciseReps(x,false);D.documentElement.dataset.wrg268Exercise=JSON.stringify({pid:x?.pid,wi:Number(x?.wi)||0,di:Number(x?.di)||0,n:x?.n||x?.name||'',existing:!!existing});return true
  }
  function patchExerciseForm(){
    let cur=null;try{cur=typeof programExerciseForm==='function'?programExerciseForm:W.programExerciseForm}catch(_){cur=W.programExerciseForm}
    if(typeof cur!=='function'||cur.__wrg269)return false;
    const wrapped=function(x){const r=cur.apply(this,arguments);setTimeout(()=>decorateExercise(x),0);return r};wrapped.__wrg269=true;wrapped.__wrg269Base=cur;W.programExerciseForm=wrapped;try{programExerciseForm=wrapped}catch(_){ }return true
  }
  function currentExerciseContext(){try{return JSON.parse(D.documentElement.dataset.wrg268Exercise||'null')}catch(_){return null}}
  function patchSetKind(){
    const cur=W.programSetKind;if(typeof cur!=='function'||cur.__wrg269)return false;
    const wrapped=function(kind){const r=cur.apply(this,arguments),x=currentExerciseContext();if(x&&!x.existing)setTimeout(()=>setExerciseReps(x,false),0);return r};wrapped.__wrg269=true;wrapped.__wrg269Base=cur;W.programSetKind=wrapped;return true
  }

  function install(){patchWeekProfile();patchIntensityApi();patchExerciseForm();patchSetKind();injectWeekEditor()}
  let q=false;function queue(){if(q)return;q=true;requestAnimationFrame(()=>{q=false;install()})}
  const mo=typeof MutationObserver==='function'?new MutationObserver(queue):null;mo?.observe(D.documentElement,{childList:true,subtree:true});
  for(const ev of ['unvrsl:modules-ready','unvrsl:app-ready','unvrsl:cloud-ready','unvrsl:training-engine-ready'])W.addEventListener?.(ev,queue,{passive:true});
  [0,100,300,700,1400,2600].forEach(ms=>setTimeout(queue,ms));setInterval(()=>{patchWeekProfile();patchIntensityApi();patchExerciseForm();patchSetKind();injectWeekEditor()},1200)
})();
