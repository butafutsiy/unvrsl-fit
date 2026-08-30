'use strict';

// v223: remove the old demo bodyweight seed before it can be synced to a real account.
(()=>{
  if(window.__unvrslLegacyWeightSeedFixV223)return;
  window.__unvrslLegacyWeightSeedFixV223=true;
  try{
    const s=typeof st!=='undefined'?st:window.st;
    if(!s)return;
    const bw=Array.isArray(s.bw)?s.bw:[];
    const one=bw.length===1?bw[0]:null;
    const legacy=one&&String(one.d||'').slice(0,10)==='2026-08-25'&&Number(one.w)===97.5&&!(s.sessions||[]).length&&!s.current&&!s.goal;
    if(!legacy)return;
    s.bw=[];
    try{if(typeof save==='function')save()}catch(e){}
    setTimeout(()=>{try{if(typeof render==='function')render()}catch(e){}},0);
  }catch(e){console.warn('legacy bodyweight seed cleanup',e)}
})();

(()=>{
  if(window.__unvrslTrainerDirectUIV3)return;
  window.__unvrslTrainerDirectUIV3=true;

  const M=[['chest','Грудь'],['waist','Талия'],['abdomen','Живот'],['hips','Ягодицы'],['thigh','Бедро'],['arm','Рука'],['calf','Икра']];
  const state={clientId:null,data:null,tab:'workouts',planView:null,planWeek:0};
  const A=x=>Array.isArray(x)?x:[];
  const E=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const N=v=>{const n=Number(v);return Number.isFinite(n)&&n>0?n:null};
  const F=v=>v==null?'–':Number(v).toFixed(1).replace('.0','').replace('.',',');
  const rd=v=>{if(!v)return'–';const d=new Date(String(v).slice(0,10)+'T12:00:00');return isNaN(d)?String(v):new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',year:'numeric'}).format(d)};
  const clone=v=>JSON.parse(JSON.stringify(v));

  const css=document.createElement('style');
  css.id='trainer-client-v3-style';
  css.textContent=`
    .tcv3-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.tcv3-name{font-size:30px;font-weight:850;line-height:1.05;overflow-wrap:anywhere}
    .tcv3-tabs{display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:4px;background:#121215;border:1px solid #2b2c31;border-radius:16px;margin:16px 0 12px}.tcv3-tab{border:0;background:transparent;color:#8e8e93;border-radius:12px;padding:11px 8px;font:inherit;font-weight:750}.tcv3-tab.on{background:#2b2c31;color:#f5f5f7}
    .tcv3-list{padding:0!important;overflow:hidden}.tcv3-workout{padding:13px 14px;border-bottom:1px solid #303034}.tcv3-workout:last-child{border-bottom:0}.tcv3-workout-top{display:flex;justify-content:space-between;gap:12px;align-items:baseline}.tcv3-workout b{font-size:16px}.tcv3-meta{font-size:12px;color:#8e8e93;margin-top:5px;line-height:1.4}
    .tcv3-measure-day{padding:14px 0;border-bottom:1px solid #303034}.tcv3-measure-day:last-child{border-bottom:0}.tcv3-date{font-size:14px;font-weight:800;margin-bottom:10px}.tcv3-measure-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.tcv3-measure{background:#19191c;border:1px solid #2e3035;border-radius:14px;padding:10px;min-width:0}.tcv3-measure span{display:block;color:#8e8e93;font-size:11px}.tcv3-measure b{display:block;font-size:17px;margin-top:4px}
    .tcv3-program{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:13px 0;border-bottom:1px solid #303034}.tcv3-program:last-child{border-bottom:0}.tcv3-program .danger{background:#3a1a1a!important;color:#ff6b63!important}.tcv3-program .muted{margin-top:4px}.tcv3-program-actions{display:flex;align-items:center;gap:7px}.tcv3-program-open{background:#2b2c31!important;color:#f5f5f7!important}
    .tcv3-program-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:18px}.tcv3-program-head .section{margin:0}.tcv3-add{white-space:nowrap}
    .tcv3-plan-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.tcv3-plan-actions{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}.tcv3-plan-weeks{display:flex;gap:7px;overflow:auto;padding:3px 1px 8px;scrollbar-width:none}.tcv3-plan-weeks::-webkit-scrollbar{display:none}.tcv3-plan-week{min-width:48px;padding:10px 12px;border-radius:13px;background:#19191c;border:1px solid #303034;color:#9b9ba0;font-weight:750}.tcv3-plan-week.on{background:var(--accent,var(--green,#30d158));color:#07110a;border-color:transparent}.tcv3-plan-day{padding:14px 0;border-bottom:1px solid #303034}.tcv3-plan-day:last-child{border-bottom:0}.tcv3-plan-day-name{font-size:17px;font-weight:800;margin-bottom:8px}.tcv3-plan-ex{padding:9px 0}.tcv3-plan-ex+.tcv3-plan-ex{border-top:1px solid #28282c}.tcv3-plan-ex b{font-size:14px}.tcv3-plan-ex-meta{color:#8e8e93;font-size:12px;line-height:1.45;margin-top:3px}
    @media(max-width:390px){.tcv3-name{font-size:26px}.tcv3-measure-grid{grid-template-columns:1fr 1fr}.tcv3-program{grid-template-columns:1fr}.tcv3-program-actions{width:100%}.tcv3-program-actions .btn{flex:1}.tcv3-plan-head{display:block}.tcv3-plan-actions{justify-content:flex-start;margin-top:12px}}
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
    return `<div class="card" style="padding-top:0;padding-bottom:0">${d.plans.map(p=>{const t=p.plans?.title||'Программа';return `<div class="tcv3-program"><div><b>${E(t)} · v${p.version||1}</b><div class="muted small">Назначена клиенту</div></div><div class="tcv3-program-actions"><button class="btn tiny tcv3-program-open" type="button" onclick="trainerClientOpenPlanV3('${E(id)}','${E(p.plan_id)}','${encodeURIComponent(t)}')">Открыть</button><button class="btn tiny danger" type="button" onclick="trainerClientDeletePlanV3('${E(id)}','${E(p.plan_id)}','${encodeURIComponent(t)}')">Удалить</button></div></div>`}).join('')}</div>`;
  }

  function bodyHtml(){
    const d=state.data;if(!d)return'';
    return state.tab==='measures'?measuresHtml(d):workoutsHtml(d);
  }
  function renderSheet(){
    const d=state.data,id=state.clientId;if(!d||!id)return;
    const avg=avgRpe(d.workouts);
    modal(`<div class="sheet-grabber"></div><div class="tcv3-head"><div><div class="tcv3-name">${E(d.profile?.display_name||'Клиент')}</div></div><button class="btn tiny" onclick="closeModal()">✕</button></div><div class="metrics" style="margin-top:14px"><div class="metric"><span>Тренировок</span><b>${d.workouts.length}</b></div><div class="metric"><span>Средний RPE</span><b>${avg??'–'}</b></div></div><div class="tcv3-tabs"><button class="tcv3-tab ${state.tab==='workouts'?'on':''}" onclick="trainerClientTabV3('workouts')">Тренировки</button><button class="tcv3-tab ${state.tab==='measures'?'on':''}" onclick="trainerClientTabV3('measures')">Замеры</button></div><div id="trainerClientTabBodyV3">${bodyHtml()}</div><div class="tcv3-program-head"><div class="section">ПРОГРАММЫ</div><button class="btn tiny tcv3-add" onclick="trainerAssignProgramSheet('${E(id)}')">＋ Программа</button></div>${programsHtml(d,id)}`);
  }

  function setSummary(s){
    const a=A(s);
    if(!a.length)return 'Подходы не заданы';
    const reps=a.map(x=>Number(x?.r)).filter(Number.isFinite);
    const weights=a.map(x=>Number(x?.w)).filter(x=>Number.isFinite(x)&&x>0);
    const repText=reps.length?(Math.min(...reps)===Math.max(...reps)?`${reps[0]} повт.`:`${Math.min(...reps)}–${Math.max(...reps)} повт.`):'повторы не заданы';
    return `${a.length} подх. · ${repText}${weights.length?' · '+F(Math.min(...weights))+(Math.min(...weights)!==Math.max(...weights)?'–'+F(Math.max(...weights)):'')+' кг':''}`;
  }

  function renderPlanView(){
    const v=state.planView;if(!v)return;
    const p=v.snapshot?.program||null;
    if(!p)return modal(`<div class="sheet-grabber"></div><div class="tcv3-plan-head"><div><h2>${E(v.title||'Программа')}</h2><div class="muted">Версия ${E(v.version||1)}</div></div><button class="btn tiny" onclick="trainerClientDetail('${E(v.clientId)}')">Назад</button></div><div class="card muted">Снимок программы не найден.</div>`);
    const weeks=A(p.weeks);const wi=Math.max(0,Math.min(state.planWeek,weeks.length-1));state.planWeek=wi;const w=weeks[wi]||{n:1,days:[]};
    const weeksHtml=weeks.length>1?`<div class="tcv3-plan-weeks">${weeks.map((x,i)=>`<button class="tcv3-plan-week ${i===wi?'on':''}" onclick="trainerClientPlanWeekV3(${i})">${E(x.n||i+1)}</button>`).join('')}</div>`:'';
    const daysHtml=A(w.days).length?`<div class="card" style="padding-top:0;padding-bottom:0">${A(w.days).map((d,di)=>`<div class="tcv3-plan-day"><div class="tcv3-plan-day-name">${E(d.name||`День ${di+1}`)}</div>${A(d.ex).map(ex=>`<div class="tcv3-plan-ex"><b>${E(ex.n||'Упражнение')}</b><div class="tcv3-plan-ex-meta">${E(setSummary(ex.sets))}${N(ex.rpe)?' · RPE '+E(ex.rpe):''}${N(ex.rest)?' · отдых '+E(ex.rest)+' сек':''}${ex.tempo?' · темп '+E(ex.tempo):''}</div>${ex.note?`<div class="tcv3-plan-ex-meta">${E(ex.note)}</div>`:''}</div>`).join('')||'<div class="muted small">Упражнений нет.</div>'}</div>`).join('')}</div>`:'<div class="card muted">В этой неделе нет тренировок.</div>';
    modal(`<div class="sheet-grabber"></div><div class="tcv3-plan-head"><div><h2>${E(p.name||v.title||'Программа')}</h2><div class="muted">Версия ${E(v.version||1)}${weeks.length?' · неделя '+E(w.n||wi+1):''}</div></div><div class="tcv3-plan-actions"><button class="btn tiny" onclick="trainerClientDetail('${E(v.clientId)}')">Назад</button><button class="btn tiny primary" onclick="trainerClientEditPlanV3('${E(v.clientId)}','${E(v.planId)}')">Редактировать</button></div></div>${weeksHtml}${daysHtml}`);
  }

  window.trainerClientTabV3=function(tab){state.tab=tab==='measures'?'measures':'workouts';const el=document.getElementById('trainerClientTabBodyV3');if(el)el.innerHTML=bodyHtml();document.querySelectorAll('.tcv3-tab').forEach(b=>b.classList.toggle('on',(b.textContent||'').trim()===(state.tab==='measures'?'Замеры':'Тренировки')))};

  window.trainerClientOpenPlanV3=async function(clientId,planId,titleToken){
    const c=window.cloud;if(!c?.client||!c?.user)return;
    const title=decodeURIComponent(titleToken||'Программа');
    modal('<div class="sheet-grabber"></div><div class="card muted">Загружаю программу…</div>');
    const r=await c.client.from('plan_assignments').select('plan_id,version,snapshot,status').eq('trainer_id',c.user.id).eq('client_id',clientId).eq('plan_id',planId).eq('status','active').maybeSingle();
    if(r.error||!r.data)return modal(`<div class="sheet-grabber"></div><div class="card muted">Не удалось загрузить программу.</div><button class="btn full" onclick="trainerClientDetail('${E(clientId)}')">Назад</button>`);
    state.planView={clientId,planId,title,version:r.data.version||1,snapshot:r.data.snapshot};state.planWeek=0;renderPlanView();
  };

  window.trainerClientPlanWeekV3=function(i){state.planWeek=Math.max(0,Number(i)||0);renderPlanView()};

  window.trainerClientEditPlanV3=async function(clientId,planId){
    const c=window.cloud;if(!c?.client||!c?.user)return;
    if(typeof openProgramEditor!=='function'||typeof ensureProgramShape!=='function')return typeof toast==='function'&&toast('Редактор программы ещё загружается');
    const [master,uses]=await Promise.all([
      c.client.from('plans').select('id,title,version,snapshot').eq('id',planId).eq('trainer_id',c.user.id).maybeSingle(),
      c.client.from('plan_assignments').select('client_id').eq('trainer_id',c.user.id).eq('plan_id',planId).eq('status','active')
    ]);
    if(master.error||!master.data?.snapshot?.program)return alert('Не удалось открыть программу для редактирования');
    const count=A(uses.data).length;
    if(count>1&&!confirm(`Эта программа назначена ${count} клиентам. После «Обновить клиентам» изменения получат все. Открыть редактор?`))return;
    const remote=master.data;
    st.programs=A(st.programs);
    let p=st.programs.find(x=>String(x?.cloudPlanId||'')===String(planId));
    if(!p){
      p=clone(remote.snapshot.program);
      p.id=typeof uid==='function'?uid('prog'):`prog-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
      p.cloudPlanId=planId;p.cloudVersion=remote.version||1;p.trainerId=c.user.id;p.created=p.created||Date.now();p.updated=Date.now();
      ensureProgramShape(p);st.programs.push(p);try{if(typeof save==='function')save()}catch(e){}
    }else if(Number(remote.version||1)>Number(p.cloudVersion||0)){
      const keepId=p.id,created=p.created;
      const fresh=clone(remote.snapshot.program);Object.keys(p).forEach(k=>delete p[k]);Object.assign(p,fresh,{id:keepId,cloudPlanId:planId,cloudVersion:remote.version||1,trainerId:c.user.id,created:created||Date.now(),updated:Date.now()});
      ensureProgramShape(p);try{if(typeof save==='function')save()}catch(e){}
    }
    closeModal();openProgramEditor(p.id);
  };

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
    state.clientId=id;state.tab='workouts';state.planView=null;
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
