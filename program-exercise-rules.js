'use strict';
(()=>{
  if(window.__unvrslProgramExerciseRulesV162)return;
  window.__unvrslProgramExerciseRulesV162=true;
  window.__unvrslProgramParameterOverridesV381=true;window.__unvrslCanonicalProgramRepsV386=true;

  const TEMPOS=['2-0-2','2-1-1','3-1-2','4-1-2','2-0-X'];
  const METHODS=[
    ['STANDARD','Обычные'],
    ['UNVRSL','UNVRSL'],
    ['SLDR','SLDR'],
    ['DS','Дроп-сет'],
    ['FST-7','FST-7']
  ];
  const METHOD_LABEL=Object.fromEntries(METHODS);
  const METHOD_HINT={
    STANDARD:'Обычные рабочие подходы.',
    UNVRSL:'3 раунда: тяжёлая тройка → 30 секунд → лёгкая девятка. После них – средние подходы.',
    SLDR:'Несколько мини-подходов на одном весе, пауза 15 секунд, повторения уменьшаются.',
    DS:'Последовательное снижение веса практически без отдыха.',
    'FST-7':'7 подходов по 8–15 повторений, отдых 20–40 секунд.'
  };
  const INNER_REST={STANDARD:null,UNVRSL:30,SLDR:15,DS:0,'FST-7':30};

  const style=document.createElement('style');
  style.id='program-exercise-rules-v162-style';
  style.textContent=`
    #modal.px-program-modal,#modal.px-exercise-modal{align-items:stretch;background:#050505}
    #modal.px-program-modal .sheet,#modal.px-exercise-modal .sheet{width:100%;max-width:760px;height:100dvh;max-height:none;border-radius:0;padding:0 18px calc(28px + env(safe-area-inset-bottom));background:#111113}
    .px-editor-head,.px-exercise-head{position:sticky;top:0;z-index:8;display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 -18px;padding:calc(12px + env(safe-area-inset-top)) 18px 14px;background:rgba(17,17,19,.96);backdrop-filter:blur(18px);border-bottom:1px solid #29292e}
    .px-editor-head h2,.px-exercise-head h2{margin:0;font-size:27px;line-height:1.05;overflow-wrap:anywhere}.px-head-copy{min-width:0}.px-head-copy .muted{margin-top:5px}.px-head-actions{display:flex;gap:8px;flex:0 0 auto}.px-icon-btn{width:48px;height:48px;border-radius:16px;background:#26262a;border:1px solid #37373d;display:grid;place-items:center;font-size:21px;font-weight:800}.px-done{padding:13px 16px;border-radius:16px;background:var(--green);color:#061108;font-weight:820}
    .px-week-wrap{position:sticky;top:calc(75px + env(safe-area-inset-top));z-index:7;margin:0 -18px;padding:12px 18px;background:linear-gradient(#111113 82%,rgba(17,17,19,0))}.px-week-wrap .weekbar{padding-bottom:10px}
    .px-program-section{margin:12px 2px 8px;color:#77777d;font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
    .px-day{padding:0!important;overflow:hidden;border-radius:24px!important}.px-day-head{width:100%;display:flex;align-items:center;gap:12px;padding:18px;text-align:left}.px-day-title{font-size:20px;font-weight:800}.px-day-chevron{color:#777;font-size:22px;transition:transform .2s}.px-day.open .px-day-chevron{transform:rotate(180deg)}.px-day-menu{margin-left:auto}.px-day-body{padding:0 14px 15px;border-top:1px solid #2b2b30}.px-day-actions{display:grid;grid-template-columns:1fr auto;gap:8px;margin-top:12px}.px-add-exercise{min-height:50px;border-radius:16px;background:var(--green);color:#061108;font-weight:820}.px-add-super{min-width:120px;border-radius:16px;background:#28282c;border:1px solid #38383d;font-weight:760}.px-empty{padding:19px 4px 7px;color:#85858b;line-height:1.45}.px-add-day{margin:12px 0 26px;min-height:52px}.px-program-ex{padding:14px 2px;border-bottom:1px solid #2b2b30}.px-program-ex:last-of-type{border-bottom:0}.px-ex-title{font-size:16px;font-weight:780}.px-ex-meta{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.px-meta-chip{padding:5px 8px;border-radius:999px;background:#29292d;color:#a9a9af;font-size:11px;font-weight:720}.px-meta-chip.kind{color:#64d2ff;background:rgba(100,210,255,.12)}.px-meta-chip.method{color:var(--green);background:color-mix(in srgb,var(--green) 13%,transparent)}.px-ex-controls{display:flex;gap:6px;margin-top:10px}.px-ex-controls button{padding:7px 10px;border-radius:11px;background:#27272b;color:#aaa;font-size:12px}.px-ex-controls .danger-text{color:var(--red)}
    .px-choice-section{margin-top:20px}.px-choice-label{color:#929298;font-size:14px;margin:0 2px 9px}.px-segment{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.px-segment.methods{grid-template-columns:repeat(3,minmax(0,1fr))}.px-choice{min-height:48px;padding:10px;border-radius:15px;background:#1b1b1e;border:1px solid #34343a;color:#b0b0b6;font-weight:730}.px-choice.on{background:rgba(10,132,255,.18);border-color:#0a84ff;color:#64b5ff}.px-choice.recommended:after{content:'•';color:var(--green);margin-left:5px}.px-main-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 12px;margin-top:12px}.px-main-grid .field{min-width:0}.px-main-grid input{font-size:18px}.px-span-2{grid-column:1/-1}.px-method-fields{grid-column:1/-1;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 12px;padding:4px 12px 2px;margin-top:8px;border-radius:18px;background:#19191c;border:1px solid #2d2d32}.px-method-fields .px-method-subtitle{grid-column:1/-1;color:#9a9aa0;font-size:12px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;margin:12px 2px 0}.px-tempo-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.px-tempo{min-height:44px;border-radius:13px;background:#1c1c1f;border:1px solid #34343a;color:#aaa;font-weight:750}.px-tempo.on{border-color:var(--green);background:color-mix(in srgb,var(--green) 13%,#1c1c1f);color:var(--green)}.px-custom-tempo{margin-top:8px}.px-tempo-help,.px-auto-help,.px-method-info{font-size:12px;color:#7f7f86;line-height:1.45;margin-top:7px}.px-method-info{padding:13px 14px;background:#202024;border:1px solid #303036;border-radius:15px;color:#b5b5bb}.px-method-info.warn{border-color:rgba(255,159,10,.45);color:#ffb340}.px-rest-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.px-rest-toggle,.px-mode-toggle{display:flex;padding:3px;background:#26262a;border-radius:12px}.px-rest-toggle button,.px-mode-toggle button{padding:8px 11px;border-radius:9px;color:#929298;font-size:12px;font-weight:780}.px-rest-toggle button.on,.px-mode-toggle button.on{background:#45454b;color:#fff}.px-rest-auto input:disabled{opacity:.72;color:#64b5ff}
    .px-inherited-card{margin:16px 0 4px;padding:14px 15px;border-radius:18px;background:linear-gradient(145deg,rgba(191,90,242,.14),rgba(10,132,255,.08));border:1px solid rgba(191,90,242,.3)}.px-inherited-top{display:flex;align-items:center;justify-content:space-between;gap:10px}.px-inherited-top b{font-size:14px}.px-inherited-top span{color:#bf5af2;font-size:12px;font-weight:820}.px-inherited-values{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}.px-inherited-values span{padding:5px 8px;border-radius:999px;background:rgba(255,255,255,.06);color:#b9b9c0;font-size:11px;font-weight:720}
    .px-parameter-card{margin-top:12px;padding:15px;border-radius:20px;background:#19191c;border:1px solid #303036}.px-parameter-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.px-parameter-title{font-size:15px;font-weight:820}.px-parameter-sub{margin-top:3px;color:#77777e;font-size:11px;line-height:1.35}.px-range-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:12px}.px-range-grid .field{margin:0}.px-parameter-card input:disabled{opacity:1;color:#9b9ba2;-webkit-text-fill-color:#9b9ba2}.px-parameter-card input::placeholder{color:#9b9ba2!important;opacity:.55!important;font-weight:720}.px-parameter-card[data-mode="auto"] .px-tempo-grid,.px-parameter-card[data-mode="auto"] .px-effort-type{opacity:.58}.px-effort-type{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}.px-effort-type button{min-height:42px;border-radius:13px;background:#242428;color:#8f8f96;font-weight:780}.px-effort-type button.on{background:rgba(191,90,242,.18);color:#d58aff;border:1px solid rgba(191,90,242,.55)}.px-auto-caption{margin-top:9px;color:#86868d;font-size:12px;line-height:1.4}.px-auto-caption b{color:#c9c9ce}.px-weight-grid{display:grid;grid-template-columns:1fr;gap:10px;margin-top:12px}.px-comment{margin-top:18px}.px-save-wrap{position:sticky;bottom:0;z-index:9;margin:20px -18px 0;padding:12px 18px calc(12px + env(safe-area-inset-bottom));background:linear-gradient(rgba(17,17,19,0),#111113 24%)}.px-save-exercise{min-height:58px;font-size:18px;border-radius:18px}.px-action-list{display:grid;gap:9px;margin-top:18px}.px-action-list .btn{width:100%;min-height:52px;text-align:left}.px-action-list .danger{color:var(--red)}
    @media(max-width:390px){.px-segment.methods{grid-template-columns:repeat(2,minmax(0,1fr))}.px-main-grid{gap:0 8px}.px-tempo-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.px-editor-head h2,.px-exercise-head h2{font-size:24px}}
  `;
  document.head.appendChild(style);

  function numberValue(id,fallback=0){
    const el=document.getElementById(id),n=Number(String(el?.value??'').replace(',','.'));
    return Number.isFinite(n)?n:fallback
  }
  function roundProgramLoad(v){return typeof roundLoad==='function'?roundLoad(v,2.5):Math.round(v/2.5)*2.5}
  function kindLabel(k){return k==='isolation'?'Изоляция':'База'}
  function inferKind(name=''){
    const s=String(name).toLowerCase();
    const isolation=['разгибан','сгибан','сведен','разведен','махи','подъём на носки','подъем на носки','отведен','приведен','кроссовер','пуловер','скручиван','планка','каната к лицу','бабочка'];
    return isolation.some(x=>s.includes(x))?'isolation':'compound'
  }
  window.programInferExerciseKind=inferKind;
  function autoRest(kind,method){
    if(method==='DS')return kind==='compound'?120:75;
    if(method==='FST-7')return kind==='compound'?90:45;
    return kind==='compound'?150:75
  }
  window.programAutoRest=autoRest;
  function recommendedTempo(kind){return kind==='compound'?'2-1-1':'3-1-2'}
  function tempoChooser(target,label,value){
    const custom=!TEMPOS.includes(value);
    return `<div class="px-choice-section" data-tempo-section="${target}"><div class="px-choice-label">${label}</div><input id="${target}" type="hidden" value="${esc(value)}"><div class="px-tempo-grid">${TEMPOS.map(t=>`<button type="button" class="px-tempo ${t===value?'on':''}" data-tempo-value="${t}" onclick="programChooseTempo('${target}','${t}')">${t}</button>`).join('')}<button type="button" class="px-tempo ${custom?'on':''}" data-tempo-value="CUSTOM" onclick="programChooseTempo('${target}','CUSTOM')">Свой</button></div><input id="${target}Custom" class="px-custom-tempo" value="${custom?esc(value):''}" placeholder="Например, 3-0-1" ${custom?'':'hidden'} oninput="programCustomTempo('${target}',this.value)"><div class="px-tempo-help">Негатив · пауза · позитив. X означает максимально быстрое движение.</div></div>`
  }
  function methodButtons(method){return METHODS.map(([id,title])=>`<button type="button" class="px-choice ${id===method?'on':''}" data-method="${id}" onclick="programSetMethod('${id}')">${title}</button>`).join('')}
  function kindButtons(kind){return `<button type="button" class="px-choice ${kind==='compound'?'on':''}" data-kind="compound" onclick="programSetKind('compound')">Базовое</button><button type="button" class="px-choice ${kind==='isolation'?'on':''}" data-kind="isolation" onclick="programSetKind('isolation')">Изолирующее</button>`}

  const nullableNumber=v=>{if(v===''||v==null)return null;const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:null};
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  const orderedPair=(a,b,fallback=[null,null])=>{
    let lo=nullableNumber(a),hi=nullableNumber(b);if(lo==null)lo=nullableNumber(fallback?.[0]);if(hi==null)hi=nullableNumber(fallback?.[1]??lo);
    return lo==null||hi==null?[null,null]:[Math.min(lo,hi),Math.max(lo,hi)]
  };
  const fmt=v=>v==null?'–':Number(v).toFixed(1).replace('.0','').replace('.',',');
  const rangeLabel=(a,b)=>a==null||b==null?'–':Math.abs(Number(a)-Number(b))<.001?fmt(a):`${fmt(a)}–${fmt(b)}`;
  function repDefaultsFromIntensity(w,kind){
    let lo=nullableNumber(w?.intensityMin),hi=nullableNumber(w?.intensityMax);if(lo!=null&&lo<=1)lo*=100;if(hi!=null&&hi<=1)hi*=100;
    const mid=((lo??70)+(hi??75))/2,table=kind==='isolation'?[[65,15,20],[70,12,15],[75,12,15],[80,10,12],[85,8,12],[88,8,10],[90,6,10],[95,6,8],[101,4,6]]:[[65,12,15],[70,10,12],[75,8,10],[80,6,8],[85,5,7],[88,4,6],[90,3,5],[95,2,4],[101,1,3]];
    const row=table.find(x=>mid<=x[0])||table.at(-1);return[row[1],row[2]]
  }
  function weeklyDefaults(pid,wi,kind){
    const p=programById(pid),w=p?.weeks?.[Number(wi)]||{},profile=typeof window.unvrslWeekLoadProfileV263==='function'?window.unvrslWeekLoadProfileV263(p,Number(wi),true):null;
    const fallbackReps=repDefaultsFromIntensity(w,kind),reps=orderedPair(kind==='isolation'?(profile?.isolationRepMin??w.isolationRepMin):(profile?.baseRepMin??w.baseRepMin),kind==='isolation'?(profile?.isolationRepMax??w.isolationRepMax):(profile?.baseRepMax??w.baseRepMax),fallbackReps);
    const rpe=orderedPair(profile?.rpeMin??w.rpeMin,profile?.rpeMax??w.rpeMax,[7,8]),rir=[Math.max(0,10-rpe[1]),Math.max(0,10-rpe[0])];
    const rest=orderedPair(kind==='isolation'?(profile?.isolationRestMin??w.isolationRestMin):(profile?.baseRestMin??w.baseRestMin),kind==='isolation'?(profile?.isolationRestMax??w.isolationRestMax):(profile?.baseRestMax??w.baseRestMax),[autoRest(kind,'STANDARD'),autoRest(kind,'STANDARD')]);
    return {week:Number(w?.n)||Number(wi)+1,reps,rpe,rir,tempo:String(profile?.tempo||w.tempo||recommendedTempo(kind)),rest,intensity:orderedPair(profile?.intensityMin??w.intensityMin,profile?.intensityMax??w.intensityMax,[70,75])}
  }
  function legacyMode(e,key,isNew){
    if(key==='reps'&&['auto','manual','method'].includes(e?.reps?.mode))return e.reps.mode;
    const saved=e?.parameterOverrides?.[key]?.mode;if(saved==='auto'||saved==='manual'||saved==='method')return saved;
    if(key==='effort'&&(e?.effortSourceMode||e?.rpeMode))return e.effortSourceMode||e.rpeMode;
    if(key==='tempo'&&e?.tempoMode)return e.tempoMode;
    if(key==='rest'&&e?.restMode)return e.restMode;
    if(key==='weight'&&e?.weightMode)return e.weightMode;
    if(isNew)return'auto';
    if(key==='weight')return(e?.sets||[]).some(s=>nullableNumber(s?.w)>0)?'manual':'auto';
    return'manual'
  }
  function manualValue(e,key,name,fallback){const v=e?.parameterOverrides?.[key]?.[name];return v!=null?v:fallback}
  function resolvedParameters(pid,wi,e={}){
    const kind=e.kind||inferKind(e.n||''),defaults=weeklyDefaults(pid,wi,kind),method=String(e.method||'STANDARD').toUpperCase(),overrides=e.parameterOverrides||{},canonical=e.reps||{};
    const repMode=method==='UNVRSL'||method==='SLDR'?'method':legacyMode(e,'reps',false),repManual=orderedPair(canonical.min,canonical.max,defaults.reps),reps=repMode==='manual'?repManual:defaults.reps;
    const effortMode=legacyMode(e,'effort',false),effortType=String(overrides.effort?.type||e.effortType||'rpe').toLowerCase()==='rir'?'rir':'rpe';
    const ownRpe=orderedPair(manualValue(e,'effort','rpeMin',e.rpeMin??e.rpe),manualValue(e,'effort','rpeMax',e.rpeMax??e.rpe),defaults.rpe),ownRir=orderedPair(manualValue(e,'effort','rirMin',e.rirMin),manualValue(e,'effort','rirMax',e.rirMax),defaults.rir);
    const rpe=effortMode==='manual'?(effortType==='rir'?[Math.max(0,10-ownRir[1]),Math.max(0,10-ownRir[0])]:ownRpe):defaults.rpe,rir=[Math.max(0,10-rpe[1]),Math.max(0,10-rpe[0])];
    const tempoMode=legacyMode(e,'tempo',false),tempo=tempoMode==='manual'?String(manualValue(e,'tempo','value',e.tempo)||defaults.tempo):defaults.tempo;
    const restMode=legacyMode(e,'rest',false),restManual=orderedPair(manualValue(e,'rest','min',e.restMin??e.rest),manualValue(e,'rest','max',e.restMax??e.rest),defaults.rest),rest=restMode==='manual'?restManual:defaults.rest,restValue=Math.round(((rest[0]+rest[1])/2)/15)*15;
    const weightMode=legacyMode(e,'weight',false),weight=weightMode==='manual'?Math.max(0,nullableNumber(manualValue(e,'weight','value',e.sets?.[0]?.w))||0):0;
    return {kind,method,defaults,reps:{mode:repMode,min:reps[0],max:reps[1]},effort:{mode:effortMode,type:effortType,rpeMin:rpe[0],rpeMax:rpe[1],rirMin:rir[0],rirMax:rir[1]},tempo:{mode:tempoMode,value:tempo},rest:{mode:restMode,min:rest[0],max:rest[1],value:restValue},weight:{mode:weightMode,value:weight}}
  }
  window.programResolveExerciseParametersV381=resolvedParameters;
  function sourceToggle(key,mode){return `<div class="px-mode-toggle"><button type="button" data-parameter-mode="${key}:auto" class="${mode==='auto'?'on':''}" onclick="programSetParameterModeV381('${key}','auto')">Авто</button><button type="button" data-parameter-mode="${key}:manual" class="${mode==='manual'?'on':''}" onclick="programSetParameterModeV381('${key}','manual')">Вручную</button></div>`}
  function parameterRangeInputs(prefix,mode,manual,fallback,min,max,step=1){const auto=mode==='auto';return `<div class="px-range-grid"><div class="field"><label>От</label><input id="${prefix}Min" type="number" min="${min}" max="${max}" step="${step}" value="${auto?'':manual[0]}" placeholder="${fallback[0]}" data-auto-value="${fallback[0]}" ${auto?'disabled':''}></div><div class="field"><label>До</label><input id="${prefix}Max" type="number" min="${min}" max="${max}" step="${step}" value="${auto?'':manual[1]}" placeholder="${fallback[1]}" data-auto-value="${fallback[1]}" ${auto?'disabled':''}></div></div>`}
  function modeInput(key){return document.getElementById(`pm${key[0].toUpperCase()+key.slice(1)}Mode`)}
  function syncModeUi(key,mode,focus=true){
    const hidden=modeInput(key),card=document.querySelector(`[data-parameter-card="${key}"]`);if(hidden)hidden.value=mode;if(!card)return;card.dataset.mode=mode;
    card.querySelectorAll('[data-parameter-mode]').forEach(b=>b.classList.toggle('on',b.dataset.parameterMode===`${key}:${mode}`));
    card.querySelectorAll('input[data-auto-value],button[data-tempo-value]').forEach(el=>{if(el.matches('input')){if(mode==='auto'){if(el.value!=='')el.dataset.manualValue=el.value;el.value='';el.disabled=true}else{el.disabled=false;if(!el.value)el.value=el.dataset.manualValue||el.dataset.autoValue||''}}else el.disabled=mode==='auto'});
    if(key==='weight'){const input=document.getElementById('pmWeight');if(input){if(mode==='auto'){if(input.value)input.dataset.manualValue=input.value;input.value='';input.disabled=true}else{input.disabled=false;if(!input.value)input.value=input.dataset.manualValue||''}}}
    if(key==='tempo'){const custom=document.getElementById('pmTempoCustom');if(custom)custom.disabled=mode==='auto'}
    if(mode==='manual'&&focus){setTimeout(()=>card.querySelector('input:not([type="hidden"]):not(:disabled)')?.focus(),0)}
  }
  window.programSetParameterModeV381=function(key,mode){syncModeUi(key,mode,true)};
  window.programSetEffortTypeV381=function(type){
    const input=document.getElementById('pmEffortType');if(!input)return;input.value=type;document.querySelectorAll('[data-effort-type]').forEach(b=>b.classList.toggle('on',b.dataset.effortType===type));
    document.querySelectorAll('[data-effort-fields]').forEach(el=>el.classList.toggle('hidden',el.dataset.effortFields!==type))
  };

  window.programChooseTempo=function(target,value){
    const hidden=document.getElementById(target),custom=document.getElementById(target+'Custom');if(!hidden||!custom)return;
    if(value==='CUSTOM'){custom.hidden=false;hidden.value=custom.value.trim()||recommendedTempo(document.getElementById('pmKind')?.value);setTimeout(()=>custom.focus(),0)}
    else{hidden.value=value;custom.hidden=true}
    document.querySelectorAll(`[data-tempo-section="${target}"] .px-tempo`).forEach(b=>b.classList.toggle('on',b.dataset.tempoValue===(value==='CUSTOM'?'CUSTOM':value)))
  };
  window.programCustomTempo=function(target,value){const hidden=document.getElementById(target);if(hidden)hidden.value=value.trim()};
  window.programSetKind=function(kind){
    const input=document.getElementById('pmKind');if(!input)return;input.value=kind;
    document.querySelectorAll('[data-kind]').forEach(b=>b.classList.toggle('on',b.dataset.kind===kind));
    programRefreshInheritedV381();
    programRefreshMethodUi(false)
  };
  window.programSetMethod=function(method){
    const input=document.getElementById('pmMethod');if(!input)return;input.value=method;
    document.querySelectorAll('[data-method]').forEach(b=>b.classList.toggle('on',b.dataset.method===method));
    programRefreshMethodUi(true)
  };
  window.programMethodDefaults=function(method){programSetMethod(method)};
  window.programSetRestMode=function(mode){
    programSetParameterModeV381('rest',mode)
  };
  window.programUpdateAutoRest=function(){
    programRefreshInheritedV381()
  };
  window.programRefreshMethodUi=function(applyDefaults=false){
    const method=document.getElementById('pmMethod')?.value||'STANDARD',kind=document.getElementById('pmKind')?.value||'compound';
    const sets=document.getElementById('pmSets');
    if(applyDefaults&&sets)sets.value=method==='UNVRSL'?3:method==='SLDR'?3:method==='DS'?5:method==='FST-7'?7:Math.min(5,Math.max(1,numberValue('pmSets',3)));
    document.getElementById('pmSetsField')?.classList.toggle('hidden',method!=='STANDARD');
    document.getElementById('pmRepsSection')?.classList.toggle('hidden',method==='UNVRSL'||method==='SLDR');
    const repsMode=modeInput('reps');if(repsMode){if(method==='UNVRSL'||method==='SLDR')repsMode.value='method';else if(repsMode.value==='method')syncModeUi('reps','auto',false)}
    document.getElementById('pmTempoGeneral')?.classList.toggle('hidden',method==='UNVRSL');
    document.getElementById('pmTempoUnvrsl')?.classList.toggle('hidden',method!=='UNVRSL');
    document.getElementById('pmUnvrslFields')?.classList.toggle('hidden',method!=='UNVRSL');
    document.getElementById('pmSldrFields')?.classList.toggle('hidden',method!=='SLDR');
    const hint=document.getElementById('methodHint');
    if(hint){const warning=(method==='FST-7'||method==='DS')&&kind==='compound';hint.className='px-method-info'+(warning?' warn':'');hint.textContent=(METHOD_HINT[method]||'')+(warning?' Для базового упражнения метод лучше использовать только осознанно.':'')}
    const inner=document.getElementById('pmInnerRest');if(inner){const v=INNER_REST[method];inner.textContent=v==null?'Внутри метода нет отдельной паузы.':v===0?'Внутри метода: без отдыха.':`Внутри метода: ${v} сек.`}
    programRefreshInheritedV381()
  };

  window.programRefreshInheritedV381=function(){
    const x=window.__programExerciseContextV381;if(!x)return;const kind=document.getElementById('pmKind')?.value||inferKind(x.n),d=weeklyDefaults(x.pid,x.wi,kind);
    const values={pmReps:[d.reps[0],d.reps[1]],pmRpe:[d.rpe[0],d.rpe[1]],pmRir:[d.rir[0],d.rir[1]],pmRest:[d.rest[0],d.rest[1]]};
    Object.entries(values).forEach(([prefix,pair])=>['Min','Max'].forEach((suffix,i)=>{const el=document.getElementById(prefix+suffix);if(el){el.dataset.autoValue=pair[i];el.placeholder=pair[i]}}));
    const tempo=document.getElementById('pmTempo');if(tempo&&modeInput('tempo')?.value==='auto'){tempo.value=d.tempo;document.querySelectorAll('[data-tempo-section="pmTempo"] .px-tempo').forEach(b=>b.classList.toggle('on',b.dataset.tempoValue===(TEMPOS.includes(d.tempo)?d.tempo:'CUSTOM')))}
    const card=document.getElementById('pxInheritedCard');if(card)card.innerHTML=`<div class="px-inherited-top"><b>Настройки недели</b><span>W${d.week} · применяются автоматически</span></div><div class="px-inherited-values"><span>${kindLabel(kind)}</span><span>Повторы ${rangeLabel(...d.reps)}</span><span>RPE ${rangeLabel(...d.rpe)}</span><span>RIR ${rangeLabel(...d.rir)}</span><span>Темп ${esc(d.tempo)}</span><span>Отдых ${rangeLabel(...d.rest)} сек</span></div>`;
    const restCaption=document.getElementById('pmRestHelp');if(restCaption)restCaption.innerHTML=`Авто из W${d.week}: <b>${rangeLabel(...d.rest)} сек</b> для ${kindLabel(kind).toLowerCase()}. В таймер передаётся среднее значение.`
  };

  window.programExerciseForm=function(x){
    const d=programById(x.pid)?.weeks?.[x.wi]?.days?.[x.di],e=x.existingIndex!==null&&x.existingIndex!==undefined?d?.ex?.[x.existingIndex]:null;
    const method=e?.method||'STANDARD',kind=e?.kind||inferKind(x.n),defaults=weeklyDefaults(x.pid,x.wi,kind),first=e?.sets?.[0]||{},second=e?.sets?.[1]||{},isNew=!e;
    const repsMode=method==='UNVRSL'||method==='SLDR'?'method':legacyMode(e,'reps',isNew),effortMode=legacyMode(e,'effort',isNew),tempoMode=legacyMode(e,'tempo',isNew),restMode=legacyMode(e,'rest',isNew),weightMode=legacyMode(e,'weight',isNew);
    const repsManual=orderedPair(e?.reps?.min,e?.reps?.max,defaults.reps),rpeManual=orderedPair(manualValue(e,'effort','rpeMin',e?.rpeMin??e?.rpe),manualValue(e,'effort','rpeMax',e?.rpeMax??e?.rpe),defaults.rpe),rirManual=orderedPair(manualValue(e,'effort','rirMin',e?.rirMin),manualValue(e,'effort','rirMax',e?.rirMax),defaults.rir),restManual=orderedPair(manualValue(e,'rest','min',e?.restMin??e?.rest),manualValue(e,'rest','max',e?.restMax??e?.rest),defaults.rest);
    const effortType=String(e?.parameterOverrides?.effort?.type||e?.effortType||'rpe').toLowerCase()==='rir'?'rir':'rpe',tempo=String(manualValue(e,'tempo','value',e?.tempo)||defaults.tempo),tempoLight=e?.tempoLight||second.tempo||'3-1-2',weight=Math.max(0,nullableNumber(manualValue(e,'weight','value',first.w))||0);
    const heavyReps=e?.heavyReps||first.r||3,lightReps=e?.lightReps||second.r||9,lightWeight=e?.lightWeight??second.w??roundProgramLoad((first.w||0)*.85);
    const middle=e?.sets?.find(set=>set?.role==='middle')||e?.sets?.[6]||{},middleCount=e?.middleSets??(e?.sets?.filter(set=>set?.role==='middle').length||2);
    const middleWeight=e?.middleWeight??middle.w??roundProgramLoad(((first.w||0)+(lightWeight||0))/2),middleReps=e?.middleReps??middle.r??6;
    const sldrCount=e?.miniSets??(e?.sets?.length||3),sldrDrop=e?.repDrop??Math.max(1,(Number(first.r||12)-Number(e?.sets?.[1]?.r||10))||2);
    window.__programExerciseContextV381=x;
    modal(`<div class="px-exercise-head"><button class="px-icon-btn" onclick="openProgramEditor('${x.pid}',${x.wi},${x.di})">←</button><div class="px-head-copy grow"><h2>${esc(x.n)}</h2><div class="muted">Настройка упражнения</div></div></div>
      <input id="pmKind" type="hidden" value="${kind}"><input id="pmMethod" type="hidden" value="${method}"><input id="pmRepsMode" type="hidden" value="${repsMode}"><input id="pmEffortMode" type="hidden" value="${effortMode}"><input id="pmEffortType" type="hidden" value="${effortType}"><input id="pmTempoMode" type="hidden" value="${tempoMode}"><input id="pmRestMode" type="hidden" value="${restMode}"><input id="pmWeightMode" type="hidden" value="${weightMode}">
      <div id="pxInheritedCard" class="px-inherited-card"></div>
      <div class="px-choice-section"><div class="px-choice-label">Вид упражнения</div><div class="px-segment">${kindButtons(kind)}</div></div>
      <div class="px-choice-section"><div class="px-choice-label">Метод выполнения</div><div class="px-segment methods">${methodButtons(method)}</div></div>
      <div class="px-main-grid">
        <div class="field" id="pmSetsField"><label>Подходов</label><input id="pmSets" type="number" min="1" max="10" value="${e?.sets?.length||3}"></div>
        <div id="pmUnvrslFields" class="px-method-fields">
          <div class="px-method-subtitle">3 тяжёло-лёгких раунда</div>
          <div class="field"><label>Тяжёлых повторов</label><input id="pmHeavyReps" type="number" min="1" max="10" value="${heavyReps}"></div>
          <div class="field"><label>Лёгких повторов</label><input id="pmLightReps" type="number" min="1" max="30" value="${lightReps}"></div>
          <div class="field px-span-2"><label>Лёгкий вес, кг</label><input id="pmLightWeight" inputmode="decimal" value="${lightWeight}"></div>
          <div class="px-method-subtitle">Средние подходы после раундов</div>
          <div class="field"><label>Подходов</label><input id="pmMiddleSets" type="number" min="0" max="5" value="${middleCount}"></div>
          <div class="field"><label>Повторений</label><input id="pmMiddleReps" type="number" min="1" max="20" value="${middleReps}"></div>
          <div class="field px-span-2"><label>Средний вес, кг</label><input id="pmMiddleWeight" inputmode="decimal" value="${middleWeight}"></div>
        </div>
        <div id="pmSldrFields" class="px-method-fields">
          <div class="px-method-subtitle">Мини-подходы</div>
          <div class="field"><label>Количество</label><input id="pmSldrSets" type="number" min="2" max="6" value="${sldrCount}"></div>
          <div class="field"><label>Убавлять повторов</label><input id="pmSldrDrop" type="number" min="1" max="10" value="${sldrDrop}"></div>
        </div>
      </div>
      <section id="pmRepsSection" class="px-parameter-card ${method==='UNVRSL'||method==='SLDR'?'hidden':''}" data-parameter-card="reps" data-mode="${repsMode}"><div class="px-parameter-head"><div><div class="px-parameter-title">Повторения</div><div class="px-parameter-sub">Диапазон упражнения или значения недели</div></div>${sourceToggle('reps',repsMode)}</div>${parameterRangeInputs('pmReps',repsMode,repsManual,defaults.reps,1,50,1)}<div class="px-auto-caption">В режиме «Авто» серые значения обновляются вместе с неделей.</div></section>
      <section class="px-parameter-card" data-parameter-card="weight" data-mode="${weightMode}"><div class="px-parameter-head"><div><div class="px-parameter-title">Рабочий вес</div><div class="px-parameter-sub">Автовес использует историю, повторы и усилие</div></div>${sourceToggle('weight',weightMode)}</div><div class="px-weight-grid"><div class="field"><label>Вес, кг</label><input id="pmWeight" inputmode="decimal" value="${weightMode==='auto'?'':weight}" placeholder="Рассчитается автоматически" ${weightMode==='auto'?'disabled':''}></div></div><div class="px-auto-caption">Ручной вес остаётся плановым. Автоматическая рекомендация его не переписывает.</div></section>
      <section class="px-parameter-card" data-parameter-card="effort" data-mode="${effortMode}"><div class="px-parameter-head"><div><div class="px-parameter-title">Усилие</div><div class="px-parameter-sub">Выбери основной показатель: RPE или RIR</div></div>${sourceToggle('effort',effortMode)}</div><div class="px-effort-type"><button type="button" data-effort-type="rpe" class="${effortType==='rpe'?'on':''}" onclick="programSetEffortTypeV381('rpe')">RPE</button><button type="button" data-effort-type="rir" class="${effortType==='rir'?'on':''}" onclick="programSetEffortTypeV381('rir')">RIR</button></div><div data-effort-fields="rpe" class="${effortType==='rpe'?'':'hidden'}">${parameterRangeInputs('pmRpe',effortMode,rpeManual,defaults.rpe,1,10,.5)}</div><div data-effort-fields="rir" class="${effortType==='rir'?'':'hidden'}">${parameterRangeInputs('pmRir',effortMode,rirManual,defaults.rir,0,10,.5)}</div><div class="px-auto-caption">RPE и RIR сохраняются диапазоном и автоматически пересчитываются друг в друга.</div></section>
      <section class="px-parameter-card" data-parameter-card="tempo" data-mode="${tempoMode}"><div class="px-parameter-head"><div><div class="px-parameter-title">Темп</div><div class="px-parameter-sub">Общий темп недели или свой для упражнения</div></div>${sourceToggle('tempo',tempoMode)}</div><div id="pmTempoGeneral">${tempoChooser('pmTempo','Темп выполнения',tempoMode==='auto'?defaults.tempo:tempo)}</div><div id="pmTempoUnvrsl">${tempoChooser('pmTempoHeavy','Темп тяжёлой тройки',tempo)}${tempoChooser('pmTempoLight','Темп лёгкой девятки',tempoLight)}</div></section>
      <section id="pmRestField" class="px-parameter-card" data-parameter-card="rest" data-mode="${restMode}"><div class="px-parameter-head"><div><div class="px-parameter-title">Полный отдых</div><div class="px-parameter-sub">После подхода, раунда или блока</div></div>${sourceToggle('rest',restMode)}</div>${parameterRangeInputs('pmRest',restMode,restManual,defaults.rest,0,600,15)}<div id="pmRestHelp" class="px-auto-caption"></div><div id="pmInnerRest" class="px-auto-caption"></div></section>
      <div id="methodHint" class="px-method-info"></div><div class="field px-comment"><label>Комментарий</label><input id="pmNote" value="${esc(e?.note||'')}"></div><div class="px-save-wrap"><button class="btn primary full px-save-exercise" onclick="saveProgramExercise('${x.pid}',${x.wi},${x.di},'${encodeURIComponent(x.n)}','${encodeURIComponent(x.sourceId||'')}','${encodeURIComponent(x.bp||'')}','${encodeURIComponent(x.tg||'')}','${encodeURIComponent(x.eq||'')}',${x.existingIndex===null||x.existingIndex===undefined?'null':x.existingIndex})">${x.existingIndex===null||x.existingIndex===undefined?'Добавить':'Сохранить'}</button></div>`);
    document.getElementById('modal')?.classList.add('px-exercise-modal');
    setTimeout(()=>{programRefreshMethodUi(false);programSetEffortTypeV381(effortType);['reps','weight','effort','tempo','rest'].forEach(key=>syncModeUi(key,modeInput(key)?.value||'auto',false));programRefreshInheritedV381()},0)
  };

  function buildSets(method,count,w,r,rest,data){
    if(method==='UNVRSL'){
      const rounds=Array.from({length:3},(_,round)=>[
        {label:`${round+1}/3 тяжёлая`,role:'heavy',round:round+1,w,r:data.heavyReps,rest:30,tempo:data.tempo},
        {label:`${round+1}/3 лёгкая`,role:'light',round:round+1,w:data.lightWeight,r:data.lightReps,rest,tempo:data.tempoLight}
      ]).flat();
      const middle=Array.from({length:data.middleSets},(_,i)=>({label:`Средний ${i+1}/${data.middleSets}`,role:'middle',w:data.middleWeight,r:data.middleReps,rest,tempo:data.tempo}));
      return[...rounds,...middle]
    }
    if(method==='SLDR')return Array.from({length:data.sldrSets},(_,i)=>({label:`${i+1}/${data.sldrSets}`,role:'mini',w,r:Math.max(1,r-i*data.sldrDrop),rest:i<data.sldrSets-1?15:rest,tempo:data.tempo}));
    if(method==='DS')return Array.from({length:5},(_,i)=>({label:`DS${i+1}`,w:roundProgramLoad(w*Math.pow(.8,i)),r,rest:i<4?0:rest,tempo:data.tempo}));
    if(method==='FST-7')return Array.from({length:7},(_,i)=>({label:`${i+1}/7`,w,r,rest:i<6?30:rest,tempo:data.tempo}));
    return Array.from({length:Math.max(1,Math.min(10,count))},(_,i)=>({label:String(i+1),w,r,rest,tempo:data.tempo}))
  }
  window.programBuildMethodSets=buildSets;
  window.saveProgramExercise=function(pid,wi,di,nameToken,sourceToken,bpToken,tgToken,eqToken,existingIndex){
    const p=programById(pid),d=p?.weeks?.[wi]?.days?.[di];if(!d)return;
    const old=existingIndex===null||Number.isNaN(existingIndex)?null:d.ex?.[existingIndex],n=decodeURIComponent(nameToken),method=document.getElementById('pmMethod')?.value||'STANDARD',kind=document.getElementById('pmKind')?.value||inferKind(n),defaults=weeklyDefaults(pid,wi,kind);
    const repsMode=method==='UNVRSL'||method==='SLDR'?'method':modeInput('reps')?.value||'auto',effortMode=modeInput('effort')?.value||'auto',effortType=document.getElementById('pmEffortType')?.value==='rir'?'rir':'rpe',tempoMode=modeInput('tempo')?.value||'auto',restMode=modeInput('rest')?.value||'auto',weightMode=modeInput('weight')?.value||'auto';
    const remembered=(id,fallback)=>{const el=document.getElementById(id);return nullableNumber(el?.value)??nullableNumber(el?.dataset?.manualValue)??nullableNumber(fallback)};
    const manualPair=(prefix,fallback,min,max)=>{const pair=orderedPair(remembered(prefix+'Min',fallback?.[0]),remembered(prefix+'Max',fallback?.[1]),fallback);return[clamp(pair[0],min,max),clamp(pair[1],min,max)]};
    const previous=old?.parameterOverrides||{},repManual=manualPair('pmReps',orderedPair(old?.reps?.min,old?.reps?.max,defaults.reps),1,50),rpeManual=manualPair('pmRpe',orderedPair(previous.effort?.rpeMin??old?.rpeMin??old?.rpe,previous.effort?.rpeMax??old?.rpeMax??old?.rpe,defaults.rpe),1,10),rirManual=manualPair('pmRir',orderedPair(previous.effort?.rirMin??old?.rirMin,previous.effort?.rirMax??old?.rirMax,defaults.rir),0,10),restManual=manualPair('pmRest',orderedPair(previous.rest?.min??old?.restMin??old?.rest,previous.rest?.max??old?.restMax??old?.rest,defaults.rest),0,600);
    const reps=repsMode==='manual'?repManual:defaults.reps,rawEffort=effortType==='rir'?rirManual:rpeManual,rpe=effortMode==='manual'?(effortType==='rir'?[Math.max(0,10-rawEffort[1]),Math.max(0,10-rawEffort[0])]:rawEffort):defaults.rpe,rir=[Math.max(0,10-rpe[1]),Math.max(0,10-rpe[0])],restRange=restMode==='manual'?restManual:defaults.rest,rest=Math.round(((restRange[0]+restRange[1])/2)/15)*15;
    const manualWeight=remembered('pmWeight',previous.weight?.value??old?.sets?.[0]?.w)??0;if(weightMode==='manual'&&!(manualWeight>0)){try{toast('Укажи вес или выбери «Авто»')}catch(_){}return}const w=weightMode==='manual'?manualWeight:0;
    const count=numberValue('pmSets',3),r=reps[0],rpeTarget=Math.round(((rpe[0]+rpe[1])/2)*2)/2,note=document.getElementById('pmNote')?.value.trim()||'';
    const tempoManual=(method==='UNVRSL'?document.getElementById('pmTempoHeavy'):document.getElementById('pmTempo'))?.value.trim()||String(previous.tempo?.value||old?.tempo||defaults.tempo),tempo=tempoMode==='manual'?tempoManual:defaults.tempo,tempoLight=document.getElementById('pmTempoLight')?.value.trim()||'3-1-2',heavyReps=Math.max(1,numberValue('pmHeavyReps',3)),lightReps=Math.max(1,numberValue('pmLightReps',9)),lightWeight=Math.max(0,numberValue('pmLightWeight',roundProgramLoad(w*.85)));
    const middleSets=Math.max(0,Math.min(5,numberValue('pmMiddleSets',2))),middleReps=Math.max(1,numberValue('pmMiddleReps',6)),middleWeight=Math.max(0,numberValue('pmMiddleWeight',roundProgramLoad((w+lightWeight)/2)));
    const sldrSets=Math.max(2,Math.min(6,numberValue('pmSldrSets',3))),sldrDrop=Math.max(1,numberValue('pmSldrDrop',2));
    const data={tempo,tempoLight,heavyReps,lightReps,lightWeight,middleSets,middleReps,middleWeight,sldrSets,sldrDrop},sets=buildSets(method,count,w,r,rest,data),parameterOverrides={version:386,effort:{mode:effortMode,type:effortType,rpeMin:rpeManual[0],rpeMax:rpeManual[1],rirMin:rirManual[0],rirMax:rirManual[1]},tempo:{mode:tempoMode,value:tempoManual},rest:{mode:restMode,min:restManual[0],max:restManual[1]},weight:{mode:weightMode,value:manualWeight}},canonicalReps={mode:repsMode,min:repsMode==='manual'?reps[0]:null,max:repsMode==='manual'?reps[1]:null};
    if(method==='DS'){const start=reps[1],end=reps[0],steps=Array.from({length:sets.length},(_,i)=>Math.round(start+(end-start)*(i/Math.max(1,sets.length-1))));sets.forEach((set,i)=>{set.r=steps[i]})}else if(method!=='UNVRSL'&&method!=='SLDR')sets.forEach(set=>{set.r=reps[0]});
    const obj={...(old||{}),id:old?.id||uid('pex'),n,sourceId:decodeURIComponent(sourceToken||'')||null,bp:decodeURIComponent(bpToken||''),tg:decodeURIComponent(tgToken||''),eq:decodeURIComponent(eqToken||''),kind,method,reps:canonicalReps,effortSourceMode:effortMode,effortType,rpe:rpeTarget,tempoMode,tempo,tempoLight:method==='UNVRSL'?tempoLight:null,restMode,rest,weightMode,parameterOverrides,innerRest:INNER_REST[method],heavyReps:method==='UNVRSL'?heavyReps:null,lightReps:method==='UNVRSL'?lightReps:null,lightWeight:method==='UNVRSL'?lightWeight:null,middleSets:method==='UNVRSL'?middleSets:null,middleReps:method==='UNVRSL'?middleReps:null,middleWeight:method==='UNVRSL'?middleWeight:null,miniSets:method==='SLDR'?sldrSets:null,repDrop:method==='SLDR'?sldrDrop:null,note,sets};
    delete obj.repMode;delete obj.repMin;delete obj.repMax;delete obj.repRange;delete obj.repsMin;delete obj.repsMax;delete obj.minReps;delete obj.maxReps;delete obj.targetReps
    if(effortMode==='manual'){obj.rpeMin=rpe[0];obj.rpeMax=rpe[1];obj.rirMin=rir[0];obj.rirMax=rir[1]}else{delete obj.rpeMin;delete obj.rpeMax;delete obj.rirMin;delete obj.rirMax}
    if(restMode==='manual'){obj.restMin=restRange[0];obj.restMax=restRange[1]}else{delete obj.restMin;delete obj.restMax}
    if(old)d.ex[existingIndex]=obj;else d.ex.push(obj);p.updated=Date.now();save();openProgramEditor(pid,wi,di)
  };

  const baseBegin=window.beginProgramDay;
  if(typeof baseBegin==='function'){
    const wrappedBegin=function(pid,wi,di){
      const result=baseBegin.apply(this,arguments),started=Date.now();
      const timer=setInterval(()=>{
        const p=programById(pid),d=p?.weeks?.[wi]?.days?.[di],s=window.st?.current;
        if(Date.now()-started>30000){clearInterval(timer);return}
        if(!d||!s||s.programId!==pid)return;
        (d.ex||[]).filter(b=>b.method==='UNVRSL').forEach(b=>{
          const rows=(s.ex||[]).filter(e=>String(e.n||'').startsWith(b.n)&&/UNVRSL/.test(e.n||''));
          rows.forEach((e,i)=>{e.tempo=b.sets?.[i]?.tempo||b.tempo||''})
        });
        try{save()}catch(e){};clearInterval(timer);if(document.getElementById('start')?.classList.contains('active'))try{startPage()}catch(e){}
      },120);
      return result
    };
    wrappedBegin.__programRulesV162=true;window.beginProgramDay=wrappedBegin;try{beginProgramDay=wrappedBegin}catch(e){}
  }
})();
