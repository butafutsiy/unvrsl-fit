'use strict';
(()=>{
  if(window.__unvrslClientUiFix)return;window.__unvrslClientUiFix=true;

  const style=document.createElement('style');style.id='unvrsl-client-ui-fix';style.textContent=`
    body.unvrsl-client{padding-bottom:112px!important}
    body.unvrsl-client .topbar{position:relative!important;top:auto!important;overflow:visible!important;padding:calc(env(safe-area-inset-top) + 20px) 18px 14px!important;min-height:0!important;background:#050505!important}
    body.unvrsl-client .topbar>div{min-width:0;overflow:visible!important}
    body.unvrsl-client .brand{line-height:1.08!important;padding-top:2px!important;overflow:visible!important}
    body.unvrsl-client .date{margin-top:8px!important}
    body.unvrsl-client .page{padding-bottom:42px!important}
    body.unvrsl-client #start.page{padding-bottom:152px!important}
    body.unvrsl-client #start .workout-head{top:calc(env(safe-area-inset-top) + 8px)!important}
    body.unvrsl-client .nav{bottom:calc(env(safe-area-inset-bottom) + 7px)!important}
    body.unvrsl-client .client-own-weight-card .big{font-size:48px!important;line-height:1!important}
    body.unvrsl-client .client-own-weight-card .weight-actions button{white-space:nowrap!important}
    body.unvrsl-client .client-home-note{font-size:12px;color:#85878e;margin-top:10px;line-height:1.35}
    @media(max-width:430px){
      body.unvrsl-client .topbar{padding-left:17px!important;padding-right:17px!important;padding-bottom:12px!important}
      body.unvrsl-client .brand{font-size:32px!important;letter-spacing:-1.5px!important}
      body.unvrsl-client .gear{width:48px!important;height:48px!important;border-radius:16px!important}
      body.unvrsl-client #start .exercise{padding:15px!important}
      body.unvrsl-client #start .sethead,body.unvrsl-client #start .setrow{gap:6px!important;grid-template-columns:28px minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) 40px!important}
    }
  `;document.head.appendChild(style);

  function isClient(){
    if(!window.cloud?.user)return false;
    if(typeof window.unvrslTrainerMode==='function')return !window.unvrslTrainerMode();
    return window.cloud?.profile?.role!=='trainer';
  }
  function applyClientClass(){document.body?.classList.toggle('unvrsl-client',isClient())}

  async function ownWeights(limit=8){
    if(!isClient()||!window.cloud?.client||!window.cloud?.user)return[];
    const r=await window.cloud.client.from('bodyweights').select('measure_date,weight_kg').eq('user_id',window.cloud.user.id).order('measure_date',{ascending:false}).limit(limit);
    return r.error?[]:(r.data||[]);
  }
  async function ownWorkoutCount(){
    if(!isClient()||!window.cloud?.client||!window.cloud?.user)return 0;
    const r=await window.cloud.client.from('workouts').select('id',{count:'exact',head:true}).eq('user_id',window.cloud.user.id);
    return r.error?0:(r.count||0);
  }
  function shortDate(v){if(!v)return'';const d=new Date(v+'T12:00:00');return new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short'}).format(d).replace('.','')}
  function fmt(v){const n=Number(v);return Number.isFinite(n)?n.toFixed(1).replace('.0',''):'—'}

  async function refreshClientHomeCloud(){
    if(!isClient())return;
    const [weights,count]=await Promise.all([ownWeights(2),ownWorkoutCount()]);
    const wEl=document.getElementById('clientOwnWeight'),note=document.getElementById('clientOwnWeightNote'),countEl=document.getElementById('clientOwnWorkoutCount');
    if(wEl){
      const latest=weights[0];
      wEl.innerHTML=latest?fmt(latest.weight_kg)+' <span class="muted" style="font-size:20px">кг</span>':'—';
      if(note)note.textContent=latest?'Последняя запись: '+shortDate(latest.measure_date):'Вес появится только после того, как клиент запишет его сам.';
    }
    if(countEl)countEl.textContent=String(count);
  }

  function cleanClientHome(){
    applyClientClass();
    const root=document.getElementById('home');if(!root)return;
    const ps=typeof window.assignedClientPrograms==='function'?window.assignedClientPrograms():[],p=ps[0];
    if(!window.cloud?.user){
      root.innerHTML='<div class="card"><div class="muted">UNVRSL FIT</div><div class="title" style="margin-top:6px">Твои тренировки — только твои</div><div class="muted" style="margin-top:8px">Войди в аккаунт. До назначения тренером здесь не будет чужих или демонстрационных программ.</div><button class="btn primary full" style="margin-top:16px" onclick="cloudAccountSheet()">Войти</button></div>';
      return;
    }
    const plan=p?'<div class="title" style="margin-top:6px">'+esc(p.name)+'</div><div class="muted" style="margin-top:6px">'+(p.weeks?.length||0)+' нед. · тренер: '+esc(p.trainerName||'назначен')+'</div><button class="btn primary full" style="margin-top:16px" onclick="openClientProgram(\''+p.id+'\')">Открыть план</button>':'<div class="title" style="margin-top:6px">План пока не назначен</div><div class="muted" style="margin-top:8px">Когда тренер отправит программу, она появится здесь автоматически.</div>';
    root.innerHTML='<div class="card"><div class="muted">МОЙ ПЛАН</div>'+plan+'</div>'+
      '<div class="card client-own-weight-card"><div class="weight-top"><div><div class="muted">Вес тела</div><div class="big" id="clientOwnWeight">—</div></div><div class="weight-actions"><button onclick="weight()">＋ Записать</button></div></div><div id="clientOwnWeightNote" class="client-home-note">Вес появится только после того, как клиент запишет его сам.</div></div>'+
      '<div class="card"><div class="row between"><div><div class="muted">Выполнено тренировок</div><div class="title" id="clientOwnWorkoutCount">—</div></div><button class="btn" onclick="nav(\'stats\')">Статистика</button></div></div>';
    refreshClientHomeCloud();
  }
  window.clientCleanHome=cleanClientHome;try{clientCleanHome=cleanClientHome}catch(e){}

  const baseWeight=window.weight;
  window.weight=async function(){
    if(!isClient())return typeof baseWeight==='function'?baseWeight.apply(this,arguments):undefined;
    const a=await ownWeights(1),last=a[0];
    modal('<h2>Вес тела</h2><div class="muted">Запиши свой текущий вес. Старое значение автоматически не подставляется.</div><div class="field"><label>Вес, кг</label><input id="weightInput" inputmode="decimal" placeholder="'+(last?'Последний: '+fmt(last.weight_kg)+' кг':'Например, 65.4')+'"></div><button class="btn primary full" onclick="saveWeight()">Сохранить</button>');
    setTimeout(()=>document.getElementById('weightInput')?.focus(),100);
  };try{weight=window.weight}catch(e){}

  const baseSaveWeight=window.saveWeight;
  window.saveWeight=async function(){
    if(!isClient())return typeof baseSaveWeight==='function'?baseSaveWeight.apply(this,arguments):undefined;
    const el=document.getElementById('weightInput'),v=Number(String(el?.value||'').replace(',','.'));if(!v||v<20||v>400)return toast('Проверь вес');
    const date=typeof iso==='function'?iso():new Date().toISOString().slice(0,10);
    const r=await window.cloud.client.from('bodyweights').upsert({user_id:window.cloud.user.id,measure_date:date,weight_kg:v},{onConflict:'user_id,measure_date'});
    if(r.error)return alert('Не удалось сохранить вес: '+r.error.message);
    closeModal();if(typeof render==='function')render();setTimeout(refreshClientHomeCloud,80);toast('Вес сохранён');
  };try{saveWeight=window.saveWeight}catch(e){}

  const baseOpenCheckin=window.openWeeklyCheckin;
  if(typeof baseOpenCheckin==='function'){
    window.openWeeklyCheckin=async function(){
      await baseOpenCheckin.apply(this,arguments);
      if(!isClient())return;
      let last=null;try{if(typeof loadMyCheckin==='function')last=await loadMyCheckin(true)}catch(e){}
      const today=typeof checkinToday==='function'?checkinToday():new Date().toISOString().slice(0,10),input=document.getElementById('ciWeight');
      if(input&&(!last||last.checkin_date!==today)){input.value='';input.placeholder='Запиши свой вес'}
    };
    try{openWeeklyCheckin=window.openWeeklyCheckin}catch(e){}
  }

  const baseSaveCheckin=window.saveWeeklyCheckin;
  if(typeof baseSaveCheckin==='function'){
    window.saveWeeklyCheckin=async function(){
      if(!isClient())return baseSaveCheckin.apply(this,arguments);
      const before=Array.isArray(st?.bw)?JSON.stringify(st.bw):'[]';
      const r=await baseSaveCheckin.apply(this,arguments);
      try{st.bw=JSON.parse(before);if(typeof save==='function')save()}catch(e){}
      setTimeout(()=>{if(document.getElementById('home')?.classList.contains('active'))cleanClientHome()},80);
      return r;
    };
    try{saveWeeklyCheckin=window.saveWeeklyCheckin}catch(e){}
  }

  const baseRender=window.render;
  if(typeof baseRender==='function'&&!baseRender.__clientUiFix){
    const wrapped=function(){const r=baseRender.apply(this,arguments);applyClientClass();return r};wrapped.__clientUiFix=true;window.render=wrapped;try{render=wrapped}catch(e){}
  }
  const baseNav=window.nav;
  if(typeof baseNav==='function'&&!baseNav.__clientUiFix){
    const wrapped=function(){const r=baseNav.apply(this,arguments);applyClientClass();return r};wrapped.__clientUiFix=true;window.nav=wrapped;try{nav=wrapped}catch(e){}
  }
  [0,150,500,1200,2500].forEach(t=>setTimeout(()=>{applyClientClass();if(isClient()&&document.getElementById('home')?.classList.contains('active'))cleanClientHome()},t));
})();
