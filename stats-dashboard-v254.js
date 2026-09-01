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
    #stats .sd2-metric{background:#1c1c1f;border:1px solid #24252a;border-radius:19px;padding:15px;min-height:92px}
    #stats .sd2-metric-label{display:flex;gap:8px;align-items:center;color:#9b9ba1;font-size:14px}
    #stats .sd2-metric b{display:block;font-size:29px;line-height:1;margin-top:11px;font-variant-numeric:tabular-nums}
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
    @media(max-width:390px){#stats .sd2-head h1{font-size:35px}#stats .sd2-card{padding:15px}#stats .sd2-measures{grid-template-columns:repeat(2,minmax(0,1fr))}}
  `;
  document.head.appendChild(css);

  const MEASURES=[['chest','Грудь'],['waist','Талия'],['abdomen','Живот'],['hips','Ягодицы'],['thigh','Бедро'],['arm','Рука'],['calf','Икра']];
  const cloudCache={loaded:false,loading:false,workouts:[],checkins:[],ts:0};
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
    const local=localWorkouts();if(!cloudCache.loaded)return local;
    const cloud=cloudCache.workouts.map(w=>({id:String(w.external_id||w.payload?.id||''),date:w.workout_date,duration:Math.max(1,Math.round((((w.payload?.ended||0)-(w.payload?.started||0))/60000)||1))}));
    const out=[...cloud],keys=new Set(out.map(x=>x.id?`id:${x.id}`:`d:${x.date}:${x.duration}`));
    local.forEach(x=>{const k=x.id?`id:${x.id}`:`d:${x.date}:${x.duration}`;if(!keys.has(k)){keys.add(k);out.push(x)}});
    return out.sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  }
  function workoutSessions(){
    const deleted=new Set((st.deletedSessionIds||[]).map(String));
    const local=(st.sessions||[]).filter(s=>s&&typeof s==='object'&&!deleted.has(String(s.id||'')));
    const cloud=cloudCache.loaded?cloudCache.workouts.map(x=>x?.payload).filter(s=>s&&typeof s==='object'&&!deleted.has(String(s.id||''))):[];
    const out=[...cloud],keys=new Set(out.map(s=>String(s.id||'')));
    local.forEach(s=>{const k=String(s.id||'');if(!k||!keys.has(k)){out.push(s);if(k)keys.add(k)}});
    return out.filter(s=>s?.ended&&(s.ex||[]).some(e=>(e.set||[]).some(x=>x?.ok))).sort((a,b)=>Number(a.ended||a.started||0)-Number(b.ended||b.started||0));
  }
  window.unvrslStatsSessions254=workoutSessions;

  function monthCount(ws){const now=new Date(),ym=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;return ws.filter(x=>String(x.date).startsWith(ym)).length}
  function weekKey(d){const x=parseDate(d),day=(x.getDay()+6)%7;x.setDate(x.getDate()-day);return isoDate(x)}
  function weekStreak(ws){const set=new Set(ws.map(x=>weekKey(x.date))),now=new Date(),day=(now.getDay()+6)%7;now.setHours(12,0,0,0);now.setDate(now.getDate()-day);let n=0;for(let i=0;i<104;i++){const k=isoDate(now);if(!set.has(k))break;n++;now.setDate(now.getDate()-7)}return n}
  function metric(label,value,icon){return `<div class="sd2-metric"><div class="sd2-metric-label"><span>${icon}</span><span>${label}</span></div><b>${value}</b></div>`}
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
    return `<div class="sd2-head"><div><h1>Статистика</h1><div class="sd2-sub">Прогресс тренировок</div></div></div><div class="sd2-grid">${metric('Тренировки',ws.length,'◫')}${metric('Этот месяц',monthCount(ws),'▣')}${metric('Серия недель',weekStreak(ws),'♨')}${metric('Средний RPE',avgRpe,'◉')}</div>${anatomy}${measuresHtml()}<div class="sd2-section">СИЛОВЫЕ</div><div class="sd2-strength-host">${strength}</div>`;
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
    if(cloudCache.loading)return;if(!force&&cloudCache.loaded&&Date.now()-cloudCache.ts<30000)return;
    cloudCache.loading=true;
    try{
      const c=window.cloud.client,uid=window.cloud.user.id;
      const [wo,ci]=await Promise.all([
        c.from('workouts').select('external_id,workout_date,payload').eq('user_id',uid).order('workout_date',{ascending:true}).limit(1000),
        c.from('checkins').select('checkin_date,measurements').eq('user_id',uid).order('checkin_date',{ascending:true}).limit(500)
      ]);
      cloudCache.workouts=wo.data||[];cloudCache.checkins=ci.data||[];cloudCache.loaded=true;cloudCache.ts=Date.now();
    }catch(e){console.warn('stats v254 hydrate',e)}finally{cloudCache.loading=false}
  }

  window.statsProgressRefresh=async function(force=true){if(force)cloudCache.loaded=false;await hydrateCloud(force);renderDashboard()};
  window.statsPage=function(){renderDashboard();hydrateCloud().then(()=>{if(document.getElementById('stats')?.classList.contains('active'))renderDashboard()})};
  try{statsPage=window.statsPage}catch(e){}
})();
