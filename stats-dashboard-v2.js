'use strict';
(()=>{
  if(window.__unvrslStatsDashboardV2)return;
  window.__unvrslStatsDashboardV2=true;

  const css=document.createElement('style');
  css.id='stats-dashboard-v2-style';
  css.textContent=`
  #stats.stats-v2{padding-bottom:150px}.sd2-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin:4px 0 20px}.sd2-head h1{font-size:40px;line-height:.95;margin:0 0 8px;font-weight:900;letter-spacing:-1.5px}.sd2-sub{color:#8e8e93;font-size:17px}.sd2-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:12px}.sd2-metric{background:#1c1c1f;border:1px solid #24252a;border-radius:19px;padding:15px;min-height:92px}.sd2-metric-label{display:flex;gap:8px;align-items:center;color:#9b9ba1;font-size:14px}.sd2-metric b{display:block;font-size:29px;line-height:1;margin-top:11px;font-variant-numeric:tabular-nums}.sd2-card{background:#1c1c1f;border:1px solid #26272c;border-radius:23px;padding:17px;margin:12px 0;overflow:hidden}.sd2-card-title{color:#aaaab0;font-size:14px;line-height:1.35;margin-bottom:14px}.sd2-heat-wrap{overflow-x:auto;padding-bottom:3px;-webkit-overflow-scrolling:touch}.sd2-heat{display:grid;grid-template-rows:repeat(7,10px);grid-auto-flow:column;grid-auto-columns:10px;gap:4px;width:max-content;min-width:100%}.sd2-cell{width:10px;height:10px;border-radius:3px;background:#2c2c31}.sd2-cell.l1{background:#4c365e}.sd2-cell.l2{background:#70468d}.sd2-cell.l3{background:#914fb8}.sd2-cell.l4{background:#bf5af2}.sd2-legend{display:flex;justify-content:flex-end;align-items:center;gap:5px;color:#77777d;font-size:11px;margin-top:11px}.sd2-legend i{width:10px;height:10px;border-radius:3px;display:inline-block}.sd2-weight-head{display:flex;justify-content:space-between;gap:10px;align-items:center}.sd2-weight-label{font-size:15px;color:#9b9ba1}.sd2-weight-actions{display:flex;align-items:center;gap:14px}.sd2-goal-link,.sd2-write{border:0;background:transparent;padding:0;font-size:16px}.sd2-goal-link{color:#ffd60a}.sd2-write{color:#bf5af2}.sd2-current-row{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;margin:18px 0 5px}.sd2-current{font-size:43px;line-height:1;font-weight:900;letter-spacing:-1.5px}.sd2-current small{font-size:20px;color:#a4a4aa;font-weight:700}.sd2-last-date{color:#6f6f76;font-size:14px}.sd2-goal-copy{color:#ffd60a;font-size:15px;margin:8px 0 14px}.sd2-seg{display:grid;grid-template-columns:repeat(4,1fr);background:#3a3a3f;border-radius:12px;padding:2px;margin:12px 0 6px}.sd2-seg button{border:0;background:transparent;color:#aaaab0;padding:9px 4px;border-radius:10px;font-size:14px}.sd2-seg button.on{background:#202023;color:#fff}.sd2-chart{display:block;width:100%;height:auto;margin-top:8px;overflow:visible}.sd2-axis{font-size:9px;fill:#77777e}.sd2-date{font-size:9px;fill:#6f6f76}.sd2-measures{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.sd2-measure{background:#17171a;border:1px solid #292a2f;border-radius:16px;padding:13px;min-width:0}.sd2-measure span{display:block;color:#8f8f95;font-size:12px}.sd2-measure b{display:block;font-size:21px;margin-top:5px}.sd2-measure small{display:block;margin-top:3px;font-size:11px;color:#77777e}.sd2-up{color:#34c759!important}.sd2-down{color:#ff9f0a!important}.sd2-empty{color:#85858b;padding:6px 0}.sd2-section{font-size:12px;letter-spacing:2px;color:#77777e;font-weight:800;margin:20px 4px 8px}.sd2-strength-host .card{margin:0}.sd2-card button,.sd2-seg button{touch-action:manipulation}
  @media(max-width:390px){.sd2-head h1{font-size:35px}.sd2-current{font-size:39px}.sd2-card{padding:15px}.sd2-measures{grid-template-columns:repeat(2,minmax(0,1fr))}}
  `;
  document.head.appendChild(css);

  let weightRange='3m';
  let cloudCache={loaded:false,loading:false,workouts:[],weights:[],checkins:[],goal:null,ts:0};
  const MEASURES=[['chest','Грудь'],['waist','Талия'],['abdomen','Живот'],['hips','Ягодицы'],['thigh','Бедро'],['arm','Рука'],['calf','Икра']];
  const num=v=>{const n=Number(v);return Number.isFinite(n)?n:null};
  const fmt=(v,d=1)=>v==null?'—':Number(v).toFixed(d).replace('.0','').replace('.',',');
  const isoDate=d=>{const x=new Date(d);return Number.isNaN(x.getTime())?'':x.toISOString().slice(0,10)};
  const parseDate=s=>new Date(String(s).slice(0,10)+'T12:00:00');
  const daysBetween=(a,b)=>Math.round((parseDate(b)-parseDate(a))/86400000);
  function esc2(s){return typeof window.esc==='function'?window.esc(String(s??'')):String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}

  function localWorkouts(){return (st.sessions||[]).map(s=>({id:String(s.id||''),date:s.date||isoDate(s.started||Date.now()),duration:Math.max(1,Math.round(((+s.ended||+s.started||Date.now())-(+s.started||Date.now()))/60000))})).filter(x=>x.date)}
  function dataWorkouts(){const local=localWorkouts();if(!cloudCache.loaded)return local;const cloud=cloudCache.workouts.map(w=>({id:String(w.external_id||w.payload?.id||''),date:w.workout_date,duration:Math.max(1,Math.round((((w.payload?.ended||0)-(w.payload?.started||0))/60000)||1))})),out=[...cloud],keys=new Set(out.map(x=>x.id?`id:${x.id}`:`d:${x.date}:${x.duration}`));local.forEach(x=>{const k=x.id?`id:${x.id}`:`d:${x.date}:${x.duration}`;if(!keys.has(k)){keys.add(k);out.push(x)}});return out.sort((a,b)=>String(a.date).localeCompare(String(b.date)))}
  function workoutSessions(){const deleted=new Set((st.deletedSessionIds||[]).map(String)),local=(st.sessions||[]).filter(s=>s&&typeof s==='object'&&!deleted.has(String(s.id||''))),cloud=cloudCache.loaded?cloudCache.workouts.map(x=>x?.payload).filter(s=>s&&typeof s==='object'&&!deleted.has(String(s.id||''))):[],out=[...cloud],keys=new Set(out.map(s=>String(s.id||'')));local.forEach(s=>{const k=String(s.id||'');if(!k||!keys.has(k)){out.push(s);if(k)keys.add(k)}});return out.filter(s=>s?.ended&&(s.ex||[]).some(e=>(e.set||[]).some(x=>x?.ok))).sort((a,b)=>Number(a.ended||a.started||0)-Number(b.ended||b.started||0))}
  window.unvrslStatsSessions208=workoutSessions;
  function localWeights(){return (st.bw||[]).map(x=>({d:x.d,v:num(x.w)})).filter(x=>x.d&&x.v!=null).sort((a,b)=>a.d.localeCompare(b.d))}
  function dataWeights(){if(cloudCache.loaded)return cloudCache.weights.map(x=>({d:x.measure_date,v:num(x.weight_kg)})).filter(x=>x.v!=null).sort((a,b)=>a.d.localeCompare(b.d));return localWeights()}
  function goalWeight(){return num(cloudCache.goal)??num(st.weightGoalKg)}

  function monthCount(ws){const now=new Date(),ym=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;return ws.filter(x=>String(x.date).startsWith(ym)).length}
  function weekKey(d){const x=parseDate(d),day=(x.getDay()+6)%7;x.setDate(x.getDate()-day);return isoDate(x)}
  function weekStreak(ws){const set=new Set(ws.map(x=>weekKey(x.date))),now=new Date(),day=(now.getDay()+6)%7;now.setHours(12,0,0,0);now.setDate(now.getDate()-day);let n=0;for(let i=0;i<104;i++){const k=isoDate(now);if(!set.has(k))break;n++;now.setDate(now.getDate()-7)}return n}
  function weight30(weights){if(weights.length<2)return null;const last=weights[weights.length-1],cut=parseDate(last.d);cut.setDate(cut.getDate()-30);const first=weights.find(x=>parseDate(x.d)>=cut)||weights[0];return +(last.v-first.v).toFixed(1)}

  function metric(label,value,icon){return `<div class="sd2-metric"><div class="sd2-metric-label"><span>${icon}</span><span>${label}</span></div><b>${value}</b></div>`}

  function heatmapHtml(ws){
    const map=new Map();ws.forEach(x=>map.set(x.date,(map.get(x.date)||0)+(x.duration||1)));
    const today=new Date();today.setHours(12,0,0,0);const end=new Date(today),start=new Date(today);start.setDate(start.getDate()-364);const weekday=(start.getDay()+6)%7;start.setDate(start.getDate()-weekday);
    const vals=[...map.values()],max=Math.max(1,...vals);let cells='';
    for(let d=new Date(start);d<=end;d.setDate(d.getDate()+1)){const k=isoDate(d),v=map.get(k)||0,ratio=v/max,lev=!v?'':ratio>.72?'l4':ratio>.42?'l3':ratio>.18?'l2':'l1';cells+=`<i class="sd2-cell ${lev}" title="${k}: ${v?Math.round(v)+' мин':'нет тренировки'}"></i>`}
    return `<div class="sd2-card"><div class="sd2-card-title">Активность — последние 12 месяцев · по времени тренировок</div><div class="sd2-heat-wrap" id="sd2HeatWrap"><div class="sd2-heat">${cells}</div></div><div class="sd2-legend"><span>Меньше</span><i style="background:#2c2c31"></i><i style="background:#4c365e"></i><i style="background:#70468d"></i><i style="background:#914fb8"></i><i style="background:#bf5af2"></i><span>Больше</span></div></div>`
  }

  function rangeDays(){return weightRange==='1m'?31:weightRange==='3m'?93:weightRange==='1y'?366:99999}
  function filteredWeights(weights){if(weightRange==='all'||!weights.length)return weights;const last=parseDate(weights[weights.length-1].d),cut=new Date(last);cut.setDate(cut.getDate()-rangeDays());return weights.filter(x=>parseDate(x.d)>=cut)}
  function weightChart(weights,goal){
    const p=filteredWeights(weights),w=340,h=178,L=34,R=12,T=20,B=27;
    if(!p.length)return `<div class="sd2-empty">Запиши первый вес — здесь появится график.</div>`;
    const values=p.map(x=>x.v).concat(goal? [goal]:[]),mn=Math.min(...values),mx=Math.max(...values),pad=Math.max(1,(mx-mn)*.25),ymin=Math.floor((mn-pad)*2)/2,ymax=Math.ceil((mx+pad)*2)/2,range=Math.max(.5,ymax-ymin),dx=p.length>1?(w-L-R)/(p.length-1):0;
    const xy=p.map((x,i)=>[L+i*dx,T+(ymax-x.v)/range*(h-T-B)]),poly=xy.map(a=>a.join(',')).join(' '),fill=`${L},${h-B} ${poly} ${xy[xy.length-1][0]},${h-B}`;
    const ticks=[0,.33,.66,1].map(q=>+(ymax-range*q).toFixed(1));
    const grid=ticks.map(v=>{const y=T+(ymax-v)/range*(h-T-B);return `<line x1="${L}" y1="${y}" x2="${w-R}" y2="${y}" stroke="#303037" stroke-dasharray="2 5"/><text class="sd2-axis" x="${L-5}" y="${y+3}" text-anchor="end">${fmt(v)}</text>`}).join('');
    let goalLine='';if(goal){const gy=T+(ymax-goal)/range*(h-T-B);goalLine=`<line x1="${L}" y1="${gy}" x2="${w-R}" y2="${gy}" stroke="#ffd60a" stroke-width="2" stroke-dasharray="7 5"/><text x="${w-R}" y="${gy-5}" text-anchor="end" fill="#ffd60a" font-size="10" font-weight="800">${fmt(goal)}</text>`}
    const labels=p.length===1?[0]:[0,Math.floor((p.length-1)/2),p.length-1];
    const dateLabels=[...new Set(labels)].map(i=>{const d=parseDate(p[i].d);return `<text class="sd2-date" x="${xy[i][0]}" y="${h-6}" text-anchor="middle">${d.getDate()} ${['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'][d.getMonth()]}</text>`}).join('');
    return `<svg class="sd2-chart" viewBox="0 0 ${w} ${h}" aria-label="График веса">${grid}${goalLine}<polygon points="${fill}" fill="rgba(191,90,242,.10)"/><polyline points="${poly}" fill="none" stroke="#bf5af2" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${xy.map((a,i)=>`<circle class="bw190-point ${window.__unvrslSelectedBodyweightDate===p[i].d?'is-selected':''}" data-bw-date="${p[i].d}" data-bw-value="${p[i].v}" cx="${a[0]}" cy="${a[1]}" r="${i===xy.length-1?4.5:3}" fill="#bf5af2" role="button" tabindex="0" aria-label="${fmt(p[i].v)} кг, ${p[i].d}" onclick="bw190SelectPoint('${p[i].d}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();bw190SelectPoint('${p[i].d}')}"/>`).join('')}${dateLabels}</svg>`
  }

  function weightCardHtml(weights){
    const last=weights.length?weights[weights.length-1]:null,goal=goalWeight(),diff=last&&goal?+(goal-last.v).toFixed(1):null;
    let copy='';if(last&&goal){copy=diff===0?`◎ Цель ${fmt(goal)} кг · достигнута`:diff>0?`◎ Цель ${fmt(goal)} кг · набрать ${fmt(Math.abs(diff))} кг`:`◎ Цель ${fmt(goal)} кг · снизить ${fmt(Math.abs(diff))} кг`}
    const date=last?parseDate(last.d):null,dateText=date?`${['Вс','Пн','Вт','Ср','Чт','Пт','Сб'][date.getDay()]}, ${date.getDate()} ${['янв.','февр.','мар.','апр.','мая','июн.','июл.','авг.','сент.','окт.','нояб.','дек.'][date.getMonth()]}`:'';
    return `<div class="sd2-card"><div class="sd2-weight-head"><div class="sd2-weight-label">Вес тела</div><div class="sd2-weight-actions"><button class="sd2-goal-link" onclick="statsGoalSheet()">◎ ${goal?fmt(goal):'Цель'}</button><button class="sd2-write" onclick="statsWeightSheet()">＋ Записать</button></div></div><div class="sd2-current-row"><div class="sd2-current">${last?fmt(last.v):'—'} <small>кг</small></div><div class="sd2-last-date">${dateText}</div></div>${copy?`<div class="sd2-goal-copy">${copy}</div>`:''}<div class="sd2-seg">${[['1m','1М'],['3m','3М'],['1y','1Г'],['all','Все']].map(([k,l])=>`<button class="${weightRange===k?'on':''}" onclick="statsWeightRange('${k}')">${l}</button>`).join('')}</div>${weightChart(weights,goal)}</div>`
  }

  function measurementSeries(key){return (cloudCache.checkins||[]).map(x=>({d:x.checkin_date,v:num(x.measurements?.[key])})).filter(x=>x.v!=null).sort((a,b)=>a.d.localeCompare(b.d))}
  function measuresHtml(){
    if(!window.cloud?.user)return'';
    const cards=MEASURES.map(([k,l])=>{const a=measurementSeries(k);if(!a.length)return'';const last=a[a.length-1],first=a[0],d=+(last.v-first.v).toFixed(1),cls=d>0?'sd2-up':d<0?'sd2-down':'';return `<div class="sd2-measure"><span>${l}</span><b>${fmt(last.v)} см</b><small class="${cls}">${a.length>1?`${d>0?'+':''}${fmt(d)} см · ${a.length} зам.`:'1 замер'}</small></div>`}).filter(Boolean).join('');
    return `<div class="sd2-section">ЗАМЕРЫ</div><div class="sd2-card">${cards?`<div class="sd2-measures">${cards}</div>`:'<div class="sd2-empty">Замеры появятся после чек-ина.</div>'}</div>`
  }

  function workoutHistoryHtml(){const rows=workoutSessions().slice().reverse().slice(0,30);return `<div id="statsWorkoutHistory208" class="sd2-section">ИСТОРИЯ ТРЕНИРОВОК</div><div class="sd2-card">${rows.length?rows.map(s=>{const sets=(s.ex||[]).reduce((n,e)=>n+(e.set||[]).filter(x=>x?.ok).length,0),name=[s.c,s.name].filter(Boolean).join(' · ')||'Тренировка';return `<button class="strength-item" onclick="statsOpenWorkout208('${encodeURIComponent(String(s.id||''))}')"><div><div class="strength-item-title">${esc2(name)}</div><div class="strength-item-meta">${esc2(s.date||isoDate(s.ended||s.started))} · ${sets} рабочих сетов</div></div><span class="cj107-chev">›</span></button>`}).join(''):'<div class="sd2-empty">Завершённые тренировки появятся здесь.</div>'}</div>`}

  window.statsOpenWorkout208=function(token){const id=decodeURIComponent(token||''),s=workoutSessions().find(x=>String(x.id||'')===id);if(!s)return;const name=[s.c,s.name].filter(Boolean).join(' · ')||'Тренировка',sets=(s.ex||[]).map(e=>{const done=(e.set||[]).filter(x=>x?.ok);if(!done.length)return'';return `<div class="listline"><b>${esc2(e.n||'Упражнение')}</b>${done.map(x=>`<div class="muted small">${fmt(num(x.w)||0)} кг × ${num(x.r)||0}${x.rpe!==''&&x.rpe!=null?` @RPE ${esc2(x.rpe)}`:''}</div>`).join('')}</div>`}).join('');modal(`<div class="sheet-grabber"></div><div class="row between"><div><h2>${esc2(name)}</h2><div class="muted">${esc2(s.date||isoDate(s.ended||s.started))}</div></div><button class="btn tiny" onclick="closeModal()">✕</button></div>${sets||'<div class="muted">Нет выполненных подходов.</div>'}`)};

  function dashboardHtml(){
    const ws=dataWorkouts(),rpes=workoutSessions().flatMap(s=>(s.ex||[]).flatMap(e=>(e.set||[]).filter(x=>x?.ok&&num(x.rpe)!=null).map(x=>num(x.rpe)))),avgRpe=rpes.length?fmt(rpes.reduce((a,b)=>a+b,0)/rpes.length):'—';
    const anatomy=typeof window.anatomeMuscleCardHtmlV253==='function'?window.anatomeMuscleCardHtmlV253():'';
    return `<div class="sd2-head"><div><h1>Статистика</h1><div class="sd2-sub">Прогресс и история</div></div></div><div class="sd2-grid">${metric('Тренировки',ws.length,'◫')}${metric('Этот месяц',monthCount(ws),'▣')}${metric('Серия недель',weekStreak(ws),'♨')}${metric('Средний RPE',avgRpe,'◉')}</div>${anatomy}${heatmapHtml(ws)}${measuresHtml()}<div class="sd2-section">СИЛОВЫЕ</div><div class="sd2-strength-host">${typeof window.profileStrengthOverviewHtml==='function'?window.profileStrengthOverviewHtml():typeof profileStrengthOverviewHtml==='function'?profileStrengthOverviewHtml():'<div class="sd2-card sd2-empty">Силовой прогресс появится после тренировок.</div>'}</div>${workoutHistoryHtml()}`
  }

  function renderDashboard(){const root=document.getElementById('stats');if(!root)return;const html=dashboardHtml();root.classList.add('stats-v2');root.dataset.statsAuthority='253';if(root.__statsDashboardHtml===html&&root.querySelector('.sd2-head')){window.anatomeMountCardV253?.();return}const y=root.classList.contains('active')?(window.scrollY||document.documentElement?.scrollTop||0):0;root.innerHTML=html;root.__statsDashboardHtml=html;window.anatomeMountCardV253?.();if(y>0)window.scrollTo({top:y,left:0,behavior:'auto'});requestAnimationFrame(()=>{const h=document.getElementById('sd2HeatWrap');if(h)h.scrollLeft=h.scrollWidth})}
  window.statsDashboardRender=renderDashboard;

  window.statsWeightRange=function(k){weightRange=k;renderDashboard()};
  window.statsWeightSheet=function(){const w=dataWeights(),last=w.length?w[w.length-1].v:'';modal(`<div class="sheet-grabber"></div><h2>Записать вес</h2><div class="field"><label>Дата</label><input id="sd2WeightDate" type="date" value="${isoDate(new Date())}"></div><div class="field"><label>Вес, кг</label><input id="sd2WeightValue" type="number" inputmode="decimal" min="30" max="350" step="0.1" value="" placeholder="${last?fmt(last):'Например, 75.5'}"></div><button class="btn primary full" onclick="statsSaveWeight()">Сохранить</button>`)};
  window.statsSaveWeight=async function(){const d=document.getElementById('sd2WeightDate')?.value||isoDate(new Date()),v=num(String(document.getElementById('sd2WeightValue')?.value||'').replace(',','.'));if(!v||v<30||v>350)return toast('Проверь вес');const now=Date.now();st.bw=Array.isArray(st.bw)?st.bw:[];const i=st.bw.findIndex(x=>x.d===d);const row={d,w:+v.toFixed(1),t:now,updatedAt:now};if(i>=0)st.bw[i]=row;else st.bw.push(row);st.bw.sort((a,b)=>a.d.localeCompare(b.d));st.deletedBodyweights=(Array.isArray(st.deletedBodyweights)?st.deletedBodyweights:[]).filter(x=>String(x?.d||x||'').slice(0,10)!==d);save();if(window.cloud?.client&&window.cloud?.user){const r=await window.cloud.client.from('bodyweights').upsert({user_id:window.cloud.user.id,measure_date:d,weight_kg:+v.toFixed(1)},{onConflict:'user_id,measure_date'});if(r.error)console.warn('weight save',r.error);cloudCache.loaded=false}closeModal();await hydrateCloud(true);renderDashboard();toast('Вес записан')};
  window.statsGoalSheet=function(){const g=goalWeight();modal(`<div class="sheet-grabber"></div><h2>Цель по весу</h2><div class="field"><label>Целевой вес, кг</label><input id="sd2Goal" type="number" inputmode="decimal" min="30" max="350" step="0.1" value="${g||''}" placeholder="Например, 100"></div><button class="btn primary full" onclick="statsSaveGoal()">Сохранить</button>`)};
  window.statsSaveGoal=async function(){const v=num(String(document.getElementById('sd2Goal')?.value||'').replace(',','.'));if(!v||v<30||v>350)return toast('Проверь целевой вес');st.weightGoalKg=+v.toFixed(1);save();if(window.cloud?.client&&window.cloud?.user){const r=await window.cloud.client.from('profiles').update({target_weight_kg:+v.toFixed(1),updated_at:new Date().toISOString()}).eq('id',window.cloud.user.id);if(r.error)console.warn('goal save',r.error);else cloudCache.goal=+v.toFixed(1)}closeModal();renderDashboard();toast('Цель сохранена')};

  async function hydrateCloud(force=false){
    if(!window.cloud?.client||!window.cloud?.user)return;
    if(cloudCache.loading)return;if(!force&&cloudCache.loaded&&Date.now()-cloudCache.ts<30000)return;
    cloudCache.loading=true;try{
      const c=window.cloud.client,uid=window.cloud.user.id;
      const [wo,bw,ci,pr]=await Promise.all([
        c.from('workouts').select('external_id,workout_date,payload').eq('user_id',uid).order('workout_date',{ascending:true}).limit(1000),
        c.from('bodyweights').select('measure_date,weight_kg').eq('user_id',uid).order('measure_date',{ascending:true}).limit(1000),
        c.from('checkins').select('checkin_date,measurements').eq('user_id',uid).order('checkin_date',{ascending:true}).limit(500),
        c.from('profiles').select('target_weight_kg').eq('id',uid).maybeSingle()
      ]);
      const deleted=new Set((st.deletedBodyweights||[]).map(x=>String(x?.d||x||'').slice(0,10)).filter(Boolean));
      cloudCache.workouts=wo.data||[];cloudCache.weights=(bw.data||[]).filter(x=>!deleted.has(String(x.measure_date).slice(0,10)));cloudCache.checkins=ci.data||[];cloudCache.goal=num(pr.data?.target_weight_kg)??num(st.weightGoalKg);cloudCache.loaded=true;cloudCache.ts=Date.now();
    }catch(e){console.warn('stats hydrate',e)}finally{cloudCache.loading=false}
  }

  window.statsProgressRefresh=async function(force=true){if(force)cloudCache.loaded=false;await hydrateCloud(force);renderDashboard()};

  window.statsPage=function(){renderDashboard();hydrateCloud().then(()=>{if(document.getElementById('stats')?.classList.contains('active'))renderDashboard()});};
  try{statsPage=window.statsPage}catch(e){}
})();
