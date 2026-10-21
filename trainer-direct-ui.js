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
  const LEGACY_WEIGHT_CLIENT='4e0b2acf-7482-4698-9111-8573de113490';
  const state={clientId:null,data:null,tab:'overview',planView:null,planWeek:0,progressUi:{},workoutLimit:30,request:0};
  const A=x=>Array.isArray(x)?x:[];
  const E=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const N=v=>{const n=Number(v);return Number.isFinite(n)&&n>0?n:null};
  const F=v=>v==null?'–':Number(v).toFixed(1).replace('.0','').replace('.',',');
  const rd=v=>{if(!v)return'–';const d=new Date(String(v).slice(0,10)+'T12:00:00');return isNaN(d)?String(v):new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',year:'numeric'}).format(d)};
  const clone=v=>JSON.parse(JSON.stringify(v));
  const cleanWeights=(id,rows)=>A(rows).filter(x=>!(String(id)===LEGACY_WEIGHT_CLIENT&&String(x?.measure_date||'').slice(0,10)==='2026-08-25'&&Number(x?.weight_kg)===97.5));

  const css=document.createElement('style');
  css.id='trainer-client-v3-style';
  css.textContent=`
    .tcv3-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.tcv3-name{font-size:30px;font-weight:850;line-height:1.05;overflow-wrap:anywhere}
    .tcv3-tabs{display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:4px;background:#121215;border:1px solid #2b2c31;border-radius:16px;margin:16px 0 12px}.tcv3-tab{border:0;background:transparent;color:#8e8e93;border-radius:12px;padding:11px 8px;font:inherit;font-weight:750}.tcv3-tab.on{background:#2b2c31;color:#f5f5f7}
    .tcv3-list{padding:0!important;overflow:hidden}.tcv3-workout{display:block;width:100%;padding:15px 16px;border:0;border-bottom:1px solid #303034;background:transparent;color:inherit;text-align:left;font:inherit;touch-action:manipulation}.tcv3-workout:last-child{border-bottom:0}.tcv3-workout:active{background:#202024}.tcv3-workout-top{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.tcv3-workout-top b{min-width:0;flex:1;font-size:16px;line-height:1.32;overflow-wrap:anywhere}.tcv3-workout-date{display:flex;align-items:center;gap:8px;white-space:nowrap}.tcv3-chevron{color:#6f7076;font-size:21px;line-height:1}.tcv3-meta{font-size:13px;color:#8e8e93;margin-top:7px;line-height:1.4}
    .tcv3-session-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.tcv3-session-head h2{margin:0;line-height:1.08}.tcv3-session-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:15px 0}.tcv3-session-metric{background:#19191c;border:1px solid #2e3035;border-radius:15px;padding:11px}.tcv3-session-metric span{display:block;color:#8e8e93;font-size:11px}.tcv3-session-metric b{display:block;font-size:19px;margin-top:4px}.tcv3-session-ex{padding:14px 0;border-bottom:1px solid #303034}.tcv3-session-ex:last-child{border-bottom:0}.tcv3-session-ex-name{font-size:16px;font-weight:800;line-height:1.25}.tcv3-set-list{display:grid;gap:7px;margin-top:11px}.tcv3-set-row{display:grid;grid-template-columns:minmax(70px,.8fr) minmax(0,1.5fr);gap:10px;align-items:center;background:#19191c;border:1px solid #2e3035;border-radius:13px;padding:9px 10px}.tcv3-set-row span{color:#8e8e93;font-size:12px}.tcv3-set-values{display:flex;gap:6px 10px;justify-content:flex-end;flex-wrap:wrap;font-size:13px;font-weight:750}.tcv3-set-values i{font-style:normal;white-space:nowrap}.tcv3-session-note{font-size:12px;color:#8e8e93;line-height:1.45;margin-top:7px}
    .tcv3-measure-day{padding:14px 0;border-bottom:1px solid #303034}.tcv3-measure-day:last-child{border-bottom:0}.tcv3-date{font-size:14px;font-weight:800;margin-bottom:10px}.tcv3-measure-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.tcv3-measure{background:#19191c;border:1px solid #2e3035;border-radius:14px;padding:10px;min-width:0}.tcv3-measure span{display:block;color:#8e8e93;font-size:11px}.tcv3-measure b{display:block;font-size:17px;margin-top:4px}
    .tcv3-program{display:grid;grid-template-columns:minmax(0,1fr);gap:10px;align-items:center;padding:13px 0;border-bottom:1px solid #303034}.tcv3-program:last-child{border-bottom:0}.tcv3-program .danger{background:#3a1a1a!important;color:#ff6b63!important}.tcv3-program .muted{margin-top:4px}.tcv3-program-actions{display:flex;align-items:center;gap:7px;flex-wrap:wrap}.tcv3-program>div:first-child{min-width:0;overflow-wrap:anywhere}.tcv3-program-actions .btn{flex:1;min-width:0}.tcv3-tabs{grid-template-columns:repeat(4,minmax(0,1fr))!important}.tcv3-tab{min-width:0;font-size:12px!important;padding:11px 3px!important}.tcv3-program-open{background:#2b2c31!important;color:#f5f5f7!important}
    .tcv3-program-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:18px}.tcv3-program-head .section{margin:0}.tcv3-add{white-space:nowrap}
    .tcv3-plan-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.tcv3-plan-actions{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}.tcv3-plan-weeks{display:flex;gap:7px;overflow:auto;padding:3px 1px 8px;scrollbar-width:none}.tcv3-plan-weeks::-webkit-scrollbar{display:none}.tcv3-plan-week{min-width:48px;padding:10px 12px;border-radius:13px;background:#19191c;border:1px solid #303034;color:#9b9ba0;font-weight:750}.tcv3-plan-week.on{background:var(--accent,var(--green,#30d158));color:#07110a;border-color:transparent}.tcv3-plan-day{padding:14px 0;border-bottom:1px solid #303034}.tcv3-plan-day:last-child{border-bottom:0}.tcv3-plan-day-name{font-size:17px;font-weight:800;margin-bottom:8px}.tcv3-plan-ex{padding:9px 0}.tcv3-plan-ex+.tcv3-plan-ex{border-top:1px solid #28282c}.tcv3-plan-ex b{font-size:14px}.tcv3-plan-ex-meta{color:#8e8e93;font-size:12px;line-height:1.45;margin-top:3px}
    #modal:has(.tcv3-client-header) .modal-close-bar{display:none!important}
    #modal:has(.tcv3-client-header) .sheet{max-height:100%!important;border-radius:24px 24px 0 0!important}
    .tcv3-client-header{position:sticky;top:-22px;z-index:3;margin:-22px -18px 14px;padding:14px 18px;background:var(--panel);border-bottom:1px solid var(--line);border-radius:24px 24px 0 0}
    .tcv3-client-header .sheet-grabber{margin:0 auto 12px!important}
    #modal .tcv3-head>div{min-width:0;flex:1}
    #modal .tcv3-name{font-size:22px!important;line-height:1.2!important;font-weight:800;letter-spacing:-.4px}
    #modal .tcv3-client-header .tcv262-trainer{font-size:12px!important;margin-top:5px!important;font-weight:500!important}
    #modal .tcv3-close[data-modal-close-source]{display:grid!important;place-items:center;flex:0 0 44px;width:44px;height:44px;padding:0;font-size:20px;border:1px solid var(--line);background:var(--panel2);color:var(--text);border-radius:14px}
    #modal:has(.tcv3-client-header) .metric{padding:13px 14px;border-radius:18px}
    #modal:has(.tcv3-client-header) .metric span{font-size:12px}
    #modal:has(.tcv3-client-header) .metric b{font-size:24px;margin-top:4px}
    #modal .tcv3-workout-top b{font-size:15px!important;line-height:1.35!important}
    #modal .tcv3-workout-date{font-size:12px!important;margin-top:8px;white-space:normal}
    .tcv3-workout-program{font-size:12px;color:var(--muted);margin-top:4px;line-height:1.4;overflow-wrap:anywhere}
    #modal .tcv3-meta{font-size:12px!important;margin-top:4px}
    #modal .tcv3-session-head>div{min-width:0;flex:1}
    #modal .tcv3-session-head h2{font-size:21px!important;line-height:1.25!important;overflow-wrap:anywhere}
    @media(max-width:350px){.tcv3-tab{font-size:11px!important}}
    @media(max-width:390px){.tcv3-name{font-size:26px}.tcv3-measure-grid{grid-template-columns:1fr 1fr}.tcv3-program{grid-template-columns:1fr}.tcv3-program-actions{width:100%}.tcv3-program-actions .btn{flex:1}.tcv3-plan-head{display:block}.tcv3-plan-actions{justify-content:flex-start;margin-top:12px}}
  `;
  document.head.appendChild(css);

  async function loadClient(id){
    const c=window.cloud;if(!c?.client||!c?.user)return null;
    const trainerId=c.user.id;
    async function all(table,fields,dateKey){
      const rows=[],size=500;
      for(let offset=0;;offset+=size){
        let query=c.client.from(table).select(fields).eq('user_id',id).order(dateKey,{ascending:false});
        if(table==='workouts')query=query.order('id',{ascending:false});
        const result=await (typeof query.range==='function'?query.range(offset,offset+size-1):query.limit(size));
        if(result.error)return {data:rows,error:result.error};
        const page=A(result.data);rows.push(...page);
        if(page.length<size||typeof query.range!=='function')return{data:rows};
      }
    }
    const [pr,wo,bw,bm,pa]=await Promise.all([
      c.client.from('profiles').select('id,display_name').eq('id',id).maybeSingle(),
      all('workouts','id,external_id,user_id,workout_date,avg_rpe,completed_sets,total_sets,payload,created_at,updated_at','workout_date'),
      all('bodyweights','measure_date,weight_kg','measure_date'),
      all('body_measurements','measure_date,measurements','measure_date'),
      c.client.from('plan_assignments').select('plan_id,version,snapshot,status,assigned_at,plans(title)').eq('trainer_id',trainerId).eq('client_id',id).eq('status','active').order('assigned_at',{ascending:false})
    ]);
    if(window.cloud?.user?.id!==trainerId)return null;
    const d={profile:pr.data||null,workouts:A(wo.data),weights:cleanWeights(id,bw.data),measurements:A(bm.data),plans:A(pa.data),errors:[pr,wo,bw,bm,pa].filter(x=>x.error).length};
    if(window.TrainerClientProgress521){
      d.progress=window.TrainerClientProgress521.build(d,typeof workoutRegistry==='undefined'?window.WorkoutDomain.registry([]):workoutRegistry,window.WorkoutDomain,window.StrengthAnalytics,id);
      d.workouts=d.progress.sessions.slice().reverse().map(x=>({...x.row,avg_rpe:x.rpe,completed_sets:x.done}));
    }
    return d;
  }

  function avgRpe(rows){const a=rows.map(x=>N(x.avg_rpe)).filter(Boolean);return a.length?Math.round(a.reduce((q,x)=>q+x,0)/a.length*10)/10:null}
  function workoutTitle(w){const s=w?.payload||{};return [s.c,s.name].filter(Boolean).join(' · ')||s.name||'Тренировка'}
  function workoutsHtml(d){
    if(!d.workouts.length)return '<div class="card muted">Пока нет проведённых тренировок.</div>';
    return `<div class="card tcv3-list">${d.workouts.slice(0,state.workoutLimit).map((w,i)=>`<button type="button" class="tcv3-workout" onclick="trainerClientWorkoutV3(${i})"><div class="tcv3-workout-top"><b>${E(w.payload?.c||w.payload?.name||'Тренировка')}</b><span class="tcv3-chevron" aria-hidden="true">›</span></div>${w.payload?.c&&w.payload?.name&&w.payload.c!==w.payload.name?`<div class="tcv3-workout-program">${E(w.payload.name)}</div>`:''}<div class="tcv3-workout-date muted">${E(rd(w.workout_date))}</div><div class="tcv3-meta">${w.avg_rpe!=null?'RPE '+E(F(w.avg_rpe)):'RPE не указан'}${w.completed_sets!=null?' · '+E(w.completed_sets)+' подходов':''}</div></button>`).join('')}</div>${d.workouts.length>state.workoutLimit?'<button class="btn full" onclick="trainerClientMoreWorkouts521()">Показать ещё тренировки</button>':''}`;
  }

  function fmtTime(ms){
    const min=Math.max(0,Math.round(Number(ms||0)/60000));
    if(!min)return '–';
    const h=Math.floor(min/60),m=min%60;
    return h?`${h} ч${m?' '+m+' мин':''}`:`${m} мин`;
  }
  function workoutDuration(s){return Number(s?.finalDurationMs||s?.durationMs)||Math.max(0,Number(s?.ended||0)-Number(s?.started||0))}
  function workoutTonnage(s){
    return window.WorkoutDomain.tonnage(s,typeof workoutRegistry==='undefined'?null:workoutRegistry);
  }
  function setValues(x,e){
    const out=[],sec=Number(x?.workSeconds||e?.workSeconds||e?.timedSeconds||0),w=Number(x?.w),r=Number(x?.r);
    if(sec>0)out.push(`${Math.floor(sec/60)?Math.floor(sec/60)+' мин ':''}${sec%60?sec%60+' сек':''}`.trim());
    else{
      if(Number.isFinite(w)&&w>0)out.push(`${F(w)} кг`);
      if(Number.isFinite(r)&&r>0)out.push(`${F(r)} повт.`);
    }
    if(x?.rpe!==''&&x?.rpe!=null&&Number.isFinite(Number(x.rpe)))out.push(`RPE ${F(x.rpe)}`);
    if(x?.rir!==''&&x?.rir!=null&&Number.isFinite(Number(x.rir)))out.push(`RIR ${F(x.rir)}`);
    return out.length?out:['Выполнено'];
  }
  function workoutExercisesHtml(s){
    const rows=A(s?.ex).map(e=>{
      const sets=A(e?.set).filter(x=>x?.ok);if(!sets.length)return'';
      const meta=[];if(e?.method&&e.method!=='STANDARD')meta.push(e.method);if(e?.tempo)meta.push('темп '+e.tempo);if(N(e?.rest))meta.push('отдых '+F(e.rest)+' сек');if(N(e?.target))meta.push('цель RPE '+F(e.target));
      return `<div class="tcv3-session-ex"><div class="tcv3-session-ex-name">${E(e?.n||'Упражнение')}</div>${meta.length?`<div class="tcv3-session-note">${E(meta.join(' · '))}</div>`:''}<div class="tcv3-set-list">${sets.map((x,i)=>`<div class="tcv3-set-row"><span>Подход ${E(x?.n||i+1)}</span><div class="tcv3-set-values">${setValues(x,e).map(v=>`<i>${E(v)}</i>`).join('')}</div></div>`).join('')}</div>${e?.d?`<div class="tcv3-session-note">${E(e.d)}</div>`:''}</div>`;
    }).filter(Boolean).join('');
    return rows||'<div class="card muted">В этой тренировке нет отмеченных подходов.</div>';
  }
  function renderWorkoutView(w){
    const s=w?.payload||{},sets=A(s.ex).reduce((n,e)=>n+A(e?.set).filter(x=>x?.ok).length,0),rpe=w?.avg_rpe??s?.advancedMetrics?.avgRpe,ton=workoutTonnage(s),duration=workoutDuration(s);
    modal(`<div class="sheet-grabber"></div><div class="tcv3-session-head"><div><h2>${E(workoutTitle(w))}</h2><div class="muted" style="margin-top:6px">${E(rd(w?.workout_date||s?.date))}</div></div><button class="btn tiny" onclick="trainerClientWorkoutBackV3()">Назад</button></div><div class="tcv3-session-metrics"><div class="tcv3-session-metric"><span>Подходы</span><b>${E(sets)}</b></div><div class="tcv3-session-metric"><span>Средний RPE</span><b>${rpe!=null?E(F(rpe)):'–'}</b></div><div class="tcv3-session-metric"><span>Тоннаж</span><b>${ton?E(Math.round(ton).toLocaleString('ru-RU'))+' кг':'–'}</b></div><div class="tcv3-session-metric"><span>Длительность</span><b>${E(fmtTime(duration))}</b></div></div><div class="card" style="padding-top:0;padding-bottom:0">${workoutExercisesHtml(s)}</div>`);
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
    return `<div class="card" style="padding-top:0;padding-bottom:0">${d.plans.map(p=>{const t=p.snapshot?.clientTitle||p.snapshot?.program?.name||p.plans?.title||'Программа';return `<div class="tcv3-program"><div><b>${E(t)} · v${p.version||1}</b><div class="muted small">Назначена клиенту</div></div><div class="tcv3-program-actions"><button class="btn tiny" type="button" onclick="trainerClientRenamePlan521('${E(id)}','${E(p.plan_id)}')">Название</button><button class="btn tiny tcv3-program-open" type="button" onclick="trainerClientOpenPlanV3('${E(id)}','${E(p.plan_id)}','${encodeURIComponent(t)}')">Открыть</button><button class="btn tiny danger" type="button" onclick="trainerClientDeletePlanV3('${E(id)}','${E(p.plan_id)}','${encodeURIComponent(t)}')">Удалить</button></div></div>`}).join('')}</div>`;
  }

  const tabs=[['overview','Обзор'],['workouts','Тренировки'],['strength','Силовые'],['measures','Замеры']];
  function bodyHtml(){
    const d=state.data;if(!d)return'';
    if(state.tab==='workouts')return workoutsHtml(d);
    return window.TrainerClientProgress521?window.TrainerClientProgress521.render(d.progress,state.tab,state.progressUi):state.tab==='measures'?measuresHtml(d):workoutsHtml(d);
  }
  function renderSheet(){
    const d=state.data,id=state.clientId;if(!d||!id)return;
    modal(`<div class="tcv3-client-header"><div class="sheet-grabber"></div><div class="tcv3-head"><div><div class="tcv3-name">${E(d.profile?.display_name||'Клиент')}</div></div><button class="btn tiny tcv3-close" aria-label="Закрыть окно" onclick="closeModal()">✕</button></div></div>${d.errors?`<div class="card"><p class="muted small">Часть данных не загрузилась. Статистика может быть неполной.</p><button class="btn full" onclick="trainerClientDetail('${E(id)}')">Повторить загрузку</button></div>`:''}<div class="tcv3-tabs">${tabs.map(([key,label])=>`<button class="tcv3-tab ${state.tab===key?'on':''}" data-client-tab="${key}" onclick="trainerClientTabV3('${key}')">${label}</button>`).join('')}</div><div id="trainerClientTabBodyV3">${bodyHtml()}</div><div class="tcv3-program-head"><div class="section">ПРОГРАММЫ</div><button class="btn tiny tcv3-add" onclick="trainerAssignProgramSheet('${E(id)}')">＋ Отправить программу</button></div>${programsHtml(d,id)}`);
  }
  window.trainerClientMoreWorkouts521=function(){state.workoutLimit+=30;window.trainerClientTabV3('workouts')};
  window.trainerClientProgressSelect521=function(key,value){if(!['strengthKey','strengthMetric','measure'].includes(key))return;state.progressUi[key]=value;const body=document.getElementById('trainerClientTabBodyV3');if(body)body.innerHTML=bodyHtml()};

  function setSummary(s,e){
    const a=A(s);
    if(!a.length)return 'Подходы не заданы';
    const reps=a.map(x=>Number(x?.r)).filter(Number.isFinite);
    const weights=a.map(x=>Number(x?.w)).filter(x=>Number.isFinite(x)&&x>0);
    const divisor=window.WorkoutDomain.planRepDivisor(e),repText=reps.length?`${window.WorkoutDomain.repRangeText(e,{lo:Math.min(...reps)/divisor,hi:Math.max(...reps)/divisor})} повт.`:'повторы не заданы';
    return `${a.length} подх. · ${repText}${weights.length?' · '+window.WorkoutDomain.weightText(e,Math.min(...weights),typeof workoutRegistry==='undefined'?null:workoutRegistry)+(Math.min(...weights)!==Math.max(...weights)?'–'+window.WorkoutDomain.weightText(e,Math.max(...weights),typeof workoutRegistry==='undefined'?null:workoutRegistry):'')+' кг':''}`;
  }

  function renderPlanView(){
    const v=state.planView;if(!v)return;
    const p=v.snapshot?.program||null;
    if(!p)return modal(`<div class="sheet-grabber"></div><div class="tcv3-plan-head"><div><h2>${E(v.title||'Программа')}</h2><div class="muted">Версия ${E(v.version||1)}</div></div><button class="btn tiny" onclick="trainerClientDetail('${E(v.clientId)}')">Назад</button></div><div class="card muted">Снимок программы не найден.</div>`);
    const weeks=A(p.weeks);const wi=Math.max(0,Math.min(state.planWeek,weeks.length-1));state.planWeek=wi;const w=weeks[wi]||{n:1,days:[]};
    const weeksHtml=weeks.length>1?`<div class="tcv3-plan-weeks">${weeks.map((x,i)=>`<button class="tcv3-plan-week ${i===wi?'on':''}" onclick="trainerClientPlanWeekV3(${i})">${E(x.n||i+1)}</button>`).join('')}</div>`:'';
    const daysHtml=A(w.days).length?`<div class="card" style="padding-top:0;padding-bottom:0">${A(w.days).map((d,di)=>`<div class="tcv3-plan-day"><div class="tcv3-plan-day-name">${E(d.name||`День ${di+1}`)}</div>${A(d.ex).map(ex=>`<div class="tcv3-plan-ex"><b>${E(ex.n||'Упражнение')}</b><div class="tcv3-plan-ex-meta">${E(setSummary(ex.sets,ex))}${N(ex.rpe)?' · RPE '+E(ex.rpe):''}${N(ex.rest)?' · отдых '+E(ex.rest)+' сек':''}${ex.tempo?' · темп '+E(ex.tempo):''}</div>${ex.note?`<div class="tcv3-plan-ex-meta">${E(ex.note)}</div>`:''}</div>`).join('')||'<div class="muted small">Упражнений нет.</div>'}</div>`).join('')}</div>`:'<div class="card muted">В этой неделе нет тренировок.</div>';
    modal(`<div class="sheet-grabber"></div><div class="tcv3-plan-head"><div><h2>${E(p.name||v.title||'Программа')}</h2><div class="muted">Версия ${E(v.version||1)}${weeks.length?' · неделя '+E(w.n||wi+1):''}</div></div><div class="tcv3-plan-actions"><button class="btn tiny" onclick="trainerClientDetail('${E(v.clientId)}')">Назад</button><button class="btn tiny primary" onclick="trainerClientEditPlanV3('${E(v.clientId)}','${E(v.planId)}')">Редактировать</button></div></div>${weeksHtml}${daysHtml}`);
  }

  window.trainerClientTabV3=function(tab){if(!tabs.some(([key])=>key===tab))return;state.tab=tab;const el=document.getElementById('trainerClientTabBodyV3');if(el)el.innerHTML=bodyHtml();document.querySelectorAll('[data-client-tab]').forEach(b=>b.classList.toggle('on',b.dataset.clientTab===tab))};
  window.trainerClientWorkoutV3=function(index){const w=A(state.data?.workouts)[Number(index)];if(w)renderWorkoutView(w)};
  window.trainerClientWorkoutBackV3=function(){renderSheet()};

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

  window.trainerClientRenamePlan521=async function(clientId,planId){
    const c=window.cloud;if(!c?.client||!c?.user)return;
    const trainerId=c.user.id;
    const r=await c.client.from('plan_assignments').select('plan_id,version,snapshot,updated_at').eq('trainer_id',trainerId).eq('client_id',clientId).eq('plan_id',planId).eq('status','active').maybeSingle();
    if(r.error||!r.data)return toast('Не удалось загрузить программу');
    if(window.cloud?.user?.id!==trainerId||state.clientId!==clientId)return;
    const current=r.data.snapshot?.clientTitle||r.data.snapshot?.program?.name||state.data?.plans.find(p=>p.plan_id===planId)?.plans?.title||'Программа';
    modal(`<div class="row between"><h2>Название программы</h2><button class="btn tiny" onclick="trainerClientWorkoutBackV3()">Назад</button></div><label class="field">Название у этого клиента<input id="tc521Title" maxlength="100" value="${E(current)}" autocomplete="off"></label><p class="muted small">Название изменится только у этого клиента. История тренировок сохранится.</p><p id="tc521RenameStatus" class="muted small" role="status"></p><button id="tc521RenameSave" class="btn primary full">Сохранить название</button>`);
    document.getElementById('tc521RenameSave').onclick=async function(){
      const name=document.getElementById('tc521Title')?.value.trim(),status=document.getElementById('tc521RenameStatus');
      if(!name||name.length>100){status.textContent='Укажи название от 1 до 100 символов';return}
      if(window.cloud?.user?.id!==trainerId)return;
      this.disabled=true;
      try{
        const snapshot=window.assignmentSnapshotTitle521(r.data.snapshot,r.data.snapshot,name);
        let query=c.client.from('plan_assignments').update({snapshot,updated_at:new Date().toISOString()}).eq('trainer_id',trainerId).eq('client_id',clientId).eq('plan_id',planId).eq('status','active');
        if(r.data.updated_at)query=query.eq('updated_at',r.data.updated_at);
        const saved=await query.select('plan_id,snapshot').maybeSingle();
        if(saved.error||!saved.data)throw Error('Не удалось сохранить. Возможно, программа обновилась. Открой её заново и повтори.');
        if(state.clientId!==clientId||window.cloud?.user?.id!==trainerId)return;
        const local=state.data?.plans.find(p=>p.plan_id===planId);if(local)local.snapshot=snapshot;
        renderSheet();toast('Название сохранено');
      }catch(error){status.textContent=error.message;this.disabled=false}
    };
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
    const request=++state.request;state.clientId=id;state.tab='overview';state.planView=null;state.progressUi={};state.workoutLimit=30;
    modal('<div class="sheet-grabber"></div><div class="card muted">Загружаю клиента…</div>');
    const loaded=await loadClient(id);if(request!==state.request||state.clientId!==id)return;state.data=loaded;
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
