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

  applyTombstones(true);
  [0,250,900,1800].forEach(t=>setTimeout(()=>{applyTombstones(false);try{if(typeof trainerProgramsPage==='function'&&document.querySelector('#programs.active'))trainerProgramsPage()}catch(e){}},t));
})();