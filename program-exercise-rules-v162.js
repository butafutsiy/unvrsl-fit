'use strict';
(()=>{
  if(window.__unvrslProgramExerciseRulesV162)return;
  window.__unvrslProgramExerciseRulesV162=true;

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
    UNVRSL:'Тяжёлая тройка → 30 секунд → лёгкая девятка.',
    SLDR:'3 мини-подхода с тем же весом и паузой 15 секунд.',
    DS:'5 мини-подходов подряд, каждый следующий вес ниже на 20%.',
    'FST-7':'7 подходов с паузой 30 секунд.'
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
    .px-choice-section{margin-top:20px}.px-choice-label{color:#929298;font-size:14px;margin:0 2px 9px}.px-segment{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.px-segment.methods{grid-template-columns:repeat(3,minmax(0,1fr))}.px-choice{min-height:48px;padding:10px;border-radius:15px;background:#1b1b1e;border:1px solid #34343a;color:#b0b0b6;font-weight:730}.px-choice.on{background:rgba(10,132,255,.18);border-color:#0a84ff;color:#64b5ff}.px-choice.recommended:after{content:'•';color:var(--green);margin-left:5px}.px-main-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 12px;margin-top:12px}.px-main-grid .field{min-width:0}.px-main-grid input{font-size:18px}.px-span-2{grid-column:1/-1}.px-tempo-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.px-tempo{min-height:44px;border-radius:13px;background:#1c1c1f;border:1px solid #34343a;color:#aaa;font-weight:750}.px-tempo.on{border-color:var(--green);background:color-mix(in srgb,var(--green) 13%,#1c1c1f);color:var(--green)}.px-custom-tempo{margin-top:8px}.px-tempo-help,.px-auto-help,.px-method-info{font-size:12px;color:#7f7f86;line-height:1.45;margin-top:7px}.px-method-info{padding:13px 14px;background:#202024;border:1px solid #303036;border-radius:15px;color:#b5b5bb}.px-method-info.warn{border-color:rgba(255,159,10,.45);color:#ffb340}.px-rest-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.px-rest-toggle{display:flex;padding:3px;background:#26262a;border-radius:12px}.px-rest-toggle button{padding:8px 10px;border-radius:9px;color:#929298;font-size:12px;font-weight:750}.px-rest-toggle button.on{background:#3a3a3f;color:#fff}.px-rest-auto input:disabled{opacity:.72;color:#64b5ff}.px-save-exercise{position:sticky;bottom:0;margin:20px -2px 0;box-shadow:0 -18px 36px #111113;min-height:56px;font-size:18px}.px-action-list{display:grid;gap:9px;margin-top:18px}.px-action-list .btn{width:100%;min-height:52px;text-align:left}.px-action-list .danger{color:var(--red)}
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

  const originalModal=window.modal;
  if(typeof originalModal==='function'){
    const cleanModal=function(html){
      document.getElementById('modal')?.classList.remove('px-program-modal','px-exercise-modal');
      document.getElementById('sheet')?.classList.remove('px-program-sheet','px-exercise-sheet');
      return originalModal.call(this,html)
    };
    window.modal=cleanModal;try{modal=cleanModal}catch(e){}
  }
  function markModal(type){
    document.getElementById('modal')?.classList.add(type==='program'?'px-program-modal':'px-exercise-modal');
    document.getElementById('sheet')?.classList.add(type==='program'?'px-program-sheet':'px-exercise-sheet')
  }

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
    if(document.getElementById('pmRestMode')?.value==='auto')programUpdateAutoRest();
    programRefreshMethodUi(false)
  };
  window.programSetMethod=function(method){
    const input=document.getElementById('pmMethod');if(!input)return;input.value=method;
    document.querySelectorAll('[data-method]').forEach(b=>b.classList.toggle('on',b.dataset.method===method));
    programRefreshMethodUi(true)
  };
  window.programMethodDefaults=function(method){programSetMethod(method)};
  window.programSetRestMode=function(mode){
    const input=document.getElementById('pmRestMode');if(!input)return;input.value=mode;
    document.querySelectorAll('[data-rest-mode]').forEach(b=>b.classList.toggle('on',b.dataset.restMode===mode));
    const rest=document.getElementById('pmRest');if(rest)rest.disabled=mode==='auto';
    document.getElementById('pmRestField')?.classList.toggle('px-rest-auto',mode==='auto');
    if(mode==='auto')programUpdateAutoRest();else setTimeout(()=>rest?.focus(),0)
  };
  window.programUpdateAutoRest=function(){
    const kind=document.getElementById('pmKind')?.value||'compound',method=document.getElementById('pmMethod')?.value||'STANDARD',rest=document.getElementById('pmRest');
    if(rest)rest.value=autoRest(kind,method);
    const help=document.getElementById('pmRestHelp');if(help)help.textContent=`Автоматически: ${kindLabel(kind).toLowerCase()} · ${METHOD_LABEL[method]||method}`
  };
  window.programRefreshMethodUi=function(applyDefaults=false){
    const method=document.getElementById('pmMethod')?.value||'STANDARD',kind=document.getElementById('pmKind')?.value||'compound';
    const sets=document.getElementById('pmSets');
    if(applyDefaults&&sets)sets.value=method==='UNVRSL'?2:method==='SLDR'?3:method==='DS'?5:method==='FST-7'?7:Math.min(5,Math.max(1,numberValue('pmSets',3)));
    document.getElementById('pmSetsField')?.classList.toggle('hidden',method!=='STANDARD');
    document.getElementById('pmRepsField')?.classList.toggle('hidden',method==='UNVRSL');
    document.getElementById('pmTempoGeneral')?.classList.toggle('hidden',method==='UNVRSL');
    document.getElementById('pmTempoUnvrsl')?.classList.toggle('hidden',method!=='UNVRSL');
    document.getElementById('pmUnvrslFields')?.classList.toggle('hidden',method!=='UNVRSL');
    const hint=document.getElementById('methodHint');
    if(hint){const warning=(method==='FST-7'||method==='DS')&&kind==='compound';hint.className='px-method-info'+(warning?' warn':'');hint.textContent=(METHOD_HINT[method]||'')+(warning?' Для базового упражнения метод лучше использовать только осознанно.':'')}
    const inner=document.getElementById('pmInnerRest');if(inner){const v=INNER_REST[method];inner.textContent=v==null?'Внутри метода нет отдельной паузы.':v===0?'Внутри метода: без отдыха.':`Внутри метода: ${v} сек.`}
    if(document.getElementById('pmRestMode')?.value==='auto')programUpdateAutoRest()
  };

  window.programExerciseForm=function(x){
    const d=programById(x.pid)?.weeks?.[x.wi]?.days?.[x.di],e=x.existingIndex!==null&&x.existingIndex!==undefined?d?.ex?.[x.existingIndex]:null;
    const method=e?.method||'STANDARD',kind=e?.kind||inferKind(x.n),restMode=e?.restMode||(e?'manual':'auto'),rest=e?.rest??autoRest(kind,method),first=e?.sets?.[0]||{},second=e?.sets?.[1]||{};
    const tempo=e?.tempo||recommendedTempo(kind),tempoLight=e?.tempoLight||second.tempo||'3-1-2',heavyReps=e?.heavyReps||first.r||3,lightReps=e?.lightReps||second.r||9,lightWeight=e?.lightWeight??second.w??roundProgramLoad((first.w||0)*.7);
    modal(`<div class="px-exercise-head"><button class="px-icon-btn" onclick="openProgramEditor('${x.pid}',${x.wi},${x.di})">←</button><div class="px-head-copy grow"><h2>${esc(x.n)}</h2><div class="muted">Настройка упражнения</div></div></div><input id="pmKind" type="hidden" value="${kind}"><input id="pmMethod" type="hidden" value="${method}"><input id="pmRestMode" type="hidden" value="${restMode}"><div class="px-choice-section"><div class="px-choice-label">Вид упражнения</div><div class="px-segment">${kindButtons(kind)}</div></div><div class="px-choice-section"><div class="px-choice-label">Метод выполнения</div><div class="px-segment methods">${methodButtons(method)}</div></div><div class="px-main-grid"><div class="field" id="pmSetsField"><label>Подходов</label><input id="pmSets" type="number" min="1" max="10" value="${e?.sets?.length||3}"></div><div class="field" id="pmRepsField"><label>Повторений</label><input id="pmReps" type="number" min="1" max="50" value="${first.r||10}"></div><div class="field"><label>Вес, кг</label><input id="pmWeight" inputmode="decimal" value="${first.w||0}"></div><div class="field"><label>Целевой RPE</label><input id="pmRpe" inputmode="decimal" value="${e?.rpe||8}"></div><div id="pmUnvrslFields" class="px-span-2 px-main-grid"><div class="field"><label>Тяжёлых повторов</label><input id="pmHeavyReps" type="number" min="1" max="10" value="${heavyReps}"></div><div class="field"><label>Лёгких повторов</label><input id="pmLightReps" type="number" min="1" max="30" value="${lightReps}"></div><div class="field px-span-2"><label>Лёгкий вес, кг</label><input id="pmLightWeight" inputmode="decimal" value="${lightWeight}"></div></div></div><div id="pmTempoGeneral">${tempoChooser('pmTempo','Темп',tempo)}</div><div id="pmTempoUnvrsl">${tempoChooser('pmTempoHeavy','Темп тяжёлой тройки',tempo)}${tempoChooser('pmTempoLight','Темп лёгкой девятки',tempoLight)}</div><div class="px-choice-section" id="pmRestField"><div class="px-rest-head"><div class="px-choice-label">Отдых после блока</div><div class="px-rest-toggle"><button type="button" data-rest-mode="auto" class="${restMode==='auto'?'on':''}" onclick="programSetRestMode('auto')">Авто</button><button type="button" data-rest-mode="manual" class="${restMode==='manual'?'on':''}" onclick="programSetRestMode('manual')">Вручную</button></div></div><div class="field"><input id="pmRest" type="number" min="0" step="15" value="${rest}" ${restMode==='auto'?'disabled':''}></div><div id="pmRestHelp" class="px-auto-help"></div><div id="pmInnerRest" class="px-auto-help"></div></div><div id="methodHint" class="px-method-info"></div><div class="field"><label>Комментарий</label><input id="pmNote" value="${esc(e?.note||'')}"></div><button class="btn primary full px-save-exercise" onclick="saveProgramExercise('${x.pid}',${x.wi},${x.di},'${encodeURIComponent(x.n)}','${encodeURIComponent(x.sourceId||'')}','${encodeURIComponent(x.bp||'')}','${encodeURIComponent(x.tg||'')}','${encodeURIComponent(x.eq||'')}',${x.existingIndex===null||x.existingIndex===undefined?'null':x.existingIndex})">${x.existingIndex===null||x.existingIndex===undefined?'Добавить':'Сохранить'}</button>`);
    markModal('exercise');
    setTimeout(()=>{programRefreshMethodUi(false);programSetRestMode(restMode)},0)
  };

  function buildSets(method,count,w,r,rest,data){
    if(method==='UNVRSL')return[
      {label:'Тяжёлая',w,r:data.heavyReps,rest:30,tempo:data.tempo},
      {label:'Лёгкая',w:data.lightWeight,r:data.lightReps,rest,tempo:data.tempoLight}
    ];
    if(method==='SLDR')return Array.from({length:3},(_,i)=>({label:`${i+1}/3`,w,r,rest:i<2?15:rest,tempo:data.tempo}));
    if(method==='DS')return Array.from({length:5},(_,i)=>({label:`DS${i+1}`,w:roundProgramLoad(w*Math.pow(.8,i)),r,rest:i<4?0:rest,tempo:data.tempo}));
    if(method==='FST-7')return Array.from({length:7},(_,i)=>({label:`${i+1}/7`,w,r,rest:i<6?30:rest,tempo:data.tempo}));
    return Array.from({length:Math.max(1,Math.min(10,count))},(_,i)=>({label:String(i+1),w,r,rest,tempo:data.tempo}))
  }
  window.saveProgramExercise=function(pid,wi,di,nameToken,sourceToken,bpToken,tgToken,eqToken,existingIndex){
    const p=programById(pid),d=p?.weeks?.[wi]?.days?.[di];if(!d)return;
    const old=existingIndex===null||Number.isNaN(existingIndex)?null:d.ex?.[existingIndex],n=decodeURIComponent(nameToken),method=document.getElementById('pmMethod')?.value||'STANDARD',kind=document.getElementById('pmKind')?.value||inferKind(n),restMode=document.getElementById('pmRestMode')?.value||'auto';
    const count=numberValue('pmSets',3),r=numberValue('pmReps',10),w=numberValue('pmWeight',0),rpe=numberValue('pmRpe',8),rest=restMode==='auto'?autoRest(kind,method):Math.max(0,numberValue('pmRest',90)),note=document.getElementById('pmNote')?.value.trim()||'';
    const tempo=(method==='UNVRSL'?document.getElementById('pmTempoHeavy'):document.getElementById('pmTempo'))?.value.trim()||recommendedTempo(kind),tempoLight=document.getElementById('pmTempoLight')?.value.trim()||'3-1-2',heavyReps=Math.max(1,numberValue('pmHeavyReps',3)),lightReps=Math.max(1,numberValue('pmLightReps',9)),lightWeight=Math.max(0,numberValue('pmLightWeight',roundProgramLoad(w*.7)));
    const data={tempo,tempoLight,heavyReps,lightReps,lightWeight},sets=buildSets(method,count,w,r,rest,data),obj={...(old||{}),id:old?.id||uid('pex'),n,sourceId:decodeURIComponent(sourceToken||'')||null,bp:decodeURIComponent(bpToken||''),tg:decodeURIComponent(tgToken||''),eq:decodeURIComponent(eqToken||''),kind,method,rpe,tempo,tempoLight:method==='UNVRSL'?tempoLight:null,restMode,rest,innerRest:INNER_REST[method],heavyReps:method==='UNVRSL'?heavyReps:null,lightReps:method==='UNVRSL'?lightReps:null,lightWeight:method==='UNVRSL'?lightWeight:null,note,sets};
    if(old)d.ex[existingIndex]=obj;else d.ex.push(obj);p.updated=Date.now();save();openProgramEditor(pid,wi,di)
  };

  const baseProgramExerciseRow=window.programExerciseRow;
  window.programExerciseRow=function(p,d,e,ei){
    if(e?.method==='SUPERSET'&&typeof baseProgramExerciseRow==='function')return baseProgramExerciseRow(p,d,e,ei);
    const kind=e?.kind||inferKind(e?.n),method=e?.method||'STANDARD',tempo=method==='UNVRSL'&&e?.tempoLight?`${e.tempo} → ${e.tempoLight}`:(e?.tempo||'—');
    return `<div class="px-program-ex"><div class="row between"><div class="grow"><div class="px-ex-title">${esc(e.n)}</div><div class="muted small" style="margin-top:4px">${esc(typeof prescriptionText==='function'?prescriptionText(e):'')}</div></div><button class="btn tiny" onclick="editProgramExercise('${p.id}',${programUi.week},'${d.id}',${ei})">Изм.</button></div><div class="px-ex-meta"><span class="px-meta-chip kind">${kindLabel(kind)}</span><span class="px-meta-chip method">${METHOD_LABEL[method]||method}</span><span class="px-meta-chip">Темп ${esc(tempo)}</span><span class="px-meta-chip">Отдых ${e?.rest??autoRest(kind,method)} сек${e?.restMode==='auto'?' · авто':''}</span></div><div class="px-ex-controls"><button onclick="moveProgramExercise('${p.id}',${programUi.week},'${d.id}',${ei},-1)">↑ Выше</button><button onclick="moveProgramExercise('${p.id}',${programUi.week},'${d.id}',${ei},1)">↓ Ниже</button><button class="danger-text" onclick="removeProgramExercise('${p.id}',${programUi.week},'${d.id}',${ei})">Удалить</button></div></div>`
  };

  const openDays={};
  function openDayKey(pid,wi){return `${pid}:${wi}`}
  window.programToggleDay=function(pid,wi,di){const k=openDayKey(pid,wi);openDays[k]=openDays[k]===di?-1:di;renderProgramEditor()};
  window.programDayActions=function(pid,wi,di){
    const d=programById(pid)?.weeks?.[wi]?.days?.[di];if(!d)return;
    modal(`<div class="sheet-grabber"></div><div class="row between"><div><h2>${esc(d.name)}</h2><div class="muted">Действия с тренировкой</div></div><button class="btn tiny" onclick="openProgramEditor('${pid}',${wi},${di})">←</button></div><div class="px-action-list"><button class="btn" onclick="renameProgramDaySheet('${pid}',${wi},${di})">Переименовать</button><button class="btn" onclick="createProgramSuperset('${pid}',${wi},${di})">Добавить суперсет</button><button class="btn danger" onclick="deleteProgramDay('${pid}',${wi},${di})">Удалить день</button></div>`)
  };
  window.programEditorActions=function(pid,wi){
    modal(`<div class="sheet-grabber"></div><div class="row between"><div><h2>Действия</h2><div class="muted">Программа и неделя W${wi+1}</div></div><button class="btn tiny" onclick="openProgramEditor('${pid}',${wi})">←</button></div><div class="px-action-list"><button class="btn" onclick="renameProgramSheet('${pid}')">Переименовать программу</button><button class="btn" onclick="copyProgramWeek('${pid}',${wi})">Копировать неделю</button><button class="btn" onclick="addProgramWeek('${pid}')">Добавить неделю</button><button class="btn" onclick="shareProgram('${pid}')">Поделиться программой</button><button class="btn" onclick="saveProgramAsTemplate('${pid}')">Сохранить как шаблон</button></div>`)
  };
  window.programDayCard=function(p,w,d,di){
    const k=openDayKey(p.id,programUi.week);if(!(k in openDays))openDays[k]=Number.isFinite(programUi.day)?programUi.day:0;const open=openDays[k]===di,rows=(d.ex||[]).map((e,ei)=>programExerciseRow(p,d,e,ei)).join('');
    return `<div class="card px-day ${open?'open':''}"><button class="px-day-head" onclick="programToggleDay('${p.id}',${programUi.week},${di})"><span class="px-day-chevron">⌄</span><span class="grow"><span class="px-day-title">${esc(d.name)}</span><span class="muted small" style="display:block;margin-top:4px">${d.ex.length} упражнений</span></span><span class="px-icon-btn px-day-menu" onclick="event.stopPropagation();programDayActions('${p.id}',${programUi.week},${di})">•••</span></button>${open?`<div class="px-day-body">${rows||'<div class="px-empty">Добавь первое упражнение. Вид, темп и отдых настроятся на следующем шаге.</div>'}<div class="px-day-actions"><button class="px-add-exercise" onclick="chooseProgramExercise('${p.id}',${programUi.week},${di})">＋ Добавить упражнение</button><button class="px-add-super" onclick="createProgramSuperset('${p.id}',${programUi.week},${di})">Суперсет</button></div></div>`:''}</div>`
  };
  window.renderProgramEditor=function(){
    const p=programById(programUi.pid);if(!p)return;ensureProgramShape(p);const w=p.weeks[programUi.week]||p.weeks[0];if(!w)return;
    modal(`<div class="px-editor-head"><div class="px-head-copy grow"><h2>${esc(p.name)}</h2><div class="muted">Неделя ${programUi.week+1} · ${w.days.length} тренировок</div></div><div class="px-head-actions"><button class="px-icon-btn" onclick="programEditorActions('${p.id}',${programUi.week})">•••</button><button class="px-done" onclick="closeModal();planPage()">Готово</button></div></div><div class="px-week-wrap"><div class="weekbar">${p.weeks.map((x,i)=>`<button class="weekbtn ${i===programUi.week?'on':''}" onclick="programUi.week=${i};programUi.day=0;renderProgramEditor()">W${i+1}</button>`).join('')}</div></div><div class="px-program-section">Неделя ${programUi.week+1}</div>${w.days.map((d,di)=>programDayCard(p,w,d,di)).join('')}<button class="btn full px-add-day" onclick="addProgramDay('${p.id}',${programUi.week})">＋ Добавить тренировку</button>`);
    markModal('program')
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
