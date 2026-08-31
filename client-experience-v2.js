'use strict';
(()=>{
  if(window.__unvrslClientExperienceV2)return;window.__unvrslClientExperienceV2=true;

  const style=document.createElement('style');style.id='unvrsl-client-experience-v2';style.textContent=`
    body.unvrsl-client .client-progress-card{padding:17px!important}
    body.unvrsl-client .client-progress-card .title{font-size:22px!important}
    body.unvrsl-client .client-progress-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:13px}
    body.unvrsl-client .client-progress-actions .btn{min-height:42px!important}
    body.unvrsl-client .topbar{scroll-margin-top:0}
    .trainer-assignment-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:12px 0;border-bottom:1px solid #303034}
    .trainer-assignment-row:last-child{border-bottom:0}.trainer-assignment-row .btn{white-space:nowrap}
    @media(max-width:390px){body.unvrsl-client .client-progress-actions{grid-template-columns:1fr}}
  `;document.head.appendChild(style);

  function isClient(){
    if(!window.cloud?.user)return false;
    if(typeof window.unvrslTrainerMode==='function')return !window.unvrslTrainerMode();
    return window.cloud?.profile?.role!=='trainer';
  }

  async function clientWorkoutCount(){
    if(!isClient()||!window.cloud?.client||!window.cloud?.user)return 0;
    const r=await window.cloud.client.from('workouts').select('id',{count:'exact',head:true}).eq('user_id',window.cloud.user.id);
    return r.error?0:(r.count||0);
  }

  function refreshClientHomeExtras(){
    if(!isClient()||!document.getElementById('home')?.classList.contains('active'))return;
    try{if(typeof window.renderClientCheckinCard==='function')window.renderClientCheckinCard()}catch(e){}
    try{if(typeof window.homeProgressRefresh==='function')window.homeProgressRefresh(false)}catch(e){}
  }

  function clientHomeV2(){
    document.body?.classList.toggle('unvrsl-client',isClient());
    const root=document.getElementById('home');if(!root)return;
    const ps=typeof window.assignedClientPrograms==='function'?window.assignedClientPrograms():[],p=ps[0];
    if(!window.cloud?.user){
      root.innerHTML='<div class="card"><div class="muted">UNVRSL FIT</div><div class="title" style="margin-top:6px">Твои тренировки — только твои</div><div class="muted" style="margin-top:8px">Войди в аккаунт. До назначения тренером здесь не будет чужих программ.</div><button class="btn primary full" style="margin-top:16px" onclick="cloudAccountSheet()">Войти</button></div>';
      return;
    }
    const plan=p?'<div class="title" style="margin-top:6px">'+esc(p.name)+'</div><div class="muted" style="margin-top:6px">'+(p.weeks?.length||0)+' нед. · тренер: '+esc(p.trainerName||'назначен')+'</div><button class="btn primary full" style="margin-top:16px" onclick="openClientProgram(\''+p.id+'\')">Открыть план</button>':'<div class="title" style="margin-top:6px">План пока не назначен</div><div class="muted" style="margin-top:8px">Когда тренер назначит программу, она появится здесь автоматически.</div>';
    root.innerHTML='<div class="card"><div class="muted">МОЙ ПЛАН</div>'+plan+'</div>'+
      '<div class="card client-progress-card"><div class="muted">ЗАМЕРЫ И ПРОГРЕСС</div><div class="title" style="margin-top:6px">Вес и обхваты</div><div class="muted" style="margin-top:7px">Вес и замеры заполняются тобой в еженедельном чек-ине. Здесь не подставляются данные тренера или чужого аккаунта.</div><div class="client-progress-actions"><button class="btn" onclick="openWeeklyCheckin()">Заполнить чек-ин</button><button class="btn primary" onclick="nav(\'stats\')">Смотреть прогресс</button></div></div>'+
      '<div class="card"><div class="row between"><div><div class="muted">Выполнено тренировок</div><div class="title" id="clientOwnWorkoutCountV2">—</div></div><button class="btn" onclick="nav(\'stats\')">Статистика</button></div></div>';
    clientWorkoutCount().then(n=>{const el=document.getElementById('clientOwnWorkoutCountV2');if(el)el.textContent=String(n)});
    [0,120].forEach(t=>setTimeout(refreshClientHomeExtras,t));
  }
  window.clientHomeCanonicalV236=clientHomeV2;
  window.clientCleanHome=clientHomeV2;try{clientCleanHome=clientHomeV2}catch(e){}

  const baseNav=window.nav;
  if(typeof baseNav==='function'&&!baseNav.__clientV2){
    const wrapped=function(p){const r=baseNav.apply(this,arguments);if(isClient())requestAnimationFrame(()=>window.scrollTo({top:0,left:0,behavior:'auto'}));return r};
    wrapped.__clientV2=true;window.nav=wrapped;try{nav=wrapped}catch(e){}
  }

  const baseSyncWeights=window.cloudSyncBodyweights;
  if(typeof baseSyncWeights==='function'){
    window.cloudSyncBodyweights=async function(){if(isClient())return;return baseSyncWeights.apply(this,arguments)};
    try{cloudSyncBodyweights=window.cloudSyncBodyweights}catch(e){}
  }

  const baseLoadAssignments=window.cloudLoadAssignments;
  if(typeof baseLoadAssignments==='function'&&!baseLoadAssignments.__clientV2){
    const wrapped=async function(){
      const r=await baseLoadAssignments.apply(this,arguments);
      if(!isClient()||!window.cloud?.client||!window.cloud?.user)return r;
      const q=await window.cloud.client.from('plan_assignments').select('plan_id').eq('client_id',window.cloud.user.id).eq('status','active');
      if(q.error)return r;
      const active=new Set((q.data||[]).map(x=>String(x.plan_id)));let changed=false;
      if(Array.isArray(st.programs)){
        const before=st.programs.length;st.programs=st.programs.filter(p=>!(p?.cloudPlanId&&p?.trainerId&&!active.has(String(p.cloudPlanId))));changed=changed||before!==st.programs.length;
      }
      if(Array.isArray(st.remotePlans)){
        const before=st.remotePlans.length;st.remotePlans=st.remotePlans.filter(p=>!(p?.id&&p?.trainerId&&!active.has(String(p.id))));changed=changed||before!==st.remotePlans.length;
      }
      if(changed){save();render()}
      return r;
    };
    wrapped.__clientV2=true;window.cloudLoadAssignments=wrapped;try{cloudLoadAssignments=wrapped}catch(e){}
  }

  async function activeAssignments(clientId){
    if(!window.cloud?.client||!window.cloud?.user)return[];
    const r=await window.cloud.client.from('plan_assignments').select('plan_id,version,status,plans(title)').eq('trainer_id',window.cloud.user.id).eq('client_id',clientId).eq('status','active').order('updated_at',{ascending:false});
    return r.error?[]:(r.data||[]);
  }

  window.trainerRemoveProgram=async function(clientId,planId){
    if(!window.cloud?.client||!window.cloud?.user)return;
    if(!confirm('Убрать эту программу у клиента? История его тренировок сохранится.'))return;
    const r=await window.cloud.client.from('plan_assignments').update({status:'revoked',updated_at:new Date().toISOString()}).eq('trainer_id',window.cloud.user.id).eq('client_id',clientId).eq('plan_id',planId);
    if(r.error)return alert('Не удалось убрать программу: '+r.error.message);
    toast('Программа убрана');await window.trainerClientDetail(clientId);
  };

  const baseClientDetail=window.trainerClientDetail;
  if(typeof baseClientDetail==='function'&&!baseClientDetail.__clientV2){
    const wrapped=async function(id){
      const r=await baseClientDetail.apply(this,arguments);if(!window.cloud?.user)return r;
      const sh=document.getElementById('sheet');if(!sh)return r;
      const rows=await activeAssignments(id);
      if(sh.querySelector('.trainer-program-control-v2'))return r;
      const box=document.createElement('div');box.className='trainer-program-control-v2';
      box.innerHTML='<div class="section">УПРАВЛЕНИЕ ПРОГРАММОЙ</div><div class="card">'+(rows.length?rows.map(a=>'<div class="trainer-assignment-row"><div><b>'+esc(a.plans?.title||'Программа')+'</b><div class="muted small">Версия '+(a.version||1)+' · назначена клиенту</div></div><button class="btn tiny danger" onclick="trainerRemoveProgram(\''+id+'\',\''+a.plan_id+'\')">Убрать</button></div>').join(''):'<div class="muted">Активной программы сейчас нет.</div>')+'</div><button class="btn primary full" style="margin-top:10px" onclick="trainerAssignProgramSheet(\''+id+'\')">'+(rows.length?'Назначить другую программу':'Назначить программу')+'</button>';
      sh.appendChild(box);return r;
    };
    wrapped.__clientV2=true;window.trainerClientDetail=wrapped;try{trainerClientDetail=wrapped}catch(e){}
  }

  document.body?.classList.toggle('unvrsl-client',isClient());
  if(isClient()&&typeof window.home==='function')setTimeout(()=>{try{window.home();refreshClientHomeExtras()}catch(e){}},120);
})();
