'use strict';
(()=>{
  if(window.__unvrslTrainerDirectUI)return;window.__unvrslTrainerDirectUI=true;

  const css=document.createElement('style');
  css.textContent=`
    #trainerInlineDetail{margin-top:12px}.trainer-direct-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px}
    .trainer-direct-plan{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:13px 0;border-bottom:1px solid #303034}.trainer-direct-plan:last-child{border-bottom:0}
    .trainer-direct-plan .danger{background:#3a1a1a!important;color:#ff6b63!important}.trainer-direct-measures{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.trainer-direct-measures .metric{min-width:0;padding:13px}.trainer-direct-measures .metric b{font-size:20px}
    @media(max-width:390px){.trainer-direct-plan{grid-template-columns:1fr}.trainer-direct-plan .btn{width:100%}.trainer-direct-measures{grid-template-columns:1fr 1fr}}
  `;
  document.head.appendChild(css);

  function clientsRoot(){return document.getElementById('clients')}
  function ensureHost(){
    const root=clientsRoot();if(!root)return null;
    let host=document.getElementById('trainerInlineDetail');if(host)return host;
    host=document.createElement('div');host.id='trainerInlineDetail';
    const list=document.getElementById('clientList'),sent=[...root.querySelectorAll('button')].find(b=>/отправленные планы|готовые планы/i.test(b.textContent||''));
    if(sent)sent.before(host);else if(list)list.after(host);else root.appendChild(host);
    return host;
  }
  function fmt(v,unit=''){const n=Number(v);return Number.isFinite(n)&&n>0?`${n.toFixed(1).replace('.0','')}${unit}`:'—'}
  function latestMeasure(checkins,key){for(let i=checkins.length-1;i>=0;i--){const n=Number(checkins[i]?.measurements?.[key]);if(Number.isFinite(n)&&n>0)return n}return null}

  async function loadClient(id){
    const c=window.cloud;if(!c?.client||!c?.user)return null;
    const [pr,pa,bw,ci,wo]=await Promise.all([
      c.client.from('profiles').select('id,display_name').eq('id',id).maybeSingle(),
      c.client.from('plan_assignments').select('plan_id,version,status,assigned_at,plans(title)').eq('trainer_id',c.user.id).eq('client_id',id).eq('status','active').order('assigned_at',{ascending:false}),
      c.client.from('bodyweights').select('measure_date,weight_kg').eq('user_id',id).order('measure_date',{ascending:true}).limit(80),
      c.client.from('checkins').select('checkin_date,measurements').eq('user_id',id).order('checkin_date',{ascending:true}).limit(80),
      c.client.from('workouts').select('workout_date,avg_rpe').eq('user_id',id).order('workout_date',{ascending:false}).limit(30)
    ]);
    return {profile:pr.data,plans:pa.data||[],weights:bw.data||[],checkins:ci.data||[],workouts:wo.data||[]};
  }

  async function showClient(id){
    const host=ensureHost();if(!host)return;
    host.innerHTML='<div class="card muted">Загружаю клиента…</div>';
    const d=await loadClient(id);if(!d){host.innerHTML='<div class="card muted">Не удалось загрузить клиента.</div>';return}
    const rpes=d.workouts.map(x=>Number(x.avg_rpe)).filter(Number.isFinite),avg=rpes.length?(rpes.reduce((a,b)=>a+b,0)/rpes.length).toFixed(1):'—';
    const lastW=d.weights.length?d.weights[d.weights.length-1].weight_kg:null;
    const mm=[['Грудь','chest'],['Талия','waist'],['Живот','abdomen'],['Ягодицы','hips'],['Бедро','thigh'],['Рука','arm'],['Икра','calf']];
    const measures=[lastW?`<div class="metric"><span>Вес</span><b>${fmt(lastW,' кг')}</b></div>`:'',...mm.map(([l,k])=>{const v=latestMeasure(d.checkins,k);return v?`<div class="metric"><span>${l}</span><b>${fmt(v,' см')}</b></div>`:''})].filter(Boolean).join('');
    const plans=d.plans.length?d.plans.map(p=>`<div class="trainer-direct-plan"><div><b>${esc(p.plans?.title||'Программа')} · v${p.version||1}</b><div class="muted small">Назначена клиенту</div></div><button type="button" class="btn tiny danger" data-remove-plan="${p.plan_id}" data-client="${id}">Удалить</button></div>`).join(''):'<div class="muted">Активных программ нет.</div>';
    host.innerHTML=`<div class="card"><div class="trainer-direct-head"><div><div class="title">${esc(d.profile?.display_name||'Клиент')}</div><div class="muted small">Тренировок: ${d.workouts.length} · средний RPE ${avg}</div></div><button class="btn tiny" type="button" data-close-client>Закрыть</button></div><div class="section">ПРОГРАММЫ</div><div class="card" style="margin:0">${plans}</div><div class="section">ЗАМЕРЫ</div>${measures?`<div class="trainer-direct-measures">${measures}</div>`:'<div class="muted">Пока нет замеров.</div>'}</div>`;
    host.scrollIntoView({behavior:'smooth',block:'start'});
  }

  async function removeClientPlan(clientId,planId){
    if(!confirm('Удалить эту программу у клиента? История тренировок и замеры сохранятся.'))return;
    const c=window.cloud;if(!c?.client||!c?.user)return;
    const r=await c.client.from('plan_assignments').update({status:'revoked',updated_at:new Date().toISOString()}).eq('trainer_id',c.user.id).eq('client_id',clientId).eq('plan_id',planId).eq('status','active');
    if(r.error)return alert('Не удалось удалить программу: '+r.error.message);
    toast('Программа удалена у клиента');await showClient(clientId);
  }

  async function showSentPlans(){
    const host=ensureHost();if(!host)return;
    const c=window.cloud;if(!c?.client||!c?.user){host.innerHTML='<div class="card muted">Войди в тренерский аккаунт.</div>';return}
    host.innerHTML='<div class="card muted">Загружаю готовые планы…</div>';
    const r=await c.client.from('plans').select('id,title,version,created_at,is_active').eq('trainer_id',c.user.id).eq('is_active',true).order('created_at',{ascending:false});
    if(r.error){host.innerHTML=`<div class="card muted">${esc(r.error.message)}</div>`;return}
    const rows=(r.data||[]).map(p=>`<div class="trainer-direct-plan"><div><b>${esc(p.title)}</b><div class="muted small">Версия ${p.version||1}</div></div><button type="button" class="btn tiny" data-new-link="${p.id}" data-title="${encodeURIComponent(p.title)}">Ссылка</button></div>`).join('');
    host.innerHTML=`<div class="card"><div class="trainer-direct-head"><div><div class="title">Мои готовые планы</div><div class="muted small">Здесь только планы, которые можно отправлять клиентам</div></div><button class="btn tiny" type="button" data-close-client>Закрыть</button></div>${rows||'<div class="muted">Планов пока нет.</div>'}</div>`;
    host.scrollIntoView({behavior:'smooth',block:'start'});
  }

  document.addEventListener('click',e=>{
    const root=e.target.closest?.('#clients');if(!root)return;
    const del=e.target.closest?.('[data-remove-plan]');if(del){e.preventDefault();e.stopImmediatePropagation();removeClientPlan(del.dataset.client,del.dataset.removePlan);return}
    const close=e.target.closest?.('[data-close-client]');if(close){e.preventDefault();e.stopImmediatePropagation();document.getElementById('trainerInlineDetail')?.remove();return}
    const link=e.target.closest?.('[data-new-link]');if(link){e.preventDefault();e.stopImmediatePropagation();if(typeof window.trainerNewInvite==='function')window.trainerNewInvite(link.dataset.newLink,link.dataset.title);return}
  },true);

  window.trainerClientDetail=showClient;try{trainerClientDetail=showClient}catch(e){}
  window.trainerPlansSheet=showSentPlans;try{trainerPlansSheet=showSentPlans}catch(e){}
})();
