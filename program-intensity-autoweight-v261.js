'use strict';
(()=>{
  const W=window,D=document,REV=292;
  if(W.__unvrslProgramIntensityAutoWeightV261)return;
  W.__unvrslProgramIntensityAutoWeightV261=true;
  W.__unvrslProgramIntensityUiOnlyV292=true;

  const BUILTIN=Object.freeze({1:[70,75],2:[75,80],3:[80,85],4:[60,65],5:[85,88],6:[60,65],7:[88,90],8:[90,100]});
  const N=v=>{if(v===''||v==null)return null;const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:null};
  const num=v=>N(v)??0;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const state=()=>{try{return typeof st!=='undefined'?st:W.st}catch(_){return W.st}};
  const program=id=>{try{return typeof programById==='function'?programById(id):(state()?.programs||[]).find(p=>String(p?.id)===String(id))||null}catch(_){return null}};
  const ui=()=>{try{return typeof programUi!=='undefined'?programUi:null}catch(_){return null}};
  const base=n=>{try{return W.baseExerciseName?W.baseExerciseName(n):String(n||'').replace(/\s+—\s+.*$/,'').trim()}catch(_){return String(n||'')}};

  function normalizePct(v){const n=N(v);if(!(n>0))return null;return n>1?n/100:n}
  function weekBand(w){const lo=normalizePct(w?.intensityMin??w?.weekIntensityMin??w?.intensity?.min),hi=normalizePct(w?.intensityMax??w?.weekIntensityMax??w?.intensity?.max);return lo>0&&hi>0?[Math.min(lo,hi),Math.max(lo,hi)]:null}
  function weekBandPct(w){const b=weekBand(w);return b?[Math.round(b[0]*1000)/10,Math.round(b[1]*1000)/10]:null}
  function useWeekIntensity(w){return !!weekBand(w)&&w?.useIntensity!==false}
  function weightMode(e){if(e?.weightMode==='auto'||e?.weightMode==='manual')return e.weightMode;return (e?.sets||[]).some(s=>num(s?.w)>0)?'manual':'auto'}
  function saveState(){try{if(typeof save==='function')save();else W.save?.()}catch(_){}}
  function recalc(force=true){try{return W.trainingLoadModel292?.run?.(force)||W.trainingLoadModel258?.run?.(force)}catch(_){return null}}

  function style(){
    if(D.getElementById('program-intensity-autoweight-v261-style'))return;
    const s=D.createElement('style');s.id='program-intensity-autoweight-v261-style';s.textContent=`
      .pi261-week{margin:10px 0 14px;padding:14px 15px;border-radius:20px;background:#1b1b1e;border:1px solid #303034}
      .pi261-week-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.pi261-week-title{font-weight:800;font-size:15px}.pi261-band{color:var(--green);font-size:13px;font-weight:800}
      .pi261-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.pi261-grid .field{margin:0}.pi261-presets{display:flex;gap:6px;overflow:auto;padding:9px 0 2px;scrollbar-width:none}.pi261-presets::-webkit-scrollbar{display:none}
      .pi261-preset{white-space:nowrap;background:#29292d;border:1px solid #37373c;border-radius:999px;padding:7px 9px;font-size:11px;font-weight:750;color:#c8c8cd}.pi261-toggle{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:10px;padding-top:10px;border-top:1px solid #303034}.pi261-toggle input{width:22px;height:22px;accent-color:var(--green)}
      .pi261-note{color:#85858b;font-size:11px;line-height:1.4;margin-top:8px}.pi261-mode-note{font-size:11px;color:#85858b;margin-top:6px;line-height:1.35}.pi261-auto-input{opacity:.55}
    `;D.head?.appendChild(s)
  }

  function injectWeekCard(){
    style();const u=ui(),p=u?.pid?program(u.pid):null,wi=Number(u?.week)||0,w=p?.weeks?.[wi],sheet=D.getElementById('sheet'),bar=sheet?.querySelector('.weekbar');if(!p||!w||!bar)return;
    sheet.querySelector('.pi261-week')?.remove();const pct=weekBandPct(w),node=D.createElement('div');node.className='pi261-week';const lo=pct?.[0]??'',hi=pct?.[1]??'';
    node.innerHTML=`<div class="pi261-week-head"><div class="pi261-week-title">Интенсивность недели</div><div class="pi261-band">${pct?`${String(lo).replace('.',',')}–${String(hi).replace('.',',')}%`:'Не задана'}</div></div>
      <div class="pi261-grid"><div class="field"><label>От, %</label><input id="pi261Min" inputmode="decimal" placeholder="70" value="${lo}"></div><div class="field"><label>До, %</label><input id="pi261Max" inputmode="decimal" placeholder="75" value="${hi}"></div></div>
      <div class="pi261-presets"><button class="pi261-preset" onclick="programWeekIntensityPresetV261(60,65)">60–65%</button><button class="pi261-preset" onclick="programWeekIntensityPresetV261(70,75)">70–75%</button><button class="pi261-preset" onclick="programWeekIntensityPresetV261(75,80)">75–80%</button><button class="pi261-preset" onclick="programWeekIntensityPresetV261(80,85)">80–85%</button><button class="pi261-preset" onclick="programWeekIntensityPresetV261(85,88)">85–88%</button><button class="pi261-preset" onclick="programWeekIntensityPresetV261(88,90)">88–90%</button></div>
      <label class="pi261-toggle"><span><b>Учитывать при расчёте веса</b><div class="muted small">Считает единый training-load-model v292</div></span><input id="pi261Use" type="checkbox" ${w.useIntensity===false?'':'checked'}></label>
      <div class="pi261-note">Этот модуль только задаёт интенсивность и режим веса. Рекомендации и автовес рассчитывает один общий движок v292.</div>
      <button class="btn primary full" style="margin-top:11px" onclick="programWeekIntensitySaveV261('${String(p.id).replace(/'/g,"\\'")}',${wi})">Сохранить интенсивность</button>`;
    bar.insertAdjacentElement('afterend',node)
  }

  W.programWeekIntensityPresetV261=(lo,hi)=>{const a=D.getElementById('pi261Min'),b=D.getElementById('pi261Max');if(a)a.value=lo;if(b)b.value=hi};
  W.programWeekIntensitySaveV261=(pid,wi)=>{
    const p=program(pid),w=p?.weeks?.[Number(wi)];if(!p||!w)return;let lo=N(D.getElementById('pi261Min')?.value),hi=N(D.getElementById('pi261Max')?.value);
    if(lo==null&&hi==null){delete w.intensityMin;delete w.intensityMax;w.useIntensity=false}else{if(lo==null)lo=hi;if(hi==null)hi=lo;lo=clamp(lo,40,100);hi=clamp(hi,40,100);w.intensityMin=Math.min(lo,hi);w.intensityMax=Math.max(lo,hi);w.useIntensity=D.getElementById('pi261Use')?.checked!==false}
    p.updated=Date.now();saveState();try{typeof renderProgramEditor==='function'&&renderProgramEditor()}catch(_){}recalc(true)
  };

  function syncWeightUi(){const sel=D.getElementById('pmWeightMode'),input=D.getElementById('pmWeight');if(!sel||!input)return;const auto=sel.value==='auto';input.disabled=auto;input.classList.toggle('pi261-auto-input',auto);input.placeholder=auto?'Рассчитается автоматически':'Вес, кг';const note=D.getElementById('pi261WeightNote');if(note)note.textContent=auto?'Вес рассчитает единый движок v292 по истории, повторам, RPE и интенсивности недели.':'Заданный вес останется планом, v292 покажет рекомендацию отдельно.'}
  W.programWeightModeChangedV261=syncWeightUi;
  function injectWeightMode(x){style();const input=D.getElementById('pmWeight');if(!input||D.getElementById('pmWeightMode'))return;let e=null;if(x?.existingIndex!==null&&x?.existingIndex!==undefined)e=program(x.pid)?.weeks?.[x.wi]?.days?.[x.di]?.ex?.[x.existingIndex]||null;const mode=weightMode(e||x),field=input.closest('.field');if(!field)return;const wrap=D.createElement('div');wrap.className='field';wrap.innerHTML=`<label>Расчёт веса</label><select id="pmWeightMode" onchange="programWeightModeChangedV261()"><option value="auto" ${mode==='auto'?'selected':''}>Автовес</option><option value="manual" ${mode==='manual'?'selected':''}>Вручную</option></select><div id="pi261WeightNote" class="pi261-mode-note"></div>`;field.insertAdjacentElement('beforebegin',wrap);syncWeightUi()}

  function bindCurrentToProgram(p,w,d,wi){
    const cur=state()?.current;if(!cur||String(cur.programId||'')!==String(p?.id||''))return;const b=weekBand(w);cur.programWeekNumber=wi+1;cur.programWeekIntensityMin=b?b[0]*100:null;cur.programWeekIntensityMax=b?b[1]*100:null;cur.programWeekUseIntensity=useWeekIntensity(w);cur.programIntensityRevision=REV;
    const blocks=d?.ex||[];(cur.ex||[]).forEach(ex=>{const bn=base(ex?.n).toLowerCase(),src=blocks.find(b=>(ex?.sourceId&&b?.sourceId&&String(ex.sourceId)===String(b.sourceId))||base(b?.n).toLowerCase()===bn)||blocks.find(b=>bn.startsWith(base(b?.n).toLowerCase())),mode=weightMode(src);ex.programWeightMode=mode==='auto'?'autoweight':'prescribed';(ex.set||[]).forEach(s=>{if(mode==='auto')s.programW=0;else if(!(num(s.programW)>0)&&num(s.w)>0)s.programW=num(s.w)})});saveState()
  }
  W.programIntensityApplyV261=()=>recalc(true);

  function install(){
    style();let ok=false;
    try{
      if(typeof renderProgramEditor==='function'&&!renderProgramEditor.__pi261){const old=renderProgramEditor,wrapped=function(){const r=old.apply(this,arguments);setTimeout(injectWeekCard,0);return r};wrapped.__pi261=true;wrapped.__pi261Base=old;W.renderProgramEditor=wrapped;renderProgramEditor=wrapped;ok=true}
      if(typeof programExerciseForm==='function'&&!programExerciseForm.__pi261){const old=programExerciseForm,wrapped=function(x){const r=old.apply(this,arguments);setTimeout(()=>injectWeightMode(x),0);return r};wrapped.__pi261=true;wrapped.__pi261Base=old;W.programExerciseForm=wrapped;programExerciseForm=wrapped;ok=true}
      if(typeof saveProgramExercise==='function'&&!saveProgramExercise.__pi261){const old=saveProgramExercise,wrapped=function(pid,wi,di,nameToken,sourceId,bp,tg,eq,existingIndex){const mode=D.getElementById('pmWeightMode')?.value||null,input=D.getElementById('pmWeight');if(mode==='manual'&&!(N(input?.value)>0)){try{toast('Укажи вес или выбери Автовес')}catch(_){}return}if(mode==='auto'&&input)input.value='0';const r=old.apply(this,arguments),p=program(pid),d=p?.weeks?.[wi]?.days?.[di],idx=existingIndex===null||Number.isNaN(Number(existingIndex))?(d?.ex?.length||1)-1:Number(existingIndex),e=d?.ex?.[idx];if(e&&mode){e.weightMode=mode;if(mode==='auto')(e.sets||[]).forEach(s=>s.w=0);p.updated=Date.now();saveState()}return r};wrapped.__pi261=true;wrapped.__pi261Base=old;W.saveProgramExercise=wrapped;saveProgramExercise=wrapped;ok=true}
      if(typeof beginProgramDay==='function'&&!beginProgramDay.__pi261){const old=beginProgramDay,wrapped=function(pid,wi,di){const p=program(pid),w=p?.weeks?.[wi],d=w?.days?.[di];if(d)(d.ex||[]).forEach(e=>{const m=weightMode(e);e.weightMode=m;if(m==='auto')(e.sets||[]).forEach(s=>s.w=0)});const r=old.apply(this,arguments);if(p&&w&&d){bindCurrentToProgram(p,w,d,Number(wi));[40,180,600].forEach(ms=>setTimeout(()=>recalc(true),ms))}return r};wrapped.__pi261=true;wrapped.__pi261Base=old;W.beginProgramDay=wrapped;beginProgramDay=wrapped;ok=true}
      if(typeof addProgramWeek==='function'&&!addProgramWeek.__pi261){const old=addProgramWeek,wrapped=function(id){const p=program(id),prev=p?.weeks?.at?.(-1),b=weekBandPct(prev),use=prev?.useIntensity!==false,r=old.apply(this,arguments),nw=p?.weeks?.at?.(-1);if(nw&&b){nw.intensityMin=b[0];nw.intensityMax=b[1];nw.useIntensity=use;saveState()}return r};wrapped.__pi261=true;W.addProgramWeek=wrapped;addProgramWeek=wrapped;ok=true}
      if(typeof cloneBuiltInCycle==='function'&&!cloneBuiltInCycle.__pi261){const old=cloneBuiltInCycle,wrapped=function(){const before=(state()?.programs||[]).length,r=old.apply(this,arguments),list=state()?.programs||[],p=list.length>before?list[list.length-1]:null;if(p)(p.weeks||[]).forEach((w,i)=>{const b=BUILTIN[i+1];if(b){w.intensityMin=b[0];w.intensityMax=b[1];w.useIntensity=true}});if(p)saveState();return r};wrapped.__pi261=true;W.cloneBuiltInCycle=wrapped;cloneBuiltInCycle=wrapped;ok=true}
    }catch(e){console.warn('program intensity UI v292 install',e)}return ok
  }

  for(const name of ['unvrsl:modules-ready','unvrsl:app-ready','unvrsl:training-engine-ready','unvrsl:cloud-modules-settled'])W.addEventListener?.(name,()=>{install();setTimeout(injectWeekCard,0)},{passive:true});
  D.addEventListener?.('visibilitychange',()=>{if(!D.hidden)install()},{passive:true});
  [0,120,400,900,1800,3200].forEach(ms=>setTimeout(()=>{install();injectWeekCard()},ms));
})();