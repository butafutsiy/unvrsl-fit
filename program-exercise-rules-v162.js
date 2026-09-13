'use strict';
(()=>{
  const W=window,D=document,REV=380;
  if(W.__unvrslProgramEngineEditorV380)return;
  W.__unvrslProgramEngineEditorV380=true;
  W.__unvrslProgramExerciseRulesV162=true;

  const LOAD_PROFILE=Object.freeze({
    1:{pct:[70,75],rpe:[6,8],focus:'Техника, базовый объём'},
    2:{pct:[75,80],rpe:[7,8],focus:'Повышение интенсивности'},
    3:{pct:[80,85],rpe:[8,9],focus:'Интенсификация'},
    4:{pct:[60,65],rpe:[4,6],focus:'Плотность и памп'},
    5:{pct:[85,88],rpe:[8,9],focus:'Тяжёлый стимул'},
    6:{pct:[60,70],rpe:[4,6],focus:'Разгрузка через методы и контролируемый объём'},
    7:{pct:[88,90],rpe:[8.5,9.5],focus:'Сила'},
    8:{pct:[90,100],rpe:[9,10],focus:'Контроль результатов',test:true}
  });
  W.UNVRSL_LOAD_PROFILE_V380=LOAD_PROFILE;

  const METHODS=[['STANDARD','Обычные'],['UNVRSL','UNVRSL'],['SLDR','SLDR'],['DS','Дроп-сет'],['FST-7','FST-7']];
  const TEMPOS=['2-0-2','2-1-1','3-1-2','4-1-2','2-0-X'];
  const INNER_REST={STANDARD:null,UNVRSL:30,SLDR:15,DS:0,'FST-7':30};
  const METHOD_HINT={
    STANDARD:'Обычные рабочие подходы. Вес может быть задан вручную или рассчитан AutoWeight.',
    UNVRSL:'3 раунда Heavy → 30 сек → Light, затем средние подходы. Heavy, Light и Middle сохраняются раздельно.',
    SLDR:'3 полноценных раунда на одном весе. В каждом раунде мини-подходы, базово 12 → 10 → 8, пауза 15 сек.',
    DS:'Ступени со снижением веса. Можно рассчитать автоматически или задать каждую ступень вручную.',
    'FST-7':'7 рабочих подходов на одном весе. Базово 8–15 повторений и 30 сек отдыха.'
  };

  const N=v=>{if(v===''||v==null)return null;const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:null};
  const num=(v,f=0)=>N(v)??f;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=v=>{const n=N(v);return n==null?'—':String(Math.round(n*10)/10).replace('.',',')};
  const roundLoad=(v,step=2.5)=>{const n=N(v),s=N(step)||2.5;return n==null?0:Math.max(0,Math.round(n/s)*s)};
  const state=()=>{try{return typeof st!=='undefined'?st:W.st}catch(_){return W.st}};
  const program=id=>{try{return typeof programById==='function'?programById(id):(state()?.programs||[]).find(p=>String(p.id)===String(id))||null}catch(_){return null}};
  const saveState=()=>{try{if(typeof save==='function')save();else W.save?.()}catch(_){}};
  const uidLocal=p=>typeof uid==='function'?uid(p):`${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;

  function movementClass(name='',legacyKind=''){
    if(['compound','isolation','isometric','cardio'].includes(legacyKind))return legacyKind;
    const s=String(name).toLowerCase();
    if(/планк|удержан|wall sit|isometric/.test(s))return'isometric';
    if(/кардио|аэробайк|велотренаж|дорожк|эллипс|гребн/.test(s))return'cardio';
    const iso=['разгибан','сгибан','сведен','разведен','махи','подъём на носки','подъем на носки','отведен','приведен','кроссовер','пуловер','скручиван','каната к лицу','бабочка','бицеп','трицеп'];
    return iso.some(x=>s.includes(x))?'isolation':'compound'
  }
  function resistanceType(eq='',name=''){
    const e=String(eq).toLowerCase(),n=String(name).toLowerCase();
    if(/assisted|гравитрон|помощ/.test(`${e} ${n}`))return'assisted';
    if(e==='smith machine'||/смит|smith/.test(`${e} ${n}`))return'smith';
    if(/dumbbell|гантел/.test(`${e} ${n}`))return'dumbbell';
    if(/barbell|olympic barbell|ez barbell|штанг/.test(`${e} ${n}`))return'barbell';
    if(/cable|rope|блок|кроссовер|трос/.test(`${e} ${n}`))return'cable';
    if(/sled machine|leverage machine|plate loaded|хаммер|hammer|гакк|жим ногами/.test(`${e} ${n}`))return'plate_loaded';
    if(/machine|тренаж/.test(`${e} ${n}`))return'machine';
    if(/body weight|свой вес|подтяг|брусь|отжиман/.test(`${e} ${n}`))return'bodyweight';
    return'other'
  }
  function loadConvention(type,name=''){
    if(type==='dumbbell')return'per_hand';
    if(type==='plate_loaded'&&/жим ногами|гакк|хаммер|hammer/.test(String(name).toLowerCase()))return'per_side';
    if(type==='machine'||type==='cable')return'stack';
    if(type==='assisted')return'assistance';
    if(type==='bodyweight')return'added_weight';
    return'total'
  }
  function progressionType(move,type,name=''){
    if(move==='cardio')return'duration';
    if(move==='isometric')return'duration';
    if(type==='assisted')return'assistance';
    if(type==='bodyweight'&&!/вес|weighted|отягощ/.test(String(name).toLowerCase()))return'reps';
    return'load'
  }
  W.programInferExerciseKind=(n)=>movementClass(n);
  W.programInferResistanceTypeV380=resistanceType;

  function stepFor(name,sourceId){try{return Number(W.loadStepFor?.(name,sourceId||null))||2.5}catch(_){return 2.5}}
  function autoRest(kind,method){
    if(method==='DS')return kind==='compound'?120:75;
    if(method==='FST-7')return kind==='compound'?90:45;
    return kind==='compound'?150:75
  }
  W.programAutoRest=autoRest;
  const defaultTempo=kind=>kind==='compound'?'2-1-1':'3-1-2';

  function normalizeExercise(e={},fallback={}){
    const method=String(e.method||'STANDARD').toUpperCase();
    const kind=movementClass(e.n||fallback.n,e.movementClass||e.kind);
    const resistance=e.resistanceType||resistanceType(e.eq||fallback.eq,e.n||fallback.n);
    const convention=e.loadConvention||loadConvention(resistance,e.n||fallback.n);
    const first=e.sets?.[0]||{};
    const weightMode=e.weightMode||((e.sets||[]).some(s=>num(s.w)>0)?'manual':'auto');
    const rpeMin=N(e.targetRpeMin??e.rpeMin)??N(e.rpe)??8;
    const rpeMax=N(e.targetRpeMax??e.rpeMax)??rpeMin;
    const rirMin=Math.max(0,10-Math.max(rpeMin,rpeMax));
    const rirMax=Math.max(0,10-Math.min(rpeMin,rpeMax));
    let cfg=e.methodConfig&&typeof e.methodConfig==='object'?JSON.parse(JSON.stringify(e.methodConfig)):{};
    if(method==='UNVRSL'&&!cfg.unvrsl){
      const light=(e.sets||[]).find(s=>s.role==='light')||e.sets?.[1]||{};
      const middle=(e.sets||[]).find(s=>s.role==='middle')||e.sets?.[6]||{};
      cfg.unvrsl={rounds:3,innerRest:30,heavy:{weight:num(first.w),reps:num(e.heavyReps??first.r,3),tempo:e.tempo||first.tempo||defaultTempo(kind),weightMode:num(first.w)>0?'manual':'auto'},light:{weight:num(e.lightWeight??light.w),reps:num(e.lightReps??light.r,9),tempo:e.tempoLight||light.tempo||'3-1-2',weightMode:num(e.lightWeight??light.w)>0?'manual':'auto'},middle:{enabled:num(e.middleSets,2)>0,sets:num(e.middleSets,2),weight:num(e.middleWeight??middle.w),reps:num(e.middleReps??middle.r,6),tempo:e.tempo||middle.tempo||defaultTempo(kind),weightMode:num(e.middleWeight??middle.w)>0?'manual':'auto'}}
    }
    if(method==='SLDR'&&!cfg.sldr){
      const pattern=Array.isArray(e.repPattern)?e.repPattern.slice(0,6):(e.sets||[]).filter(s=>(s.round||1)===1).slice(0,3).map(s=>num(s.r)).filter(Boolean);
      cfg.sldr={rounds:num(e.sldrRounds,3),repPattern:pattern.length?pattern:[12,10,8],innerRest:num(e.innerRest,15),roundRest:num(e.rest,90)}
    }
    if(method==='DS'&&!cfg.dropSet){
      const old=(e.sets||[]).map(s=>({plannedWeight:num(s.w),plannedReps:num(s.r),rest:num(s.rest)}));
      cfg.dropSet={mode:old.length?'manual':'auto',stages:old.length?old:null,stageCount:old.length||3,dropMode:'percent',dropValue:20,dropReference:'previous',innerRest:0}
    }
    if(method==='FST-7'&&!cfg.fst7)cfg.fst7={sets:7,repMin:N(e.repMin??e.targetRepMin)??8,repMax:N(e.repMax??e.targetRepMax)??15,innerRest:num(e.innerRest,30)};
    return{...e,schemaVersion:REV,movementClass:kind,kind,resistanceType:resistance,loadConvention:convention,progressionType:e.progressionType||progressionType(kind,resistance,e.n||fallback.n),weightMode,targetRpeMin:Math.min(rpeMin,rpeMax),targetRpeMax:Math.max(rpeMin,rpeMax),targetRirMin:rirMin,targetRirMax:rirMax,rpe:(rpeMin+rpeMax)/2,methodConfig:cfg}
  }
  W.normalizeExercisePrescriptionV380=normalizeExercise;

  function methodButtons(method){return METHODS.map(([id,t])=>`<button type="button" class="px-choice ${id===method?'on':''}" data-method="${id}" onclick="programSetMethod('${id}')">${t}</button>`).join('')}
  function classButtons(kind){return[['compound','Базовое'],['isolation','Изоляция'],['isometric','Изометрия']].map(([id,t])=>`<button type="button" class="px-choice ${id===kind?'on':''}" data-kind="${id}" onclick="programSetKind('${id}')">${t}</button>`).join('')}
  function tempoButtons(id,value){return `<input id="${id}" type="hidden" value="${esc(value)}"><div class="px-tempo-grid">${TEMPOS.map(t=>`<button type="button" class="px-tempo ${t===value?'on':''}" data-tempo-target="${id}" data-tempo-value="${t}" onclick="programChooseTempo('${id}','${t}')">${t}</button>`).join('')}</div>`}
  function rpeRirText(){const lo=num(D.getElementById('pmRpeMin')?.value,8),hi=num(D.getElementById('pmRpeMax')?.value,lo),a=Math.min(lo,hi),b=Math.max(lo,hi);return`RIR ${fmt(Math.max(0,10-b))}${Math.abs(a-b)>.001?`–${fmt(Math.max(0,10-a))}`:''}`}
  W.programRpeRangeChangedV380=()=>{const n=D.getElementById('pmRirMirror');if(n)n.textContent=rpeRirText()};
  W.programChooseTempo=(id,v)=>{const h=D.getElementById(id);if(h)h.value=v;D.querySelectorAll(`[data-tempo-target="${id}"]`).forEach(b=>b.classList.toggle('on',b.dataset.tempoValue===v))};
  W.programCustomTempo=(id,v)=>{const h=D.getElementById(id);if(h)h.value=String(v||'').trim()};

  let dsStageDraft=[];
  function dsRow(s,i){return `<div class="pe380-stage" data-ds-index="${i}"><span>${i+1}</span><input inputmode="decimal" value="${s.plannedWeight||''}" placeholder="кг" oninput="programDsStageChangedV380(${i},'plannedWeight',this.value)"><input inputmode="numeric" value="${s.plannedReps||''}" placeholder="повт." oninput="programDsStageChangedV380(${i},'plannedReps',this.value)"><button type="button" onclick="programDsRemoveStageV380(${i})">×</button></div>`}
  function renderDsStages(){const box=D.getElementById('pmDsManualStages');if(box)box.innerHTML=dsStageDraft.map(dsRow).join('')}
  W.programDsStageChangedV380=(i,k,v)=>{if(!dsStageDraft[i])return;dsStageDraft[i][k]=num(v)};
  W.programDsAddStageV380=()=>{if(dsStageDraft.length>=8)return;const prev=dsStageDraft.at(-1)||{plannedWeight:num(D.getElementById('pmWeight')?.value),plannedReps:num(D.getElementById('pmReps')?.value,10)};dsStageDraft.push({plannedWeight:prev.plannedWeight?roundLoad(prev.plannedWeight*.8,2.5):0,plannedReps:prev.plannedReps||10,rest:0});renderDsStages()};
  W.programDsRemoveStageV380=i=>{if(dsStageDraft.length<=2)return;dsStageDraft.splice(i,1);renderDsStages()};
  W.programDsModeChangedV380=()=>{const manual=D.getElementById('pmDsMode')?.value==='manual';D.getElementById('pmDsAutoFields')?.classList.toggle('hidden',manual);D.getElementById('pmDsManualWrap')?.classList.toggle('hidden',!manual)};

  function methodFields(method,e){
    const c=e.methodConfig||{};
    if(method==='UNVRSL'){
      const u=c.unvrsl||{},h=u.heavy||{},l=u.light||{},m=u.middle||{};
      return `<div id="pmUnvrslFields" class="px-method-fields"><div class="px-method-subtitle">Heavy → 30 сек → Light · 3 раунда</div>
        <div class="field"><label>Heavy повторы</label><input id="pmHeavyReps" type="number" min="1" max="10" value="${h.reps||3}"></div><div class="field"><label>Heavy вес, кг</label><input id="pmHeavyWeight" inputmode="decimal" value="${h.weight||''}" placeholder="Автовес"></div>
        <div class="field"><label>Light повторы</label><input id="pmLightReps" type="number" min="1" max="30" value="${l.reps||9}"></div><div class="field"><label>Light вес, кг</label><input id="pmLightWeight" inputmode="decimal" value="${l.weight||''}" placeholder="Автовес"></div>
        <div class="field px-span-2"><label>Внутри раунда</label><div class="pe380-readonly">30 сек между Heavy и Light</div></div>
        <div class="px-method-subtitle">Middle после 3 раундов</div><div class="field"><label>Подходов</label><input id="pmMiddleSets" type="number" min="0" max="5" value="${m.enabled===false?0:(m.sets??2)}"></div><div class="field"><label>Повторов</label><input id="pmMiddleReps" type="number" min="1" max="20" value="${m.reps||6}"></div><div class="field px-span-2"><label>Middle вес, кг</label><input id="pmMiddleWeight" inputmode="decimal" value="${m.weight||''}" placeholder="Автовес"></div></div>`
    }
    if(method==='SLDR'){
      const s=c.sldr||{},p=Array.isArray(s.repPattern)&&s.repPattern.length?s.repPattern:[12,10,8];
      return `<div id="pmSldrFields" class="px-method-fields"><div class="px-method-subtitle">SLDR · 3 рабочих раунда</div><div class="field px-span-2"><label>Схема мини-подходов</label><select id="pmSldrScheme" onchange="programSetSldrScheme?.(this.value)"><option value="10-8-6">10 → 8 → 6</option><option value="12-10-8" selected>12 → 10 → 8</option><option value="15-12-10">15 → 12 → 10</option><option value="manual">Вручную</option></select></div><div id="pmSldrManualFields" class="px-span-2" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px"><div class="field"><label>1-й</label><input id="pmSldrManual1" type="number" value="${p[0]||12}"></div><div class="field"><label>2-й</label><input id="pmSldrManual2" type="number" value="${p[1]||10}"></div><div class="field"><label>3-й</label><input id="pmSldrManual3" type="number" value="${p[2]||8}"></div></div><div class="field"><label>Раундов</label><input id="pmSldrRounds" type="number" min="1" max="5" value="${s.rounds||3}"></div><div class="field"><label>Пауза внутри, сек</label><input id="pmSldrInnerRest" type="number" min="5" max="60" value="${s.innerRest||15}"></div><div class="px-method-info px-span-2">Один рабочий вес. После последнего mini-set каждого раунда идёт полный отдых.</div></div>`
    }
    if(method==='DS'){
      const ds=c.dropSet||{};dsStageDraft=(Array.isArray(ds.stages)&&ds.stages.length?ds.stages:(e.sets||[]).map(x=>({plannedWeight:num(x.w),plannedReps:num(x.r),rest:num(x.rest)}))).map(x=>({...x}));if(dsStageDraft.length<2)dsStageDraft=[{plannedWeight:num(e.sets?.[0]?.w),plannedReps:num(e.sets?.[0]?.r,12),rest:0},{plannedWeight:0,plannedReps:num(e.sets?.[0]?.r,10),rest:0},{plannedWeight:0,plannedReps:num(e.sets?.[0]?.r,8),rest:0}];
      const mode=ds.mode||'auto';
      return `<div id="pmDsFields" class="px-method-fields"><div class="px-method-subtitle">Drop Set</div><div class="field px-span-2"><label>Расчёт ступеней</label><select id="pmDsMode" onchange="programDsModeChangedV380()"><option value="auto" ${mode==='auto'?'selected':''}>Авто</option><option value="manual" ${mode==='manual'?'selected':''}>Вручную</option></select></div><div id="pmDsAutoFields" class="px-span-2 ${mode==='manual'?'hidden':''}" style="display:grid;grid-template-columns:repeat(2,1fr);gap:0 12px"><div class="field"><label>Ступеней</label><input id="pmDsStages" type="number" min="2" max="6" value="${ds.stageCount||3}"></div><div class="field"><label>Снижение</label><input id="pmDsDrop" inputmode="decimal" value="${ds.dropValue??20}"></div><div class="field"><label>Тип</label><select id="pmDsDropMode"><option value="percent" ${ds.dropMode!=='kg'?'selected':''}>%</option><option value="kg" ${ds.dropMode==='kg'?'selected':''}>кг</option></select></div><div class="field"><label>Считать от</label><select id="pmDsReference"><option value="previous" ${ds.dropReference!=='initial'?'selected':''}>предыдущей</option><option value="initial" ${ds.dropReference==='initial'?'selected':''}>стартовой</option></select></div></div><div id="pmDsManualWrap" class="px-span-2 ${mode==='manual'?'':'hidden'}"><div class="pe380-stage-head"><span>#</span><span>Вес</span><span>Повт.</span><span></span></div><div id="pmDsManualStages">${dsStageDraft.map(dsRow).join('')}</div><button type="button" class="btn full" onclick="programDsAddStageV380()">＋ Ступень</button></div><div class="px-method-info px-span-2">Внутри цепочки по умолчанию без отдыха. Вручную заданные ступени AutoWeight не перезаписывает.</div></div>`
    }
    if(method==='FST-7'){
      const f=c.fst7||{};return `<div id="pmFstFields" class="px-method-fields"><div class="px-method-subtitle">FST-7</div><div class="field"><label>Повторы от</label><input id="pmFstRepMin" type="number" min="1" max="30" value="${f.repMin||8}"></div><div class="field"><label>до</label><input id="pmFstRepMax" type="number" min="1" max="30" value="${f.repMax||15}"></div><div class="field px-span-2"><label>Отдых между 7 подходами, сек</label><input id="pmFstRest" type="number" min="15" max="90" value="${f.innerRest||30}"></div><div class="px-method-info px-span-2">Один рабочий вес на 7 подходов. Фактические повторы сохраняются отдельно по каждому подходу.</div></div>`
    }
    return''
  }

  function style(){if(D.getElementById('program-engine-editor-v380-style'))return;const s=D.createElement('style');s.id='program-engine-editor-v380-style';s.textContent=`
    .px-exercise-head{position:sticky;top:0;z-index:10;display:flex;align-items:center;gap:12px;margin:0 -18px;padding:calc(12px + env(safe-area-inset-top)) 18px 14px;background:rgba(17,17,19,.97);backdrop-filter:blur(18px);border-bottom:1px solid #29292e}.px-icon-btn{width:46px;height:46px;border-radius:15px;background:#28282c}.px-choice-section{margin-top:18px}.px-choice-label{color:#929298;font-size:13px;margin:0 2px 8px}.px-segment{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.px-choice{min-height:46px;padding:9px;border-radius:14px;background:#1b1b1e;border:1px solid #34343a;color:#b0b0b6;font-weight:730}.px-choice.on{background:rgba(48,209,88,.11);border-color:rgba(48,209,88,.48);color:var(--green)}.px-main-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 10px;margin-top:12px}.px-span-2{grid-column:1/-1}.px-method-fields{grid-column:1/-1;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 10px;padding:4px 12px 10px;margin-top:10px;border-radius:18px;background:#19191c;border:1px solid #2d2d32}.px-method-subtitle{grid-column:1/-1;color:#9a9aa0;font-size:12px;font-weight:800;text-transform:uppercase;margin:12px 2px 0}.px-method-info{font-size:12px;color:#aaa;line-height:1.45;padding:12px;background:#202024;border-radius:14px;margin-top:8px}.px-tempo-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:5px}.px-tempo{min-height:41px;border-radius:12px;background:#1c1c1f;border:1px solid #34343a;font-size:12px}.px-tempo.on{border-color:var(--green);color:var(--green)}.pe380-readonly{padding:13px;border-radius:14px;background:#242428;color:#a8a8ad}.pe380-rir{padding:13px 14px;border-radius:15px;background:#202023;color:#64b5ff;font-weight:750}.pe380-stage-head,.pe380-stage{display:grid;grid-template-columns:28px 1fr 1fr 34px;gap:7px;align-items:center}.pe380-stage-head{font-size:10px;color:#777;padding:6px}.pe380-stage{margin-bottom:7px}.pe380-stage input{min-width:0;background:#101012;border:1px solid #343438;border-radius:12px;color:#fff;padding:10px 7px;text-align:center}.pe380-stage button{font-size:20px;color:#ff6961}.pe380-load-card{margin-top:14px;padding:13px 14px;border-radius:16px;background:rgba(48,209,88,.07);border:1px solid rgba(48,209,88,.20)}.pe380-load-card b{display:block}.pe380-load-card span{display:block;margin-top:4px;color:#909096;font-size:12px;line-height:1.4}.pe380-create-grid{display:grid;grid-template-columns:1fr 1fr;gap:0 10px}@media(max-width:420px){.px-segment{grid-template-columns:repeat(2,minmax(0,1fr))}.px-tempo-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
  `;D.head.appendChild(s)}

  W.programSetKind=kind=>{const h=D.getElementById('pmKind');if(h)h.value=kind;D.querySelectorAll('[data-kind]').forEach(b=>b.classList.toggle('on',b.dataset.kind===kind));const method=D.getElementById('pmMethod')?.value||'STANDARD',rest=D.getElementById('pmRest');if(rest&&D.getElementById('pmRestMode')?.value==='auto')rest.value=autoRest(kind,method)};
  W.programSetMethod=method=>{const h=D.getElementById('pmMethod');if(h)h.value=method;D.querySelectorAll('[data-method]').forEach(b=>b.classList.toggle('on',b.dataset.method===method));W.programRefreshMethodUi(true)};
  W.programMethodDefaults=W.programSetMethod;
  W.programSetRestMode=mode=>{const h=D.getElementById('pmRestMode');if(h)h.value=mode;const input=D.getElementById('pmRest');if(input){input.disabled=mode==='auto';if(mode==='auto')input.value=autoRest(D.getElementById('pmKind')?.value||'compound',D.getElementById('pmMethod')?.value||'STANDARD')}};
  W.programUpdateAutoRest=()=>W.programSetRestMode('auto');
  W.programRefreshMethodUi=function(){const method=D.getElementById('pmMethod')?.value||'STANDARD',hint=D.getElementById('methodHint');if(hint)hint.textContent=METHOD_HINT[method]||''};

  W.programExerciseForm=function(x){
    style();const p=program(x.pid),d=p?.weeks?.[x.wi]?.days?.[x.di],raw=x.existingIndex!==null&&x.existingIndex!==undefined?d?.ex?.[x.existingIndex]:null,e=normalizeExercise(raw||{n:x.n,sourceId:x.sourceId,bp:x.bp,tg:x.tg,eq:x.eq,method:'STANDARD',sets:[]},x);
    const method=e.method||'STANDARD',kind=e.movementClass||'compound',weightMode=e.weightMode||'auto',first=e.sets?.[0]||{},restMode=e.restMode||(raw?'manual':'auto'),rest=e.rest??autoRest(kind,method),rpeMin=e.targetRpeMin??7,rpeMax=e.targetRpeMax??8,tempo=e.tempo||first.tempo||defaultTempo(kind),weight=num(first.w);
    const resistance=e.resistanceType||resistanceType(e.eq,e.n),convention=e.loadConvention||loadConvention(resistance,e.n);
    const back=`openProgramEditor('${String(x.pid).replace(/'/g,"\\'")}',${x.wi},${x.di})`;
    W.modal?.(`<div class="px-exercise-head"><button class="px-icon-btn" onclick="${back}">←</button><div class="grow"><h2 style="margin:0">${esc(x.n)}</h2><div class="muted small">Настройка упражнения</div></div></div>
      <input id="pmKind" type="hidden" value="${kind}"><input id="pmMethod" type="hidden" value="${method}"><input id="pmRestMode" type="hidden" value="${restMode}"><input id="pmResistanceType" type="hidden" value="${resistance}"><input id="pmLoadConvention" type="hidden" value="${convention}">
      <div class="px-choice-section"><div class="px-choice-label">Тип движения</div><div class="px-segment">${classButtons(kind)}</div></div>
      <div class="px-choice-section"><div class="px-choice-label">Метод выполнения</div><div class="px-segment">${methodButtons(method)}</div></div>
      <div class="px-main-grid">
        <div class="field"><label>Расчёт веса</label><select id="pmWeightMode" onchange="programWeightModeChangedV380()"><option value="auto" ${weightMode==='auto'?'selected':''}>Автовес</option><option value="manual" ${weightMode==='manual'?'selected':''}>Вручную</option></select></div>
        <div class="field"><label>Вес, кг</label><input id="pmWeight" inputmode="decimal" value="${weight||''}" placeholder="${weightMode==='auto'?'Рассчитается':'0'}"></div>
        <div class="field" id="pmSetsField"><label>Подходов</label><input id="pmSets" type="number" min="1" max="10" value="${method==='STANDARD'?(e.sets?.length||3):3}"></div>
        <div class="field" id="pmRepsField"><label>Повторений</label><input id="pmReps" type="number" min="1" max="50" value="${first.r||10}"></div>
        <div class="field"><label>RPE от</label><input id="pmRpeMin" inputmode="decimal" value="${rpeMin}" oninput="programRpeRangeChangedV380()"></div><div class="field"><label>RPE до</label><input id="pmRpeMax" inputmode="decimal" value="${rpeMax}" oninput="programRpeRangeChangedV380()"></div>
        <div class="px-span-2 pe380-rir" id="pmRirMirror">RIR ${fmt(Math.max(0,10-rpeMax))}${Math.abs(rpeMin-rpeMax)>.001?`–${fmt(Math.max(0,10-rpeMin))}`:''}</div>
        ${methodFields(method,e)}
        <div class="field px-span-2"><label>Темп</label>${tempoButtons('pmTempo',tempo)}</div>
        <div class="field"><label>Отдых</label><select id="pmRestModeSelect" onchange="programSetRestMode(this.value)"><option value="auto" ${restMode==='auto'?'selected':''}>Авто</option><option value="manual" ${restMode==='manual'?'selected':''}>Вручную</option></select></div><div class="field"><label>Полный отдых, сек</label><input id="pmRest" type="number" min="0" value="${rest}" ${restMode==='auto'?'disabled':''}></div>
        <div class="px-span-2 pe380-load-card"><b>${esc(resistance.replace('_',' '))} · ${esc(convention.replace('_',' '))}</b><span>Тип сопротивления и схема записи веса сохраняются с упражнением. Это нужно для корректного AutoWeight и истории.</span></div>
        <div class="field px-span-2"><label>Комментарий</label><input id="pmNote" value="${esc(e.note||'')}"></div>
      </div><div id="methodHint" class="px-method-info">${METHOD_HINT[method]||''}</div><button class="btn primary full" style="margin:18px 0 28px;min-height:54px" onclick="saveProgramExercise('${String(x.pid).replace(/'/g,"\\'")}',${x.wi},${x.di},'${encodeURIComponent(x.n)}','${encodeURIComponent(x.sourceId||'')}','${encodeURIComponent(x.bp||'')}','${encodeURIComponent(x.tg||'')}','${encodeURIComponent(x.eq||'')}',${x.existingIndex===null||x.existingIndex===undefined?'null':x.existingIndex})">${raw?'Сохранить':'Добавить'}</button>`);
    setTimeout(()=>{W.programWeightModeChangedV380();W.programDsModeChangedV380?.();W.programRpeRangeChangedV380()},0)
  };
  W.programWeightModeChangedV380=()=>{const auto=D.getElementById('pmWeightMode')?.value==='auto',w=D.getElementById('pmWeight');if(w){w.disabled=auto;if(auto)w.placeholder='Рассчитается автоматически'}};

  function sldrPattern(){const scheme=D.getElementById('pmSldrScheme')?.value||'manual';if(scheme==='10-8-6')return[10,8,6];if(scheme==='15-12-10')return[15,12,10];if(scheme==='12-10-8')return[12,10,8];return[1,2,3].map(i=>Math.max(1,num(D.getElementById(`pmSldrManual${i}`)?.value,[12,10,8][i-1])))}
  function buildSets(method,count,w,r,rest,data){
    if(method==='UNVRSL'){
      const rounds=Array.from({length:3},(_,i)=>[{label:`${i+1}/3 тяжёлая`,role:'heavy',round:i+1,w:data.heavyWeight,r:data.heavyReps,rest:30,tempo:data.tempo},{label:`${i+1}/3 лёгкая`,role:'light',round:i+1,w:data.lightWeight,r:data.lightReps,rest,tempo:data.tempoLight}]).flat();
      return rounds.concat(Array.from({length:data.middleSets},(_,i)=>({label:`Средний ${i+1}/${data.middleSets}`,role:'middle',w:data.middleWeight,r:data.middleReps,rest,tempo:data.tempo})))
    }
    if(method==='SLDR')return Array.from({length:data.sldrRounds},(_,round)=>data.repPattern.map((rp,mini)=>({label:`Круг ${round+1}/${data.sldrRounds} · ${mini+1}/${data.repPattern.length}`,role:'sldr-mini',round:round+1,mini:mini+1,w,r:rp,rest:mini<data.repPattern.length-1?data.sldrInnerRest:rest,tempo:data.tempo}))).flat();
    if(method==='DS'){
      if(data.dsMode==='manual')return data.dsStages.map((s,i)=>({label:`DS${i+1}`,role:'drop-stage',stage:i+1,w:num(s.plannedWeight),r:Math.max(1,num(s.plannedReps,r)),rest:i<data.dsStages.length-1?num(s.rest,0):rest,tempo:data.tempo,manual:true}));
      const out=[],n=Math.max(2,Math.min(6,data.dsCount));let prev=w;for(let i=0;i<n;i++){let value=i===0?w:prev;if(i>0){if(data.dsDropMode==='kg')value=data.dsReference==='initial'?Math.max(0,w-data.dsDrop*i):Math.max(0,prev-data.dsDrop);else value=data.dsReference==='initial'?Math.max(0,w*(1-(data.dsDrop/100)*i)):Math.max(0,prev*(1-data.dsDrop/100));value=roundLoad(value,data.step);prev=value}else prev=value;out.push({label:`DS${i+1}`,role:'drop-stage',stage:i+1,w:value,r:Math.max(1,r),rest:i<n-1?0:rest,tempo:data.tempo})}return out
    }
    if(method==='FST-7')return Array.from({length:7},(_,i)=>({label:`${i+1}/7`,role:'fst7',w,r:data.fstRepMin,repMin:data.fstRepMin,repMax:data.fstRepMax,targetRepMin:data.fstRepMin,targetRepMax:data.fstRepMax,rest:i<6?data.fstRest:rest,tempo:data.tempo}));
    return Array.from({length:Math.max(1,Math.min(10,count))},(_,i)=>({label:String(i+1),w,r,rest,tempo:data.tempo}))
  }
  W.programBuildMethodSets=buildSets;

  W.saveProgramExercise=function(pid,wi,di,nameToken,sourceToken,bpToken,tgToken,eqToken,existingIndex){
    const p=program(pid),d=p?.weeks?.[wi]?.days?.[di];if(!p||!d)return;const old=existingIndex===null||Number.isNaN(Number(existingIndex))?null:d.ex?.[Number(existingIndex)],name=decodeURIComponent(nameToken||''),sourceId=decodeURIComponent(sourceToken||'')||null,bp=decodeURIComponent(bpToken||''),tg=decodeURIComponent(tgToken||''),eq=decodeURIComponent(eqToken||'');
    const method=D.getElementById('pmMethod')?.value||'STANDARD',kind=D.getElementById('pmKind')?.value||movementClass(name),resistance=D.getElementById('pmResistanceType')?.value||resistanceType(eq,name),convention=D.getElementById('pmLoadConvention')?.value||loadConvention(resistance,name),weightMode=D.getElementById('pmWeightMode')?.value||'auto';
    const count=Math.max(1,num(D.getElementById('pmSets')?.value,3)),reps=Math.max(1,num(D.getElementById('pmReps')?.value,10)),manualWeight=Math.max(0,num(D.getElementById('pmWeight')?.value)),baseWeight=weightMode==='manual'?manualWeight:0;if(weightMode==='manual'&&!(baseWeight>0)&&!['bodyweight','assisted'].includes(resistance)){W.toast?.('Укажи вес или выбери Автовес');return}
    let rpeMin=clamp(num(D.getElementById('pmRpeMin')?.value,7),1,10),rpeMax=clamp(num(D.getElementById('pmRpeMax')?.value,8),1,10);if(rpeMin>rpeMax)[rpeMin,rpeMax]=[rpeMax,rpeMin];
    const tempo=D.getElementById('pmTempo')?.value||defaultTempo(kind),restMode=D.getElementById('pmRestMode')?.value||D.getElementById('pmRestModeSelect')?.value||'auto',rest=restMode==='auto'?autoRest(kind,method):Math.max(0,num(D.getElementById('pmRest')?.value,90)),step=stepFor(name,sourceId);
    const data={tempo,tempoLight:'3-1-2',step,heavyReps:Math.max(1,num(D.getElementById('pmHeavyReps')?.value,3)),heavyWeight:Math.max(0,num(D.getElementById('pmHeavyWeight')?.value,baseWeight)),lightReps:Math.max(1,num(D.getElementById('pmLightReps')?.value,9)),lightWeight:Math.max(0,num(D.getElementById('pmLightWeight')?.value,0)),middleSets:Math.max(0,Math.min(5,num(D.getElementById('pmMiddleSets')?.value,2))),middleReps:Math.max(1,num(D.getElementById('pmMiddleReps')?.value,6)),middleWeight:Math.max(0,num(D.getElementById('pmMiddleWeight')?.value,0)),sldrRounds:Math.max(1,Math.min(5,num(D.getElementById('pmSldrRounds')?.value,3))),sldrInnerRest:Math.max(5,num(D.getElementById('pmSldrInnerRest')?.value,15)),repPattern:sldrPattern(),dsMode:D.getElementById('pmDsMode')?.value||'auto',dsCount:Math.max(2,Math.min(6,num(D.getElementById('pmDsStages')?.value,3))),dsDropMode:D.getElementById('pmDsDropMode')?.value||'percent',dsDrop:Math.max(0,num(D.getElementById('pmDsDrop')?.value,20)),dsReference:D.getElementById('pmDsReference')?.value||'previous',dsStages:dsStageDraft.map(x=>({...x})),fstRepMin:Math.max(1,num(D.getElementById('pmFstRepMin')?.value,8)),fstRepMax:Math.max(1,num(D.getElementById('pmFstRepMax')?.value,15)),fstRest:Math.max(15,num(D.getElementById('pmFstRest')?.value,30))};if(data.fstRepMin>data.fstRepMax)[data.fstRepMin,data.fstRepMax]=[data.fstRepMax,data.fstRepMin];
    const sets=buildSets(method,count,baseWeight,reps,rest,data),cfg={};
    if(method==='UNVRSL')cfg.unvrsl={rounds:3,innerRest:30,heavy:{weight:data.heavyWeight,reps:data.heavyReps,tempo:data.tempo,weightMode:data.heavyWeight>0?'manual':'auto'},light:{weight:data.lightWeight,reps:data.lightReps,tempo:data.tempoLight,weightMode:data.lightWeight>0?'manual':'auto'},middle:{enabled:data.middleSets>0,sets:data.middleSets,weight:data.middleWeight,reps:data.middleReps,tempo:data.tempo,weightMode:data.middleWeight>0?'manual':'auto'}};
    if(method==='SLDR')cfg.sldr={rounds:data.sldrRounds,weight:baseWeight,weightMode,repPattern:data.repPattern,innerRest:data.sldrInnerRest,roundRest:rest};
    if(method==='DS')cfg.dropSet={mode:data.dsMode,stageCount:data.dsMode==='manual'?data.dsStages.length:data.dsCount,stages:data.dsMode==='manual'?data.dsStages.map(x=>({...x})):null,dropMode:data.dsDropMode,dropValue:data.dsDrop,dropReference:data.dsReference,innerRest:0,startWeight:baseWeight,weightMode};
    if(method==='FST-7')cfg.fst7={sets:7,weight:baseWeight,weightMode,repMin:data.fstRepMin,repMax:data.fstRepMax,innerRest:data.fstRest};
    const obj=normalizeExercise({...(old||{}),id:old?.id||uidLocal('pex'),n:name,sourceId,bp,tg,eq,method,kind,movementClass:kind,resistanceType:resistance,loadConvention:convention,progressionType:progressionType(kind,resistance,name),weightMode,rpe:(rpeMin+rpeMax)/2,targetRpeMin:rpeMin,targetRpeMax:rpeMax,targetRirMin:Math.max(0,10-rpeMax),targetRirMax:Math.max(0,10-rpeMin),tempo,restMode,rest,innerRest:INNER_REST[method],note:D.getElementById('pmNote')?.value.trim()||'',sets,methodConfig:cfg,schemaVersion:REV},{});
    if(method==='UNVRSL'){obj.heavyReps=data.heavyReps;obj.lightReps=data.lightReps;obj.lightWeight=data.lightWeight;obj.middleSets=data.middleSets;obj.middleReps=data.middleReps;obj.middleWeight=data.middleWeight;obj.tempoLight=data.tempoLight}
    if(method==='SLDR'){obj.sldrRounds=data.sldrRounds;obj.miniSets=data.repPattern.length;obj.repPattern=data.repPattern;obj.innerRest=data.sldrInnerRest;obj.repDrop=null}
    if(method==='DS'){obj.dropSetMode=data.dsMode;obj.dropStages=cfg.dropSet.stages;obj.dropValue=data.dsDrop;obj.dropMode=data.dsDropMode;obj.dropReference=data.dsReference}
    if(existingIndex===null||Number.isNaN(Number(existingIndex)))d.ex.push(obj);else d.ex[Number(existingIndex)]=obj;p.schemaVersion=Math.max(num(p.schemaVersion),REV);p.updated=Date.now();saveState();W.openProgramEditor?.(pid,wi,di)
  };

  function installProgramCreator(){if(typeof W.newProgramSheet!=='function'||W.newProgramSheet.__pe380)return;const old=W.newProgramSheet;W.newProgramSheet=function(){style();W.modal?.(`<div class="sheet-grabber"></div><h2>Новая программа</h2><div class="field"><label>Название</label><input id="npName" value="Новая программа"></div><div class="pe380-create-grid"><div class="field"><label>Недель</label><input id="npWeeks" type="number" min="1" max="16" value="4"></div><div class="field"><label>Тренировок / нед.</label><input id="npDays" type="number" min="1" max="7" value="3"></div><div class="field"><label>RPE от</label><input id="npRpeMin" inputmode="decimal" value="7"></div><div class="field"><label>RPE до</label><input id="npRpeMax" inputmode="decimal" value="8"></div></div><div class="field"><label>Нагрузка программы</label><select id="npProfile"><option value="adaptive">Адаптивная · AutoWeight + RPE/RIR</option><option value="unvrsl8">Профиль UNVRSL по неделям</option></select></div><div class="field"><label>Вес по умолчанию</label><select id="npWeightMode"><option value="auto">Автовес, если вес не задан</option><option value="manual">Ручной вес</option></select></div><div class="pe380-load-card"><b>Редактор v380</b><span>В каждом упражнении можно отдельно выбрать метод, RPE/RIR, AutoWeight или ручной вес. Недельные проценты потом можно изменить в карточке недели.</span></div><button class="btn primary full" style="margin-top:16px" onclick="createProgram()">Создать программу</button>`)};W.newProgramSheet.__pe380=true;W.newProgramSheet.__pe380Base=old;try{newProgramSheet=W.newProgramSheet}catch(_){ }
    W.createProgram=function(){const s=state();if(!s)return;let wc=Math.max(1,Math.min(16,num(D.getElementById('npWeeks')?.value,4))),dc=Math.max(1,Math.min(7,num(D.getElementById('npDays')?.value,3))),rpeMin=clamp(num(D.getElementById('npRpeMin')?.value,7),1,10),rpeMax=clamp(num(D.getElementById('npRpeMax')?.value,8),1,10);if(rpeMin>rpeMax)[rpeMin,rpeMax]=[rpeMax,rpeMin];const profile=D.getElementById('npProfile')?.value||'adaptive',weightMode=D.getElementById('npWeightMode')?.value||'auto',name=D.getElementById('npName')?.value.trim()||'Программа';const weeks=Array.from({length:wc},(_,i)=>{const lp=profile==='unvrsl8'?LOAD_PROFILE[(i%8)+1]:null;return{n:i+1,intensityMin:lp?.pct?.[0]??null,intensityMax:lp?.pct?.[1]??null,useIntensity:!!lp,targetRpeMin:lp?.rpe?.[0]??rpeMin,targetRpeMax:lp?.rpe?.[1]??rpeMax,focus:lp?.focus||'',days:Array.from({length:dc},(_,di)=>({id:uidLocal('day'),name:`День ${di+1}`,ex:[]}))}});const p={id:uidLocal('prog'),name,created:Date.now(),updated:Date.now(),schemaVersion:REV,loadProfileMode:profile,defaults:{weightMode,targetRpeMin:rpeMin,targetRpeMax:rpeMax,targetRirMin:Math.max(0,10-rpeMax),targetRirMax:Math.max(0,10-rpeMin),restMode:'auto'},weeks};if(!Array.isArray(s.programs))s.programs=[];s.programs.push(p);saveState();W.openProgramEditor?.(p.id)};try{createProgram=W.createProgram}catch(_){ }
  }

  function installSummary(){if(typeof W.prescriptionText!=='function'||W.prescriptionText.__pe380)return;const old=W.prescriptionText;W.prescriptionText=function(raw){const e=normalizeExercise(raw||{}),s=e.sets||[],weight=v=>num(v)>0?`${fmt(v)} кг`:'Автовес',rpe=`RPE ${fmt(e.targetRpeMin)}${Math.abs(e.targetRpeMax-e.targetRpeMin)>.001?`–${fmt(e.targetRpeMax)}`:''}`;if(e.method==='STANDARD')return`${s.length||3}×${s[0]?.r||'—'} · ${weight(s[0]?.w)} · ${rpe}`;if(e.method==='UNVRSL'){const u=e.methodConfig?.unvrsl||{},h=u.heavy||{},l=u.light||{},m=u.middle||{};return`3×(${weight(h.weight)}×${h.reps||3} → ${weight(l.weight)}×${l.reps||9})${m.enabled?` + ${m.sets||0}×${m.reps||6}`:''} · ${rpe}`};if(e.method==='SLDR'){const c=e.methodConfig?.sldr||{},p=c.repPattern||e.repPattern||[12,10,8];return`${c.rounds||3}×(${p.join('/')}) · ${weight(s[0]?.w)} · ${c.innerRest||15}с внутри`};if(e.method==='DS'){const a=s.map(x=>`${num(x.w)>0?fmt(x.w):'Auto'}×${x.r||'—'}`);return`DS · ${a.join(' → ')}`};if(e.method==='FST-7'){const f=e.methodConfig?.fst7||{};return`7×${f.repMin||8}–${f.repMax||15} · ${weight(s[0]?.w)} · ${f.innerRest||30}с`};return old.apply(this,arguments)};W.prescriptionText.__pe380=true;W.prescriptionText.__pe380Base=old;try{prescriptionText=W.prescriptionText}catch(_){ }
  }

  function fixCanonicalProfile(){try{if(typeof W.cloneBuiltInCycle==='function'&&!W.cloneBuiltInCycle.__pe380){const old=W.cloneBuiltInCycle;W.cloneBuiltInCycle=function(){const before=(state()?.programs||[]).length,r=old.apply(this,arguments),list=state()?.programs||[],p=list.length>before?list.at(-1):null;if(p)(p.weeks||[]).slice(0,8).forEach((w,i)=>{const x=LOAD_PROFILE[i+1];if(!x)return;w.intensityMin=x.pct[0];w.intensityMax=x.pct[1];w.useIntensity=true;w.targetRpeMin=x.rpe[0];w.targetRpeMax=x.rpe[1]});if(p)saveState();return r};W.cloneBuiltInCycle.__pe380=true;try{cloneBuiltInCycle=W.cloneBuiltInCycle}catch(_){ }}}catch(_){ }}

  function migrate(){const s=state();if(!Array.isArray(s?.programs))return false;let changed=false;s.programs.forEach(p=>(p.weeks||[]).forEach(w=>(w.days||[]).forEach(d=>(d.ex||[]).forEach((e,i)=>{if(num(e.schemaVersion)>=REV)return;d.ex[i]=normalizeExercise(e);changed=true}))));if(changed)saveState();return changed}

  function install(){style();installProgramCreator();installSummary();fixCanonicalProfile();migrate();return typeof W.programExerciseForm==='function'}
  ['unvrsl:modules-ready','unvrsl:app-ready','unvrsl:training-engine-ready','unvrsl:cloud-modules-settled'].forEach(ev=>W.addEventListener?.(ev,()=>setTimeout(install,0),{passive:true}));
  [0,80,250,700,1500,3000].forEach(ms=>setTimeout(install,ms));
  install();
})();
