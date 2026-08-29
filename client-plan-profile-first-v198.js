'use strict';
(()=>{
  if(window.__unvrslClientPlanProfileFirstV198)return;window.__unvrslClientPlanProfileFirstV198=true;
  const E=v=>typeof window.esc==='function'?window.esc(String(v??'')):String(v??'');
  const N=v=>{const n=Number(v);return Number.isFinite(n)&&n>0?n:null};
  const F=v=>v==null?'—':Number(v).toFixed(1).replace('.0','').replace('.',',');
  const M=[['chest','Грудь'],['waist','Талия'],['abdomen','Живот'],['hips','Ягодицы'],['thigh','Бедро'],['arm','Рука'],['calf','Икра']];
  let cache={at:0,p:null,w:null,m:null,loading:null};
  function isClient(){if(!window.cloud?.user)return false;if(typeof window.unvrslTrainerMode==='function')return !window.unvrslTrainerMode();return window.cloud?.profile?.role!=='trainer'}
  function age(v){if(!v)return null;const d=new Date(v+'T12:00:00'),n=new Date();let a=n.getFullYear()-d.getFullYear();if(n<new Date(n.getFullYear(),d.getMonth(),d.getDate()))a--;return a}
  async function load(force=false){
    if(!isClient()||!window.cloud?.client||!window.cloud?.user)return cache;
    if(cache.loading)return cache.loading;if(!force&&Date.now()-cache.at<15000)return cache;
    cache.loading=(async()=>{const u=window.cloud.user.id;const [p,w,m]=await Promise.all([
      window.cloud.client.from('profiles').select('id,display_name,height_cm,birth_date,sex,target_weight_kg').eq('id',u).maybeSingle(),
      window.cloud.client.from('bodyweights').select('measure_date,weight_kg').eq('user_id',u).order('measure_date',{ascending:false}).limit(1),
      window.cloud.client.from('body_measurements').select('measure_date,measurements').eq('user_id',u).order('measure_date',{ascending:false}).limit(1)
    ]);cache.p=p.data||window.cloud.profile||null;cache.w=w.data?.[0]||null;cache.m=m.data?.[0]||null;cache.at=Date.now();cache.loading=null;return cache})().catch(e=>{cache.loading=null;console.warn('client plan profile',e);return cache});return cache.loading
  }
  function html(){const p=cache.p||window.cloud?.profile||{},w=N(cache.w?.weight_kg),a=age(p.birth_date),mm=cache.m?.measurements||{};const measures=M.map(([k,l])=>[l,N(mm[k])]).filter(x=>x[1]);return `<div class="client-plan-profile-v198"><div class="section">ПРОФИЛЬ И ЗАМЕРЫ</div><div class="card"><div class="row between"><div><div class="title">${E(p.display_name||'Мой профиль')}</div><div class="muted small">${[p.height_cm?F(p.height_cm)+' см':null,a!=null?a+' лет':null,w?F(w)+' кг':null].filter(Boolean).join(' · ')||'Профиль спортсмена'}</div></div><button class="btn" onclick="clientPlanOpenProfile198()">Открыть</button></div>${measures.length?`<div class="cj107-profile" style="margin-top:12px">${measures.map(x=>`<div><span>${x[0]}</span><b>${F(x[1])} см</b></div>`).join('')}</div>`:'<div class="muted small" style="margin-top:12px">Обхваты пока не записаны.</div>'}</div></div>`}
  async function inject(){if(!isClient())return;const root=document.getElementById('plan');if(!root)return;root.querySelector('.client-plan-profile-v198')?.remove();root.insertAdjacentHTML('afterbegin',html());await load();const live=document.getElementById('plan');if(!live)return;live.querySelector('.client-plan-profile-v198')?.remove();live.insertAdjacentHTML('afterbegin',html())}
  window.clientPlanOpenProfile198=async()=>{await load(true);if(typeof window.profileEditSheet==='function')return window.profileEditSheet();if(typeof window.cloudAccountSheet==='function')return window.cloudAccountSheet()};
  function wrap(){const f=window.clientCleanPlanPage;if(typeof f!=='function'||f.__profileFirstV198)return false;const w=function(){const r=f.apply(this,arguments);setTimeout(inject,0);return r};w.__profileFirstV198=true;window.clientCleanPlanPage=w;try{clientCleanPlanPage=w}catch(_){}return true}
  const t=setInterval(()=>{if(wrap())clearInterval(t)},120);setTimeout(()=>clearInterval(t),20000);
  document.addEventListener('click',e=>{if(e.target?.closest?.('.nav button[data-p="plan"]')&&isClient())setTimeout(inject,50)},true);
  [300,1000,2500].forEach(t=>setTimeout(inject,t));
})();