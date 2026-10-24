'use strict';
(()=>{
  if(window.__unvrslHomeStatsV254)return;
  window.__unvrslHomeStatsV254=true;

  const css=document.createElement('style');
  css.id='home-stats-v254-style';
  css.textContent=`
    #home .home-stats-v254{margin-top:12px}
    #home .home-stats-v254 .sd2-card{background:#1c1c1f;border:1px solid #26272c;border-radius:23px;padding:17px;margin:12px 0;overflow:hidden}
    #home .home-stats-v254 .sd2-card:first-child{margin-top:0}
    #home .home-stats-v254 .sd2-card:last-child{margin-bottom:0}
    #home .home-stats-v254 .sd2-card-title{color:#aaaab0;font-size:14px;line-height:1.35;margin-bottom:14px}
    #home .home-stats-v254 .sd2-heat-wrap{overflow-x:auto;padding-bottom:3px;-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain}
    #home .home-stats-v254 .sd2-heat{display:grid;grid-template-rows:repeat(7,10px);grid-auto-flow:column;grid-auto-columns:10px;gap:4px;width:max-content;min-width:100%}
    #home .home-stats-v254 .sd2-cell{width:10px;height:10px;border-radius:3px;background:#2c2c31}
    #home .home-stats-v254 .sd2-cell.l1{background:color-mix(in srgb,var(--green) 28%,#2c2c31)}
    #home .home-stats-v254 .sd2-cell.l2{background:color-mix(in srgb,var(--green) 46%,#2c2c31)}
    #home .home-stats-v254 .sd2-cell.l3{background:color-mix(in srgb,var(--green) 68%,#2c2c31)}
    #home .home-stats-v254 .sd2-cell.l4{background:var(--green)}
    #home .home-stats-v254 .sd2-legend{display:flex;justify-content:flex-end;align-items:center;gap:5px;color:#77777d;font-size:11px;margin-top:11px}
    #home .home-stats-v254 .sd2-legend i{width:10px;height:10px;border-radius:3px;display:inline-block}
    #home .home-stats-v254 .sd2-weight-head{display:flex;justify-content:space-between;gap:10px;align-items:center}
    #home .home-stats-v254 .sd2-weight-label{font-size:15px;color:#9b9ba1}
    #home .home-stats-v254 .sd2-weight-actions{display:flex;align-items:center;gap:14px;flex-wrap:wrap;justify-content:flex-end}
    #home .home-stats-v254 .sd2-goal-link,#home .home-stats-v254 .sd2-write{border:0;background:transparent;padding:0;font-size:16px;touch-action:manipulation}
    #home .home-stats-v254 .sd2-goal-link{color:#ffd60a}#home .home-stats-v254 .sd2-write{color:var(--green)}
    #home .home-stats-v254 .sd2-current-row{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;margin:18px 0 5px}
    #home .home-stats-v254 .sd2-current{font-size:46px;line-height:1;font-weight:900;letter-spacing:-1.5px}
    #home .home-stats-v254 .sd2-current small{font-size:20px;color:#a4a4aa;font-weight:700}
    #home .home-stats-v254 .sd2-last-date{color:#6f6f76;font-size:14px}
    #home .home-stats-v254 .sd2-goal-copy{color:#ffd60a;font-size:15px;margin:8px 0 14px}
    #home .home-stats-v254 .sd2-seg{display:grid;grid-template-columns:repeat(4,1fr);background:#3a3a3f;border-radius:12px;padding:2px;margin:12px 0 6px}
    #home .home-stats-v254 .sd2-seg button{border:0;background:transparent;color:#aaaab0;padding:9px 4px;border-radius:10px;font-size:14px}
    #home .home-stats-v254 .sd2-seg button.on{background:#202023;color:#fff}
    #home .home-stats-v254 .sd2-chart{display:block;width:100%;height:auto;margin-top:8px;overflow:visible}
    #home .home-stats-v254 .sd2-axis{font-size:9px;fill:#77777e}#home .home-stats-v254 .sd2-date{font-size:9px;fill:#6f6f76}
    #home .home-stats-v254 .sd2-empty{color:#85858b;padding:6px 0}
    #home .home-stats-v254 .sd2-activity-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:20px}
    #home .home-stats-v254 .sd2-activity-head h2{margin:0;font-size:22px;line-height:1.2;letter-spacing:-.4px;color:var(--text)}
    #home .home-stats-v254 .sd2-activity-head>span{color:var(--muted,#8e8e93);font-size:11px}
    #home .home-stats-v254 .sd2-activity-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0;margin-bottom:22px}
    #home .home-stats-v254 .sd2-activity-metric{min-width:0;padding-right:9px}
    #home .home-stats-v254 .sd2-activity-metric+.sd2-activity-metric{border-left:1px solid var(--line,#343438);padding-left:10px}
    #home .home-stats-v254 .sd2-activity-metric:last-child{padding-right:0}
    #home .home-stats-v254 .sd2-activity-label{font-size:11px;line-height:1.3;color:var(--muted,#8e8e93);white-space:nowrap}
    #home .home-stats-v254 .sd2-activity-label .short{display:none}
    #home .home-stats-v254 .sd2-activity-number{display:flex;align-items:baseline;gap:6px;flex-wrap:wrap;margin:11px 0 5px;min-height:35px}
    #home .home-stats-v254 .sd2-activity-number b{font-size:clamp(25px,8vw,33px);line-height:1;font-weight:800;letter-spacing:-1px;font-variant-numeric:tabular-nums;color:var(--text);white-space:nowrap}
    #home .home-stats-v254 .sd2-activity-delta{display:block;margin-top:5px;font-size:12px;line-height:1.4;font-weight:700;color:var(--muted,#8e8e93);overflow-wrap:anywhere}
    #home .home-stats-v254 .sd2-activity-delta.up{color:var(--green)}
    #home .home-stats-v254 .sd2-activity-previous{margin-top:10px;font-size:12px;line-height:1.4;color:var(--muted,#8e8e93)}
    #home .home-stats-v254 .sd2-activity-previous b{font-weight:700;color:var(--text);font-variant-numeric:tabular-nums}
    #home .home-stats-v254 .sd2-activity-unit{font-size:11px;line-height:1.3;color:var(--muted,#8e8e93)}
    #home .home-stats-v254 .sd2-activity-grid-title{font-size:14px;line-height:1.35;color:var(--muted,#8e8e93);margin-bottom:14px}
    #home .home-stats-v254 .sd2-activity-card .sd2-cell,#home .home-stats-v254 .sd2-activity-card .sd2-legend i{background:color-mix(in srgb,var(--text) 10%,var(--panel,#1c1c1f))}
    #home .home-stats-v254 .sd2-activity-card :is(.sd2-cell,.sd2-legend i).l1{background:color-mix(in srgb,var(--green) 28%,var(--panel2,#2c2c31))}
    #home .home-stats-v254 .sd2-activity-card :is(.sd2-cell,.sd2-legend i).l2{background:color-mix(in srgb,var(--green) 46%,var(--panel2,#2c2c31))}
    #home .home-stats-v254 .sd2-activity-card :is(.sd2-cell,.sd2-legend i).l3{background:color-mix(in srgb,var(--green) 68%,var(--panel2,#2c2c31))}
    #home .home-stats-v254 .sd2-activity-card :is(.sd2-cell,.sd2-legend i).l4{background:var(--green)}
    #home .home-stats-v254 .sd2-activity-dates{font-size:10px;line-height:1.4;color:var(--muted,#8e8e93);margin-top:5px}
    #home .home-stats-v254 .sd2-activity-open{border:0;background:transparent;padding:0;min-width:44px;min-height:44px;text-align:left;color:inherit;cursor:pointer}
    #home .home-stats-v254 .sd2-activity-open:focus-visible{outline:2px solid var(--green);outline-offset:2px;border-radius:6px}
    #home .home-stats-v254 .sd2-activity-calendar{display:grid;grid-template-columns:18px minmax(0,1fr);gap:6px}
    #home .home-stats-v254 .sd2-activity-weekdays{display:grid;grid-template-rows:repeat(7,10px);gap:4px;padding-top:3px;font-size:9px;line-height:10px;color:var(--muted,#8e8e93)}
    #home .home-stats-v254 .sd2-activity-calendar .sd2-heat-wrap{padding:3px 2px}
    #home .home-stats-v254 .sd2-cell.is-future{opacity:.25}
    .sd2-activity-detail .sd2-detail-tabs{display:flex;gap:6px;margin:12px 0 18px}
    .sd2-activity-detail .sd2-detail-tabs .btn{flex:1;min-width:0;padding:9px 4px;min-height:44px}
    .sd2-activity-detail .sd2-detail-periods{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
    .sd2-activity-detail .sd2-detail-period{padding:12px;border:1px solid var(--line,#343438);border-radius:14px;min-width:0}
    .sd2-activity-detail .sd2-detail-period-head{min-height:60px;font-size:14px;line-height:1.35}
    .sd2-activity-detail .sd2-detail-period b{display:block;font-size:26px;margin:10px 0 4px}
    .sd2-activity-detail .sd2-detail-date{font-size:12px;line-height:1.5;color:var(--muted,#8e8e93)}
    .sd2-activity-detail .sd2-detail-days{list-style:none;padding:0;margin:10px 0 22px}
    .sd2-activity-detail .sd2-detail-days li{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 0;border-bottom:1px solid var(--line,#343438);font-size:13px}
    .sd2-activity-detail h3{font-size:16px;margin:20px 0 8px}
    #home .home-stats-v254 .sd2-activity-note{font-size:11px;line-height:1.5;color:var(--muted,#8e8e93);margin:16px 0 0}
    @media(max-width:360px){#home .home-stats-v254 .sd2-activity-label .long{display:none}#home .home-stats-v254 .sd2-activity-label .short{display:inline}#home .home-stats-v254 .sd2-activity-metric{padding-right:6px}#home .home-stats-v254 .sd2-activity-metric+.sd2-activity-metric{padding-left:8px}}
    @media(max-width:360px){#home .home-stats-v254 .sd2-activity-delta{font-size:11px;overflow-wrap:normal}}
    @media(max-width:390px){
      #home .home-stats-v254 .sd2-current{font-size:41px}
      #home .home-stats-v254 .sd2-weight-actions{gap:10px}
      #home .home-stats-v254 .sd2-goal-link,#home .home-stats-v254 .sd2-write{font-size:15px}
    }
  `;
  document.head.appendChild(css);

  let range='3m';
  const Activity=window.UNVRSLActivity;
  let cache={owner:null,workouts:[],weights:[],goal:null,loaded:false,workoutsLoaded:false,weightsLoaded:false,loading:false,ts:0,promise:null};
  function ensureOwner(){const owner=window.cloud?.user?.id||null;if(cache.owner!==owner)cache={owner,workouts:[],weights:[],goal:null,loaded:false,workoutsLoaded:false,weightsLoaded:false,loading:false,ts:0,promise:null};return cache}
  const ownsLocal=()=>!window.cloud?.user?.id||!st.accountOwnerId||String(st.accountOwnerId)===String(window.cloud.user.id);
  const num=v=>{const n=Number(v);return Number.isFinite(n)?n:null};
  const fmt=v=>v==null?'—':Number(v).toFixed(1).replace('.0','').replace('.',',');
  const isoDate=d=>{const x=new Date(d);return Number.isNaN(x.getTime())?'':Activity.key(x)};
  const parseDate=s=>new Date(String(s).slice(0,10)+'T12:00:00');
  const isClientMode=()=>!!window.cloud?.user&&!(typeof window.unvrslTrainerMode==='function'?window.unvrslTrainerMode():window.cloud?.profile?.role==='trainer');
  const visibleWeight=x=>!(isClientMode()&&String(x?.d||x?.measure_date||'').slice(0,10)==='2026-08-25'&&Number(x?.v??x?.w??x?.weight_kg)===97.5);

  function localWeights(){return (ownsLocal()?st.bw||[]:[]).map(x=>({d:x.d,v:num(x.w)})).filter(x=>x.d&&x.v!=null&&visibleWeight(x)).sort((a,b)=>a.d.localeCompare(b.d))}
  function workouts(){const c=ensureOwner();return Activity.completedWorkouts(ownsLocal()?st.sessions||[]:[],c.workoutsLoaded?c.workouts:[],{ownerId:window.cloud?.user?.id||st.accountOwnerId||null,deletedIds:st.deletedSessionIds||[],currentId:st.current?.id})}
  function weights(){const c=ensureOwner();return c.weightsLoaded?c.weights:localWeights()}
  window.homeStatsBodyweights=()=>weights().map(x=>({...x}));
  function goal(){const c=ensureOwner();return num(c.goal)??(ownsLocal()?num(st.weightGoalKg):null)}
  async function fetchWorkouts(client,owner){
    const rows=[];for(let from=0;;from+=500){const result=await client.from('workouts').select('workout_date,external_id,payload').eq('user_id',owner).order('workout_date',{ascending:true}).order('external_id',{ascending:true}).range(from,from+499);if(result.error)throw result.error;rows.push(...(result.data||[]));if((result.data||[]).length<500)break}return rows;
  }

  async function hydrate(force=false){
    const target=ensureOwner();if(!window.cloud?.client||!target.owner)return;
    if(target.loading)return target.promise;
    if(!force&&target.loaded&&Date.now()-target.ts<30000)return;
    target.loading=true;
    target.promise=(async()=>{
      try{
        const c=window.cloud.client,uid=target.owner;
        const [wo,bw,pr]=await Promise.allSettled([
          fetchWorkouts(c,uid),
          c.from('bodyweights').select('measure_date,weight_kg').eq('user_id',uid).order('measure_date',{ascending:true}).limit(1000),
          c.from('profiles').select('target_weight_kg').eq('id',uid).maybeSingle()
        ]);
        if(cache!==target||window.cloud?.user?.id!==uid)return;
        if(wo.status==='fulfilled'){
          target.workouts=wo.value.map(w=>({...w.payload,id:w.external_id||w.payload?.id,date:w.workout_date||w.payload?.date,userId:uid}));target.workoutsLoaded=true;
        }else console.warn('home activity hydrate',wo.reason);
        if(bw.status==='fulfilled'&&!bw.value.error){
          const deleted=new Set((st.deletedBodyweights||[]).map(x=>String(x?.d||x||'').slice(0,10)).filter(Boolean));
          target.weights=(bw.value.data||[]).map(x=>({d:String(x.measure_date).slice(0,10),v:num(x.weight_kg)})).filter(x=>x.v!=null&&!deleted.has(x.d)&&visibleWeight(x)).sort((a,b)=>a.d.localeCompare(b.d));target.weightsLoaded=true;
        }
        if(pr.status==='fulfilled'&&!pr.value.error)target.goal=num(pr.value.data?.target_weight_kg)??(ownsLocal()?num(st.weightGoalKg):null);
        target.loaded=true;target.ts=Date.now();
      }catch(e){console.warn('home stats hydrate',e)}finally{target.loading=false;target.promise=null}
    })();return target.promise;
  }

  const activityRange=(from,until)=>{
    const a=Activity.calendarDate(from),b=Activity.calendarDate(until);if(!a||!b)return '';
    const months=['янв.','февр.','мар.','апр.','мая','июн.','июля','авг.','сент.','окт.','нояб.','дек.'];
    if(a.getFullYear()!==b.getFullYear())return `${a.getDate()} ${months[a.getMonth()]} ${a.getFullYear()} – ${b.getDate()} ${months[b.getMonth()]} ${b.getFullYear()}`;
    return a.getMonth()===b.getMonth()?`${a.getDate()}–${b.getDate()} ${months[b.getMonth()]}`:`${a.getDate()} ${months[a.getMonth()]} – ${b.getDate()} ${months[b.getMonth()]}`;
  };
  window.homeStatsActivityDetails=function(kind='week'){
    const report=Activity.periodDetails(workouts(),kind),{current,previous,compared,summary}=report;
    const names={week:['Эта неделя','Прошлая неделя'],month:['Этот месяц','Прошлый месяц'],year:[`За ${summary.year} год`]};
    const section=(p,label,role)=>`<div class="sd2-detail-period" data-period="${role}"><div class="sd2-detail-period-head"><div>${label}</div><div class="sd2-detail-date">${activityRange(p.from,p.until)}${p.from.slice(0,4)===p.until.slice(0,4)?' '+p.from.slice(0,4):''}</div></div><b data-period-count>${p.count}</b><span class="muted small">${Activity.workoutWord(p.count)}</span></div>`;
    const days=(p,label,role)=>`<h3>${label} · ${p.count} ${Activity.workoutWord(p.count)}</h3>${p.days.length?`<ul class="sd2-detail-days" data-period-days="${role}">${p.days.map(d=>`<li data-counted-date="${d.date}" data-counted-workouts="${d.count}"><time datetime="${d.date}">${Activity.calendarDate(d.date).toLocaleDateString('ru-RU',{weekday:'short',day:'numeric',month:'long'})}</time><span>${d.count} ${Activity.workoutWord(d.count)}</span></li>`).join('')}</ul>`:'<p class="muted small">Завершённых тренировок за эти даты нет.</p>'}`;
    const explanation=kind==='week'?'Сравниваются полные календарные недели: понедельник–воскресенье. На текущей неделе учитываются уже завершённые тренировки.':previous?(compared.count===current.count&&compared.until===current.until?'Сравниваются одинаковые дни предыдущего периода.':`Для сравнения взяты ${activityRange(compared.from,compared.until)}: ${compared.count} ${Activity.workoutWord(compared.count)}; ${activityRange(previous.from,previous.until)}: ${previous.count} ${Activity.workoutWord(previous.count)}.`):'Завершённые тренировки с 1 января по сегодня.';
    const change=previous?`Разница: ${report.delta>0?'+':''}${report.delta}.`:'';
    modal(`<div class="sd2-activity-detail" data-activity-detail="${kind}"><h2>Тренировки по датам</h2><div class="sd2-detail-tabs">${[['week','Неделя'],['month','Месяц'],['year','Год']].map(([key,label])=>`<button class="btn ${key===kind?'primary':''}" onclick="homeStatsActivityDetails('${key}')" aria-pressed="${key===kind}">${label}</button>`).join('')}</div><div class="sd2-detail-periods">${section(current,names[kind][0],'current')}${previous?section(previous,names[kind][1],'previous'):''}</div><p class="muted small">${explanation} ${change}</p>${days(current,names[kind][0],'current')}${previous?days(previous,names[kind][1],'previous'):''}</div>`);
  };

  function heatmapHtml(){
    const stats=Activity.summarize(workouts()),format=n=>Number(n).toLocaleString('ru-RU'),delta=(value,kind)=>{
      const comparison=stats[kind],text=value===0?'Без изменений':`${value>0?'+':'−'}${format(Math.abs(value))} к ${kind==='week'?'прошлой':'прошлому'}`;
      const label=`${kind==='week'?'Полная календарная неделя':'Месяц'}: ${kind==='month'&&comparison.shorterPreviousMonth?comparison.compared:comparison.count} ${Activity.workoutWord(kind==='month'&&comparison.shorterPreviousMonth?comparison.compared:comparison.count)} за период. За прошлый период: ${comparison.previous}. Изменение: ${value>0?'+':''}${value}.`;
      return `<span class="sd2-activity-delta ${value>0?'up':value<0?'down':'same'}" title="${label}" aria-label="${label}">${text}</span>`;
    };
    const metric=(kind,long,short)=>{const x=stats[kind];return `<div class="sd2-activity-metric" data-activity="${kind}"><div class="sd2-activity-label"><span class="long">${long}</span><span class="short">${short}</span></div><div class="sd2-activity-dates">${activityRange(x.from,kind==='week'?x.until:stats.today)}</div><div class="sd2-activity-number"><button class="sd2-activity-open" onclick="homeStatsActivityDetails('${kind}')" aria-label="Показать тренировки: ${long.toLowerCase()}"><b data-activity-count>${format(x.count)}</b></button></div><span class="sd2-activity-unit">${Activity.workoutWord(x.count)}</span><div class="sd2-activity-previous"><b data-activity-previous-count>${format(x.previous)}</b> за ${activityRange(x.previousFrom,x.previousUntil)}</div>${kind==='month'&&x.shorterPreviousMonth?`<div class="sd2-activity-dates">Сейчас за ${activityRange(x.from,x.comparedUntil)}: ${format(x.compared)}</div>`:''}${delta(x.delta,kind)}</div>`};
    const maxMinutes=Math.max(1,...stats.days.map(x=>x.minutes));
    const cells=stats.weeks.map(week=>week.days.map(x=>{const ratio=x.minutes/maxMinutes,level=x.minutes?(ratio>.72?4:ratio>.42?3:ratio>.18?2:1):x.count?1:0,title=x.future?'день ещё не наступил':x.count?`${x.count} ${Activity.workoutWord(x.count)} · ${x.minutes?x.minutes+' мин':'время не указано'}`:'нет тренировки';return `<i class="sd2-cell ${level?'l'+level:''} ${x.future?'is-future':''}" data-week-start="${week.from}" data-current-week="${week.current}" data-activity-date="${x.date}" data-count="${x.count}" data-minutes="${x.minutes}" title="${x.date}: ${title}"></i>`}).join('')).join('');
    const note=stats.month.shorterPreviousMonth?`Недели — Пн–Вс. Месяц — первые ${stats.month.comparedDays} дней.`:'Недели — целиком, Пн–Вс. Месяцы — за одинаковые дни.';
    return `<div class="sd2-card sd2-activity-card"><div class="sd2-activity-head"><h2>Активность</h2><span>Тренировки</span></div><div class="sd2-activity-summary">${metric('week','На этой неделе','Неделя')}${metric('month','В этом месяце','Месяц')}<div class="sd2-activity-metric" data-activity="year"><div class="sd2-activity-label">За ${stats.year} год</div><div class="sd2-activity-dates">${activityRange(`${stats.year}-01-01`,stats.today)}</div><div class="sd2-activity-number"><button class="sd2-activity-open" onclick="homeStatsActivityDetails('year')" aria-label="Показать тренировки за год"><b data-activity-count>${format(stats.yearCount)}</b></button></div><span class="sd2-activity-unit">${Activity.workoutWord(stats.yearCount)}</span></div></div><div class="sd2-activity-grid-title">Последние 12 месяцев · по времени тренировок</div><div class="sd2-activity-calendar"><div class="sd2-activity-weekdays" aria-hidden="true">${['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(d=>`<span>${d}</span>`).join('')}</div><div class="sd2-heat-wrap" id="homeHeatWrap"><div class="sd2-heat" role="img" aria-label="Столбцы — недели, дни сверху вниз с понедельника по воскресенье">${cells}</div></div></div><div class="sd2-legend"><span>Меньше</span><i></i><i class="l1"></i><i class="l2"></i><i class="l3"></i><i class="l4"></i><span>Больше</span></div><p class="sd2-activity-note">${note} Нажми на число, чтобы сверить даты тренировок.</p></div>`;
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
    return `<div class="sd2-card"><div class="sd2-weight-head"><div class="sd2-weight-label">Вес тела</div><div class="sd2-weight-actions"><button class="sd2-goal-link" onclick="homeStatsGoalSheet()">◎ ${g?fmt(g):'Цель'}</button><button class="sd2-write" onclick="homeStatsWeightSheet()">＋ Записать</button></div></div><div class="sd2-current-row"><div class="sd2-current">${last?fmt(last.v):'—'} <small>кг</small></div><div class="sd2-last-date">${dateText}</div></div>${copy?`<div class="sd2-goal-copy">${copy}</div>`:''}<div class="sd2-seg">${[['1m','1М'],['3m','3М'],['1y','1Г'],['all','Все']].map(([k,l])=>`<button class="${range===k?'on':''}" onclick="homeStatsWeightRange('${k}')">${l}</button>`).join('')}</div>${chartHtml()}</div>`;
  }

  window.homeStatsWeightSheet=function(){
    const a=weights(),last=a.length?a.at(-1).v:'';
    modal(`<div class="sheet-grabber"></div><h2>Записать вес</h2><div class="field"><label>Дата</label><input id="homeStatsWeightDate" type="date" value="${isoDate(new Date())}"></div><div class="field"><label>Вес, кг</label><input id="homeStatsWeightValue" type="number" inputmode="decimal" min="30" max="350" step="0.1" value="" placeholder="${last?fmt(last):'Например, 75.5'}"></div><button class="btn primary full" onclick="homeStatsSaveWeight()">Сохранить</button>`);
  };
  window.homeStatsSaveWeight=async function(){
    const d=document.getElementById('homeStatsWeightDate')?.value||isoDate(new Date()),v=num(String(document.getElementById('homeStatsWeightValue')?.value||'').replace(',','.'));
    if(!v||v<30||v>350)return toast('Проверь вес');
    const now=Date.now();st.bw=Array.isArray(st.bw)?st.bw:[];const i=st.bw.findIndex(x=>x.d===d),row={d,w:+v.toFixed(1),t:now,updatedAt:now};
    if(i>=0)st.bw[i]=row;else st.bw.push(row);st.bw.sort((a,b)=>a.d.localeCompare(b.d));
    st.deletedBodyweights=(Array.isArray(st.deletedBodyweights)?st.deletedBodyweights:[]).filter(x=>String(x?.d||x||'').slice(0,10)!==d);save();
    if(window.cloud?.client&&window.cloud?.user){const r=await window.cloud.client.from('bodyweights').upsert({user_id:window.cloud.user.id,measure_date:d,weight_kg:+v.toFixed(1)},{onConflict:'user_id,measure_date'});if(r.error)console.warn('home weight save',r.error)}
    cache.loaded=false;closeModal();await renderHomeProgress(true);toast('Вес записан');
  };
  window.homeStatsGoalSheet=function(){
    const g=goal();modal(`<div class="sheet-grabber"></div><h2>Цель по весу</h2><div class="field"><label>Целевой вес, кг</label><input id="homeStatsGoal" type="number" inputmode="decimal" min="30" max="350" step="0.1" value="${g||''}" placeholder="Например, 100"></div><button class="btn primary full" onclick="homeStatsSaveGoal()">Сохранить</button>`);
  };
  window.homeStatsSaveGoal=async function(){
    const v=num(String(document.getElementById('homeStatsGoal')?.value||'').replace(',','.'));if(!v||v<30||v>350)return toast('Проверь целевой вес');
    st.weightGoalKg=+v.toFixed(1);save();
    if(window.cloud?.client&&window.cloud?.user){const r=await window.cloud.client.from('profiles').update({target_weight_kg:+v.toFixed(1),updated_at:new Date().toISOString()}).eq('id',window.cloud.user.id);if(r.error)console.warn('home goal save',r.error)}
    cache.goal=+v.toFixed(1);cache.loaded=false;closeModal();await renderHomeProgress(true);toast('Цель сохранена');
  };

  function removeOldHomeWeight(root){
    [...root.children].forEach(el=>{
      if(el.classList?.contains('home-stats-v254'))return;
      if(el.classList?.contains('dash-weight-card'))el.remove();
      else if(el.classList?.contains('card')&&/^\s*Вес тела/i.test((el.textContent||'').trim()))el.remove();
    });
  }

  function insertHost(root){
    let host=root.querySelector(':scope > .home-stats-v254');
    if(!host){host=document.createElement('div');host.className='home-stats-v254';}
    const html=heatmapHtml()+weightHtml();
    if(host.__homeStatsHtml!==html){host.innerHTML=html;host.__homeStatsHtml=html}
    const cards=[...root.children].filter(x=>x!==host&&x.classList?.contains('card'));
    const clientMode=isClientMode();
    const anchor=clientMode?(root.querySelector(':scope > .client-plan-card-v255')||cards[1]||cards[0]):(root.querySelector(':scope > .calendar-card')||cards[0]);
    if(anchor){if(anchor.nextElementSibling!==host)anchor.after(host)}else if(root.firstElementChild!==host)root.prepend(host);
    window.dispatchEvent(new CustomEvent('unvrsl:home-progress-rendered'));
    requestAnimationFrame(()=>{const h=document.getElementById('homeHeatWrap');if(h)h.scrollLeft=h.scrollWidth});
  }

  async function renderHomeProgress(force=false){
    const root=document.getElementById('home');if(!root)return;
    const stable=fn=>{
      const active=root.classList.contains('active'),y=(window.unvrslScrollTop?.()??window.scrollY??0);
      fn();
      if(active&&y>0)(window.unvrslScrollTo||window.scrollTo)({top:y,left:0,behavior:'auto'});
    };
    stable(()=>{removeOldHomeWeight(root);insertHost(root)});
    await hydrate(force);
    if(document.getElementById('home')?.classList.contains('active'))stable(()=>{removeOldHomeWeight(root);insertHost(root)})
  }
  window.homeProgressRefresh=renderHomeProgress;
  window.homeStatsWeightRange=function(k){range=k;renderHomeProgress(false)};

  function installHomeWrap(){
    const cur=window.home;if(typeof cur!=='function'||cur.__homeStatsV254)return;
    const base=cur;const wrapped=function(){const r=base.apply(this,arguments);setTimeout(()=>renderHomeProgress(false),0);return r};wrapped.__homeStatsV254=true;window.home=wrapped;try{home=wrapped}catch(e){}
  }

  for(const event of ['unvrsl:history-updated','unvrsl:cloud-ready','unvrsl:auth-changed','unvrsl:storage-hydrated'])window.addEventListener(event,()=>{ensureOwner();if(document.getElementById('home')?.classList.contains('active'))renderHomeProgress(true)});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&document.getElementById('home')?.classList.contains('active'))renderHomeProgress(false)});
  installHomeWrap();
  [40,350,1000,2200].forEach(t=>setTimeout(()=>{installHomeWrap();if(document.getElementById('home')?.classList.contains('active'))renderHomeProgress(false)},t));
})();

