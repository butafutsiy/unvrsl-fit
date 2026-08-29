'use strict';
(()=>{
  if(window.__unvrslStableClientProfileV171)return;
  window.__unvrslStableClientProfileV171=true;

  const clone=v=>JSON.parse(JSON.stringify(v));
  const escHtml=v=>typeof window.esc==='function'?window.esc(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function state(){
    try{
      if(typeof st!=='undefined'){
        window.st=st;
        return st;
      }
    }catch(e){}
    return window.st||null;
  }
  function cloudState(){
    try{if(typeof cloud!=='undefined')return cloud}catch(e){}
    return window.cloud||null;
  }
  function isClientMode(){
    const c=cloudState();
    if(!c?.user)return false;
    const role=String(c.profile?.role||'').toLowerCase();
    if(role)return role==='client';
    try{if(typeof trainerIsTrainer==='function')return !trainerIsTrainer()}catch(e){}
    return false;
  }
  function saveState(){try{if(typeof save==='function')save()}catch(e){console.warn('stable save',e)}}
  function redrawStats(){
    const fig=document.querySelector('#anatomeMuscleCard .anatome-figure');
    if(fig)delete fig.dataset.localSig;
    try{localStorage.removeItem('unvrsl-anatome-svg-v1')}catch(e){}
    try{if(typeof statsPage==='function')statsPage();else if(typeof window.statsPage==='function')window.statsPage()}catch(e){}
  }

  // --- Profile sex: local state + Supabase must stay in sync. ---
  function normalizeSex(v){return ['male','female','other'].includes(String(v||''))?String(v):null}
  function applyLocalSex(value,render=true){
    const s=state();if(!s)return;
    const sex=normalizeSex(value);
    s.profileBio=s.profileBio&&typeof s.profileBio==='object'?s.profileBio:{};
    s.profileBio.sex=sex;
    s.body=sex==='female'?'female':'male';
    window.st=s;
    saveState();
    if(render)redrawStats();
  }
  async function persistSex(value,{quiet=false}={}){
    const c=cloudState(),sex=normalizeSex(value);
    applyLocalSex(sex,false);
    if(!c?.ready||!c?.user||!c?.client){redrawStats();return false}
    try{
      const r=await c.client.from('profiles').update({sex,updated_at:new Date().toISOString()}).eq('id',c.user.id).select('sex').single();
      if(r.error)throw r.error;
      c.profile={...(c.profile||{}),sex:r.data?.sex??sex};
      applyLocalSex(r.data?.sex??sex,true);
      return true;
    }catch(e){
      console.warn('profile sex persistence',e);
      redrawStats();
      if(!quiet&&typeof toast==='function')toast('Не удалось сохранить пол в аккаунте');
      return false;
    }
  }
  window.unvrslPersistProfileSex=persistSex;

  let lastPendingSex=null;
  document.addEventListener('change',e=>{
    if(e.target?.id==='bioSex')lastPendingSex=normalizeSex(e.target.value);
  },true);
  document.addEventListener('click',e=>{
    const btn=e.target?.closest?.('button');
    if(!btn||!/profileSaveBio\s*\(/.test(btn.getAttribute('onclick')||''))return;
    lastPendingSex=normalizeSex(document.getElementById('bioSex')?.value);
    const sex=lastPendingSex;
    setTimeout(()=>persistSex(sex),80);
  },true);

  function installProfileSave(){
    let base=null;
    try{if(typeof profileSaveBio==='function')base=profileSaveBio}catch(e){}
    if(!base)base=window.profileSaveBio;
    if(typeof base!=='function'||base.__stableSexV171)return false;
    const wrapped=async function(){
      const sex=normalizeSex(document.getElementById('bioSex')?.value??lastPendingSex);
      const out=await base.apply(this,arguments);
      await persistSex(sex);
      return out;
    };
    wrapped.__stableSexV171=true;
    window.profileSaveBio=wrapped;
    try{profileSaveBio=wrapped}catch(e){}
    return true;
  }
  const profileInstall=setInterval(()=>{if(installProfileSave())clearInterval(profileInstall)},120);
  setTimeout(()=>clearInterval(profileInstall),20000);

  async function hydrateSex(){
    const c=cloudState(),s=state();if(!c?.ready||!c?.user||!c?.client||!s)return;
    try{
      const r=await c.client.from('profiles').select('sex').eq('id',c.user.id).maybeSingle();
      if(r.error)throw r.error;
      const remote=normalizeSex(r.data?.sex);
      if(remote!=null)applyLocalSex(remote,true);
      else if(normalizeSex(s.profileBio?.sex)!=null)await persistSex(s.profileBio.sex,{quiet:true});
    }catch(e){console.warn('profile sex hydrate',e)}
  }
  setTimeout(hydrateSex,1800);
  window.addEventListener('focus',()=>setTimeout(hydrateSex,150));

  // --- Strict client Start: source of truth is active plan_assignments. ---
  let strictPrograms=[];
  let strictProgramIndex=0;
  let strictWeek=1;
  let strictLoading=false;

  async function waitCloudReady(){
    for(let i=0;i<30;i++){
      const c=cloudState();
      if(c?.ready&&c?.user&&c?.client)return c;
      await new Promise(r=>setTimeout(r,100));
    }
    return cloudState();
  }
  function localProgramFromAssignment(a){
    const s=state();if(!s||a?.snapshot?.kind!=='coach-program'||!a.snapshot.program)return null;
    s.programs=Array.isArray(s.programs)?s.programs:[];
    let p=s.programs.find(x=>String(x?.cloudPlanId||'')===String(a.plan_id));
    const remoteVersion=Number(a.version)||1;
    if(!p||Number(p.cloudVersion||0)<remoteVersion){
      const fresh=clone(a.snapshot.program);
      const keepId=p?.id||(typeof uid==='function'?uid('prog'):`prog-${Date.now()}-${Math.random().toString(36).slice(2,7)}`);
      fresh.id=keepId;
      fresh.cloudPlanId=a.plan_id;
      fresh.cloudVersion=remoteVersion;
      fresh.trainerId=a.trainer_id||null;
      fresh.created=p?.created||Date.now();
      fresh.updated=Date.now();
      try{if(typeof ensureProgramShape==='function')ensureProgramShape(fresh)}catch(e){}
      if(Array.isArray(fresh.weeks))fresh.weeks.forEach(w=>Array.isArray(w.days)&&w.days.forEach(d=>{if(!d.id)d.id=typeof uid==='function'?uid('day'):`day-${Math.random().toString(36).slice(2)}`}));
      if(p){const i=s.programs.indexOf(p);s.programs[i]=fresh}else s.programs.push(fresh);
      p=fresh;
    }
    return p;
  }
  async function activeAssignments(){
    const c=await waitCloudReady();
    if(!c?.user||!c?.client)return {rows:[],error:new Error('AUTH_NOT_READY')};
    const r=await c.client.from('plan_assignments').select('plan_id,trainer_id,version,snapshot,status,updated_at').eq('client_id',c.user.id).eq('status','active').order('updated_at',{ascending:false});
    if(r.error)return {rows:[],error:r.error};
    const rows=r.data||[],s=state();
    if(s){
      s.clientAssignedUserId=String(c.user.id);
      s.clientAssignedPlanIds=rows.map(x=>String(x.plan_id));
      s.clientAssignmentsLoaded=true;
      saveState();
    }
    return {rows,error:null};
  }
  function programTitle(x){return x?.program?.name||x?.assignment?.snapshot?.program?.name||'Программа'}
  function renderStrictPicker(){
    if(!strictPrograms.length){
      if(typeof modal==='function')modal('<div class="sheet-grabber"></div><div class="row between"><h2>Выбрать тренировку</h2><button class="btn tiny" onclick="closeModal()">✕</button></div><div class="card muted">Тренер пока не назначил активную программу.</div>');
      return;
    }
    strictProgramIndex=Math.max(0,Math.min(strictPrograms.length-1,strictProgramIndex));
    const item=strictPrograms[strictProgramIndex],p=item.program,weeks=Array.isArray(p?.weeks)?p.weeks:[];
    strictWeek=Math.max(1,Math.min(Math.max(1,weeks.length),strictWeek));
    const dayList=weeks[strictWeek-1]?.days||[];
    const programs=strictPrograms.map((x,i)=>`<button class="card" style="width:100%;text-align:left;margin:8px 0;${i===strictProgramIndex?'border-color:var(--green);box-shadow:0 0 0 1px var(--green) inset;':''}" onclick="unvrslStrictProgram(${i})"><div class="muted small">${i===0?'НАЗНАЧЕНО ТРЕНЕРОМ':'АКТИВНАЯ ПРОГРАММА'}</div><div class="title" style="margin-top:4px">${escHtml(programTitle(x))}</div><div class="muted small" style="margin-top:5px">${weeks.length||1} нед.</div></button>`).join('');
    const weekButtons=Array.from({length:Math.max(1,weeks.length)},(_,i)=>i+1).map(n=>`<button class="weekbtn ${n===strictWeek?'on':''}" onclick="unvrslStrictWeek(${n})">W${n}</button>`).join('');
    const days=dayList.map((d,i)=>`<div class="listline row between"><div class="grow"><b>${escHtml(d?.name||`День ${i+1}`)}</b><div class="muted small">${Array.isArray(d?.ex)?d.ex.length:0} упражнений</div></div><button class="btn tiny primary" onclick="unvrslStrictStartDay(${i})">Старт</button></div>`).join('')||'<div class="card muted">В этой неделе тренировок нет.</div>';
    if(typeof modal==='function')modal(`<div class="sheet-grabber"></div><div class="row between"><h2>Выбрать тренировку</h2><button class="btn tiny" onclick="closeModal()">✕</button></div><div class="section">ПРОГРАММА</div>${programs}<div class="section">НЕДЕЛЯ</div><div class="weekbar">${weekButtons}</div><div style="margin-top:6px">${days}</div>`);
  }
  async function openStrictClientStart(){
    if(strictLoading)return;
    const s=state();
    if(s?.current){try{if(typeof nav==='function')nav('start')}catch(e){};return}
    strictLoading=true;
    try{
      const c=await waitCloudReady();
      if(!c?.user){if(typeof cloudAccountSheet==='function')cloudAccountSheet();return}
      if(!isClientMode())return false;
      if(typeof toast==='function')toast('Загружаю назначенную программу…');
      const {rows,error}=await activeAssignments();
      if(error){console.warn('active assignments',error);if(typeof toast==='function')toast('Не удалось загрузить программу');return}
      strictPrograms=rows.map(a=>({assignment:a,program:localProgramFromAssignment(a)})).filter(x=>x.program);
      strictProgramIndex=0;strictWeek=1;saveState();renderStrictPicker();
      return true;
    }finally{strictLoading=false}
  }
  window.openStrictClientStart=openStrictClientStart;
  window.unvrslStrictProgram=i=>{strictProgramIndex=Number(i)||0;strictWeek=1;renderStrictPicker()};
  window.unvrslStrictWeek=n=>{strictWeek=Number(n)||1;renderStrictPicker()};
  window.unvrslStrictStartDay=i=>{
    const item=strictPrograms[strictProgramIndex],p=item?.program;if(!p)return;
    const di=Number(i)||0,wi=strictWeek-1;
    try{if(typeof closeModal==='function')closeModal()}catch(e){}
    if(typeof beginProgramDay==='function')beginProgramDay(p.id,wi,di);
  };

  // Window capture runs before old document-level pickers, so revoked/local plans never flash on screen.
  window.addEventListener('click',e=>{
    const b=e.target?.closest?.('.nav button[data-p="start"]');
    if(!b||!isClientMode())return;
    e.preventDefault();
    e.stopImmediatePropagation();
    const s=state();
    if(s?.current){try{if(typeof nav==='function')nav('start')}catch(err){};return}
    openStrictClientStart();
  },true);

  function installQuick(){
    let base=null;try{if(typeof quick==='function')base=quick}catch(e){};if(!base)base=window.quick;
    if(typeof base!=='function'||base.__strictClientStartV171)return false;
    const wrapped=function(){
      if(isClientMode()){
        const s=state();if(s?.current){try{return typeof nav==='function'?nav('start'):undefined}catch(e){return}}
        return openStrictClientStart();
      }
      return base.apply(this,arguments);
    };
    wrapped.__strictClientStartV171=true;window.quick=wrapped;try{quick=wrapped}catch(e){};return true;
  }
  const quickInstall=setInterval(()=>{if(installQuick())clearInterval(quickInstall)},120);
  setTimeout(()=>clearInterval(quickInstall),20000);

  state();
})();
