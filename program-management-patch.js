'use strict';
(()=>{
  if(window.__unvrslProgramManagementPatch)return;
  window.__unvrslProgramManagementPatch=true;
  const BUILTIN='__builtin_cycle__';
  const DEFAULT_BUILTIN_NAME='Встроенный цикл · 8 недель';
  const BAD='Тренировочный план (Антон Горькуша)';
  const GOOD='Тренировочный план (Антон Гарькуша)';
  const SEED='anton-gorkusha-training-plan';

  const builtInName=()=>String(st.builtinProgramName||DEFAULT_BUILTIN_NAME);
  window.unvrslBuiltInProgramId=BUILTIN;
  window.unvrslBuiltInProgramName=builtInName;

  function migrateAntonName(){
    let changed=false;
    (Array.isArray(st.programs)?st.programs:[]).forEach(p=>{
      if(!p)return;
      if(p.seedId===SEED||p.id===SEED||p.name===BAD||/Антон\s+Горькуша/i.test(p.name||'')){
        const next=String(p.name||GOOD).replace(/Антон\s+Горькуша/gi,'Антон Гарькуша');
        if(p.name!==next){p.name=next;changed=true}
        if(typeof p.author==='string'&&/Антон\s+Горькуша/i.test(p.author)){
          p.author=p.author.replace(/Антон\s+Горькуша/gi,'Антон Гарькуша');changed=true;
        }
      }
    });
    if(changed)try{save()}catch(e){}
  }

  migrateAntonName();
  if(!st.primaryProgramId)st.primaryProgramId=BUILTIN;
  if(!st.primaryProgramWeeks||typeof st.primaryProgramWeeks!=='object')st.primaryProgramWeeks={};

  function customProgram(id){return (Array.isArray(st.programs)?st.programs:[]).find(p=>p&&!p.archived&&String(p.id)===String(id))||null}
  function validPrimary(id){return String(id)===BUILTIN||!!customProgram(id)}
  function primaryId(){if(!validPrimary(st.primaryProgramId))st.primaryProgramId=BUILTIN;return String(st.primaryProgramId||BUILTIN)}

  window.setPrimaryProgram=function(id){
    id=String(id);
    if(!validPrimary(id))return typeof toast==='function'?toast('Программа не найдена'):undefined;
    st.primaryProgramId=id;
    st.startProgramId=id;
    try{save()}catch(e){}
    if(typeof toast==='function')toast(id===BUILTIN?'Встроенный цикл выбран основным':'Программа выбрана основной');
    try{if(typeof trainerProgramsPage==='function')trainerProgramsPage()}catch(e){}
    try{planPage()}catch(e){}
  };

  window.renameBuiltInProgramSheet=function(){
    modal(`<div class="sheet-grabber"></div><h2>Название программы</h2><div class="field"><input id="builtinProgramNameInput" value="${esc(builtInName())}"></div><button class="btn primary full" onclick="saveBuiltInProgramName()">Сохранить</button>`)
  };
  window.saveBuiltInProgramName=function(){
    const v=String(document.querySelector('#builtinProgramNameInput')?.value||'').trim();
    if(!v)return typeof toast==='function'?toast('Введи название'):undefined;
    st.builtinProgramName=v;try{save()}catch(e){};closeModal();
    try{if(typeof trainerProgramsPage==='function')trainerProgramsPage()}catch(e){}
    try{planPage()}catch(e){}
    if(typeof toast==='function')toast('Название изменено');
  };

  function pctNumber(value){const n=Number(String(value??'').replace(',','.'));return Number.isFinite(n)&&n>0?(n<=1?n*100:n):null}
  function weekIntensityText(week){
    const lo=pctNumber(week?.intensityMin??week?.weekIntensityMin??week?.intensity?.min);
    const hi=pctNumber(week?.intensityMax??week?.weekIntensityMax??week?.intensity?.max);
    if(lo==null&&hi==null)return'';
    const a=lo??hi,b=hi??lo,fmt=n=>String(Math.round(n*10)/10).replace('.',',');
    return `${fmt(Math.min(a,b))}–${fmt(Math.max(a,b))}%`
  }
  const safeId=id=>String(id||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'");
  window.openManagedProgramV385=function(id){
    window.__unvrslProgramEditorReturnPageV385='programs';
    if(typeof window.openProgramEditor!=='function')return typeof toast==='function'?toast('Редактор ещё загружается'):undefined;
    return window.openProgramEditor(String(id),0,0)
  };
  window.trainerProgramsPage=function(){
    const root=document.getElementById('programs');if(!root)return;
    const pid=primaryId(),programs=(Array.isArray(st.programs)?st.programs:[]).filter(p=>p&&!p.archived);
    const list=programs.map(p=>{
      const id=safeId(p.id),weeks=Array.isArray(p.weeks)?p.weeks:[],sessions=weeks.reduce((sum,w)=>sum+(w?.days?.length||0),0),main=String(p.id)===pid;
      const intensity=weekIntensityText(weeks[0]);
      return `<div class="card program-list-card-v385 ${main?'program-card-primary':''}"><div class="row between"><button class="program-list-open-v385 grow" data-program-open-v385="${id}" onclick="return openManagedProgramV385('${id}')"><span class="title">${esc(p.name||'Программа')}</span><span class="muted small">${weeks.length} нед. · ${sessions} тренировок${intensity?` · ${intensity}`:''}</span>${main?'<span class="chip green program-primary-badge">Основная</span>':''}</button><span class="chev">›</span></div><div class="coach-actions"><button class="btn tiny" onclick="openManagedProgramV385('${id}')">Открыть</button>${main?'':`<button class="btn tiny" onclick="setPrimaryProgram('${id}')">Сделать основной</button>`}<button class="btn tiny danger" onclick="deleteProgram('${id}')">Удалить</button></div></div>`
    }).join('');
    root.innerHTML=`<div class="programs-v385-head"><div><h1>Программы</h1><div class="muted">Создание и управление циклами</div></div><button class="btn primary program-create-v385" onclick="newProgramSheet()" aria-label="Создать программу">＋</button></div><div class="card program-list-card-v385 ${pid===BUILTIN?'program-card-primary':''}"><div class="row between"><button class="program-list-open-v385 grow" onclick="openBuiltinProgramViewer(1)"><span class="title">${esc(builtInName())}</span><span class="muted small">8 недель · встроенная программа</span>${pid===BUILTIN?'<span class="chip green program-primary-badge">Основная</span>':''}</button><span class="chev">›</span></div><div class="coach-actions"><button class="btn tiny" onclick="openBuiltinProgramViewer(1)">Открыть</button>${pid===BUILTIN?'':`<button class="btn tiny" onclick="setPrimaryProgram('${BUILTIN}')">Сделать основной</button>`}</div></div><div class="section">МОИ ПРОГРАММЫ</div>${list||'<div class="card muted">Пока нет своих программ.</div>'}`;
  };
  try{trainerProgramsPage=window.trainerProgramsPage}catch(_){}

  window.openBuiltinProgramViewer=function(w=1){
    w=Math.max(1,Math.min(8,+w||1));
    const rows=(typeof ROUTINES!=='undefined'?ROUTINES:[]).filter(r=>r.w===w);
    modal(`<div class="sheet-grabber"></div><div class="row between"><div><h2>${esc(builtInName())}</h2><div class="muted">Встроенная программа · 8 недель</div></div><button class="btn tiny" onclick="closeModal()">✕</button></div><div class="weekbar">${Array.from({length:8},(_,i)=>i+1).map(n=>`<button class="weekbtn ${n===w?'on':''}" onclick="openBuiltinProgramViewer(${n})">W${n}</button>`).join('')}</div>${rows.map(r=>`<div class="card routine" onclick="preview(${r.w},'${r.c}')"><div class="row between"><div class="grow"><b>${esc(r.c)} · ${esc(r.t)}</b><div class="muted small">${esc(r.p||'')} · ${r.e.length} упражнений</div></div><span class="chip">RPE ${RPE[w]}</span></div></div>`).join('')}`)
  };

  function customWeekIndex(p){
    const saved=Number(st.primaryProgramWeeks?.[p.id]);
    return Math.max(0,Math.min((p.weeks?.length||1)-1,Number.isFinite(saved)&&saved>0?saved-1:0));
  }
  window.selectPrimaryPlanWeek=function(w){
    const p=customProgram(primaryId());if(!p)return;
    const n=Math.max(1,Math.min(p.weeks.length,+w||1));st.primaryProgramWeeks[p.id]=n;try{save()}catch(e){};planPage();
  };
  window.previewPrimaryProgramDay=function(pid,wi,di){
    const p=customProgram(pid),d=p?.weeks?.[wi]?.days?.[di];if(!p||!d)return;
    const lines=(d.ex||[]).map(e=>`<div class="program-ex"><b>${esc(e.n||'Упражнение')}</b><div class="muted small">${typeof prescriptionText==='function'?esc(prescriptionText(e)):''}${e.rpe?` · RPE ${e.rpe}`:''}${e.tempo?` · темп ${esc(e.tempo)}`:''}${e.rest?` · отдых ${e.rest} сек`:''}</div></div>`).join('');
    modal(`<div class="sheet-grabber"></div><div class="row between"><div><h2>${esc(d.name||'Тренировка')}</h2><div class="muted">${esc(p.name||'Программа')} · W${wi+1}</div></div><button class="btn tiny" onclick="closeModal()">✕</button></div>${lines||'<div class="card muted">Упражнения не добавлены.</div>'}<button class="btn primary full" data-program-editor-start="1" style="margin-top:16px" onclick="return programStartFromEditorV386(event,'${p.id}',${wi},${di})">Старт</button>`)
  };

  const managedPlanPage=function(){
    const root=document.querySelector('#plan');if(!root)return;
    const pid=primaryId();
    if(pid===BUILTIN){
      const w=Math.max(1,Math.min(8,+st.week||1)),list=(typeof ROUTINES!=='undefined'?ROUTINES:[]).filter(r=>r.w===w);
      root.innerHTML=`<div class="card primary-plan-head"><div class="row between"><div><div class="muted small">ОСНОВНАЯ ПРОГРАММА</div><div class="title" style="margin-top:5px">${esc(builtInName())}</div></div><span class="chip green">Основная</span></div></div><div class="section">ТРЕНИРОВОЧНЫЙ ЦИКЛ</div><div class="weekbar">${Array.from({length:8},(_,i)=>i+1).map(n=>`<button class="weekbtn ${n===w?'on':''}" onclick="st.week=${n};save();planPage()">W${n}</button>`).join('')}</div><div class="card"><div class="row between"><div><div class="title">Неделя ${w}</div><div class="muted">${typeof weekType==='function'?weekType(w):''}</div></div><span class="chip green">RPE ${RPE[w]}</span></div></div>${list.map(r=>`<div class="card routine" onclick="preview(${r.w},'${r.c}')"><h3>${esc(r.c)} · ${esc(r.t)}</h3><div class="muted">${esc(r.p||'')}</div><div class="chips"><span class="chip">${r.e.length} упражнений</span><span class="chip">RPE ${RPE[w]}</span></div></div>`).join('')}`;
      return;
    }
    const p=customProgram(pid);if(!p){st.primaryProgramId=BUILTIN;try{save()}catch(e){};return managedPlanPage()}
    const wi=customWeekIndex(p),w=p.weeks?.[wi],days=w?.days||[];
    root.innerHTML=`<div class="card primary-plan-head"><div class="row between"><div class="grow"><div class="muted small">ОСНОВНАЯ ПРОГРАММА</div><div class="title" style="margin-top:5px">${esc(p.name||'Программа')}</div><div class="muted small" style="margin-top:5px">${p.weeks?.length||0} нед. · ${(p.weeks||[]).reduce((a,x)=>a+(x.days?.length||0),0)} тренировок</div></div><span class="chip green">Основная</span></div></div>${window.unvrslProgramLoadGridHtmlV431?.(p.weeks)||''}<div class="section">ТРЕНИРОВОЧНЫЙ ЦИКЛ</div><div class="weekbar">${p.weeks.map((_,i)=>`<button class="weekbtn ${i===wi?'on':''}" onclick="selectPrimaryPlanWeek(${i+1})">W${i+1}</button>`).join('')}</div><div class="card program-week-summary-v385"><div class="row between"><div><div class="title">Неделя ${wi+1}</div><div class="muted">${esc(w?.focus||w?.name||'')}</div></div>${weekIntensityText(w)?`<span class="chip green program-week-intensity-v385">${weekIntensityText(w)}</span>`:''}</div></div>${days.map((d,di)=>{const rr=d?.ex?.[0]?.rpe??d?.ex?.[0]?.target;return `<div class="card routine" onclick="previewPrimaryProgramDay('${p.id}',${wi},${di})"><h3>${esc(d.name||`День ${di+1}`)}</h3><div class="chips"><span class="chip">${d.ex?.length||0} упражнений</span>${rr?`<span class="chip">RPE ${rr}</span>`:''}</div></div>`}).join('')||'<div class="card muted">В этой неделе тренировок нет.</div>'}`;
  };
  window.planPage=managedPlanPage;try{planPage=managedPlanPage}catch(e){}

  const style=document.createElement('style');
  style.textContent=`
    #programs .program-card-primary,.primary-plan-head{
      border-color:color-mix(in srgb,var(--green) 58%,transparent)!important;
      box-shadow:0 0 0 1px color-mix(in srgb,var(--green) 18%,transparent) inset!important
    }
    #programs .program-primary-badge{display:inline-flex;margin-top:7px;width:max-content}
    #programs .programs-v385-head{display:flex;align-items:center;justify-content:space-between;gap:14px;margin:4px 2px 18px}
    #programs .programs-v385-head h1{margin:0 0 5px;font-size:38px;letter-spacing:-1.4px}
    #programs .program-create-v385{width:52px;height:52px;padding:0;font-size:27px}
    #programs .program-list-card-v385{padding:18px}
    #programs .program-list-open-v385{display:flex;flex-direction:column;align-items:flex-start;text-align:left;gap:6px;min-width:0;padding:0}
    #programs .program-list-open-v385 .title{white-space:normal}
    #programs .program-list-card-v385 .chev{font-size:28px;color:#777}
    .program-week-summary-v385 .program-week-intensity-v385{flex:none;font-size:13px}
  `;document.head.appendChild(style);

  setTimeout(()=>{migrateAntonName();try{planPage()}catch(e){};if(document.getElementById('programs')?.classList.contains('active'))try{window.trainerProgramsPage()}catch(e){}},0);
})();
