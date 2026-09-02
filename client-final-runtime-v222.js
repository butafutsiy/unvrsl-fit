'use strict';
(()=>{
  if(window.__unvrslClientRuntimeV257)return;
  window.__unvrslClientRuntimeV257=true;
  window.__unvrslClientRuntimeV260=true;
  window.__unvrslClientRuntimeV256=true;
  window.__unvrslClientRuntimeV255=true;
  // Cached loaders may still look for the old marker. Keep it locked so a
  // second client renderer can never start alongside the canonical runtime.
  window.__unvrslClientFinalRuntimeV222=true;

  const MASTER='butafutsiy@mail.ru';
  const LEGACY_WEIGHT_DATE='2026-08-25';
  const LEGACY_WEIGHT_VALUE=97.5;
  const loaded=new Set();
  let clientReady=false,clientBooting=null;
  let legacyCleanup=null;

  if(!document.getElementById('client-runtime-v257-style')){
    const style=document.createElement('style');style.id='client-runtime-v257-style';style.textContent=`
      body.unvrsl-client #plan>.client-plan-loading-v255{min-height:180px;display:grid;align-content:center;text-align:center}
      body.unvrsl-client #plan>.client-plan-loading-v255 .title{margin-bottom:8px}
      body.unvrsl-client .client-streak-v255 .streak-meta{line-height:1.35}
      @media(max-width:390px){body.unvrsl-client .client-streak-v255{align-items:flex-start}}
    `;document.head.appendChild(style)
  }

  function cloudState(){try{if(typeof cloud!=='undefined')return cloud}catch(_){ }return window.cloud||null}
  function state(){try{if(typeof st!=='undefined'){window.st=st;return st}}catch(_){ }return window.st||null}
  function isTrainer(){const c=cloudState();return String(c?.user?.email||'').toLowerCase()===MASTER||String(c?.profile?.role||'').toLowerCase()==='trainer'}
  function isClient(){const c=cloudState();return !!c?.user&&!isTrainer()}
  function saveState(){try{if(typeof save==='function')save()}catch(_){}}
  function cleanClientCalendarPlans(s){
    if(!s?.calendarPlans||typeof s.calendarPlans!=='object'||Array.isArray(s.calendarPlans))return false;
    const active=new Set((s.programs||[]).filter(p=>p?.clientAssignmentActive).map(p=>String(p.id||''))),entries=Object.entries(s.calendarPlans);let changed=false;
    entries.forEach(([date,entry])=>{if(entry?.kind==='builtin'||(entry?.kind==='program'&&!active.has(String(entry.programId||'')))){delete s.calendarPlans[date];changed=true}});
    return changed
  }

  function isLegacyWeight(x){
    return String(x?.d||x?.measure_date||'').slice(0,10)===LEGACY_WEIGHT_DATE&&Number(x?.w??x?.weight_kg)===LEGACY_WEIGHT_VALUE
  }

  function addWeightTombstone(s){
    s.deletedBodyweights=Array.isArray(s.deletedBodyweights)?s.deletedBodyweights:[];
    const at=Date.now();
    const hit=s.deletedBodyweights.find(x=>String(x?.d||x||'').slice(0,10)===LEGACY_WEIGHT_DATE);
    if(hit&&typeof hit==='object')hit.at=Math.max(Number(hit.at||hit.t||0),at);
    else if(!hit)s.deletedBodyweights.push({d:LEGACY_WEIGHT_DATE,at});
  }

  async function cleanupLegacyClientWeight(){
    if(!isClient())return false;
    if(legacyCleanup)return legacyCleanup;
    legacyCleanup=(async()=>{
      const c=cloudState(),s=state(),uid=String(c?.user?.id||'');
      if(!c?.client||!s||!uid)return false;
      const before=Array.isArray(s.bw)?s.bw.length:0;
      s.bw=(Array.isArray(s.bw)?s.bw:[]).filter(x=>!isLegacyWeight(x));
      addWeightTombstone(s);
      if(s.bw.length!==before)saveState();
      try{
        const deleted=await c.client.from('bodyweights').delete().eq('user_id',uid).eq('measure_date',LEGACY_WEIGHT_DATE).eq('weight_kg',LEGACY_WEIGHT_VALUE);
        if(deleted.error)throw deleted.error;
        const remote=await c.client.from('user_app_state').select('state').eq('user_id',uid).maybeSingle();
        if(remote.error)throw remote.error;
        if(remote.data?.state&&typeof remote.data.state==='object'){
          const clean=JSON.parse(JSON.stringify(remote.data.state));
          clean.bw=(Array.isArray(clean.bw)?clean.bw:[]).filter(x=>!isLegacyWeight(x));
          addWeightTombstone(clean);
          const updated=await c.client.from('user_app_state').update({state:clean,client_updated_at:new Date().toISOString()}).eq('user_id',uid);
          if(updated.error)throw updated.error;
        }
      }catch(e){console.warn('client legacy weight cleanup v236',e)}
      try{if(typeof window.homeProgressRefresh==='function')await window.homeProgressRefresh(true)}catch(_){ }
      return true;
    })().finally(()=>{setTimeout(()=>{legacyCleanup=null},15000)});
    return legacyCleanup
  }
  window.unvrslCleanupLegacyClientWeightV236=cleanupLegacyClientWeight;

  function script(src){
    if(window.unvrslScriptRetiredV257?.(src)||window.unvrslScriptRetiredV256?.(src)||window.unvrslScriptRetiredV255?.(src)||window.unvrslScriptRetiredV254?.(src)||window.unvrslScriptRetiredV253?.(src))return Promise.resolve({retired:true,src});
    if(loaded.has(src)||document.querySelector(`script[src="${src}"],script[src="./${src}"]`))return Promise.resolve();
    loaded.add(src);
    return new Promise(resolve=>{const s=document.createElement('script');s.src=src;s.async=false;s.dataset.clientFinal='1';s.onload=resolve;s.onerror=resolve;document.body.appendChild(s)});
  }

  async function hydrateAssignments(){
    const c=cloudState(),s=state();
    if(!isClient()||!c?.client||!s)return;
    try{
      const r=await c.client.from('plan_assignments').select('plan_id,trainer_id,version,snapshot,status,updated_at').eq('client_id',c.user.id).eq('status','active').order('updated_at',{ascending:false});
      if(r.error)throw r.error;
      const rows=r.data||[];
      s.clientAssignedUserId=String(c.user.id);
      s.clientAssignedPlanIds=rows.map(x=>String(x.plan_id));
      s.clientAssignmentsLoaded=true;
      s.programs=Array.isArray(s.programs)?s.programs:[];
      const active=new Set(s.clientAssignedPlanIds);
      rows.forEach(a=>{
        if(a?.snapshot?.kind!=='coach-program'||!a.snapshot.program)return;
        let p=s.programs.find(x=>String(x?.cloudPlanId||'')===String(a.plan_id));
        const fresh=JSON.parse(JSON.stringify(a.snapshot.program));
        fresh.id=p?.id||`assigned-${a.plan_id}`;
        fresh.cloudPlanId=a.plan_id;
        fresh.cloudVersion=Number(a.version)||1;
        fresh.trainerId=a.trainer_id||null;
        fresh.created=p?.created||Date.now();fresh.updated=Date.now();
        if(p)s.programs[s.programs.indexOf(p)]=fresh;else s.programs.push(fresh);
      });
      // A client may keep local history, but only active trainer assignments are eligible for Plan/Start.
      s.programs.forEach(p=>{if(p?.cloudPlanId&&p?.trainerId)p.clientAssignmentActive=active.has(String(p.cloudPlanId))});
      cleanClientCalendarPlans(s);
      saveState();
    }catch(e){console.warn('client assignment hydrate v222',e)}
  }

  function assigned(){
    const c=cloudState(),s=state();if(!c?.user||!s)return[];
    if(String(s.clientAssignedUserId||'')!==String(c.user.id)||s.clientAssignmentsLoaded!==true)return[];
    const ids=new Set((s.clientAssignedPlanIds||[]).map(String));
    return (s.programs||[]).filter(p=>p?.cloudPlanId&&p?.trainerId&&ids.has(String(p.cloudPlanId)));
  }

  function esc2(v){try{return typeof esc==='function'?esc(String(v??'')):String(v??'')}catch(_){return String(v??'')}}
  function appState(){return state()||{}}
  function isoDay(d){try{return typeof window.iso==='function'?window.iso(d):new Date(d).toISOString().slice(0,10)}catch(_){return''}}
  function currentViewDate(){try{if(typeof viewDate!=='undefined'&&viewDate instanceof Date)return viewDate}catch(_){}return window.viewDate instanceof Date?window.viewDate:new Date()}
  function mondayFor(d){if(typeof window.getMonday==='function')return window.getMonday(d);const x=new Date(d),day=(x.getDay()+6)%7;x.setDate(x.getDate()-day);x.setHours(12,0,0,0);return x}
  function planForDate(d){try{return window.calendarPlanForDateV234?.(d)||window.plannedForDate?.(d)||null}catch(_){return null}}
  function calendarTitle(view,today){
    try{if(typeof window.sameWeek==='function'&&window.sameWeek(view,today))return'Эта неделя'}catch(_){}
    return new Intl.DateTimeFormat('ru-RU',{month:'long',year:'numeric'}).format(view)
  }
  function clientCalendarHtml(){
    const today=new Date(),monday=mondayFor(currentViewDate()),cells=[];
    for(let i=0;i<7;i++){const d=new Date(monday);d.setDate(monday.getDate()+i);cells.push(d)}
    const sessions=Array.isArray(appState().sessions)?appState().sessions:[],todayPlan=planForDate(today),todayKey=isoDay(today);
    const title=todayPlan?[todayPlan.c,todayPlan.t].filter(Boolean).join(' · '):'День отдыха';
    return `<div class="card calendar-card"><div class="calendar-head"><button class="arrow" onclick="moveWeek(-1)">‹</button><b>${esc2(calendarTitle(currentViewDate(),today))}</b><button class="arrow" onclick="moveWeek(1)">›</button></div><div class="weekdays">${['ПН','ВТ','СР','ЧТ','ПТ','СБ','ВС'].map(x=>`<div>${x}</div>`).join('')}</div><div class="dates">${cells.map(d=>{const key=isoDay(d),has=!!planForDate(d)||sessions.some(s=>String(s?.date||'').slice(0,10)===key);return `<div class="datecell ${key===todayKey?'today':''}"><div class="num">${d.getDate()}</div>${has?'<span class="dot"></span>':''}</div>`}).join('')}</div><div class="today-card"><div class="today-icon">${todayPlan?'🏋︎':'☾'}</div><div class="today-main"><small>Сегодня</small><b>${esc2(title)}</b></div><button class="plus" onclick="${todayPlan?`calendarPlannerPreviewDateV234('${encodeURIComponent(todayKey)}')`:`calendarPlannerAddV234('${encodeURIComponent(todayKey)}')`}">＋</button></div></div>`
  }
  function clientStreakHtml(){
    const s=appState(),sessions=Array.isArray(s.sessions)?s.sessions:[],monday=mondayFor(new Date()),end=new Date(monday);end.setDate(end.getDate()+7);
    const weekDone=sessions.filter(x=>{const d=new Date(`${String(x?.date||'').slice(0,10)}T12:00:00`);return d>=monday&&d<end}).length;
    let planned=0;for(let i=0;i<7;i++){const d=new Date(monday);d.setDate(d.getDate()+i);if(planForDate(d))planned++}
    let streak=0;try{streak=typeof window.streakWeeks==='function'?window.streakWeeks():0}catch(_){}
    return `<div class="card streak client-streak-v255"><div class="fire">🔥</div><div class="grow"><b>серия: ${streak} нед.</b><div class="streak-meta">${weekDone} / ${planned} на этой неделе · всего тренировок: ${sessions.length}</div></div></div>`
  }
  function refreshClientHomeExtras(){
    if(!isClient()||!document.getElementById('home')?.classList.contains('active'))return;
    try{if(typeof window.renderClientCheckinCard==='function')window.renderClientCheckinCard()}catch(_){ }
    try{if(typeof window.homeProgressRefresh==='function')window.homeProgressRefresh(false)}catch(_){ }
    try{window.calendarPlannerDecorateV234?.()}catch(_){ }
  }
  async function settleClientHome(){
    if(!document.getElementById('home')?.classList.contains('active'))return;
    const tasks=[];
    try{if(typeof window.renderClientCheckinCard==='function')tasks.push(Promise.resolve(window.renderClientCheckinCard()))}catch(_){ }
    try{if(typeof window.homeProgressRefresh==='function')tasks.push(Promise.resolve(window.homeProgressRefresh(true)))}catch(_){ }
    await Promise.allSettled(tasks);try{window.calendarPlannerDecorateV234?.()}catch(_){ }
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))
  }
  function renderCanonicalClientHome(){
    if(!isClient())return;
    document.body?.classList.add('unvrsl-client');
    const root=document.getElementById('home');if(!root)return;
    const s=appState(),signature=JSON.stringify([String(cloudState()?.user?.id||''),isoDay(mondayFor(currentViewDate())),s.sessions?.length||0,s.calendarPlans||{}]);
    if(root.dataset.clientHomeSignatureV257===signature&&root.querySelector('.calendar-card')){
      refreshClientHomeExtras();return;
    }
    const y=root.classList.contains('active')?(window.scrollY||document.documentElement?.scrollTop||0):0;
    root.innerHTML=`${clientCalendarHtml()}${clientStreakHtml()}`;
    root.dataset.clientHomeSignatureV257=signature;
    if(y>0)window.scrollTo({top:y,left:0,behavior:'auto'});
    [0,160,700].forEach(t=>setTimeout(refreshClientHomeExtras,t));
  }
  function installCanonicalClientHome(){
    if(!isClient())return;
    window.clientCleanHome=renderCanonicalClientHome;
    try{clientCleanHome=renderCanonicalClientHome}catch(_){ }
    const current=window.home;
    if(typeof current==='function'&&!current.__clientHomeAuthorityV255){
      const wrapped=function(){if(isClient())return renderCanonicalClientHome();return current.apply(this,arguments)};
      wrapped.__clientHomeAuthorityV255=true;window.home=wrapped;try{home=wrapped}catch(_){ }
    }
    const root=document.getElementById('home');
    if(root?.classList.contains('active')&&!root.querySelector('.calendar-card'))renderCanonicalClientHome();
  }
  function canonicalClientPlan(){
    if(!isClient())return;
    const root=document.getElementById('plan');if(!root)return;
    const renderer=window.clientCleanPlanPage;
    if(typeof renderer==='function'&&renderer.__clientPlanV255)return renderer();
    if(!root.querySelector('.client-plan-loading-v255'))root.innerHTML='<div class="card client-plan-loading-v255"><div><div class="title">Загружаем план</div><div class="muted">Получаем назначенную программу…</div></div></div>';
  }

  function installPlanGuard(){
    if(!isClient())return;
    const current=window.planPage;
    if(typeof current!=='function'||!current.__clientPlanAuthorityV255){
      canonicalClientPlan.__clientPlanAuthorityV255=true;window.planPage=canonicalClientPlan;try{planPage=canonicalClientPlan}catch(_){ }
    }
  }

  function installSettings(){
    const base=window.settingsSheet;
    if(typeof base!=='function'||base.__clientSettingsV255)return;
    const wrapped=function(){
      const out=base.apply(this,arguments);
      if(!isClient())return out;
      setTimeout(()=>{
        const sh=document.getElementById('sheet');if(!sh||sh.querySelector('.client-settings-v255'))return;
        const block=document.createElement('div');block.className='client-settings-v255';
        block.innerHTML=`<div class="section">МОИ ДАННЫЕ</div><div class="settings-card"><div class="setting"><div><b>Профиль</b><div class="muted small">Рост, возраст, пол и цель</div></div><button class="btn tiny" onclick="clientFinalProfileV222()">Открыть</button></div><div class="setting"><div><b>Замеры</b><div class="muted small">Вес и обхваты тела</div></div><button class="btn tiny" onclick="clientFinalMeasuresV222()">Записать</button></div></div>`;
        const firstSection=sh.querySelector('.section');if(firstSection)firstSection.before(block);else sh.prepend(block);
        // Old AI/OpenGym imports were retired: remove any stale controls injected by cached legacy modules.
        [...sh.querySelectorAll('button,label,.setting')].forEach(el=>{const t=(el.textContent||'').toLowerCase();if(/chat\s*gpt|opengym|open gym|openai|импорт.*gpt|импорт.*open/.test(t))el.remove()});
      },0);
      return out;
    };
    wrapped.__clientSettingsV255=true;window.settingsSheet=wrapped;try{settingsSheet=wrapped}catch(_){ }
  }

  window.clientFinalProfileV222=()=>{
    if(typeof window.clientProfile107==='function')return window.clientProfile107();
    if(typeof window.profileEditSheet==='function')return window.profileEditSheet();
    if(typeof window.cloudAccountSheet==='function')return window.cloudAccountSheet();
  };
  window.clientFinalMeasuresV222=()=>{
    if(typeof window.clientMeasure107==='function')return window.clientMeasure107();
    return window.clientFinalProfileV222();
  };
  window.clientProfileV255=window.clientFinalProfileV222;
  window.clientMeasuresV255=window.clientFinalMeasuresV222;

  async function bootClient(){
    if(clientReady||!isClient())return clientBooting;
    if(clientBooting)return clientBooting;
    // Claim both client routes before any network wait so the built-in trainer
    // cycle can never flash while assignments are loading.
    installPlanGuard();installSettings();installCanonicalClientHome();
    clientBooting=(async()=>{
      await cleanupLegacyClientWeight();
      await hydrateAssignments();
      await script('client-program-picker.js?v=260');
      await script('client-journal-profile-v107.js?v=260');
      installPlanGuard();installSettings();installCanonicalClientHome();
      if(document.getElementById('plan')?.classList.contains('active'))canonicalClientPlan();
      if(document.getElementById('home')?.classList.contains('active'))renderCanonicalClientHome();
      await settleClientHome();
      clientReady=true;document.body?.classList.add('client-runtime-ready-v255','client-runtime-ready-v256','client-runtime-ready-v257','client-runtime-ready-v260');
      setTimeout(()=>window.clientPlanHistoryRefresh107?.(),0);
      window.dispatchEvent(new CustomEvent('unvrsl:client-ready',{detail:{release:260}}));
      return true;
    })().catch(e=>{console.warn('client runtime v260',e);return false}).finally(()=>{window.__unvrslClientRuntimeSettledV257=true;window.__unvrslClientRuntimeSettledV260=true;window.dispatchEvent(new CustomEvent('unvrsl:client-settled',{detail:{ready:clientReady,release:260}}));clientBooting=null});
    return clientBooting;
  }

  // Prevent the built-in 8-week trainer cycle from remaining visible once a client session is known.
  document.addEventListener('click',e=>{
    if(!e.target?.closest?.('.nav button[data-p="plan"]')||!isClient())return;
    installPlanGuard();
    requestAnimationFrame(canonicalClientPlan);
  },true);

  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden&&isClient())cleanupLegacyClientWeight();
  });

  const tick=setInterval(()=>{
    const c=cloudState();
    if(c?.user){
      if(isClient())bootClient();
      else installSettings()
    }
    if(isClient()){installPlanGuard();installSettings();installCanonicalClientHome()}
  },120);
  setTimeout(()=>clearInterval(tick),20000);
  [500,1200,2500,5000].forEach(t=>setTimeout(()=>{if(isClient()){bootClient();installPlanGuard();installSettings();installCanonicalClientHome()}},t));
})();
