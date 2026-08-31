'use strict';
(()=>{
  if(window.__unvrslClientFinalRuntimeV222)return;
  window.__unvrslClientFinalRuntimeV222=true;

  const MASTER='butafutsiy@mail.ru';
  const loaded=new Set();
  let clientReady=false;

  function cloudState(){try{if(typeof cloud!=='undefined')return cloud}catch(_){ }return window.cloud||null}
  function state(){try{if(typeof st!=='undefined'){window.st=st;return st}}catch(_){ }return window.st||null}
  function isTrainer(){const c=cloudState();return String(c?.user?.email||'').toLowerCase()===MASTER||String(c?.profile?.role||'').toLowerCase()==='trainer'}
  function isClient(){const c=cloudState();return !!c?.user&&!isTrainer()}
  function saveState(){try{if(typeof save==='function')save()}catch(_){}}

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
    await hydrateAssignments();
    await script('client-journal-profile-v107.js');
    await script('client-plan-profile-first-v198.js');
    installPlanGuard();installSettings();
    if(document.getElementById('plan')?.classList.contains('active'))renderClientPlan();
    try{if(typeof window.clientCleanPlanPage==='function')window.clientCleanPlanPage()}catch(_){ }
  }

  // Prevent the built-in 8-week trainer cycle from remaining visible once a client session is known.
  document.addEventListener('click',e=>{
    if(!e.target?.closest?.('.nav button[data-p="plan"]')||!isClient())return;
    installPlanGuard();
    setTimeout(renderClientPlan,0);
  },true);

  const tick=setInterval(()=>{
    const c=cloudState();
    if(c?.user){
      if(isClient())bootClient();
      else {clientReady=true;installSettings()}
    }
    if(isClient()){installPlanGuard();installSettings()}
  },120);
  setTimeout(()=>clearInterval(tick),20000);
  [500,1200,2500,5000].forEach(t=>setTimeout(()=>{if(isClient()){bootClient();installPlanGuard();installSettings()}},t));
})();
