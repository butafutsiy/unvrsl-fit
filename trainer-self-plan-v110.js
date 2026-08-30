'use strict';
(()=>{
  if(window.__trainerSelfPlanV110)return;
  window.__trainerSelfPlanV110=true;

  const M=[['chest','Грудь'],['waist','Талия'],['abdomen','Живот'],['hips','Ягодицы'],['thigh','Бедро'],['arm','Рука'],['calf','Икра']];
  const C={at:0,rows:[],ms:[],bw:[],p:null,loading:null};
  const A=x=>Array.isArray(x)?x:[];
  const N=v=>{const n=Number(v);return Number.isFinite(n)&&n>0?n:null};
  const E=v=>typeof esc==='function'?esc(String(v??'')):String(v??'');
  const F=v=>v==null?'—':Number(v).toFixed(1).replace('.0','').replace('.',',');
  const isTrainer=()=>!!window.cloud?.user&&((typeof window.unvrslTrainerMode==='function'&&window.unvrslTrainerMode())||window.cloud?.profile?.role==='trainer');
  const done=s=>A(s?.ex).reduce((n,e)=>n+A(e?.set).filter(x=>x?.ok).length,0);
  const cardio=e=>/^(cardio|time|timer)$/i.test(String(e?.mode||e?.kind||''))||String(e?.kind||'').toLowerCase()==='cardio';
  const title=s=>[s?.c,s?.name].filter(Boolean).join(' · ')||s?.name||'Тренировка';
  const key=r=>String(r?.id||r?.external_id||r?.payload?.id||'');
  const date=(s,r)=>r?.workout_date||s?.date||new Date(s?.ended||s?.started||Date.now()).toISOString().slice(0,10);
  const rd=v=>{const d=new Date(v+'T12:00:00');return isNaN(d)?v:new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',year:'numeric'}).format(d)};
  const deleted=()=>new Set(A(window.st?.deletedSessionIds).map(String));

  function ton(s){
    return Math.round(A(s?.ex).reduce((a,e)=>a+(cardio(e)?0:A(e?.set).reduce((q,x)=>q+(x?.ok&&N(x.w)&&N(x.r)?Number(x.w)*Number(x.r):0),0)),0));
  }
  function rpe(s){
    const a=[];A(s?.ex).forEach(e=>A(e?.set).forEach(x=>{const n=Number(x?.rpe);if(x?.ok&&x?.rpe!==''&&Number.isFinite(n)&&n>0)a.push(n)}));
    return a.length?Math.round(a.reduce((q,x)=>q+x,0)/a.length*10)/10:null;
  }
  function durationMs(s){
    if(Number(s?.finalDurationMs)>0)return Number(s.finalDurationMs);
    if(Number(s?.durationMs)>0)return Number(s.durationMs);
    if(s?.started&&s?.ended)return Math.max(0,Number(s.ended)-Number(s.started));
    return 0;
  }
  function durationText(s){
    const ms=durationMs(s);
    if(typeof window.unvrslDurationText==='function')return window.unvrslDurationText(ms);
    const t=Math.floor(ms/1000),h=Math.floor(t/3600),m=Math.floor((t%3600)/60),sec=t%60,p=n=>String(n).padStart(2,'0');
    return h?`${h}:${p(m)}:${p(sec)}`:`${p(m)}:${p(sec)}`;
  }

  async function waitCloud(){
    for(let i=0;i<80;i++){
      if(window.cloud?.client&&window.cloud?.user)return window.cloud;
      await new Promise(r=>setTimeout(r,100));
    }
    return window.cloud||null;
  }

  async function load(force=false){
    if(!isTrainer())return C;
    const c=await waitCloud();if(!c?.client||!c?.user)return C;
    if(C.loading)return C.loading;
    if(!force&&Date.now()-C.at<12000)return C;
    C.loading=(async()=>{
      const u=c.user.id,d=deleted();
      const [w,m,b,p]=await Promise.all([
        c.client.from('workouts').select('id,external_id,workout_date,payload,avg_rpe,completed_sets').eq('user_id',u).order('workout_date',{ascending:false}).limit(100),
        c.client.from('body_measurements').select('id,measure_date,measurements').eq('user_id',u).order('measure_date',{ascending:false}).limit(100),
        c.client.from('bodyweights').select('measure_date,weight_kg').eq('user_id',u).order('measure_date',{ascending:false}).limit(100),
        c.client.from('profiles').select('id,display_name,height_cm,birth_date,sex,target_weight_kg').eq('id',u).maybeSingle()
      ]);
      const remote=A(w.data).filter(x=>{const s=x.payload||{},id=String(x.external_id||s.id||'');return s.ended&&done(s)>0&&!d.has(id)});
      const seen=new Set(remote.map(x=>String(x.external_id||x.payload?.id||'')));
      const local=A(window.st?.sessions).filter(s=>s?.ended&&done(s)>0&&!d.has(String(s.id))&&!seen.has(String(s.id))).map(s=>({external_id:String(s.id),workout_date:date(s),payload:s,localOnly:true}));
      C.rows=[...remote,...local].sort((a,b)=>Number(b.payload?.ended||Date.parse(b.workout_date)||0)-Number(a.payload?.ended||Date.parse(a.workout_date)||0));
      C.ms=A(m.data).filter(x=>Object.keys(x.measurements||{}).length);
      C.bw=A(b.data);C.p=p.data||c.profile||null;C.at=Date.now();C.loading=null;return C;
    })().catch(e=>{C.loading=null;console.warn('trainer self plan',e);return C});
    return C.loading;
  }

  const lm=()=>C.ms[0]||null;
  const lw=()=>N(C.bw[0]?.weight_kg)||(typeof latestW==='function'?N(latestW()):null);
  const age=v=>{if(!v)return null;const d=new Date(v+'T12:00:00'),n=new Date();let a=n.getFullYear()-d.getFullYear();if(n<new Date(n.getFullYear(),d.getMonth(),d.getDate()))a--;return a};
  function measures(){
    const m=lm()?.measurements||{},v=M.map(([k,l])=>[l,N(m[k])]).filter(x=>x[1]);
    return v.length?`<div class="cj107-profile">${v.map(x=>`<div><span>${x[0]}</span><b>${F(x[1])} см</b></div>`).join('')}</div>`:'<div class="muted" style="margin-top:10px">Обхваты пока не записаны.</div>';
  }
  function row(r){
    const s=r.payload||{};
    return `<button class="cj107-row" onclick="trainerSelfWorkout110('${encodeURIComponent(key(r))}')"><div><b>${E(title(s))}</b><div class="cj107-meta">${E(rd(date(s,r)))} · ${ton(s).toLocaleString('ru-RU')} кг · RPE ${rpe(s)??'—'} · ${done(s)} сет.</div></div><span class="cj107-chev">›</span></button>`;
  }

  async function renderSelf(force=false){
    if(!isTrainer())return;
    const root=document.getElementById('plan');if(!root)return;
    await load(force);
    let profile=root.querySelector('.trainer-self-profile-v111');
    if(!profile){profile=document.createElement('div');profile.className='cj107 trainer-self-profile-v111';root.prepend(profile)}
    let history=root.querySelector('.trainer-self-plan-v110');
    if(!history){history=document.createElement('div');history.className='cj107 trainer-self-plan-v110';root.appendChild(history)}
    const p=C.p||{},w=lw(),a=age(p.birth_date);
    profile.innerHTML=`<div class="section">ПРОФИЛЬ И ЗАМЕРЫ</div><div class="card"><div class="row between"><div><div class="title">${E(p.display_name||'Мой профиль')}</div><div class="muted small">${[p.height_cm?F(p.height_cm)+' см':null,a!=null?a+' лет':null,w?F(w)+' кг':null].filter(Boolean).join(' · ')||'Профиль спортсмена'}</div></div><button class="btn" onclick="trainerSelfProfile110()">Открыть</button></div>${measures()}<div class="cj107-actions"><button class="btn primary" onclick="trainerSelfMeasure110()">＋ Записать замеры</button><button class="btn" onclick="trainerSelfProfile110()">Профиль</button></div></div>`;
    history.innerHTML=`<div class="section">ПРОВЕДЁННЫЕ ТРЕНИРОВКИ</div><div class="card cj107-list">${C.rows.length?C.rows.slice(0,20).map(row).join(''):'<div class="muted" style="padding:15px">После завершения тренировки она появится здесь.</div>'}</div>`;
  }
  window.trainerSelfPlanRender110=renderSelf;
  const find=t=>C.rows.find(r=>key(r)===decodeURIComponent(t||''));
  function exline(e){
    const a=A(e.set).filter(x=>x.ok);
    if(cardio(e))return a.map(x=>{const sec=Number(x.workSeconds||x.timedSeconds||e.workSeconds||0);return sec?`${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`:'выполнено'}).join(' · ');
    return a.map(x=>`${F(N(x.w)||0)}×${N(x.r)||0}${x.rpe!==''&&x.rpe!=null?' @'+x.rpe:''}`).join(' · ');
  }

  window.trainerSelfWorkout110=async token=>{
    await load();const r=find(token);if(!r)return;const s=r.payload||{};
    modal(`<div class="sheet-grabber"></div><div class="row between"><div><h2>${E(title(s))}</h2><div class="muted">${E(rd(date(s,r)))}</div></div><button class="btn tiny" onclick="closeModal()">✕</button></div><div class="cj107-grid"><div class="cj107-metric"><span>Тоннаж</span><b>${ton(s).toLocaleString('ru-RU')} кг</b></div><div class="cj107-metric"><span>Средний RPE</span><b>${rpe(s)??'—'}</b></div><div class="cj107-metric"><span>Подходов</span><b>${done(s)}</b></div><div class="cj107-metric"><span>Время</span><b>${durationText(s)||'—'}</b></div></div><div class="section">УПРАЖНЕНИЯ</div><div class="card">${A(s.ex).map(e=>{const x=exline(e);return x?`<div class="cj107-ex"><b>${E(typeof displayExerciseName==='function'?displayExerciseName(typeof baseExerciseName==='function'?baseExerciseName(e.n):e.n):e.n)}</b><div class="cj107-set">${E(x)}</div></div>`:''}).join('')}</div><div class="cj107-actions"><button class="btn primary" onclick="trainerSelfShare110('${encodeURIComponent(key(r))}')">Поделиться</button><button class="btn danger" onclick="trainerSelfDelete110('${encodeURIComponent(key(r))}')">Удалить тренировку</button></div>`);
  };

  window.trainerSelfShare110=async token=>{
    await load();const r=find(token);if(!r)return;const s=r.payload||{};
    if(typeof window.advShareWorkout==='function'&&A(window.st?.sessions).some(x=>String(x.id)===String(s.id))){window.advShareWorkout(s.id);return}
    const text=[`UNVRSL FIT · ${title(s)}`,rd(date(s,r)),`Время: ${durationText(s)}`,`Тоннаж: ${ton(s).toLocaleString('ru-RU')} кг`,`Средний RPE: ${rpe(s)??'—'}`,`Рабочих подходов: ${done(s)}`].join('\n');
    try{if(navigator.share)await navigator.share({title:'UNVRSL FIT',text});else{await navigator.clipboard.writeText(text);toast('Результат скопирован')}}catch(e){}
  };

  window.trainerSelfDelete110=async token=>{
    await load();const r=find(token);if(!r)return;const s=r.payload||{},id=String(r.external_id||s.id||'');
    if(!confirm(`Удалить «${title(s)}» за ${rd(date(s,r))}?\n\nОна исчезнет из истории и статистики.`))return;
    const c=await waitCloud();if(!c?.client||!c?.user)return;
    if(r.id){const q=await c.client.from('workouts').delete().eq('user_id',c.user.id).eq('id',r.id);if(q.error)return alert(q.error.message)}
    window.st.deletedSessionIds=A(window.st.deletedSessionIds);if(id&&!window.st.deletedSessionIds.map(String).includes(id))window.st.deletedSessionIds.push(id);
    window.st.sessions=A(window.st.sessions).filter(x=>String(x.id)!==id);if(window.st.current&&String(window.st.current.id)===id)window.st.current=null;
    if(typeof save==='function')save();
    await c.client.from('user_app_state').upsert({user_id:c.user.id,state:window.st,client_updated_at:new Date().toISOString()},{onConflict:'user_id'});
    C.at=0;closeModal();await renderSelf(true);toast('Тренировка удалена');
  };

  window.trainerSelfProfile110=async()=>{
    await load(true);const p=C.p||{},w=lw(),a=age(p.birth_date),m=lm();
    modal(`<div class="sheet-grabber"></div><div class="row between"><div><h2>${E(p.display_name||'Мой профиль')}</h2><div class="muted">Профиль спортсмена</div></div><button class="btn tiny" onclick="closeModal()">✕</button></div><div class="cj107-grid"><div class="cj107-metric"><span>Рост</span><b>${p.height_cm?F(p.height_cm)+' см':'—'}</b></div><div class="cj107-metric"><span>Вес</span><b>${w?F(w)+' кг':'—'}</b></div><div class="cj107-metric"><span>Возраст</span><b>${a??'—'}</b></div><div class="cj107-metric"><span>Цель</span><b>${p.target_weight_kg?F(p.target_weight_kg)+' кг':'—'}</b></div></div><div class="section">ОБХВАТЫ</div><div class="card">${measures()}${m?`<div class="muted small" style="margin-top:9px">${E(rd(m.measure_date))}</div>`:''}</div><div class="cj107-actions"><button class="btn primary" onclick="trainerSelfMeasure110()">Обновить замеры</button><button class="btn" onclick="typeof profileEditSheet==='function'?profileEditSheet():closeModal()">Изменить профиль</button></div>`);
  };

  window.trainerSelfMeasure110=async()=>{
    await load();const m=lm()?.measurements||{},w=lw();
    modal(`<div class="sheet-grabber"></div><h2>Записать замеры</h2><div class="field"><label>Дата</label><input id="ts110Date" type="date" value="${new Date().toISOString().slice(0,10)}"></div><div class="field"><label>Вес, кг</label><input id="ts110Weight" type="number" inputmode="decimal" step="0.1" value="${w||''}"></div><div class="cj107-fields">${M.map(([k,l])=>`<div class="field"><label>${l}, см</label><input id="ts110_${k}" type="number" inputmode="decimal" step="0.1" value="${m[k]??''}"></div>`).join('')}</div><button class="btn primary full" style="margin-top:14px" onclick="trainerSelfSaveMeasure110()">Сохранить замеры</button>`);
  };

  window.trainerSelfSaveMeasure110=async()=>{
    const c=await waitCloud();if(!c?.client||!c?.user)return;
    const u=c.user.id,d=document.getElementById('ts110Date')?.value||new Date().toISOString().slice(0,10),m={};
    for(const[k]of M){const v=N(String(document.getElementById('ts110_'+k)?.value||'').replace(',','.'));if(v)m[k]=+v.toFixed(1)}
    if(!Object.keys(m).length)return toast('Добавь хотя бы один обхват');
    const q=await c.client.from('body_measurements').upsert({user_id:u,measure_date:d,measurements:m,updated_at:new Date().toISOString()},{onConflict:'user_id,measure_date'});if(q.error)return alert(q.error.message);
    const wr=N(String(document.getElementById('ts110Weight')?.value||'').replace(',','.'));
    if(wr){await c.client.from('bodyweights').upsert({user_id:u,measure_date:d,weight_kg:+wr.toFixed(1)},{onConflict:'user_id,measure_date'});const now=Date.now();window.st.bw=A(window.st.bw);const x=window.st.bw.find(z=>z.d===d);if(x){x.w=+wr.toFixed(1);x.t=now;x.updatedAt=now}else window.st.bw.push({d,w:+wr.toFixed(1),t:now,updatedAt:now});window.st.bw.sort((a,b)=>String(a.d).localeCompare(String(b.d)));window.st.deletedBodyweights=A(window.st.deletedBodyweights).filter(x=>String(x?.d||x||'').slice(0,10)!==d)}
    if(typeof save==='function')save();C.at=0;closeModal();await renderSelf(true);toast('Замеры сохранены');
  };

  function install(){
    const p=window.planPage;
    if(typeof p==='function'&&!p.__trainerSelfPlanV110){
      const b=p,w=function(){const r=b.apply(this,arguments);setTimeout(()=>{if(isTrainer())renderSelf()},0);return r};
      w.__trainerSelfPlanV110=true;window.planPage=w;try{planPage=w}catch(e){}
    }
  }
  install();
  let n=0;const timer=setInterval(()=>{install();if(isTrainer()&&document.getElementById('plan')?.classList.contains('active'))renderSelf();if(++n>90)clearInterval(timer)},1000);
  [200,700,1600,3000].forEach(t=>setTimeout(()=>{install();if(isTrainer()&&document.getElementById('plan')?.classList.contains('active'))renderSelf()},t));
})();
