'use strict';
(()=>{
  if(window.__unvrslClientFinalRuntimeV222)return;
  window.__unvrslClientFinalRuntimeV222=true;

  const MASTER='butafutsiy@mail.ru';
  const LEGACY_WEIGHT_DATE='2026-08-25';
  const LEGACY_WEIGHT_VALUE=97.5;
  const loaded=new Set();
  let clientReady=false;
  let legacyCleanup=null;

  function cloudState(){try{if(typeof cloud!=='undefined')return cloud}catch(_){ }return window.cloud||null}
  function state(){try{if(typeof st!=='undefined'){window.st=st;return st}}catch(_){ }return window.st||null}
  function isTrainer(){const c=cloudState();return String(c?.user?.email||'').toLowerCase()===MASTER||String(c?.profile?.role||'').toLowerCase()==='trainer'}
  function isClient(){const c=cloudState();return !!c?.user&&!isTrainer()}
  function saveState(){try{if(typeof save==='function')save()}catch(_){}}

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
  async function ownWorkoutCount(){
    const c=cloudState();if(!isClient()||!c?.client||!c?.user)return 0;
    const r=await c.client.from('workouts').select('id',{count:'exact',head:true}).eq('user_id',c.user.id);
    return r.error?0:(r.count||0)
  }
  function refreshClientHomeExtras(){
    if(!isClient()||!document.getElementById('home')?.classList.contains('active'))return;
    try{if(typeof window.renderClientCheckinCard==='function')window.renderClientCheckinCard()}catch(_){ }
    try{if(typeof window.homeProgressRefresh==='function')window.homeProgressRefresh(true)}catch(_){ }
  }
  function renderCanonicalClientHome(){
    if(!isClient())return;
    document.body?.classList.add('unvrsl-client');
    const root=document.getElementById('home');if(!root)return;
    const p=assigned()[0];
    const plan=p?`<div class="title" style="margin-top:6px">${esc2(p.name||'Тренировочная программа')}</div><div class="muted" style="margin-top:6px">${p.weeks?.length||0} нед. · тренер: ${esc2(p.trainerName||'назначен')}</div><button class="btn primary full" style="margin-top:16px" onclick="openClientProgram('${p.id}')">Открыть план</button>`:'<div class="title" style="margin-top:6px">План пока не назначен</div><div class="muted" style="margin-top:8px">Когда тренер назначит программу, она появится здесь автоматически.</div>';
    root.innerHTML=`<div class="card"><div class="muted">МОЙ ПЛАН</div>${plan}</div><div class="card client-progress-card"><div class="muted">ЗАМЕРЫ И ПРОГРЕСС</div><div class="title" style="margin-top:6px">Вес и обхваты</div><div class="muted" style="margin-top:7px">Вес, восстановление и замеры заполняются только из твоего аккаунта.</div><div class="client-progress-actions"><button class="btn" onclick="openWeeklyCheckin()">Заполнить чек-ин</button><button class="btn primary" onclick="nav('stats')">Смотреть прогресс</button></div></div><div class="card"><div class="row between"><div><div class="muted">Выполнено тренировок</div><div class="title" id="clientOwnWorkoutCountV236">—</div></div><button class="btn" onclick="nav('stats')">Статистика</button></div></div>`;
    ownWorkoutCount().then(n=>{const el=document.getElementById('clientOwnWorkoutCountV236');if(el)el.textContent=String(n)});
    [0,160,700].forEach(t=>setTimeout(refreshClientHomeExtras,t));
  }
  function installCanonicalClientHome(){
    if(!isClient())return;
    window.clientCleanHome=renderCanonicalClientHome;
    try{clientCleanHome=renderCanonicalClientHome}catch(_){ }
    const current=window.home;
    if(typeof current==='function'&&!current.__clientHomeV236){
      const wrapped=function(){const out=current.apply(this,arguments);setTimeout(renderCanonicalClientHome,0);return out};
      wrapped.__clientHomeV236=true;window.home=wrapped;try{home=wrapped}catch(_){ }
    }
    const root=document.getElementById('home');
    if(root?.classList.contains('active')&&!root.querySelector('#clientOwnWorkoutCountV236'))renderCanonicalClientHome();
  }
  function renderClientPlan(){
    if(!isClient())return;
    const root=document.getElementById('plan');if(!root)return;
    const ps=assigned();
    root.innerHTML=`<div class="client-final-plan-v222"><div class="section">МОЯ ПРОГРАММА</div>${ps.length?ps.map(p=>`<div class="card routine"><div class="row between"><div class="grow"><div class="title">${esc2(p.name||'Программа')}</div><div class="muted">${p.weeks?.length||0} нед. · назначено тренером</div></div><button class="btn primary" onclick="openClientProgram('${p.id}')">Открыть</button></div></div>`).join(''):`<div class="card"><div class="title">План пока не назначен</div><div class="muted" style="margin-top:7px">Здесь появится только программа, которую отправил тренер.</div></div>`}</div>`;
    setTimeout(()=>{try{window.clientPlanProfileInjectV222?.()}catch(_){ }try{if(typeof window.clientCleanPlanPage==='function'&&window.clientCleanPlanPage.__profileFirstV198)window.clientCleanPlanPage()}catch(_){ }},0);
  }

  function installPlanGuard(){
    if(!isClient())return;
    const current=window.planPage;
    if(typeof current==='function'&&!current.__clientFinalV222){
      const w=function(){renderClientPlan();setTimeout(()=>{try{window.clientPlanProfileRefresh198?.()}catch(_){ }},0)};
      w.__clientFinalV222=true;window.planPage=w;try{planPage=w}catch(_){ }
    }
  }

  function installSettings(){
    const base=window.settingsSheet;
    if(typeof base!=='function'||base.__clientFinalV222)return;
    const wrapped=function(){
      const out=base.apply(this,arguments);
      if(!isClient())return out;
      setTimeout(()=>{
        const sh=document.getElementById('sheet');if(!sh||sh.querySelector('.client-settings-v222'))return;
        const block=document.createElement('div');block.className='client-settings-v222';
        block.innerHTML=`<div class="section">МОИ ДАННЫЕ</div><div class="settings-card"><div class="setting"><div><b>Профиль</b><div class="muted small">Рост, возраст, пол и цель</div></div><button class="btn tiny" onclick="clientFinalProfileV222()">Открыть</button></div><div class="setting"><div><b>Замеры</b><div class="muted small">Вес и обхваты тела</div></div><button class="btn tiny" onclick="clientFinalMeasuresV222()">Записать</button></div></div>`;
        const firstSection=sh.querySelector('.section');if(firstSection)firstSection.before(block);else sh.prepend(block);
        // Old AI/OpenGym imports were retired: remove any stale controls injected by cached legacy modules.
        [...sh.querySelectorAll('button,label,.setting')].forEach(el=>{const t=(el.textContent||'').toLowerCase();if(/chat\s*gpt|opengym|open gym|openai|импорт.*gpt|импорт.*open/.test(t))el.remove()});
      },0);
      return out;
    };
    wrapped.__clientFinalV222=true;window.settingsSheet=wrapped;try{settingsSheet=wrapped}catch(_){ }
  }

  window.clientFinalProfileV222=()=>{
    if(typeof window.clientProfile107==='function')return window.clientProfile107();
    if(typeof window.clientPlanOpenProfile198==='function')return window.clientPlanOpenProfile198();
    if(typeof window.profileEditSheet==='function')return window.profileEditSheet();
    if(typeof window.cloudAccountSheet==='function')return window.cloudAccountSheet();
  };
  window.clientFinalMeasuresV222=()=>{
    if(typeof window.clientMeasure107==='function')return window.clientMeasure107();
    if(typeof window.clientPlanMeasure198==='function')return window.clientPlanMeasure198();
    return window.clientFinalProfileV222();
  };

  async function bootClient(){
    if(clientReady||!isClient())return;
    clientReady=true;
    await cleanupLegacyClientWeight();
    await hydrateAssignments();
    await script('client-journal-profile-v107.js');
    await script('client-plan-profile-first-v198.js');
    installPlanGuard();installSettings();installCanonicalClientHome();
    if(document.getElementById('plan')?.classList.contains('active'))renderClientPlan();
    try{if(typeof window.clientCleanPlanPage==='function')window.clientCleanPlanPage()}catch(_){ }
  }

  // Prevent the built-in 8-week trainer cycle from remaining visible once a client session is known.
  document.addEventListener('click',e=>{
    if(!e.target?.closest?.('.nav button[data-p="plan"]')||!isClient())return;
    installPlanGuard();
    setTimeout(renderClientPlan,0);
  },true);

  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden&&isClient())cleanupLegacyClientWeight();
  });

  const tick=setInterval(()=>{
    const c=cloudState();
    if(c?.user){
      if(isClient())bootClient();
      else {clientReady=true;installSettings()}
    }
    if(isClient()){installPlanGuard();installSettings();installCanonicalClientHome()}
  },120);
  setTimeout(()=>clearInterval(tick),20000);
  [500,1200,2500,5000].forEach(t=>setTimeout(()=>{if(isClient()){bootClient();installPlanGuard();installSettings();installCanonicalClientHome()}},t));
})();
