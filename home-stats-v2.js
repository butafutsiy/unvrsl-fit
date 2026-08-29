'use strict';
(()=>{
  if(window.__unvrslHomeStatsV2)return;
  window.__unvrslHomeStatsV2=true;

  const css=document.createElement('style');
  css.id='home-stats-v2-style';
  css.textContent=`
    #home .home-stats-v2{margin-top:12px}
    #home .home-stats-v2 .sd2-card{margin:12px 0}
    #home .home-stats-v2 .sd2-card:first-child{margin-top:0}
    #home .home-stats-v2 .sd2-card:last-child{margin-bottom:0}
    #home .home-stats-v2 .sd2-heat-wrap{overscroll-behavior-x:contain}
    #home .home-stats-v2 .sd2-current{font-size:46px}
    #home .home-stats-v2 .sd2-weight-actions{flex-wrap:wrap;justify-content:flex-end}
    #home .home-stats-v2 .sd2-goal-link,#home .home-stats-v2 .sd2-write{touch-action:manipulation}
    @media(max-width:390px){
      #home .home-stats-v2 .sd2-current{font-size:41px}
      #home .home-stats-v2 .sd2-weight-actions{gap:10px}
      #home .home-stats-v2 .sd2-goal-link,#home .home-stats-v2 .sd2-write{font-size:15px}
    }
  `;
  document.head.appendChild(css);

  let range='3m';
  let cache={workouts:[],weights:[],goal:null,loaded:false,loading:false,ts:0};
  const num=v=>{const n=Number(v);return Number.isFinite(n)?n:null};
  const fmt=v=>v==null?'—':Number(v).toFixed(1).replace('.0','').replace('.',',');
  const isoDate=d=>{const x=new Date(d);return Number.isNaN(x.getTime())?'':x.toISOString().slice(0,10)};
  const parseDate=s=>new Date(String(s).slice(0,10)+'T12:00:00');

  function localWorkouts(){
    return (st.sessions||[]).map(s=>({
      date:s.date||isoDate(s.started||Date.now()),
      duration:Math.max(1,Math.round(((+s.ended||+s.started||Date.now())-(+s.started||Date.now()))/60000))
    })).filter(x=>x.date);
  }
  function localWeights(){return (st.bw||[]).map(x=>({d:x.d,v:num(x.w)})).filter(x=>x.d&&x.v!=null).sort((a,b)=>a.d.localeCompare(b.d))}
  function workouts(){return cache.loaded&&cache.workouts.length?cache.workouts:localWorkouts()}
  function weights(){return cache.loaded?cache.weights:localWeights()}
  function goal(){return num(cache.goal)??num(st.weightGoalKg)}

  async function hydrate(force=false){
    if(!window.cloud?.client||!window.cloud?.user)return;
    if(cache.loading)return;
    if(!force&&cache.loaded&&Date.now()-cache.ts<30000)return;
    cache.loading=true;
    try{
      const c=window.cloud.client,uid=window.cloud.user.id;
      const [wo,bw,pr]=await Promise.all([
        c.from('workouts').select('workout_date,payload').eq('user_id',uid).order('workout_date',{ascending:true}).limit(1000),
        c.from('bodyweights').select('measure_date,weight_kg').eq('user_id',uid).order('measure_date',{ascending:true}).limit(1000),
        c.from('profiles').select('target_weight_kg').eq('id',uid).maybeSingle()
      ]);
      cache.workouts=(wo.data||[]).map(w=>({date:w.workout_date,duration:Math.max(1,Math.round((((w.payload?.ended||0)-(w.payload?.started||0))/60000)||1))}));
      cache.weights=(bw.data||[]).map(x=>({d:x.measure_date,v:num(x.weight_kg)})).filter(x=>x.v!=null).sort((a,b)=>a.d.localeCompare(b.d));
      cache.goal=num(pr.data?.target_weight_kg)??num(st.weightGoalKg);
      cache.loaded=true;cache.ts=Date.now();
    }catch(e){console.warn('home stats hydrate',e)}finally{cache.loading=false}
  }

  function heatmapHtml(){
    const map=new Map();
    workouts().forEach(x=>map.set(x.date,(map.get(x.date)||0)+(x.duration||1)));
    const today=new Date();today.setHours(12,0,0,0);const end=new Date(today),start=new Date(today);start.setDate(start.getDate()-364);const weekday=(start.getDay()+6)%7;start.setDate(start.getDate()-weekday);
    const vals=[...map.values()],max=Math.max(1,...vals);let cells='';
    for(let d=new Date(start);d<=end;d.setDate(d.getDate()+1)){
      const k=isoDate(d),v=map.get(k)||0,ratio=v/max,lev=!v?'':ratio>.72?'l4':ratio>.42?'l3':ratio>.18?'l2':'l1';
      cells+=`<i class="sd2-cell ${lev}" title="${k}: ${v?Math.round(v)+' мин':'нет тренировки'}"></i>`;
    }
    return `<div class="sd2-card"><div class="sd2-card-title">Активность — последние 12 месяцев · по времени тренировок</div><div class="sd2-heat-wrap" id="homeHeatWrap"><div class="sd2-heat">${cells}</div></div><div class="sd2-legend"><span>Меньше</span><i style="background:#2c2c31"></i><i style="background:#4c365e"></i><i style="background:#70468d"></i><i style="background:#914fb8"></i><i style="background:#bf5af2"></i><span>Больше</span></div></div>`;
  }

  function filteredWeights(){
    const a=weights();if(range==='all'||!a.length)return a;
    const days=range==='1m'?31:range==='3m'?93:366,last=parseDate(a[a.length-1].d),cut=new Date(last);cut.setDate(cut.getDate()-days);
    return a.filter(x=>parseDate(x.d)>=cut);
  }

  function chartHtml(){
    const p=filteredWeights(),g=goal(),w=340,h=178,L=34,R=12,T=20,B=27;
    if(!p.length)return `<div class="sd2-empty">Запиши первый вес — здесь появится график.</div>`;
    const values=p.map(x=>x.v).concat(g?[g]:[]),mn=Math.min(...values),mx=Math.max(...values),pad=Math.max(1,(mx-mn)*.25),ymin=Math.floor((mn-pad)*2)/2,ymax=Math.ceil((mx+pad)*2)/2,span=Math.max(.5,ymax-ymin),dx=p.length>1?(w-L-R)/(p.length-1):0;
    const xy=p.map((x,i)=>[L+i*dx,T+(ymax-x.v)/span*(h-T-B)]),poly=xy.map(a=>a.join(',')).join(' '),fill=`${L},${h-B} ${poly} ${xy[xy.length-1][0]},${h-B}`;
    const ticks=[0,.33,.66,1].map(q=>+(ymax-span*q).toFixed(1));
    const grid=ticks.map(v=>{const y=T+(ymax-v)/span*(h-T-B);return `<line x1="${L}" y1="${y}" x2="${w-R}" y2="${y}" stroke="#303037" stroke-dasharray="2 5"/><text class="sd2-axis" x="${L-5}" y="${y+3}" text-anchor="end">${fmt(v)}</text>`}).join('');
    let goalLine='';if(g){const gy=T+(ymax-g)/span*(h-T-B);goalLine=`<line x1="${L}" y1="${gy}" x2="${w-R}" y2="${gy}" stroke="#ffd60a" stroke-width="2" stroke-dasharray="7 5"/><text x="${w-R}" y="${gy-5}" text-anchor="end" fill="#ffd60a" font-size="10" font-weight="800">${fmt(g)}</text>`}
    const labels=p.length===1?[0]:[0,Math.floor((p.length-1)/2),p.length-1];
    const dates=[...new Set(labels)].map(i=>{const d=parseDate(p[i].d);return `<text class="sd2-date" x="${xy[i][0]}" y="${h-6}" text-anchor="middle">${d.getDate()} ${['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'][d.getMonth()]}</text>`}).join('');
    return `<svg class="sd2-chart" viewBox="0 0 ${w} ${h}" aria-label="График веса">${grid}${goalLine}<polygon points="${fill}" fill="rgba(191,90,242,.10)"/><polyline points="${poly}" fill="none" stroke="#bf5af2" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${xy.map((a,i)=>`<circle class="bw190-point ${window.__unvrslSelectedBodyweightDate===p[i].d?'is-selected':''}" data-bw-date="${p[i].d}" data-bw-value="${p[i].v}" cx="${a[0]}" cy="${a[1]}" r="${i===xy.length-1?4.5:3}" fill="#bf5af2" role="button" tabindex="0" aria-label="${fmt(p[i].v)} кг, ${p[i].d}" onclick="bw190SelectPoint('${p[i].d}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();bw190SelectPoint('${p[i].d}')}"/>`).join('')}${dates}</svg>`;
  }

  function weightHtml(){
    const a=weights(),last=a.length?a[a.length-1]:null,g=goal(),diff=last&&g?+(g-last.v).toFixed(1):null;
    let copy='';if(last&&g)copy=diff===0?`◎ Цель ${fmt(g)} кг · достигнута`:diff>0?`◎ Цель ${fmt(g)} кг · набрать ${fmt(Math.abs(diff))} кг`:`◎ Цель ${fmt(g)} кг · снизить ${fmt(Math.abs(diff))} кг`;
    const d=last?parseDate(last.d):null,dateText=d?`${['Вс','Пн','Вт','Ср','Чт','Пт','Сб'][d.getDay()]}, ${d.getDate()} ${['янв.','февр.','мар.','апр.','мая','июн.','июл.','авг.','сент.','окт.','нояб.','дек.'][d.getMonth()]}`:'';
    return `<div class="sd2-card"><div class="sd2-weight-head"><div class="sd2-weight-label">Вес тела</div><div class="sd2-weight-actions"><button class="sd2-goal-link" onclick="statsGoalSheet()">◎ ${g?fmt(g):'Цель'}</button><button class="sd2-write" onclick="statsWeightSheet()">＋ Записать</button></div></div><div class="sd2-current-row"><div class="sd2-current">${last?fmt(last.v):'—'} <small>кг</small></div><div class="sd2-last-date">${dateText}</div></div>${copy?`<div class="sd2-goal-copy">${copy}</div>`:''}<div class="sd2-seg">${[['1m','1М'],['3m','3М'],['1y','1Г'],['all','Все']].map(([k,l])=>`<button class="${range===k?'on':''}" onclick="homeStatsWeightRange('${k}')">${l}</button>`).join('')}</div>${chartHtml()}</div>`;
  }

  function removeOldHomeWeight(root){
    [...root.children].forEach(el=>{
      if(el.classList?.contains('home-stats-v2'))return;
      if(el.classList?.contains('dash-weight-card'))el.remove();
      else if(el.classList?.contains('card')&&/^\s*Вес тела/i.test((el.textContent||'').trim()))el.remove();
    });
  }

  function insertHost(root){
    let host=root.querySelector(':scope > .home-stats-v2');
    if(!host){host=document.createElement('div');host.className='home-stats-v2';}
    host.innerHTML=heatmapHtml()+weightHtml();
    const cards=[...root.children].filter(x=>x!==host&&x.classList?.contains('card'));
    const clientMode=window.cloud?.profile?.role==='client';
    const anchor=clientMode?(cards[1]||cards[0]):(root.querySelector(':scope > .calendar-card')||cards[0]);
    if(anchor)anchor.after(host);else root.prepend(host);
    requestAnimationFrame(()=>{const h=document.getElementById('homeHeatWrap');if(h)h.scrollLeft=h.scrollWidth});
  }

  async function renderHomeProgress(force=false){
    const root=document.getElementById('home');if(!root)return;
    removeOldHomeWeight(root);
    insertHost(root);
    await hydrate(force);
    if(document.getElementById('home')?.classList.contains('active')){removeOldHomeWeight(root);insertHost(root)}
  }
  window.homeProgressRefresh=renderHomeProgress;
  window.homeStatsWeightRange=function(k){range=k;renderHomeProgress(false)};

  function installSaveHooks(){
    if(typeof window.statsSaveWeight==='function'&&!window.statsSaveWeight.__homeRefresh){
      const base=window.statsSaveWeight;const wrapped=async function(){const r=await base.apply(this,arguments);cache.loaded=false;await renderHomeProgress(true);return r};wrapped.__homeRefresh=true;window.statsSaveWeight=wrapped;try{statsSaveWeight=wrapped}catch(e){}
    }
    if(typeof window.statsSaveGoal==='function'&&!window.statsSaveGoal.__homeRefresh){
      const base=window.statsSaveGoal;const wrapped=async function(){const r=await base.apply(this,arguments);cache.loaded=false;await renderHomeProgress(true);return r};wrapped.__homeRefresh=true;window.statsSaveGoal=wrapped;try{statsSaveGoal=wrapped}catch(e){}
    }
  }

  function installHomeWrap(){
    const cur=window.home;if(typeof cur!=='function'||cur.__homeStatsV2)return;
    const base=cur;const wrapped=function(){const r=base.apply(this,arguments);setTimeout(()=>renderHomeProgress(false),0);return r};wrapped.__homeStatsV2=true;window.home=wrapped;try{home=wrapped}catch(e){}
  }

  installSaveHooks();installHomeWrap();
  [40,350,1000,2200].forEach(t=>setTimeout(()=>{installSaveHooks();installHomeWrap();if(document.getElementById('home')?.classList.contains('active'))renderHomeProgress(false)},t));
})();
