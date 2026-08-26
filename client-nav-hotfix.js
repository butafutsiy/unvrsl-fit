'use strict';
(()=>{
  if(window.__unvrslClientNavHotfix)return;window.__unvrslClientNavHotfix=true;

  const style=document.createElement('style');
  style.id='client-nav-hotfix-style';
  style.textContent=`
    .nav button[data-p="start"] .ico{font-size:0!important}
    .nav button[data-p="start"] .ico>*{display:none!important}
    .nav button[data-p="start"] .ico::before{content:"";display:block;width:0;height:0;border-top:9px solid transparent;border-bottom:9px solid transparent;border-left:15px solid currentColor;margin-left:3px}
    #trainerInlineDetail .trainer-assign-inline{margin:10px 0 4px;width:100%}
  `;
  document.head.appendChild(style);

  function isClient(){
    if(!window.cloud?.user)return false;
    if(typeof window.unvrslTrainerMode==='function')return !window.unvrslTrainerMode();
    return window.cloud?.profile?.role!=='trainer';
  }

  function dedupeCheckins(){
    const root=document.getElementById('clients');if(!root)return;
    const cards=[...root.querySelectorAll('.checkin-overview')];
    cards.slice(1).forEach(x=>x.remove());
  }

  let checkinBusy=false;
  function patchCheckin(){
    const current=window.trainerCheckinOverview;
    if(typeof current==='function'&&!current.__dedupeHotfix){
      const base=current;
      const wrapped=async function(){
        dedupeCheckins();
        const root=document.getElementById('clients');
        if(checkinBusy||root?.querySelector('.checkin-overview'))return;
        checkinBusy=true;
        try{const r=await base.apply(this,arguments);dedupeCheckins();return r}
        finally{checkinBusy=false;dedupeCheckins()}
      };
      wrapped.__dedupeHotfix=true;window.trainerCheckinOverview=wrapped;
      try{trainerCheckinOverview=wrapped}catch(e){}
    }

    const checkin=window.openWeeklyCheckin;
    if(typeof checkin==='function'&&!checkin.__emptyClientWeight){
      const base=checkin;
      const wrapped=async function(){
        const r=await base.apply(this,arguments);
        if(isClient()){
          try{
            const prev=typeof window.loadMyCheckin==='function'?await window.loadMyCheckin(false):(typeof loadMyCheckin==='function'?await loadMyCheckin(false):null);
            const today=typeof window.checkinToday==='function'?window.checkinToday():(typeof checkinToday==='function'?checkinToday():new Date().toISOString().slice(0,10));
            if(prev?.checkin_date!==today){const input=document.getElementById('ciWeight');if(input)input.value=''}
          }catch(e){const input=document.getElementById('ciWeight');if(input)input.value=''}
        }
        return r
      };
      wrapped.__emptyClientWeight=true;window.openWeeklyCheckin=wrapped;
      try{openWeeklyCheckin=wrapped}catch(e){}
    }
  }

  let ownState={uid:null,at:0,hasWeight:false,hasGoal:false};
  async function clientOwnState(force=false){
    if(!isClient()||!window.cloud?.client||!window.cloud?.user)return null;
    const uid=window.cloud.user.id;
    if(!force&&ownState.uid===uid&&Date.now()-ownState.at<30000)return ownState;
    try{
      const [bw,pr]=await Promise.all([
        window.cloud.client.from('bodyweights').select('measure_date').eq('user_id',uid).limit(1),
        window.cloud.client.from('profiles').select('target_weight_kg').eq('id',uid).maybeSingle()
      ]);
      ownState={uid,at:Date.now(),hasWeight:!bw.error&&(bw.data||[]).length>0,hasGoal:!pr.error&&Number(pr.data?.target_weight_kg)>0};
      return ownState
    }catch(e){return null}
  }

  function scrubInheritedWeight(state){
    if(!isClient()||!state)return;
    const cards=[...document.querySelectorAll('#home .home-stats-v2 .sd2-card')];
    const card=cards.find(x=>x.querySelector('.sd2-weight-label'));if(!card)return;
    if(!state.hasWeight){
      const cur=card.querySelector('.sd2-current');if(cur)cur.innerHTML='— <small>кг</small>';
      const date=card.querySelector('.sd2-last-date');if(date)date.textContent='';
      const chart=card.querySelector('.sd2-chart');if(chart)chart.outerHTML='<div class="sd2-empty">Запиши первый вес — здесь появится график.</div>';
    }
    if(!state.hasGoal){
      const goal=card.querySelector('.sd2-goal-link');if(goal)goal.textContent='◎ Цель';
      card.querySelector('.sd2-goal-copy')?.remove();
      card.querySelectorAll('svg [stroke="#ffd60a"],svg [fill="#ffd60a"]').forEach(x=>x.remove());
    }
  }

  async function cleanClientWeight(force=false){
    if(!isClient())return;
    const state=await clientOwnState(force);scrubInheritedWeight(state)
  }

  function patchHomeProgress(){
    const hp=window.homeProgressRefresh;
    if(typeof hp==='function'&&!hp.__clientWeightHotfix){
      const base=hp;
      const wrapped=async function(){const r=await base.apply(this,arguments);await cleanClientWeight(false);return r};
      wrapped.__clientWeightHotfix=true;window.homeProgressRefresh=wrapped;
    }
  }

  function ensureAssignButton(clientId){
    const host=document.getElementById('trainerInlineDetail');if(!host||host.querySelector('.trainer-assign-inline'))return;
    const section=[...host.querySelectorAll('.section')].find(x=>/ПРОГРАММЫ/i.test(x.textContent||''));
    if(!section)return;
    const btn=document.createElement('button');btn.type='button';btn.className='btn primary trainer-assign-inline';btn.textContent='＋ Назначить программу';
    btn.onclick=()=>{if(typeof window.trainerAssignProgramSheet==='function')window.trainerAssignProgramSheet(clientId)};
    section.after(btn)
  }

  function patchClientDetail(){
    const cur=window.trainerClientDetail;
    if(typeof cur==='function'&&!cur.__assignHotfix){
      const base=cur;
      const wrapped=async function(id){const r=await base.apply(this,arguments);setTimeout(()=>ensureAssignButton(id),0);return r};
      wrapped.__assignHotfix=true;window.trainerClientDetail=wrapped;
      try{trainerClientDetail=wrapped}catch(e){}
    }
  }

  function install(){patchCheckin();patchHomeProgress();patchClientDetail();dedupeCheckins();cleanClientWeight(false)}
  [0,120,400,900,1800,3200].forEach(t=>setTimeout(install,t));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){ownState.at=0;setTimeout(install,50)}});
  setInterval(()=>{dedupeCheckins();if(document.getElementById('home')?.classList.contains('active'))cleanClientWeight(false)},4000);
})();
