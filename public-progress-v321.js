'use strict';
(()=>{
  const W=window,D=document,root=D.getElementById('progressRoot');
  const MEASURES=[['chest','Грудь'],['waist','Талия'],['abdomen','Живот'],['hips','Ягодицы'],['thigh','Бедро'],['arm','Рука'],['calf','Икра']];
  let data=null,measureKey='waist',chartId=0;
  const A=v=>Array.isArray(v)?v:[];
  const N=v=>{if(v===''||v==null)return null;const n=Number(v);return Number.isFinite(n)?n:null};
  const E=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const fmt=(v,d=1)=>{const n=N(v);return n==null?'—':n.toFixed(d).replace(/\.0$/,'').replace('.',',')};
  const day=v=>{const p=String(v||'').slice(0,10).split('-');return p.length===3?`${p[2]}.${p[1]}.${p[0]}`:String(v||'')};
  const shortDay=v=>{const p=String(v||'').slice(0,10).split('-');return p.length===3?`${p[2]}.${p[1]}`:String(v||'')};
  const sorted=(rows,key)=>A(rows).slice().sort((a,b)=>String(a?.[key]||'').localeCompare(String(b?.[key]||'')));
  const change=points=>points.length<2?null:+(points[points.length-1].value-points[0].value).toFixed(1);
  const signed=(value,unit)=>`${value>0?'+':''}${String(value).replace('.',',')} ${unit}`;

  function chart(points,{color='#bf5af2',unit='',label='Динамика'}={}){
    const clean=A(points).map(x=>({date:String(x.date||''),value:N(x.value)})).filter(x=>x.date&&x.value!=null).slice(-80);
    if(!clean.length)return'<div class="pp-empty">Пока нет данных для графика</div>';
    const w=360,h=150,px=18,py=18,vals=clean.map(x=>x.value),min0=Math.min(...vals),max0=Math.max(...vals),span=Math.max(1,max0-min0),min=min0-span*.12,max=max0+span*.12,range=max-min;
    const xy=clean.map((x,i)=>({x:clean.length===1?w/2:px+i*(w-px*2)/(clean.length-1),y:h-py-(x.value-min)/range*(h-py*2),...x}));
    const path=xy.map((p,i)=>`${i?'L':'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' '),area=`M ${xy[0].x.toFixed(1)} ${h-py} ${path.replace(/^M/,'L')} L ${xy[xy.length-1].x.toFixed(1)} ${h-py} Z`,id=`pp-gradient-${++chartId}`;
    return `<div class="pp-chart" role="img" aria-label="${E(label)}"><svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".24"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs><line x1="${px}" y1="${h-py}" x2="${w-px}" y2="${h-py}" stroke="#34343a"/><line x1="${px}" y1="${h/2}" x2="${w-px}" y2="${h/2}" stroke="#29292e" stroke-dasharray="4 5"/><path d="${area}" fill="url(#${id})"/><path d="${path}" fill="none" stroke="${color}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>${xy.map((p,i)=>`<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${i===xy.length-1?5:3}" fill="${color}" stroke="#17171a" stroke-width="2" vector-effect="non-scaling-stroke"><title>${E(day(p.date))}: ${E(fmt(p.value))} ${E(unit)}</title></circle>`).join('')}</svg><div class="pp-axis"><span>${E(shortDay(clean[0].date))}</span><span>${clean.length===1?'Нужна ещё одна запись':E(shortDay(clean[clean.length-1].date))}</span></div></div>`
  }

  function weightPoints(){return sorted(data?.measurements,'date').map(x=>({date:x.date,value:N(x.weight)})).filter(x=>x.value!=null&&x.value>0)}
  function measures(){return MEASURES.map(([key,name])=>({key,name,points:sorted(data?.measurements,'date').map(x=>({date:x.date,value:N(x.measurements?.[key])})).filter(x=>x.value!=null&&x.value>0)})).filter(x=>x.points.length)}
  function groups(){const map=new Map();A(data?.strengths).forEach(x=>{const key=String(x.key||x.name||'');if(!key)return;if(!map.has(key))map.set(key,{key,name:x.name||'Упражнение',rows:[]});map.get(key).rows.push(x)});return[...map.values()].sort((a,b)=>String(b.rows[b.rows.length-1]?.date||'').localeCompare(String(a.rows[a.rows.length-1]?.date||'')))}
  function strengthSeries(rows){const list=sorted(rows,'date'),mode=list.some(x=>N(x.e1rm)>0)?'e1rm':list.some(x=>N(x.weight)>0)?'weight':'reps',label=mode==='e1rm'?'Расчётный 1ПМ':mode==='weight'?'Рабочий вес':'Повторения',unit=mode==='reps'?'повт.':'кг',points=list.map(x=>({date:x.date,value:N(x[mode])})).filter(x=>x.value!=null);return{label,unit,points}}
  function strengthSummary(row){const out=[];if(N(row?.weight)!=null)out.push(`${fmt(row.weight)} кг`);if(N(row?.reps)!=null)out.push(`${fmt(row.reps,0)} повт.`);if(N(row?.e1rm)!=null)out.push(`1ПМ ≈ ${fmt(row.e1rm)} кг`);return out.join(' · ')||'Нет данных'}
  const whole=value=>{const n=N(value);return n==null?'—':Math.round(n).toLocaleString('ru-RU')};
  const range=(values,unit='')=>Array.isArray(values)&&values.length===2?`${whole(values[0])}–${whole(values[1])}${unit}`:'—';

  function nutritionGoal(goal){
    if(!goal)return'';
    return `<article class="pp-nutrition-goal"><div class="pp-goal-head"><b>${E(goal.title)}</b><strong>${E(range(goal.calories,' ккал'))}</strong></div><div class="pp-macros"><span><small>Белок</small><b>${E(range(goal.protein,' г'))}</b></span><span><small>Жиры</small><b>${E(range(goal.fat,' г'))}</b></span><span><small>Углеводы</small><b>${E(range(goal.carbs,' г'))}</b></span></div></article>`
  }
  function nutritionPanel(){
    const n=data?.nutrition;if(!n)return'';
    return `<section class="pp-panel pp-nutrition"><div class="pp-nutrition-head"><div><div class="pp-kicker">ПИТАНИЕ</div><h2>Расчёт КБЖУ</h2><p>Обновлено ${E(day(n.updatedAt||data?.generatedAt))}</p></div><div class="pp-tdee"><span>Поддержание</span><b>${E(whole(n.tdee))}</b><small>ккал в день</small></div></div><div class="pp-nutrition-base"><div><span>BMR</span><b>${E(whole(n.bmr))} ккал</b><small>${E(n.formula)}</small></div><div><span>Активность</span><b>× ${E(String(n.activityFactor).replace('.',','))}</b><small>коэффициент</small></div></div><div class="pp-nutrition-goals">${nutritionGoal(n.goals?.cut)}${nutritionGoal(n.goals?.maintain)}${nutritionGoal(n.goals?.gain)}</div><p class="pp-nutrition-note">Белки и жиры рассчитаны по весу, углеводы – остатком от калорий. Это стартовый ориентир, который уточняется по динамике.</p></section>`
  }

  function weightPanel(){const points=weightPoints(),last=points[points.length-1],delta=change(points);return `<section class="pp-panel"><div class="pp-head"><div><div class="pp-kicker">ВЕС</div><div class="pp-value">${last?`${fmt(last.value)} <small>кг</small>`:'Нет записей'}</div></div>${delta==null?'':`<div class="pp-change">${E(signed(delta,'кг'))}<small>за период</small></div>`}</div>${chart(points,{color:'#bf5af2',unit:'кг',label:'Динамика веса'})}</section>`}
  function measurePanel(){
    const list=measures();if(!list.length)return'<section class="pp-panel"><div class="pp-kicker">ЗАМЕРЫ</div><div class="pp-empty">Замеров пока нет</div></section>';
    if(!list.some(x=>x.key===measureKey))measureKey=list[0].key;const current=list.find(x=>x.key===measureKey)||list[0],last=current.points[current.points.length-1],delta=change(current.points);
    return `<section id="publicMeasurePanel" class="pp-panel"><div class="pp-head"><div><div class="pp-kicker">ЗАМЕРЫ</div><div class="pp-value">${fmt(last.value)} <small>см</small></div></div>${delta==null?'':`<div class="pp-change">${E(signed(delta,'см'))}<small>за период</small></div>`}</div><div class="pp-tabs">${list.map(x=>`<button class="${x.key===current.key?'on':''}" onclick="publicProgressMetricV321('${E(x.key)}')">${E(x.name)}</button>`).join('')}</div>${chart(current.points,{color:'#64d2ff',unit:'см',label:`Динамика: ${current.name}`})}</section>`
  }
  function strengthCards(){const list=groups();if(!list.length)return'<div class="pp-panel pp-empty">Силовых показателей пока нет</div>';return `<div class="pp-strength-grid">${list.map(group=>{const rows=sorted(group.rows,'date'),latest=rows[rows.length-1],series=strengthSeries(rows),delta=change(series.points);return `<article class="pp-strength"><h3>${E(group.name)}</h3><div class="pp-meta">${E(strengthSummary(latest))} · ${E(day(latest?.date))}</div><div class="pp-strength-label"><span>${E(series.label)}</span>${delta==null?'':`<b>${E(signed(delta,series.unit))}</b>`}</div>${chart(series.points,{color:'#30d158',unit:series.unit,label:`${group.name}: ${series.label}`})}</article>`}).join('')}</div>`}

  function render(updatedAt){
    const name=data?.client?.name||'Клиент',weights=weightPoints(),lastWeight=weights[weights.length-1]?.value,measureCount=A(data?.measurements).length,strengthCount=groups().length;
    D.title=`Прогресс ${name} · UNVRSL FIT`;
    root.innerHTML=`<header class="pp-hero"><div class="pp-eyebrow">ПРОГРЕСС КЛИЕНТА</div><h1>${E(name)}</h1><p>Обновлено ${E(day(updatedAt||data?.generatedAt))}</p></header><div class="pp-facts"><div class="pp-fact"><span>Вес сейчас</span><b>${lastWeight?`${fmt(lastWeight)} кг`:'—'}</b></div><div class="pp-fact"><span>Замеров</span><b>${measureCount}</b></div><div class="pp-fact"><span>Упражнений</span><b>${strengthCount}</b></div></div>${nutritionPanel()}${weightPanel()}${measurePanel()}<div class="pp-section-head"><div class="pp-kicker">СИЛОВЫЕ</div><h2>Динамика упражнений</h2></div>${strengthCards()}<footer class="pp-footer">Страница доступна только по личной ссылке. Редактирование данных здесь отключено.</footer>`
  }
  function fail(message){root.innerHTML=`<div class="pp-error"><b>Прогресс не найден</b><span>${E(message||'Ссылка неверна, устарела или была обновлена тренером.')}</span></div>`}
  async function hash(token){const bytes=new TextEncoder().encode(token),out=await crypto.subtle.digest('SHA-256',bytes);return[...new Uint8Array(out)].map(x=>x.toString(16).padStart(2,'0')).join('')}
  W.publicProgressMetricV321=function(key){measureKey=String(key||'');const panel=D.getElementById('publicMeasurePanel');if(panel)panel.outerHTML=measurePanel()};

  (async()=>{
    try{
      const token=new URLSearchParams(W.location.hash.replace(/^#/, '')).get('t')||'';
      if(!/^[A-Za-z0-9_-]{40,80}$/.test(token))return fail();
      if(!W.supabase?.createClient||!W.UNVRSL_CLOUD?.url||!W.UNVRSL_CLOUD?.anonKey)throw new Error('Сервис временно недоступен. Попробуй открыть ссылку позже.');
      const client=W.supabase.createClient(W.UNVRSL_CLOUD.url,W.UNVRSL_CLOUD.anonKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}}),tokenHash=await hash(token),result=await client.rpc('get_offline_progress_share',{p_token_hash:tokenHash});
      if(result.error)throw result.error;if(!result.data?.data)return fail();data=result.data.data;render(result.data.updated_at)
    }catch(e){console.warn('UNVRSL public progress',e);fail(e?.message)}
  })();
})();
