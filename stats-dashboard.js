'use strict';
(()=>{
  if(window.__unvrslStatsDashboardV254)return;
  window.__unvrslStatsDashboardV254=true;

  const css=document.createElement('style');
  css.id='stats-dashboard-v254-style';
  css.textContent=`
    #stats.stats-v254{padding-bottom:150px}
    #stats .sd2-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin:4px 0 20px}
    #stats .sd2-head h1{font-size:40px;line-height:.95;margin:0 0 8px;font-weight:900;letter-spacing:-1.5px}
    #stats .sd2-sub{color:#8e8e93;font-size:17px}
    #stats .sd2-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:16px}
    #stats .sd2-metric{position:relative;display:grid;grid-template-columns:52px minmax(0,1fr);align-items:center;gap:12px;background:linear-gradient(145deg,#202026,#18181c);border:1px solid #2d2e35;border-radius:22px;padding:15px;min-height:108px;overflow:hidden}
    #stats .sd2-metric-icon{width:52px;height:52px;border-radius:16px;display:grid;place-items:center;color:#bf5af2;background:linear-gradient(145deg,rgba(191,90,242,.17),rgba(191,90,242,.06));border:1px solid rgba(191,90,242,.16)}
    #stats .sd2-metric-icon.streak{color:#ff453a;background:linear-gradient(145deg,rgba(255,69,58,.18),rgba(255,69,58,.05));border-color:rgba(255,69,58,.17)}
    #stats .sd2-metric-icon svg{width:28px;height:28px;display:block;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
    #stats .sd2-metric-icon.streak svg{fill:currentColor;stroke:none}
    #stats .sd2-metric-copy{min-width:0}
    #stats .sd2-metric-label{display:block;color:#9b9ba1;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    #stats .sd2-metric b{display:block;font-size:31px;line-height:1;margin-top:8px;font-variant-numeric:tabular-nums;letter-spacing:-1px}
    #stats .sd2-card{background:#1c1c1f;border:1px solid #26272c;border-radius:23px;padding:17px;margin:12px 0;overflow:hidden}
    #stats .sd2-measures{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
    #stats .sd2-measure{background:#17171a;border:1px solid #292a2f;border-radius:16px;padding:13px;min-width:0}
    #stats .sd2-measure span{display:block;color:#8f8f95;font-size:12px}
    #stats .sd2-measure b{display:block;font-size:21px;margin-top:5px}
    #stats .sd2-measure small{display:block;margin-top:3px;font-size:11px;color:#77777e}
    #stats .sd2-up{color:#34c759!important}#stats .sd2-down{color:#ff9f0a!important}
    #stats .sd2-empty{color:#85858b;padding:6px 0}
    #stats .sd2-section{font-size:12px;letter-spacing:2px;color:#77777e;font-weight:800;margin:20px 4px 8px}
    #stats .sd2-strength-host .card{margin:0}
    #stats .sd2-card button{touch-action:manipulation}
    @media(max-width:390px){#stats .sd2-head h1{font-size:35px}#stats .sd2-card{padding:15px}#stats .sd2-measures{grid-template-columns:repeat(2,minmax(0,1fr))}#stats .sd2-metric{grid-template-columns:44px minmax(0,1fr);gap:9px;padding:12px;min-height:96px}#stats .sd2-metric-icon{width:44px;height:44px;border-radius:14px}#stats .sd2-metric-icon svg{width:24px;height:24px}#stats .sd2-metric-label{font-size:12px}#stats .sd2-metric b{font-size:26px}}
  `;
  document.head.appendChild(css);

  const MEASURES=[['chest','Грудь'],['waist','Талия'],['abdomen','Живот'],['hips','Ягодицы'],['thigh','Бедро'],['arm','Рука'],['calf','Икра']];
  const cloudCache={loaded:false,loading:false,workouts:[],checkins:[],ts:0,owner:null,token:0,status:'idle'};
  const num=v=>{const n=Number(v);return Number.isFinite(n)?n:null};
  const fmt=(v,d=1)=>v==null?'—':Number(v).toFixed(d).replace('.0','').replace('.',',');
  const isoDate=d=>{const x=new Date(d);return Number.isNaN(x.getTime())?'':x.toISOString().slice(0,10)};
  const parseDate=s=>new Date(String(s).slice(0,10)+'T12:00:00');

  function localWorkouts(){
    return (st.sessions||[]).map(s=>({
      id:String(s.id||''),
      date:s.date||isoDate(s.started||Date.now()),
      duration:Math.max(1,Math.round(((+s.ended||+s.started||Date.now())-(+s.started||Date.now()))/60000))
    })).filter(x=>x.date);
  }
  function dataWorkouts(){
    const local=localWorkouts();if(!cloudCache.loaded||cloudCache.owner!==window.cloud?.user?.id)return local;
    const cloud=cloudCache.workouts.map(w=>({id:String(w.external_id||w.payload?.id||''),date:w.workout_date,duration:Math.max(1,Math.round((((w.payload?.ended||0)-(w.payload?.started||0))/60000)||1))}));
    const out=[...cloud],keys=new Set(out.map(x=>x.id?`id:${x.id}`:`d:${x.date}:${x.duration}`));
    local.forEach(x=>{const k=x.id?`id:${x.id}`:`d:${x.date}:${x.duration}`;if(!keys.has(k)){keys.add(k);out.push(x)}});
    return out.sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  }
  function workoutSessions(){
    const deleted=new Set((st.deletedSessionIds||[]).map(String));
    const local=(st.sessions||[]).filter(s=>s&&typeof s==='object'&&!deleted.has(String(s.id||'')));
    const cloud=cloudCache.loaded&&cloudCache.owner===window.cloud?.user?.id?cloudCache.workouts.map(x=>x?.payload&&({...x.payload,date:x.workout_date,id:x.payload.id||x.external_id})).filter(s=>s&&typeof s==='object'&&!deleted.has(String(s.id||''))):[];
    const out=[...cloud],keys=new Set(out.map(s=>String(s.id||'')));
    local.forEach(s=>{const k=String(s.id||'');if(!k||!keys.has(k)){out.push(s);if(k)keys.add(k)}});
    const finished=s=>Boolean(s?.ended||s?.completedAt||s?.finishedAt||s?.status==='completed');
    const completedSet=x=>x?.ok===true||x?.completed===true||x?.done===true||x?.isCompleted===true||x?.status==='completed';
    return out.filter(s=>finished(s)&&(s.ex||s.exercises||[]).some(e=>(e.set||e.sets||[]).some(completedSet)))
      .sort((a,b)=>Number(a.ended||a.started||0)-Number(b.ended||b.started||0));
  }
  window.unvrslStatsSessions254=workoutSessions;
  window.unvrslStatsHistoryState254=()=>({status:cloudCache.status,loaded:cloudCache.loaded,owner:cloudCache.owner});

  function monthCount(ws){const now=new Date(),ym=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;return ws.filter(x=>String(x.date).startsWith(ym)).length}
  function weekKey(d){const x=parseDate(d),day=(x.getDay()+6)%7;x.setDate(x.getDate()-day);return isoDate(x)}
  function weekStreak(ws){const set=new Set(ws.map(x=>weekKey(x.date))),now=new Date(),day=(now.getDay()+6)%7;now.setHours(12,0,0,0);now.setDate(now.getDate()-day);let n=0;for(let i=0;i<104;i++){const k=isoDate(now);if(!set.has(k))break;n++;now.setDate(now.getDate()-7)}return n}
  const METRIC_ICONS={
    workouts:'<svg viewBox="0 0 24 24"><path d="M3 9v6M6 7v10M18 7v10M21 9v6M6 12h12"/></svg>',
    month:'<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="16" rx="3"/><path d="M8 3v4M16 3v4M3.5 10h17"/></svg>',
    streak:'<svg viewBox="0 0 24 24"><path d="M13.5 2.5c.7 3-1.8 4.2-1 7 .7-1.1 1.8-2 3.1-2.8 2.2 2 3.4 4.5 3.4 7.2A7 7 0 0 1 5 14c0-3.3 1.8-6.2 5-8.7-.2 2.3.7 3.5 1.7 4.3.4-2.3.1-4.8 1.8-7.1Z"/></svg>',
    rpe:'<svg viewBox="0 0 24 24"><path d="m4 17 5-6 4 3 7-8"/><path d="M17 6h3v3"/></svg>'
  };
  function metric(label,value,icon){return `<div class="sd2-metric"><div class="sd2-metric-icon ${icon}">${METRIC_ICONS[icon]||''}</div><div class="sd2-metric-copy"><span class="sd2-metric-label">${label}</span><b>${value}</b></div></div>`}
  function measurementSeries(key){return cloudCache.checkins.map(x=>({d:x.checkin_date,v:num(x.measurements?.[key])})).filter(x=>x.v!=null).sort((a,b)=>a.d.localeCompare(b.d))}
  function measuresHtml(){
    if(!window.cloud?.user)return'';
    const cards=MEASURES.map(([k,l])=>{const a=measurementSeries(k);if(!a.length)return'';const last=a.at(-1),first=a[0],d=+(last.v-first.v).toFixed(1),cls=d>0?'sd2-up':d<0?'sd2-down':'';return `<div class="sd2-measure"><span>${l}</span><b>${fmt(last.v)} см</b><small class="${cls}">${a.length>1?`${d>0?'+':''}${fmt(d)} см · ${a.length} зам.`:'1 замер'}</small></div>`}).filter(Boolean).join('');
    return `<div class="sd2-section">ЗАМЕРЫ</div><div class="sd2-card">${cards?`<div class="sd2-measures">${cards}</div>`:'<div class="sd2-empty">Замеры появятся после чек-ина.</div>'}</div>`;
  }
  function dashboardHtml(){
    const ws=dataWorkouts(),rpes=workoutSessions().flatMap(s=>(s.ex||[]).flatMap(e=>(e.set||[]).filter(x=>x?.ok&&num(x.rpe)!=null).map(x=>num(x.rpe)))),avgRpe=rpes.length?fmt(rpes.reduce((a,b)=>a+b,0)/rpes.length):'—';
    const anatomy=typeof window.anatomeMuscleCardHtmlV254==='function'?window.anatomeMuscleCardHtmlV254():'';
    const strength=typeof window.profileStrengthOverviewHtml==='function'?window.profileStrengthOverviewHtml():typeof profileStrengthOverviewHtml==='function'?profileStrengthOverviewHtml():'<div class="sd2-card sd2-empty">Силовой прогресс появится после тренировок.</div>';
    return `<div class="sd2-head"><div><h1>Статистика</h1><div class="sd2-sub">Прогресс тренировок</div></div></div><div class="sd2-grid">${metric('Тренировки',ws.length,'workouts')}${metric('Этот месяц',monthCount(ws),'month')}${metric('Серия недель',weekStreak(ws),'streak')}${metric('Средний RPE',avgRpe,'rpe')}</div>${anatomy}${measuresHtml()}<div class="sd2-section">СИЛОВЫЕ</div><div class="sd2-strength-host">${strength}</div>`;
  }
  function renderDashboard(){
    const root=document.getElementById('stats');if(!root)return;
    const html=dashboardHtml();root.classList.remove('stats-v2');root.classList.add('stats-v254');root.dataset.statsAuthority='254';
    if(root.__statsDashboardHtml===html&&root.querySelector('.sd2-head')){window.anatomeMountCardV254?.();return}
    const y=root.classList.contains('active')?(window.scrollY||document.documentElement?.scrollTop||0):0;
    root.innerHTML=html;root.__statsDashboardHtml=html;window.anatomeMountCardV254?.();
    if(y>0)window.scrollTo({top:y,left:0,behavior:'auto'});
  }
  window.statsDashboardRender=renderDashboard;

  async function hydrateCloud(force=false){
    if(!window.cloud?.client||!window.cloud?.user)return;
    const uid=window.cloud.user.id;
    if(cloudCache.owner!==uid){cloudCache.owner=uid;cloudCache.token++;cloudCache.loaded=false;cloudCache.loading=false;cloudCache.workouts=[];cloudCache.checkins=[];cloudCache.status='idle'}
    if(cloudCache.loading)return;if(!force&&cloudCache.loaded&&Date.now()-cloudCache.ts<30000)return;
    cloudCache.loading=true;cloudCache.status='loading';const token=++cloudCache.token;
    const current=()=>cloudCache.token===token&&cloudCache.owner===uid;
    const deadline=(query,ms=8000)=>{let timer;return Promise.race([query,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('История не ответила вовремя')),ms)})]).finally(()=>clearTimeout(timer))};
    try{
      const c=window.cloud.client;
      // Workout history drives tonnage. A slow check-in request must not block it.
      const workouts=deadline(c.from('workouts').select('external_id,workout_date,payload').eq('user_id',uid).order('workout_date',{ascending:true}).limit(1000)).then(wo=>{
        if(wo.error)throw wo.error;if(!current())return;
        cloudCache.workouts=wo.data||[];cloudCache.loaded=true;cloudCache.ts=Date.now();cloudCache.status='ready';
      }).catch(error=>{if(current()){cloudCache.status='error';console.warn('stats workouts',error)}}).finally(()=>{
        if(!current())return;
        if(typeof CustomEvent==='function')window.dispatchEvent?.(new CustomEvent('unvrsl:stats-history-ready'));
        if(document.getElementById('stats')?.classList.contains('active'))renderDashboard();
      });
      const checkins=deadline(c.from('checkins').select('checkin_date,measurements').eq('user_id',uid).order('checkin_date',{ascending:true}).limit(500)).then(ci=>{if(ci.error)throw ci.error;if(current())cloudCache.checkins=ci.data||[]}).catch(error=>{if(current())console.warn('stats checkins',error)});
      await Promise.all([workouts,checkins]);
    }catch(e){if(current()){cloudCache.status='error';console.warn('stats v254 hydrate',e)}}finally{if(current())cloudCache.loading=false}
  }

  window.statsProgressRefresh=async function(force=true){if(force)cloudCache.loaded=false;await hydrateCloud(force);renderDashboard()};
  window.statsPage=function(){renderDashboard();hydrateCloud().then(()=>{if(document.getElementById('stats')?.classList.contains('active'))renderDashboard()})};
  try{statsPage=window.statsPage}catch(e){}
})();
