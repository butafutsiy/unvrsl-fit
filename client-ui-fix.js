'use strict';
(()=>{
  if(window.__unvrslClientUiFix)return;window.__unvrslClientUiFix=true;

  const style=document.createElement('style');style.id='unvrsl-client-ui-fix';style.textContent=`
    body.unvrsl-client{padding-bottom:108px!important}
    body.unvrsl-client .topbar{position:relative!important;top:auto!important;overflow:visible!important;padding:calc(env(safe-area-inset-top) + 20px) 18px 12px!important;min-height:0!important;background:#050505!important}
    body.unvrsl-client .topbar>div{min-width:0;overflow:visible!important}
    body.unvrsl-client .brand{line-height:1.06!important;padding-top:2px!important;overflow:visible!important}
    body.unvrsl-client .date{margin-top:7px!important}
    body.unvrsl-client .page{padding-bottom:118px!important}
    body.unvrsl-client #start.page{padding-bottom:160px!important;touch-action:pan-y;overscroll-behavior-y:auto}
    body.unvrsl-client #start .workout-head{top:8px!important;position:relative!important;margin-top:4px!important}
    body.unvrsl-client #start .workout-head .title{font-size:21px!important;line-height:1.08!important;letter-spacing:-.35px!important}
    body.unvrsl-client #start .exercise{padding:14px!important;margin:9px 0!important;border-radius:21px!important}
    body.unvrsl-client #start .exname{font-size:18px!important;line-height:1.15!important}
    body.unvrsl-client #start .sethead,body.unvrsl-client #start .setrow{gap:6px!important;grid-template-columns:28px minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) 40px!important}
    body.unvrsl-client #start .setrow input{min-width:0!important;padding:10px 5px!important}
    body.unvrsl-client .nav{grid-template-columns:repeat(5,minmax(0,1fr))!important;bottom:calc(env(safe-area-inset-bottom) + 6px)!important}
    body.unvrsl-client .nav button{min-width:0!important}
    body.unvrsl-client #home>.card{margin:10px 0!important}
    body.unvrsl-client .weekly-checkin-card .row{align-items:center!important}
    body.unvrsl-client .weekly-checkin-card .title{font-size:22px!important;line-height:1.08!important}
    @media(max-width:390px){
      body.unvrsl-client .topbar{padding-left:17px!important;padding-right:17px!important}
      body.unvrsl-client .brand{font-size:32px!important;letter-spacing:-1.5px!important}
      body.unvrsl-client .gear{width:48px!important;height:48px!important;border-radius:16px!important}
      body.unvrsl-client #start .workout-head .title{font-size:19px!important}
      body.unvrsl-client .weekly-checkin-card .row{align-items:flex-start!important;flex-direction:column!important}
      body.unvrsl-client .weekly-checkin-card .btn{width:100%!important}
    }
  `;document.head.appendChild(style);

  function isClient(){
    if(!window.cloud?.user)return false;
    if(typeof window.unvrslTrainerMode==='function')return !window.unvrslTrainerMode();
    return window.cloud?.profile?.role!=='trainer';
  }
  function applyClientClass(){document.body?.classList.toggle('unvrsl-client',isClient())}

  let clientNavigationDepth=0;
  function installStableWorkoutScroll(){
    const current=window.startPage;
    if(typeof current!=='function'||current.__clientStableScroll)return;
    const wrapped=function(){
      const root=document.getElementById('start');
      const preserve=isClient()&&clientNavigationDepth===0&&root?.classList.contains('active');
      const y=preserve?window.scrollY:0;
      const result=current.apply(this,arguments);
      if(preserve&&y>0)requestAnimationFrame(()=>requestAnimationFrame(()=>{
        if(clientNavigationDepth||!document.getElementById('start')?.classList.contains('active'))return;
        const max=Math.max(0,document.documentElement.scrollHeight-window.innerHeight);
        window.scrollTo({top:Math.min(y,max),left:0,behavior:'auto'});
      }));
      return result;
    };
    wrapped.__clientStableScroll=true;
    wrapped.__clientStableScrollBase=current;
    window.startPage=wrapped;try{startPage=wrapped}catch(e){}
  }

  async function ownWorkoutCount(){
    if(!isClient()||!window.cloud?.client||!window.cloud?.user)return 0;
    const r=await window.cloud.client.from('workouts').select('id',{count:'exact',head:true}).eq('user_id',window.cloud.user.id);
    return r.error?0:(r.count||0);
  }
  async function refreshWorkoutCount(){const el=document.getElementById('clientOwnWorkoutCount');if(el)el.textContent=String(await ownWorkoutCount())}

  function cleanClientHome(){
    applyClientClass();
    const root=document.getElementById('home');if(!root)return;
    const ps=typeof window.assignedClientPrograms==='function'?window.assignedClientPrograms():[],p=ps[0];
    if(!window.cloud?.user){
      root.innerHTML='<div class="card"><div class="muted">UNVRSL FIT</div><div class="title" style="margin-top:6px">Твои тренировки — только твои</div><div class="muted" style="margin-top:8px">Войди в аккаунт, чтобы получить программу от тренера.</div><button class="btn primary full" style="margin-top:16px" onclick="cloudAccountSheet()">Войти</button></div>';
      return;
    }
    const plan=p?'<div class="title" style="margin-top:6px">'+esc(p.name)+'</div><div class="muted" style="margin-top:6px">'+(p.weeks?.length||0)+' нед. · тренер: '+esc(p.trainerName||'назначен')+'</div><button class="btn primary full" style="margin-top:16px" onclick="openClientProgram(\''+p.id+'\')">Открыть план</button>':'<div class="title" style="margin-top:6px">План пока не назначен</div><div class="muted" style="margin-top:8px">Когда тренер отправит программу, она появится здесь автоматически.</div>';
    root.innerHTML='<div class="card"><div class="muted">МОЙ ПЛАН</div>'+plan+'</div>'+
      '<div class="card"><div class="row between"><div><div class="muted">Выполнено тренировок</div><div class="title" id="clientOwnWorkoutCount">—</div></div><button class="btn" onclick="nav(\'stats\')">Статистика</button></div></div>';
    refreshWorkoutCount();
  }
  window.clientCleanHome=cleanClientHome;try{clientCleanHome=cleanClientHome}catch(e){}

  const baseOpenCheckin=window.openWeeklyCheckin;
  if(typeof baseOpenCheckin==='function'&&!baseOpenCheckin.__clientWeightFix){
    const wrapped=async function(){
      let previous=null;try{if(typeof loadMyCheckin==='function')previous=await loadMyCheckin(true)}catch(e){}
      const r=await baseOpenCheckin.apply(this,arguments);if(!isClient())return r;
      const input=document.getElementById('ciWeight');if(!input)return r;
      const today=typeof checkinToday==='function'?checkinToday():new Date().toISOString().slice(0,10),same=previous&&previous.checkin_date===today;
      if(!same){input.value='';input.placeholder=previous?.weight_kg?'Последний: '+previous.weight_kg+' кг':'Введи текущий вес'}
      const label=input.closest('.field')?.querySelector('label');if(label)label.textContent='Текущий вес, кг';
      return r;
    };
    wrapped.__clientWeightFix=true;window.openWeeklyCheckin=wrapped;try{openWeeklyCheckin=wrapped}catch(e){}
  }

  const baseNav=window.nav;
  if(typeof baseNav==='function'&&!baseNav.__clientUiFix){
    const wrapped=function(page){const current=document.querySelector('.page.active')?.id;clientNavigationDepth++;let r;try{r=baseNav.apply(this,arguments)}finally{clientNavigationDepth--}applyClientClass();if(page&&page!==current)requestAnimationFrame(()=>window.scrollTo({top:0,left:0,behavior:'auto'}));return r};
    wrapped.__clientUiFix=true;window.nav=wrapped;try{nav=wrapped}catch(e){}
  }
  const baseRender=window.render;
  if(typeof baseRender==='function'&&!baseRender.__clientUiFix){
    const wrapped=function(){const r=baseRender.apply(this,arguments);applyClientClass();return r};wrapped.__clientUiFix=true;window.render=wrapped;try{render=wrapped}catch(e){}
  }

  applyClientClass();installStableWorkoutScroll();
  [300,900,2200,5000].forEach(t=>setTimeout(()=>{applyClientClass();installStableWorkoutScroll()},t));
  if(isClient()&&typeof window.home==='function')setTimeout(()=>{try{window.home()}catch(e){}},80);
})();
