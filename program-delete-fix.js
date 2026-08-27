'use strict';
(()=>{
  if(window.__unvrslProgramDeleteFixV2)return;
  window.__unvrslProgramDeleteFixV2=true;

  const BUILTIN='__builtin_cycle__';
  const STORE='unvrsl-fit-deleted-programs-v2';

  function readDeleted(){
    const out=new Set(Array.isArray(st.deletedProgramKeys)?st.deletedProgramKeys:[]);
    try{(JSON.parse(localStorage.getItem(STORE)||'[]')||[]).forEach(x=>out.add(String(x)))}catch(e){}
    return out;
  }
  function writeDeleted(set){
    const arr=[...set];st.deletedProgramKeys=arr;
    try{localStorage.setItem(STORE,JSON.stringify(arr))}catch(e){}
  }
  function keysFor(p){
    if(!p)return[];
    return [p.id&&`id:${p.id}`,p.seedId&&`seed:${p.seedId}`,p.cloudPlanId&&`cloud:${p.cloudPlanId}`].filter(Boolean).map(String);
  }
  function isDeleted(p,set=readDeleted()){return keysFor(p).some(k=>set.has(k))}
  function visiblePrograms(){return (Array.isArray(st.programs)?st.programs:[]).filter(p=>p&&!p.archived&&!isDeleted(p))}
  function fallbackId(){const p=visiblePrograms()[0];return p?String(p.id):(st.builtinProgramHidden?'':BUILTIN)}
  function normalizePrimary(){
    const list=visiblePrograms(),ids=new Set(list.map(p=>String(p.id)));
    const current=String(st.primaryProgramId||'');
    if((current===BUILTIN&&st.builtinProgramHidden)||(current!==BUILTIN&&!ids.has(current))){st.primaryProgramId=fallbackId()}
    const start=String(st.startProgramId||'');
    if((start===BUILTIN&&st.builtinProgramHidden)||(start!==BUILTIN&&start&&!ids.has(start)))st.startProgramId=st.primaryProgramId||fallbackId();
  }
  function applyTombstones(persist=false){
    const set=readDeleted(),before=(st.programs||[]).length;
    st.programs=(Array.isArray(st.programs)?st.programs:[]).filter(p=>!isDeleted(p,set));
    normalizePrimary();
    if(persist||before!==st.programs.length)try{save()}catch(e){}
  }
  function refreshViews(){
    try{if(typeof trainerProgramsPage==='function')trainerProgramsPage()}catch(e){}
    try{if(typeof planPage==='function')planPage()}catch(e){}
  }

  window.trainerDeleteOwnProgram=function(id){
    id=String(id);
    if(id===BUILTIN)return window.deleteBuiltinProgram();
    const p=(Array.isArray(st.programs)?st.programs:[]).find(x=>String(x?.id)===id);if(!p)return;
    const cloudNote=p.cloudPlanId?'\n\nУже отправленные клиентам версии останутся у них, пока ты не уберёшь их в карточке клиента.':'';
    if(!confirm(`Удалить программу «${p.name||'Программа'}»?${cloudNote}`))return;
    const set=readDeleted();keysFor(p).forEach(k=>set.add(k));writeDeleted(set);
    if(p.seedId){st.seededPrograms=st.seededPrograms&&typeof st.seededPrograms==='object'?st.seededPrograms:{};st.seededPrograms[p.seedId]=true}
    st.programs=(st.programs||[]).filter(x=>String(x?.id)!==id);
    normalizePrimary();try{save()}catch(e){}
    if(typeof closeModal==='function')try{closeModal()}catch(e){}
    if(typeof toast==='function')toast('Программа удалена');
    refreshViews();
  };
  try{trainerDeleteOwnProgram=window.trainerDeleteOwnProgram}catch(e){}

  window.deleteProgram=function(id){return window.trainerDeleteOwnProgram(id)};
  try{deleteProgram=window.deleteProgram}catch(e){}

  window.deleteBuiltinProgram=function(){
    if(st.builtinProgramHidden)return;
    const name=typeof window.unvrslBuiltInProgramName==='function'?window.unvrslBuiltInProgramName():(st.builtinProgramName||'Встроенный цикл · 8 недель');
    if(!confirm(`Удалить программу «${name}» из «Моих программ»?\n\nСам тренировочный код останется в приложении, но программа больше не будет отображаться и выбираться для старта.`))return;
    st.builtinProgramHidden=true;
    if(String(st.primaryProgramId)===BUILTIN)st.primaryProgramId=fallbackId();
    if(String(st.startProgramId)===BUILTIN)st.startProgramId=st.primaryProgramId||fallbackId();
    try{save()}catch(e){}
    if(typeof toast==='function')toast('Встроенная программа удалена');
    refreshViews();
  };

  const baseSetPrimary=window.setPrimaryProgram;
  if(typeof baseSetPrimary==='function'){
    const wrapped=function(id){
      if(String(id)===BUILTIN&&st.builtinProgramHidden)return typeof toast==='function'?toast('Встроенная программа удалена'):undefined;
      applyTombstones(false);return baseSetPrimary.apply(this,arguments)
    };
    window.setPrimaryProgram=wrapped;try{setPrimaryProgram=wrapped}catch(e){}
  }

  function programCard(p){
    const id=String(p.id),primary=String(st.primaryProgramId)===id;
    return `<div class="card coach-program ${primary?'program-card-primary':''}"><div class="row between"><div class="grow"><div class="title">${esc(p.name||'Программа')}</div><div class="muted small">${p.weeks?.length||0} нед. · ${(p.weeks||[]).reduce((a,w)=>a+(w.days?.length||0),0)} тренировок</div>${primary?'<span class="chip green program-primary-badge">Основная</span>':''}</div><button class="btn tiny primary" onclick="openProgramEditor('${id}')">Открыть</button></div><div class="coach-actions"><button class="btn tiny" onclick="shareProgram('${id}')">Поделиться</button><button class="btn tiny" onclick="saveProgramAsTemplate('${id}')">В шаблоны</button><button class="btn tiny" onclick="renameProgramSheet('${id}')">Переименовать</button><button class="btn tiny ${primary?'primary':''}" ${primary?'disabled':''} onclick="setPrimaryProgram('${id}')">${primary?'Основная':'Сделать основной'}</button><button class="btn tiny danger" onclick="trainerDeleteOwnProgram('${id}')">Удалить</button></div></div>`;
  }
  function builtinCard(){
    if(st.builtinProgramHidden)return'';
    const name=typeof window.unvrslBuiltInProgramName==='function'?window.unvrslBuiltInProgramName():(st.builtinProgramName||'Встроенный цикл · 8 недель');
    const primary=String(st.primaryProgramId||'')===BUILTIN;
    return `<div class="card coach-program ${primary?'program-card-primary':''}"><div class="row between"><div class="grow"><div class="title">${esc(name)}</div><div class="muted small">8 нед. · 40 тренировок · встроенная</div>${primary?'<span class="chip green program-primary-badge">Основная</span>':''}</div><button class="btn tiny primary" onclick="openBuiltinProgramViewer(1)">Открыть</button></div><div class="coach-actions"><button class="btn tiny" onclick="renameBuiltInProgramSheet()">Переименовать</button><button class="btn tiny ${primary?'primary':''}" ${primary?'disabled':''} onclick="setPrimaryProgram('${BUILTIN}')">${primary?'Основная':'Сделать основной'}</button><button class="btn tiny" onclick="cloneBuiltInCycle()">Сделать копию</button><button class="btn tiny danger" onclick="deleteBuiltinProgram()">Удалить</button></div></div>`;
  }

  window.trainerProgramsPage=function(){
    const el=document.querySelector('#programs');if(!el)return;
    if(typeof trainerIsTrainer==='function'&&!trainerIsTrainer()){el.innerHTML='<div class="card"><div class="title">Раздел тренера</div></div>';return}
    applyTombstones(false);
    const list=builtinCard()+visiblePrograms().map(programCard).join('');
    el.innerHTML=`<div class="card"><div class="row between"><div><div class="title">Программы</div><div class="muted">Создание, шаблоны и отправка клиентам</div></div><button class="btn primary" onclick="newProgramSheet()">＋</button></div><div class="coach-actions"><button class="btn" onclick="templatesSheet()">Шаблоны</button></div></div><div class="section">МОИ ПРОГРАММЫ</div>${list||'<div class="card muted">Пока нет программ. Создай новую или выбери шаблон.</div>'}`;
  };
  try{trainerProgramsPage=window.trainerProgramsPage}catch(e){}

  const basePlanPage=window.planPage;
  if(typeof basePlanPage==='function'){
    const wrapped=function(){
      applyTombstones(false);
      const list=visiblePrograms(),ids=new Set(list.map(p=>String(p.id)));
      if((String(st.primaryProgramId)===BUILTIN&&st.builtinProgramHidden)||(String(st.primaryProgramId)!==BUILTIN&&!ids.has(String(st.primaryProgramId||'')))){
        st.primaryProgramId=fallbackId();try{save()}catch(e){}
      }
      if(!st.primaryProgramId){
        const root=document.querySelector('#plan');if(root)root.innerHTML='<div class="card"><div class="title">Основная программа не выбрана</div><div class="muted" style="margin-top:7px">Открой «Программы», создай программу или добавь её из шаблонов.</div></div>';
        return;
      }
      return basePlanPage.apply(this,arguments)
    };
    window.planPage=wrapped;try{planPage=wrapped}catch(e){}
  }

  let picker={pid:null,week:null};
  function pickerPrograms(){
    const out=[];
    if(!st.builtinProgramHidden)out.push({id:BUILTIN,name:typeof window.unvrslBuiltInProgramName==='function'?window.unvrslBuiltInProgramName():(st.builtinProgramName||'Встроенный цикл · 8 недель'),weeks:8,builtin:true});
    visiblePrograms().forEach(p=>out.push({id:String(p.id),name:p.name||'Программа',weeks:p.weeks?.length||1,builtin:false,p}));
    return out;
  }
  function pickerDefault(){const ps=pickerPrograms();return ps.find(x=>String(x.id)===String(st.primaryProgramId))||ps.find(x=>String(x.id)===String(st.startProgramId))||ps[0]||null}
  function pickerWeek(p){const saved=Number(st.startProgramWeeks?.[p.id]);return Math.max(1,Math.min(p.weeks,picker.week||saved||(p.builtin?Number(st.week||1):1)))}
  function renderPicker(){
    applyTombstones(false);const ps=pickerPrograms();
    if(!ps.length)return modal('<div class="row between"><h2>Выбрать тренировку</h2><button class="btn tiny" onclick="closeModal()">✕</button></div><div class="card muted" style="margin-top:16px">Нет программ. Добавь программу из шаблонов или создай новую.</div>');
    let p=ps.find(x=>String(x.id)===String(picker.pid))||pickerDefault();picker.pid=p.id;const w=pickerWeek(p);picker.week=w;
    const programHtml=ps.map(x=>`<button class="start-program-choice ${String(x.id)===String(p.id)?'on':''}" onclick="selectStartProgram('${encodeURIComponent(x.id)}')"><span class="start-program-kind ${String(x.id)===String(st.primaryProgramId)?'primary-kind':''}">${String(x.id)===String(st.primaryProgramId)?'Основная':x.builtin?'Встроенная':'Моя программа'}</span><b>${esc(x.name)}</b><span>${x.weeks} нед.</span></button>`).join('');
    const weeks=Array.from({length:p.weeks},(_,i)=>i+1).map(n=>`<button class="weekbtn ${n===w?'on':''}" onclick="selectStartWeek(${n})">W${n}</button>`).join('');
    let days='';
    if(p.builtin){
      const rows=(typeof ROUTINES!=='undefined'?ROUTINES:[]).filter(r=>r.w===w);
      days=rows.map(r=>`<div class="start-picker-day row between"><div class="grow"><b>${esc(r.c)} · ${esc(r.t)}</b><div class="muted small">RPE ${typeof RPE!=='undefined'?RPE[w]:'—'} · ${r.e?.length||0} упражнений</div></div><button class="btn tiny primary" onclick="startPickedBuiltin(${w},'${encodeURIComponent(r.c)}')">Старт</button></div>`).join('');
    }else{
      const week=p.p?.weeks?.[w-1],rows=week?.days||[];
      days=rows.map((d,di)=>`<div class="start-picker-day row between"><div class="grow"><b>${esc(d.name||`День ${di+1}`)}</b><div class="muted small">RPE ${d?.ex?.[0]?.rpe??8} · ${d.ex?.length||0} упражнений</div></div><button class="btn tiny primary" onclick="startPickedProgram('${encodeURIComponent(p.id)}',${w-1},${di})">Старт</button></div>`).join('');
    }
    const html=`<div class="row between"><h2>Выбрать тренировку</h2><button class="btn tiny" onclick="closeModal()">✕</button></div><div class="section" style="margin-top:16px">ПРОГРАММА</div><div class="start-program-strip">${programHtml}</div><div class="start-picker-current">Выбрано: <b style="color:var(--text)">${esc(p.name)}</b></div><div id="startPickerWeeks" class="weekbar">${weeks}</div><div id="startPickerDays">${days||'<div class="card muted">В этой неделе тренировок нет.</div>'}</div>`;
    const sh=document.getElementById('sheet');if(document.getElementById('modal')?.classList.contains('show')&&sh)sh.innerHTML=html;else modal(html);
  }
  window.selectStartProgram=function(token){picker.pid=decodeURIComponent(token);picker.week=null;st.startProgramId=picker.pid;st.startProgramWeeks=st.startProgramWeeks&&typeof st.startProgramWeeks==='object'?st.startProgramWeeks:{};save();renderPicker()};
  window.selectStartWeek=function(w){const p=pickerPrograms().find(x=>String(x.id)===String(picker.pid))||pickerDefault();if(!p)return;picker.week=Math.max(1,Math.min(p.weeks,+w||1));st.startProgramWeeks=st.startProgramWeeks&&typeof st.startProgramWeeks==='object'?st.startProgramWeeks:{};st.startProgramWeeks[p.id]=picker.week;if(p.builtin)st.week=picker.week;save();renderPicker()};
  window.startPickedBuiltin=function(w,token){if(st.builtinProgramHidden)return;const c=decodeURIComponent(token);st.startProgramId=BUILTIN;st.week=w;save();begin(w,c)};
  window.startPickedProgram=function(token,wi,di){const pid=decodeURIComponent(token);st.startProgramId=pid;save();beginProgramDay(pid,wi,di)};
  window.openStartProgramPicker=function(){picker.pid=(pickerDefault()||{}).id||null;picker.week=null;renderPicker()};
  window.quick=window.openStartProgramPicker;try{quick=window.quick}catch(e){}
  window.quickWeek=function(w){picker.week=w;renderPicker()};try{quickWeek=window.quickWeek}catch(e){}

  applyTombstones(true);
  [0,250,900,1800].forEach(t=>setTimeout(()=>{applyTombstones(false);try{if(typeof trainerProgramsPage==='function'&&document.querySelector('#programs.active'))trainerProgramsPage()}catch(e){}},t));
})();