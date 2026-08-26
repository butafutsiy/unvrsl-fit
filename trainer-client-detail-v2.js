'use strict';
(()=>{
  if(window.__unvrslTrainerClientDetailV2)return;
  window.__unvrslTrainerClientDetailV2=true;

  const MEASURES=[
    ['chest','Грудь'],['waist','Талия'],['abdomen','Живот'],['hips','Ягодицы'],
    ['thigh','Бедро'],['arm','Рука'],['calf','Икра']
  ];

  const style=document.createElement('style');
  style.textContent=`
    .tcd2-program{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;padding:14px 0;border-bottom:1px solid #303034}
    .tcd2-program:last-child{border-bottom:0}.tcd2-program .btn{white-space:nowrap}
    .tcd2-measures{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.tcd2-measure{background:#1a1b1e;border:1px solid #303238;border-radius:16px;padding:12px;min-width:0}
    .tcd2-measure span{display:block;color:var(--muted);font-size:12px}.tcd2-measure b{display:block;font-size:20px;margin-top:4px}.tcd2-measure small{display:block;color:#8c8e95;margin-top:3px}.tcd2-positive{color:var(--green)!important}.tcd2-negative{color:#ff9f0a!important}
    .tcd2-history{margin-top:10px}.tcd2-history .history-row{display:grid;grid-template-columns:auto minmax(0,1fr);gap:10px}
    @media(max-width:390px){.tcd2-measures{grid-template-columns:1fr}.tcd2-program{grid-template-columns:1fr}.tcd2-program .btn{width:100%}}
  `;
  document.head.appendChild(style);

  const num=v=>{const x=Number(v);return Number.isFinite(x)&&x>0?x:null};
  const fmt=(v,d=1)=>v==null?'—':Number(v).toFixed(d).replace('.0','');
  function latestPoint(a){return a&&a.length?a[a.length-1]:null}
  function deltaMeta(points,unit){
    if(!points||points.length<2)return '1 замер';
    const first=points[0],last=points[points.length-1],d=+(last.v-first.v).toFixed(1),cls=d<0?'tcd2-negative':'tcd2-positive';
    return points.length+' замеров · <span class="'+cls+'">'+(d>0?'+':'')+fmt(d)+' '+unit+'</span>';
  }
  function metricCard(label,unit,points){
    const last=latestPoint(points);if(!last)return'';
    return '<div class="tcd2-measure"><span>'+label+'</span><b>'+fmt(last.v)+' '+unit+'</b><small>'+deltaMeta(points,unit)+'</small></div>';
  }

  async function loadClientData(id){
    const c=window.cloud;if(!c?.client||!c?.user)return null;
    const trainerId=c.user.id;
    const qProfile=c.client.from('profiles').select('id,display_name').eq('id',id).maybeSingle();
    const qWorkouts=c.client.from('workouts').select('workout_date,avg_rpe,completed_sets,total_sets,payload').eq('user_id',id).order('workout_date',{ascending:false}).limit(30);
    const qWeights=c.client.from('bodyweights').select('measure_date,weight_kg').eq('user_id',id).order('measure_date',{ascending:true}).limit(80);
    const qAssignments=c.client.from('plan_assignments').select('plan_id,version,status,assigned_at,updated_at,plans(title)').eq('client_id',id).eq('trainer_id',trainerId).order('assigned_at',{ascending:false});
    const qCheckins=c.client.from('checkins').select('checkin_date,measurements').eq('user_id',id).order('checkin_date',{ascending:true}).limit(80);
    const [pr,wr,bw,ar,ci]=await Promise.all([qProfile,qWorkouts,qWeights,qAssignments,qCheckins]);
    return {profile:pr.data||null,workouts:wr.data||[],weights:bw.data||[],assignments:ar.data||[],checkins:ci.error?[]:(ci.data||[])};
  }

  function measurementSeries(data){
    const m={weight:(data.weights||[]).map(x=>({d:x.measure_date,v:num(x.weight_kg)})).filter(x=>x.v!=null)};
    for(const [key] of MEASURES)m[key]=(data.checkins||[]).map(x=>({d:x.checkin_date,v:num(x.measurements?.[key])})).filter(x=>x.v!=null);
    return m;
  }

  window.trainerRemoveClientPlan=async function(clientId,planId,titleToken){
    if(!window.cloud?.client||!window.cloud?.user)return;
    const title=decodeURIComponent(titleToken||'Программа');
    if(!confirm('Убрать «'+title+'» у этого клиента?\n\nИстория тренировок, вес и замеры сохранятся.'))return;
    const r=await window.cloud.client.from('plan_assignments').update({status:'revoked',updated_at:new Date().toISOString()})
      .eq('trainer_id',window.cloud.user.id).eq('client_id',clientId).eq('plan_id',planId).eq('status','active');
    if(r.error)return alert('Не удалось убрать программу: '+r.error.message);
    toast('Программа убрана у клиента');
    await window.trainerClientDetail(clientId);
  };

  window.trainerClientDetail=async function(id){
    if(!window.cloud?.user)return;
    const d=await loadClientData(id);if(!d)return;
    const active=d.assignments.filter(a=>a.status==='active');
    const workouts=d.workouts||[];
    const rpes=workouts.map(x=>num(x.avg_rpe)).filter(Boolean);
    const avg=rpes.length?Math.round(rpes.reduce((a,b)=>a+b,0)/rpes.length*10)/10:null;
    const ms=measurementSeries(d);
    const measureCards=[metricCard('Вес','кг',ms.weight),...MEASURES.map(([k,l])=>metricCard(l,'см',ms[k]))].filter(Boolean).join('');
    const programs=active.length?active.map(a=>{
      const title=a.plans?.title||'Программа';
      return '<div class="tcd2-program"><div><b>'+esc(title)+' · v'+(a.version||1)+'</b><div class="muted small">Назначена клиенту</div></div><button class="btn tiny danger" onclick="trainerRemoveClientPlan(\''+id+'\',\''+a.plan_id+'\',\''+encodeURIComponent(title)+'\')">Убрать</button></div>';
    }).join(''):'<div class="muted">У клиента сейчас нет активной программы.</div>';

    modal('<div class="sheet-grabber"></div>'+
      '<div class="detail-title">'+esc(d.profile?.display_name||'Клиент')+'</div>'+
      '<div class="metrics"><div class="metric"><span>Тренировок</span><b>'+workouts.length+'</b></div><div class="metric"><span>Средний RPE</span><b>'+(avg??'—')+'</b></div></div>'+
      '<div class="section">ПРОГРАММЫ КЛИЕНТА</div><div class="card">'+programs+'</div>'+
      '<button class="btn primary full" onclick="trainerAssignProgramSheet(\''+id+'\')">Назначить программу</button>'+
      '<div class="section">ЗАМЕРЫ И ПРОГРЕСС</div>'+
      (measureCards?'<div class="tcd2-measures">'+measureCards+'</div>':'<div class="card muted">Пока нет замеров. Они появятся после чек-ина клиента.</div>')+
      '<div class="section">ПОСЛЕДНИЕ ТРЕНИРОВКИ</div><div class="tcd2-history">'+
      (workouts.length?workouts.slice(0,12).map(w=>'<div class="history-row"><span>'+esc(w.workout_date)+'</span><b>'+esc(w.payload?.c||w.payload?.name||'Тренировка')+(w.avg_rpe!=null?' · RPE '+w.avg_rpe:'')+'</b></div>').join(''):'<div class="muted">Пока нет данных.</div>')+
      '</div>');
  };
  try{trainerClientDetail=window.trainerClientDetail}catch(e){}
})();
