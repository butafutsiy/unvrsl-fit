'use strict';
(()=>{
  if(window.__unvrslClientProgramPicker)return;window.__unvrslClientProgramPicker=true;

  const style=document.createElement('style');style.id='client-program-picker-style';style.textContent=`
    .client-program-strip{display:flex;gap:10px;overflow-x:auto;padding:2px 1px 10px;scrollbar-width:none}.client-program-strip::-webkit-scrollbar{display:none}
    .client-program-choice{min-width:215px;flex:0 0 auto;text-align:left;background:#1f1f22;border:1px solid #35353a;border-radius:20px;padding:14px 15px}
    .client-program-choice.on{border-color:var(--green);box-shadow:0 0 0 1px var(--green) inset;background:#20272a}
    .client-program-choice b{display:block;font-size:16px;line-height:1.2}.client-program-choice span{display:block;color:#8e8e93;font-size:12px;margin-top:5px}
    .client-program-badge{display:inline-flex!important;width:auto!important;padding:4px 8px;border-radius:999px;background:#2c2c30;color:#a8a8ad!important;font-size:10px!important;font-weight:800;letter-spacing:.04em;text-transform:uppercase;margin:0 0 7px!important}
    .client-program-badge.primary{background:rgba(48,209,88,.14);color:#30d158!important}
    .client-plan-day{padding:15px 0;border-bottom:1px solid #303034}.client-plan-day:last-child{border-bottom:0}
    .client-plan-head{margin-bottom:12px}.client-plan-primary-actions{display:flex;gap:8px;margin:8px 0 12px}.client-plan-primary-actions .btn{flex:1}
    .client-plan-profile-actions-v255{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:13px}
    .client-plan-profile-measures-v255{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:12px}
    .client-plan-profile-measures-v255>div{background:#19191c;border:1px solid #2d2e33;border-radius:15px;padding:11px}
    .client-plan-profile-measures-v255 span{display:block;color:#8e8e93;font-size:10px}.client-plan-profile-measures-v255 b{display:block;margin-top:4px;font-size:16px}
    #clientPickerWeeks .weekbtn.on,#clientPlanWeeks .weekbtn.on{background:var(--green)!important;color:#07110a!important;border-color:var(--green)!important;box-shadow:0 0 0 1px var(--green) inset!important}
    @media(max-width:390px){.client-plan-profile-actions-v255{grid-template-columns:1fr}}
  `;document.head.appendChild(style);

  function isClient(){
    if(!window.cloud?.user)return false;
    if(typeof window.unvrslTrainerMode==='function')return !window.unvrslTrainerMode();
    return window.cloud?.profile?.role!=='trainer';
  }
  function escx(v){return typeof window.esc==='function'?window.esc(String(v??'')):String(v??'')}
  const PROFILE_MEASURES=[['chest','Грудь'],['waist','Талия'],['abdomen','Живот'],['hips','Ягодицы'],['thigh','Бедро'],['arm','Рука'],['calf','Икра']];
  const positive=v=>{const n=Number(v);return Number.isFinite(n)&&n>0?n:null};
  const numberText=v=>v==null?'—':Number(v).toFixed(1).replace('.0','').replace('.',',');
  const profileCache={at:0,profile:null,weight:null,measurements:null,loading:null};
  function profileAge(value){if(!value)return null;const d=new Date(`${value}T12:00:00`),now=new Date();let n=now.getFullYear()-d.getFullYear();if(now<new Date(now.getFullYear(),d.getMonth(),d.getDate()))n--;return n}
  async function loadPlanProfile(force=false){
    if(!isClient()||!window.cloud?.client||!window.cloud?.user)return profileCache;
    if(profileCache.loading)return profileCache.loading;
    if(!force&&Date.now()-profileCache.at<30000)return profileCache;
    profileCache.loading=(async()=>{const uid=window.cloud.user.id,c=window.cloud.client,[p,w,m]=await Promise.all([
      c.from('profiles').select('id,display_name,height_cm,birth_date,sex,target_weight_kg').eq('id',uid).maybeSingle(),
      c.from('bodyweights').select('measure_date,weight_kg').eq('user_id',uid).order('measure_date',{ascending:false}).limit(1),
      c.from('body_measurements').select('measure_date,measurements').eq('user_id',uid).order('measure_date',{ascending:false}).limit(1)
    ]);profileCache.profile=p.data||window.cloud.profile||null;profileCache.weight=w.data?.[0]||null;profileCache.measurements=m.data?.[0]||null;profileCache.at=Date.now();return profileCache})().catch(e=>{console.warn('client plan profile v255',e);return profileCache}).finally(()=>{profileCache.loading=null});
    return profileCache.loading
  }
  function planProfileMarkup(){
    const p=profileCache.profile||window.cloud?.profile||{},localWeight=typeof window.latestW==='function'?positive(window.latestW()):null,w=positive(profileCache.weight?.weight_kg)||localWeight,a=profileAge(p.birth_date),raw=profileCache.measurements?.measurements||{};
    const measures=PROFILE_MEASURES.map(([key,label])=>[label,positive(raw[key])]).filter(x=>x[1]);
    return `<div class="section">ПРОФИЛЬ И ЗАМЕРЫ</div><div class="card"><div class="row between"><div><div class="title">${escx(p.display_name||'Мой профиль')}</div><div class="muted small">${[p.height_cm?numberText(p.height_cm)+' см':null,a!=null?a+' лет':null,w?numberText(w)+' кг':null].filter(Boolean).join(' · ')||'Профиль спортсмена'}</div></div><button class="btn" onclick="clientPlanOpenProfileV255()">Открыть</button></div>${measures.length?`<div class="client-plan-profile-measures-v255">${measures.map(x=>`<div><span>${x[0]}</span><b>${numberText(x[1])} см</b></div>`).join('')}</div>`:'<div class="muted small" style="margin-top:12px">Обхваты пока не записаны.</div>'}<div class="client-plan-profile-actions-v255"><button class="btn primary" onclick="clientPlanMeasureV255()">＋ Записать замеры</button><button class="btn" onclick="clientPlanOpenProfileV255()">Профиль</button></div></div>`
  }
  async function refreshPlanProfile(force=false){
    await loadPlanProfile(force);const host=document.getElementById('clientPlanProfileV255');if(host)host.innerHTML=planProfileMarkup()
  }
  window.clientPlanProfileRefreshV255=refreshPlanProfile;
  window.clientPlanOpenProfileV255=async()=>{await loadPlanProfile(true);if(typeof window.clientProfile107==='function')return window.clientProfile107();if(typeof window.profileEditSheet==='function')return window.profileEditSheet();if(typeof window.cloudAccountSheet==='function')return window.cloudAccountSheet()};
  window.clientPlanMeasureV255=async()=>{await loadPlanProfile(true);if(typeof window.clientMeasure107==='function')return window.clientMeasure107();return window.clientPlanOpenProfileV255()};
  function assignmentIds(){
    const uid=String(window.cloud?.user?.id||'');
    if(!uid||String(st.clientAssignedUserId||'')!==uid||st.clientAssignmentsLoaded!==true)return new Set();
    return new Set((Array.isArray(st.clientAssignedPlanIds)?st.clientAssignedPlanIds:[]).map(String).filter(Boolean))
  }
  function hasAssignment(planId){
    if(typeof window.clientHasActivePlan==='function')return window.clientHasActivePlan(planId);
    return assignmentIds().has(String(planId||''))
  }
  function assignedProgramsStrict(){
    if(!isClient())return [];
    return (Array.isArray(st.programs)?st.programs:[]).filter(p=>p&&!p.archived&&p.cloudPlanId&&p.trainerId&&hasAssignment(p.cloudPlanId))
  }
  window.assignedClientPrograms=assignedProgramsStrict;
  try{assignedClientPrograms=assignedProgramsStrict}catch(e){}

  function allClientPrograms(){
    const out=[];
    assignedProgramsStrict().forEach(p=>{
      if(!Array.isArray(p.weeks)||!p.weeks.length)return;
      out.push({key:'coach:'+p.id,id:p.id,name:p.name||'Программа',weeks:p.weeks.length,kind:'coach',p});
    });
    (Array.isArray(st.remotePlans)?st.remotePlans:[]).forEach(p=>{
      const rs=p?.snapshot?.routines;
      if(!p||!p.trainerId||!hasAssignment(p.id)||!Array.isArray(rs)||!rs.length)return;
      const ws=[...new Set(rs.map(r=>Number(r.w)||1))].sort((a,b)=>a-b);
      out.push({key:'remote:'+p.id,id:p.id,name:p.title||'Программа',weeks:ws.length,weekNumbers:ws,kind:'remote',p});
    });
    const seen=new Set();return out.filter(x=>{if(seen.has(x.key))return false;seen.add(x.key);return true});
  }
  function ensurePrimary(){
    const ps=allClientPrograms();
    if(!ps.length){delete st.clientPrimaryProgramKey;delete st.clientPlanViewKey;return null}
    if(!ps.some(x=>x.key===st.clientPrimaryProgramKey))st.clientPrimaryProgramKey=ps[0].key;
    return ps.find(x=>x.key===st.clientPrimaryProgramKey)||ps[0]
  }
  function orderedPrograms(){const primary=ensurePrimary(),ps=allClientPrograms();return primary?[primary,...ps.filter(x=>x.key!==primary.key)]:ps}
  function findProgram(key){return allClientPrograms().find(x=>x.key===key)||ensurePrimary()}
  function weekNumber(p,index){return p.kind==='remote'?(p.weekNumbers?.[index]||index+1):index+1}
  function weekDays(p,wi){
    if(p.kind==='coach')return (p.p?.weeks?.[wi]?.days||[]).map((d,di)=>({name:d.name||`День ${di+1}`,count:d.ex?.length||0,rpe:d.ex?.[0]?.rpe??d.ex?.[0]?.target??8,start:()=>beginProgramDay(p.id,wi,di)}));
    const wn=weekNumber(p,wi),rs=p.p?.snapshot?.routines||[];
    return rs.map((r,i)=>({r,i})).filter(x=>(Number(x.r.w)||1)===wn).map(x=>({name:`${x.r.c||''}${x.r.t?' · '+x.r.t:''}`.replace(/^ · | · $/g,''),count:x.r.e?.length||0,rpe:(typeof RPE!=='undefined'?RPE[wn]:null)||8,start:()=>beginRemotePlan(p.id,x.i)}));
  }
  function weekCount(p){return p?.weeks||1}
  function savedWeek(p){
    if(!st.clientProgramWeeks||typeof st.clientProgramWeeks!=='object')st.clientProgramWeeks={};
    const n=Number(st.clientProgramWeeks[p.key]||1);return Math.max(1,Math.min(weekCount(p),n));
  }
  function setSavedWeek(p,n){
    if(!st.clientProgramWeeks||typeof st.clientProgramWeeks!=='object')st.clientProgramWeeks={};
    st.clientProgramWeeks[p.key]=n;try{save()}catch(e){}
  }

  let picker={key:null,week:null};
  function renderStartPicker(){
    const ps=orderedPrograms();
    if(!ps.length){
      modal('<div class="sheet-grabber"></div><div class="row between"><h2>Выбрать тренировку</h2><button class="btn tiny" onclick="closeModal()">✕</button></div><div class="card muted">Тренер пока не назначил программу.</div>');
      return
    }
    const primary=ensurePrimary();let p=findProgram(picker.key)||primary;if(!p)p=ps[0];picker.key=p.key;
    const w=Math.max(1,Math.min(weekCount(p),picker.week||savedWeek(p)));picker.week=w;
    const cards=ps.map(x=>`<button class="client-program-choice ${x.key===p.key?'on':''}" onclick="clientSelectStartProgram('${encodeURIComponent(x.key)}')"><span class="client-program-badge ${x.key===primary?.key?'primary':''}">${x.key===primary?.key?'Основная':'Программа'}</span><b>${escx(x.name)}</b><span>${weekCount(x)} нед.</span></button>`).join('');
    const weeks=Array.from({length:weekCount(p)},(_,i)=>i+1).map(n=>`<button class="weekbtn ${n===w?'on':''}" onclick="clientSelectStartWeek(${n})">W${n}</button>`).join('');
    const days=weekDays(p,w-1).map((d,di)=>`<div class="client-plan-day row between"><div class="grow"><b>${escx(d.name)}</b><div class="muted small">RPE ${d.rpe} · ${d.count} упражнений</div></div><button class="btn tiny primary" data-client-start-day="${di}">Старт</button></div>`).join('')||'<div class="card muted">В этой неделе тренировок нет.</div>';
    const html=`<div class="row between"><h2>Выбрать тренировку</h2><button class="btn tiny" onclick="closeModal()">✕</button></div><div class="section" style="margin-top:16px">ПРОГРАММА</div><div class="client-program-strip">${cards}</div><div class="muted small" style="margin:4px 0 9px">Выбрано: <b style="color:var(--text)">${escx(p.name)}</b></div><div id="clientPickerWeeks" class="weekbar">${weeks}</div><div id="clientPickerDays">${days}</div>`;
    const sh=document.getElementById('sheet');
    if(document.getElementById('modal')?.classList.contains('show')&&sh)sh.innerHTML=html;else modal(html);
    sh?.querySelectorAll('[data-client-start-day]').forEach(btn=>btn.onclick=()=>{
      const d=weekDays(p,w-1)[Number(btn.dataset.clientStartDay)];if(!d)return;
      st.clientLastProgramKey=p.key;setSavedWeek(p,w);try{save()}catch(e){};d.start()
    });
  }
  window.openClientStartProgramPicker=function(){if(!isClient())return;picker.key=ensurePrimary()?.key||null;picker.week=null;renderStartPicker()};
  window.clientSelectStartProgram=function(token){picker.key=decodeURIComponent(token);picker.week=null;renderStartPicker()};
  window.clientSelectStartWeek=function(n){const p=findProgram(picker.key);if(!p)return;picker.week=Math.max(1,Math.min(weekCount(p),Number(n)||1));setSavedWeek(p,picker.week);renderStartPicker()};

  window.setClientPrimaryProgram=function(token){
    const key=decodeURIComponent(token),p=findProgram(key);if(!p)return;
    st.clientPrimaryProgramKey=p.key;st.clientPlanViewKey=p.key;try{save()}catch(e){}
    if(typeof toast==='function')toast('Основная программа изменена');
    try{clientCleanPlanPage()}catch(e){}
  };
  window.clientPlanSelectProgram=function(token){st.clientPlanViewKey=decodeURIComponent(token);try{save()}catch(e){};clientCleanPlanPage()};
  window.clientPlanSelectWeek=function(n){const p=findProgram(st.clientPlanViewKey)||ensurePrimary();if(!p)return;setSavedWeek(p,Math.max(1,Math.min(weekCount(p),Number(n)||1)));clientCleanPlanPage()};

  function finishPlanRender(root){
    root.dataset.clientPlanAuthority='255';
    refreshPlanProfile(false);
    setTimeout(()=>window.clientPlanHistoryRefresh107?.(),0)
  }
  function clientPlanPageV3(){
    const root=document.getElementById('plan');if(!root)return;
    if(!window.cloud?.user){
      root.innerHTML='<div class="card"><div class="title">Мой план</div><div class="muted" style="margin-top:7px">Войди, чтобы получить программу от тренера.</div><button class="btn primary full" style="margin-top:14px" onclick="cloudAccountSheet()">Войти</button></div>';
      return
    }
    const profile='<div id="clientPlanProfileV255">'+planProfileMarkup()+'</div>';
    const ps=orderedPrograms();
    if(!ps.length){
      root.innerHTML=profile+'<div class="section">МОЯ ПРОГРАММА</div><div class="card"><div class="title">План пока не назначен</div><div class="muted" style="margin-top:7px">Когда тренер назначит программу, она появится здесь.</div></div>';
      finishPlanRender(root);
      return
    }
    const primary=ensurePrimary();let p=findProgram(st.clientPlanViewKey)||primary||ps[0];st.clientPlanViewKey=p.key;
    const w=savedWeek(p),days=weekDays(p,w-1);
    const cards=ps.map(x=>`<button class="client-program-choice ${x.key===p.key?'on':''}" onclick="clientPlanSelectProgram('${encodeURIComponent(x.key)}')"><span class="client-program-badge ${x.key===primary?.key?'primary':''}">${x.key===primary?.key?'Основная':'Программа'}</span><b>${escx(x.name)}</b><span>${weekCount(x)} нед.</span></button>`).join('');
    const weeks=Array.from({length:weekCount(p)},(_,i)=>i+1).map(n=>`<button class="weekbtn ${n===w?'on':''}" onclick="clientPlanSelectWeek(${n})">W${n}</button>`).join('');
    root.innerHTML=`${profile}<div class="section">МОИ ПРОГРАММЫ</div><div class="client-program-strip">${cards}</div><div class="card client-plan-head"><div class="row between"><div class="grow"><div class="muted small">${p.key===primary?.key?'ОСНОВНАЯ ПРОГРАММА':'ВЫБРАННАЯ ПРОГРАММА'}</div><div class="title" style="margin-top:5px">${escx(p.name)}</div></div>${p.key===primary?.key?'<span class="chip green">Основная</span>':''}</div>${p.key!==primary?.key?`<div class="client-plan-primary-actions"><button class="btn" onclick="setClientPrimaryProgram('${encodeURIComponent(p.key)}')">Сделать основной</button></div>`:''}</div><div class="section">ТРЕНИРОВОЧНЫЙ ЦИКЛ</div><div id="clientPlanWeeks" class="weekbar">${weeks}</div><div class="card"><div class="title">Неделя ${w}</div></div>${days.map((d,di)=>`<div class="card routine client-plan-day"><div class="row between"><div class="grow"><h3>${escx(d.name)}</h3><div class="chips"><span class="chip">${d.count} упражнений</span><span class="chip">RPE ${d.rpe}</span></div></div><button class="btn primary" data-client-plan-start="${di}">Старт</button></div></div>`).join('')||'<div class="card muted">В этой неделе тренировок нет.</div>'}`;
    root.querySelectorAll('[data-client-plan-start]').forEach(btn=>btn.onclick=()=>{const d=weekDays(p,w-1)[Number(btn.dataset.clientPlanStart)];if(d)d.start()});
    finishPlanRender(root);
  }
  clientPlanPageV3.__clientPlanV255=true;
  window.clientCleanPlanPage=clientPlanPageV3;try{clientCleanPlanPage=clientPlanPageV3}catch(e){}

  const oldQuick=window.quick;
  window.quick=function(){if(isClient()){if(st.current)return nav('start');return window.openClientStartProgramPicker()}return typeof oldQuick==='function'?oldQuick.apply(this,arguments):nav('start')};
  try{quick=window.quick}catch(e){}

  const oldBegin=window.begin;
  if(typeof oldBegin==='function'){
    const guardedBegin=function(){
      if(isClient()){
        if(typeof toast==='function')toast('Выбери тренировку из назначенной программы');
        return
      }
      return oldBegin.apply(this,arguments)
    };
    window.begin=guardedBegin;try{begin=guardedBegin}catch(e){}
  }

  document.addEventListener('click',e=>{
    const b=e.target.closest?.('.nav button[data-p="start"]');if(!b||!isClient()||st.current)return;
    e.preventDefault();e.stopImmediatePropagation();window.openClientStartProgramPicker();
  },true);

  const oldAssignments=window.cloudLoadAssignments;
  if(typeof oldAssignments==='function'&&!oldAssignments.__clientPicker){
    const wrapped=async function(){
      const r=await oldAssignments.apply(this,arguments);
      ensurePrimary();try{save()}catch(e){}
      if(isClient()&&typeof window.home==='function')try{window.home()}catch(e){}
      if(isClient())try{clientCleanPlanPage()}catch(e){}
      return r
    };
    wrapped.__clientPicker=true;window.cloudLoadAssignments=wrapped;try{cloudLoadAssignments=wrapped}catch(e){}
  }

  ensurePrimary();try{save()}catch(e){}
  if(isClient()){
    try{if(typeof window.clientCleanHome==='function')window.clientCleanHome();else if(typeof clientCleanHome==='function')clientCleanHome()}catch(e){}
    try{clientCleanPlanPage()}catch(e){}
  }
})();
