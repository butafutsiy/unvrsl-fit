'use strict';
(()=>{
  if(window.__unvrslTrainerDirectUIV3)return;
  window.__unvrslTrainerDirectUIV3=true;

  const M=[['chest','Грудь'],['waist','Талия'],['abdomen','Живот'],['hips','Ягодицы'],['thigh','Бедро'],['arm','Рука'],['calf','Икра']];
  const state={clientId:null,data:null,tab:'workouts'};
  const A=x=>Array.isArray(x)?x:[];
  const E=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const N=v=>{const n=Number(v);return Number.isFinite(n)&&n>0?n:null};
  const F=v=>v==null?'—':Number(v).toFixed(1).replace('.0','').replace('.',',');
  const rd=v=>{if(!v)return'—';const d=new Date(String(v).slice(0,10)+'T12:00:00');return isNaN(d)?String(v):new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',year:'numeric'}).format(d)};

  const css=document.createElement('style');
  css.id='trainer-client-v3-style';
  css.textContent=`
    .tcv3-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.tcv3-name{font-size:30px;font-weight:850;line-height:1.05;overflow-wrap:anywhere}
    .tcv3-tabs{display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:4px;background:#121215;border:1px solid #2b2c31;border-radius:16px;margin:16px 0 12px}.tcv3-tab{border:0;background:transparent;color:#8e8e93;border-radius:12px;padding:11px 8px;font:inherit;font-weight:750}.tcv3-tab.on{background:#2b2c31;color:#f5f5f7}
    .tcv3-list{padding:0!important;overflow:hidden}.tcv3-workout{padding:13px 14px;border-bottom:1px solid #303034}.tcv3-workout:last-child{border-bottom:0}.tcv3-workout-top{display:flex;justify-content:space-between;gap:12px;align-items:baseline}.tcv3-workout b{font-size:16px}.tcv3-meta{font-size:12px;color:#8e8e93;margin-top:5px;line-height:1.4}
    .tcv3-measure-day{padding:14px 0;border-bottom:1px solid #303034}.tcv3-measure-day:last-child{border-bottom:0}.tcv3-date{font-size:14px;font-weight:800;margin-bottom:10px}.tcv3-measure-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.tcv3-measure{background:#19191c;border:1px solid #2e3035;border-radius:14px;padding:10px;min-width:0}.tcv3-measure span{display:block;color:#8e8e93;font-size:11px}.tcv3-measure b{display:block;font-size:17px;margin-top:4px}
    .tcv3-program{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:13px 0;border-bottom:1px solid #303034}.tcv3-program:last-child{border-bottom:0}.tcv3-program .danger{background:#3a1a1a!important;color:#ff6b63!important}.tcv3-program .muted{margin-top:4px}
    .tcv3-program-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:18px}.tcv3-program-head .section{margin:0}.tcv3-add{white-space:nowrap}
    @media(max-width:390px){.tcv3-name{font-size:26px}.tcv3-measure-grid{grid-template-columns:1fr 1fr}.tcv3-program{grid-template-columns:1fr}.tcv3-program .btn{width:100%}}
  `;
  document.head.appendChild(css);

  async function loadClient(id){
    const c=window.cloud;if(!c?.client||!c?.user)return null;
    const [pr,wo,bw,bm,pa]=await Promise.all([
      c.client.from('profiles').select('id,display_name').eq('id',id).maybeSingle(),
      c.client.from('workouts').select('id,workout_date,avg_rpe,completed_sets,total_sets,payload').eq('user_id',id).order('workout_date',{ascending:false}).limit(100),
      c.client.from('bodyweights').select('measure_date,weight_kg').eq('user_id',id).order('measure_date',{ascending:false}).limit(100),
      c.client.from('body_measurements').select('measure_date,measurements').eq('user_id',id).order('measure_date',{ascending:false}).limit(100),
      c.client.from('plan_assignments').select('plan_id,version,status,assigned_at,plans(title)').eq('trainer_id',c.user.id).eq('client_id',id).eq('status','active').order('assigned_at',{ascending:false})
    ]);
    return {profile:pr.data||null,workouts:A(wo.data),weights:A(bw.data),measurements:A(bm.data),plans:A(pa.data)};
  }

  function avgRpe(rows){const a=rows.map(x=>N(x.avg_rpe)).filter(Boolean);return a.length?Math.round(a.reduce((q,x)=>q+x,0)/a.length*10)/10:null}
  function workoutTitle(w){const s=w?.payload||{};return [s.c,s.name].filter(Boolean).join(' · ')||s.name||'Тренировка'}
  function workoutsHtml(d){
    if(!d.workouts.length)return '<div class="card muted">Пока нет проведённых тренировок.</div>';
    return `<div class="card tcv3-list">${d.workouts.slice(0,30).map(w=>`<div class="tcv3-workout"><div class="tcv3-workout-top"><b>${E(workoutTitle(w))}</b><span class="muted small">${E(rd(w.workout_date))}</span></div><div class="tcv3-meta">${w.avg_rpe!=null?'Средний RPE '+E(w.avg_rpe):'RPE не указан'}${w.completed_sets!=null?' · '+E(w.completed_sets)+' подходов':''}</div></div>`).join('')}</div>`;
  }

  function measurementDays(d){
    const map=new Map();
    d.weights.forEach(x=>{const k=String(x.measure_date||'').slice(0,10);if(!k)return;const v=map.get(k)||{date:k,m:{}};v.weight=N(x.weight_kg);map.set(k,v)});
    d.measurements.forEach(x=>{const k=String(x.measure_date||'').slice(0,10);if(!k)return;const v=map.get(k)||{date:k,m:{}};v.m={...(v.m||{}),...(x.measurements||{})};map.set(k,v)});
    return [...map.values()].sort((a,b)=>String(b.date).localeCompare(String(a.date)));
  }
  function measuresHtml(d){
    const days=measurementDays(d);
    if(!days.length)return '<div class="card muted">Пока нет замеров.</div>';
    return `<div class="card" style="padding-top:0;padding-bottom:0">${days.map(x=>{
      const cells=[];
      if(x.weight)cells.push(`<div class="tcv3-measure"><span>Вес</span><b>${F(x.weight)} кг</b></div>`);
      M.forEach(([k,l])=>{const v=N(x.m?.[k]);if(v)cells.push(`<div class="tcv3-measure"><span>${l}</span><b>${F(v)} см</b></div>`)});
      return cells.length?`<div class="tcv3-measure-day"><div class="tcv3-date">${E(rd(x.date))}</div><div class="tcv3-measure-grid">${cells.join('')}</div></div>`:'';
    }).join('')}</div>`;
  }
  function programsHtml(d,id){
    if(!d.plans.length)return '<div class="card muted">У клиента сейчас нет активных программ.</div>';
    return `<div class="card" style="padding-top:0;padding-bottom:0">${d.plans.map(p=>{const t=p.plans?.title||'Программа';return `<div class="tcv3-program"><div><b>${E(t)} · v${p.version||1}</b><div class="muted small">Назначена клиенту</div></div><button class="btn tiny danger" type="button" onclick="trainerClientDeletePlanV3('${E(id)}','${E(p.plan_id)}','${encodeURIComponent(t)}')">Удалить</button></div>`}).join('')}</div>`;
  }

  function bodyHtml(){
    const d=state.data;if(!d)return'';
    return state.tab==='measures'?measuresHtml(d):workoutsHtml(d);
  }
  function renderSheet(){
    const d=state.data,id=state.clientId;if(!d||!id)return;
    const avg=avgRpe(d.workouts);
    modal(`<div class="sheet-grabber"></div><div class="tcv3-head"><div><div class="tcv3-name">${E(d.profile?.display_name||'Клиент')}</div></div><button class="btn tiny" onclick="closeModal()">✕</button></div><div class="metrics" style="margin-top:14px"><div class="metric"><span>Тренировок</span><b>${d.workouts.length}</b></div><div class="metric"><span>Средний RPE</span><b>${avg??'—'}</b></div></div><div class="tcv3-tabs"><button class="tcv3-tab ${state.tab==='workouts'?'on':''}" onclick="trainerClientTabV3('workouts')">Тренировки</button><button class="tcv3-tab ${state.tab==='measures'?'on':''}" onclick="trainerClientTabV3('measures')">Замеры</button></div><div id="trainerClientTabBodyV3">${bodyHtml()}</div><div class="tcv3-program-head"><div class="section">ПРОГРАММЫ</div><button class="btn tiny tcv3-add" onclick="trainerAssignProgramSheet('${E(id)}')">＋ Программа</button></div>${programsHtml(d,id)}`);
  }

  window.trainerClientTabV3=function(tab){state.tab=tab==='measures'?'measures':'workouts';const el=document.getElementById('trainerClientTabBodyV3');if(el)el.innerHTML=bodyHtml();document.querySelectorAll('.tcv3-tab').forEach(b=>b.classList.toggle('on',(b.textContent||'').trim()===(state.tab==='measures'?'Замеры':'Тренировки')))};

  window.trainerClientDeletePlanV3=async function(clientId,planId,titleToken){
    const c=window.cloud;if(!c?.client||!c?.user)return;
    const title=decodeURIComponent(titleToken||'Программа');
    if(!confirm(`Удалить «${title}» у клиента?\n\nТренировки, вес и замеры сохранятся.`))return;
    const r=await c.client.from('plan_assignments').update({status:'revoked',updated_at:new Date().toISOString()}).eq('trainer_id',c.user.id).eq('client_id',clientId).eq('plan_id',planId).eq('status','active');
    if(r.error)return alert('Не удалось удалить программу: '+r.error.message);
    state.data=await loadClient(clientId);renderSheet();if(typeof toast==='function')toast('Программа удалена у клиента');
  };

  window.trainerClientDetail=async function(id){
    const c=window.cloud;if(!c?.client||!c?.user)return typeof toast==='function'&&toast('Войди в аккаунт тренера');
    state.clientId=id;state.tab='workouts';
    modal('<div class="sheet-grabber"></div><div class="card muted">Загружаю клиента…</div>');
    state.data=await loadClient(id);
    if(!state.data)return modal('<div class="sheet-grabber"></div><div class="card muted">Не удалось загрузить клиента.</div>');
    renderSheet();
  };
  try{trainerClientDetail=window.trainerClientDetail}catch(e){}

  async function showSentPlans(){
    const c=window.cloud;if(!c?.client||!c?.user)return;
    const r=await c.client.from('plans').select('id,title,version,created_at,is_active').eq('trainer_id',c.user.id).eq('is_active',true).order('created_at',{ascending:false});
    const rows=A(r.data);
    modal(`<div class="sheet-grabber"></div><div class="row between"><div><h2>Мои готовые планы</h2><div class="muted">Планы для отправки клиентам</div></div><button class="btn tiny" onclick="closeModal()">✕</button></div><div class="card" style="margin-top:14px">${rows.length?rows.map(p=>`<div class="tcv3-program"><div><b>${E(p.title)}</b><div class="muted small">Версия ${p.version||1}</div></div><button class="btn tiny" onclick="trainerNewInvite('${p.id}','${encodeURIComponent(p.title)}')">Ссылка</button></div>`).join(''):'<div class="muted">Планов пока нет.</div>'}</div>`);
  }
  window.trainerPlansSheet=showSentPlans;try{trainerPlansSheet=showSentPlans}catch(e){}
})();
