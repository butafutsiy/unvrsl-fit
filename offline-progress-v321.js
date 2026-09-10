'use strict';
(()=>{
  const W=window,D=document,REV=334;
  if(W.__unvrslOfflineProgressV328)return;
  W.__unvrslOfflineProgressV328=true;W.__unvrslOfflineProgressV324=true;W.__unvrslOfflineProgressV323=true;W.__unvrslOfflineProgressV322=true;W.__unvrslOfflineProgressV321=true;

  const MEASURES=[
    ['chest','Грудь'],['waist','Талия'],['abdomen','Живот'],['hips','Ягодицы'],
    ['thigh','Бедро'],['arm','Рука'],['calf','Икра']
  ];
  const NUT_ACTIVITY={sedentary:'Сидячая',low:'Невысокая',moderate:'Умеренная',high:'Высокая',very_high:'Очень высокая'};
  const state={id:null,data:null,measureKey:'waist'};
  let chartId=0;

  const A=v=>Array.isArray(v)?v:[];
  const N=v=>{if(v===''||v==null)return null;const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:null};
  const E=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const T=v=>encodeURIComponent(String(v??'')).replace(/'/g,'%27');
  const fmt=(v,d=1)=>{const n=N(v);return n==null?'—':n.toFixed(d).replace(/\.0$/,'').replace('.',',')};
  const iso=()=>new Date().toISOString();
  const today=()=>{const n=new Date(),local=new Date(n.getTime()-n.getTimezoneOffset()*60000);return local.toISOString().slice(0,10)};
  const day=v=>{if(!v)return'—';const p=String(v).slice(0,10).split('-');return p.length===3?`${p[2]}.${p[1]}.${p[0]}`:String(v)};
  const shortDay=v=>{if(!v)return'';const p=String(v).slice(0,10).split('-');return p.length===3?`${p[2]}.${p[1]}`:String(v)};
  const sourceKey=v=>v==='client'?'client':'trainer';
  const sourceName=v=>sourceKey(v)==='client'?'Клиент':'Тренер';
  const sourceBadge=v=>`<span class="ofp-source ${sourceKey(v)}">${sourceName(v)}</span>`;
  const e1rm=(weight,reps)=>{const w=N(weight),r=N(reps);return w>0&&r>=1&&r<=30?+(r===1?w:w*(1+r/30)).toFixed(1):null};
  function age(v){if(!v)return null;const d=new Date(`${v}T12:00:00`);if(Number.isNaN(d.getTime()))return null;const n=new Date();let x=n.getFullYear()-d.getFullYear(),m=n.getMonth()-d.getMonth();if(m<0||(m===0&&n.getDate()<d.getDate()))x--;return x>=14&&x<=100?x:null}
  function measure(row,key){const n=N(row?.measurements?.[key]);return n!=null&&n>0?n:null}
  function signed(v,unit){const n=N(v);if(n==null)return'';const x=Math.round(n*10)/10;return`${x>0?'+':''}${String(x).replace('.',',')} ${unit}`}
  function change(points){if(points.length<2)return null;return +(points[points.length-1].value-points[0].value).toFixed(1)}
  function chronological(rows,dateKey){return A(rows).slice().sort((a,b)=>String(a?.[dateKey]||'').localeCompare(String(b?.[dateKey]||'')))}

  function lineChart(points,{color='#bf5af2',unit='',label='Динамика'}={}){
    const clean=A(points).map(x=>({date:String(x.date||''),value:N(x.value),source:sourceKey(x.source),note:String(x.note||'')})).filter(x=>x.date&&x.value!=null).slice(-80);
    if(!clean.length)return'<div class="ofp-chart-empty">Пока нет данных для графика</div>';
    const count=clean.length,w=Math.max(360,76+Math.max(0,count-1)*78),h=190,L=36,R=18,T=34,B=30,vals=clean.map(x=>x.value),lo0=Math.min(...vals),hi0=Math.max(...vals),span=Math.max(1,hi0-lo0),lo=lo0-span*.14,hi=hi0+span*.14,range=hi-lo,selected=count-1,graphId=`ofp-chart-${REV}-${++chartId}`,gradientId=`ofp-grad-${REV}-${chartId}`;
    const xy=clean.map((x,i)=>({x:count===1?w/2:L+i*(w-L-R)/(count-1),y:h-B-(x.value-lo)/range*(h-T-B),...x})),path=xy.map((p,i)=>`${i?'L':'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' '),area=`M ${xy[0].x.toFixed(1)} ${h-B} ${path.replace(/^M/,'L')} L ${xy[count-1].x.toFixed(1)} ${h-B} Z`,last=clean[selected];
    const pointsHtml=xy.map((p,i)=>{const text=`${fmt(p.value)} ${unit}`,pw=Math.max(45,text.length*6+12),py=Math.max(4,p.y-28);return`<g class="ofp-graph-point ${i===selected?'on':''}" data-ofp-point="${i}" data-ofp-x="${p.x.toFixed(1)}" role="button" tabindex="0" aria-label="${E(day(p.date))}, ${E(text)}" onclick="offlineProgressChartPointV328('${graphId}',${i})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();offlineProgressChartPointV328('${graphId}',${i})}"><circle class="ofp-point-hit" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="21"/><rect class="ofp-point-pill" x="${(p.x-pw/2).toFixed(1)}" y="${py.toFixed(1)}" width="${pw.toFixed(1)}" height="20" rx="8"/><text class="ofp-point-value" x="${p.x.toFixed(1)}" y="${(py+14).toFixed(1)}" text-anchor="middle">${E(text)}</text><circle class="ofp-point-dot" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4"/></g>`}).join('');
    const chips=clean.map((p,i)=>`<button type="button" class="ofp-point-chip ${i===selected?'on':''}" data-ofp-chip="${i}" data-date="${E(day(p.date))}" data-value="${E(`${fmt(p.value)} ${unit}`)}" data-source="${E(p.source)}" data-note="${E(p.note)}" onclick="offlineProgressChartPointV328('${graphId}',${i})"><b>${E(fmt(p.value))} ${E(unit)}</b><span>${E(day(p.date))}</span><small>${E(sourceName(p.source))}</small></button>`).join('');
    return `<div id="${graphId}" class="ofp-chart" role="group" aria-label="${E(label)}"><div class="ofp-chart-focus"><div><span>Выбранная точка</span><b data-ofp-focus-value>${E(fmt(last.value))} ${E(unit)}</b></div><div class="ofp-chart-focus-side"><strong data-ofp-focus-date>${E(day(last.date))}</strong><span data-ofp-focus-source class="ofp-source ${E(last.source)}">${E(sourceName(last.source))}</span></div><p data-ofp-focus-note${last.note?'':' hidden'}>${E(last.note)}</p></div><div class="ofp-chart-canvas" data-ofp-canvas><svg viewBox="0 0 ${w} ${h}" style="width:${w}px;min-width:${w}px"><defs><linearGradient id="${gradientId}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".24"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs><line x1="${L}" y1="${h-B}" x2="${w-R}" y2="${h-B}" stroke="#34343a"/><line x1="${L}" y1="${h/2}" x2="${w-R}" y2="${h/2}" stroke="#29292e" stroke-dasharray="4 5"/><path d="${area}" fill="url(#${gradientId})"/><path d="${path}" fill="none" stroke="${color}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>${pointsHtml}${xy.map(p=>`<text class="ofp-x-label" x="${p.x.toFixed(1)}" y="${h-8}" text-anchor="middle">${E(shortDay(p.date))}</text>`).join('')}</svg></div><div class="ofp-point-scroll">${chips}</div></div>`
  }

  function strengthSeries(rows){
    const sorted=chronological(rows,'measured_at');
    const mode=sorted.some(x=>N(x.e1rm)>0)?'e1rm':sorted.some(x=>N(x.weight_kg)>0)?'weight':'reps';
    const label=mode==='e1rm'?'Расчётный 1ПМ':mode==='weight'?'Рабочий вес':'Повторения',unit=mode==='reps'?'повт.':'кг';
    const points=sorted.map(x=>({date:x.measured_at,value:mode==='e1rm'?N(x.e1rm):mode==='weight'?N(x.weight_kg):N(x.reps),source:x.entry_source,note:x.notes})).filter(x=>x.value!=null);
    return{mode,label,unit,points}
  }

  async function loadDetail(id){
    const c=W.cloud;if(!c?.client||!c?.user)return{error:new Error('Нет подключения к аккаунту тренера')};
    const [client,measurements,strengths]=await Promise.all([
      c.client.from('offline_clients').select('*').eq('id',id).single(),
      c.client.from('offline_client_measurements').select('*').eq('offline_client_id',id).order('measure_date',{ascending:true}).order('created_at',{ascending:true}).limit(160),
      c.client.from('offline_client_strengths').select('*').eq('offline_client_id',id).order('measured_at',{ascending:true}).order('created_at',{ascending:true}).limit(300)
    ]);
    return{client:client.data,measurements:measurements.data||[],strengths:strengths.data||[],error:client.error||measurements.error||strengths.error}
  }

  function weightPoints(data){return chronological(data?.measurements,'measure_date').map(x=>({date:x.measure_date,value:N(x.weight_kg),source:x.entry_source,note:x.notes})).filter(x=>x.value!=null&&x.value>0)}
  function availableMeasures(data){return MEASURES.map(([key,name])=>({key,name,points:chronological(data?.measurements,'measure_date').map(x=>({date:x.measure_date,value:measure(x,key),source:x.entry_source,note:x.notes})).filter(x=>x.value!=null)})).filter(x=>x.points.length)}
  function strengthGroups(data){
    const map=new Map();A(data?.strengths).forEach(row=>{const key=String(row.exercise_key||row.exercise_name||'').trim();if(!key)return;if(!map.has(key))map.set(key,{key,name:row.exercise_name||'Упражнение',rows:[]});map.get(key).rows.push(row)});
    return[...map.values()].sort((a,b)=>String(b.rows[b.rows.length-1]?.measured_at||'').localeCompare(String(a.rows[a.rows.length-1]?.measured_at||'')))
  }
  function latestWeight(data){const p=weightPoints(data);return p[p.length-1]?.value??null}
  function nutritionPlan(data){
    let value=data?.client?.nutrition_plan;if(!value)return null;
    if(typeof value==='string')try{value=JSON.parse(value)}catch(_){return null}
    return value&&typeof value==='object'?value:null
  }
  function kcal(v){const n=N(v);return n==null?'—':Math.round(n).toLocaleString('ru-RU')}
  function nutritionDefaults(data){
    const c=data?.client||{},saved=nutritionPlan(data)?.inputs||{},profileSex=['male','female'].includes(c.sex)?c.sex:'',profileAge=age(c.birth_date),profileHeight=N(c.height_cm),profileWeight=latestWeight(data);
    return{
      sex:profileSex||(['male','female'].includes(saved.sex)?saved.sex:''),
      age:profileAge??saved.age??'',height:profileHeight>=120&&profileHeight<=230?profileHeight:(saved.height??''),weight:profileWeight>=35&&profileWeight<=300?profileWeight:(saved.weight??''),
      overweight:saved.overweight===true||saved.overweight==='yes',steps:saved.steps??8000,strengthSessions:saved.strengthSessions??3,
      dailyActivity:NUT_ACTIVITY[saved.dailyActivity]?saved.dailyActivity:'moderate',activityFactor:saved.activityFactor??''
    }
  }
  function nutritionIsStale(data){
    const saved=nutritionPlan(data)?.inputs;if(!saved)return false;const current=nutritionDefaults(data);
    if(current.sex&&saved.sex!==current.sex)return true;
    return[['age',0],['height',.05],['weight',.05]].some(([key,tolerance])=>{const a=N(saved[key]),b=N(current[key]);return a!=null&&b!=null&&Math.abs(a-b)>tolerance})
  }
  function calorieRange(goal){return goal?.calories?.length===2?`${kcal(goal.calories[0])}–${kcal(goal.calories[1])}`:'—'}
  function nutritionCard(data){
    const id=data?.client?.id,plan=nutritionPlan(data),result=plan?.result,stale=nutritionIsStale(data);
    if(!result)return `<button type="button" class="ofp-nutrition" onclick="offlineNutritionOpenV322('${E(id)}')"><div class="ofp-nutrition-top"><div><span>ПИТАНИЕ</span><b>Рассчитать КБЖУ</b><small>Формула, активность и три цели</small></div><strong>Рассчитать <i>›</i></strong></div></button>`;
    return `<button type="button" class="ofp-nutrition" onclick="offlineNutritionOpenV322('${E(id)}')"><div class="ofp-nutrition-top"><div><span>ПИТАНИЕ</span><b>КБЖУ клиента</b><small>${stale?'Вес или данные изменились – пересчитай':`Поддержание: ${kcal(result.tdee)} ккал`}</small></div><strong>${stale?'Обновить':'Открыть'} <i>›</i></strong></div><div class="ofp-nutrition-grid"><span><small>Сушка</small><b>${calorieRange(result.goals?.cut)}</b></span><span><small>Поддержание</small><b>${calorieRange(result.goals?.maintain)}</b></span><span><small>Набор</small><b>${calorieRange(result.goals?.gain)}</b></span></div></button>`
  }

  function nutritionCore(){return W.unvrslNutritionPlannerV311}
  function nutritionReadInputs(){
    const val=id=>D.getElementById(id)?.value??'';
    return{sex:val('ofnSex'),age:val('ofnAge'),height:val('ofnHeight'),weight:val('ofnWeight'),overweight:val('ofnOverweight')==='yes',steps:val('ofnSteps'),strengthSessions:val('ofnStrength'),dailyActivity:val('ofnDaily'),activityFactor:val('ofnFactor')}
  }
  function nutritionGoalHtml(goal){
    if(!goal)return'';
    return `<article class="ofn-goal"><div><b>${E(goal.title)}</b><strong>${calorieRange(goal)} ккал</strong></div><div class="ofn-macros"><span><small>Белок</small><b>${E(`${goal.protein[0]}–${goal.protein[1]} г`)}</b></span><span><small>Жиры</small><b>${E(`${goal.fat[0]}–${goal.fat[1]} г`)}</b></span><span><small>Углеводы</small><b>${E(`${goal.carbs[0]}–${goal.carbs[1]} г`)}</b></span></div><small class="ofn-check">Проверка: ${kcal(goal.check[0])} / ${kcal(goal.check[1])} ккал</small></article>`
  }
  function nutritionResultHtml(result){
    if(!result)return'<div class="ofn-empty">Заполни данные и рассчитай КБЖУ.</div>';
    const activity=result.activity?.automatic?'подобран автоматически':'выбран вручную',daily=NUT_ACTIVITY[result.inputs?.dailyActivity]||'—';
    return `<div class="ofn-base"><div><span>BMR</span><b>${kcal(result.bmr?.value)} ккал</b><small>${E(result.bmr?.formula)}</small></div><div><span>Активность</span><b>× ${E(String(result.activity?.factor??'—').replace('.',','))}</b><small>${activity}</small></div><div><span>TDEE</span><b>${kcal(result.tdee)} ккал</b><small>поддержание</small></div></div><div class="ofn-formula">Использована формула <b>${E(result.bmr?.formula)}</b>: ${E(result.bmr?.reason)}. Учтено ${kcal(result.inputs?.steps)} шагов, ${E(fmt(result.inputs?.strengthSessions,0))} силовых и активность «${E(daily.toLowerCase())}».</div>${nutritionGoalHtml(result.goals?.cut)}${nutritionGoalHtml(result.goals?.maintain)}${nutritionGoalHtml(result.goals?.gain)}${result.inputs?.sex==='female'?'<div class="ofn-note">Для девушки жиры лучше не держать постоянно на самой нижней границе без отдельной причины.</div>':''}`
  }
  function nutritionForm(data){
    const inputs=nutritionDefaults(data),plan=nutritionPlan(data),result=plan?.result||null,core=nutritionCore(),selected=(a,b)=>String(a)===String(b)?' selected':'',auto=core?.recommendedActivityFactor?.(inputs)?.factor??1.55;
    return `<div class="sheet-grabber"></div><div class="ofn-head"><div><button class="ofn-back" onclick="offlineClientDetail('${E(data.client.id)}')">‹ Клиент</button><h2>Расчёт КБЖУ</h2><span>${E(data.client.display_name)}</span></div><button class="btn tiny" onclick="closeModal()">✕</button></div><div class="ofn-flow">BMR → TDEE → цель → Б/Ж → углеводы остатком</div><div class="ofn-fields"><div class="field"><label>Пол</label><select id="ofnSex" onchange="offlineNutritionRefreshV322(true)"><option value=""${selected(inputs.sex,'')}>Указать</option><option value="male"${selected(inputs.sex,'male')}>Мужской</option><option value="female"${selected(inputs.sex,'female')}>Женский</option></select></div><div class="field"><label>Возраст, лет</label><input id="ofnAge" type="number" inputmode="numeric" min="14" max="100" value="${E(inputs.age)}" oninput="offlineNutritionRefreshV322(true)"></div><div class="field"><label>Рост, см</label><input id="ofnHeight" type="number" inputmode="decimal" min="120" max="230" value="${E(inputs.height)}" oninput="offlineNutritionRefreshV322(true)"></div><div class="field"><label>Вес, кг</label><input id="ofnWeight" type="number" inputmode="decimal" step="0.1" min="35" max="300" value="${E(inputs.weight)}" oninput="offlineNutritionRefreshV322(true)"></div><div class="field"><label>Есть лишний вес?</label><select id="ofnOverweight" onchange="offlineNutritionRefreshV322(true)"><option value="no"${selected(inputs.overweight,false)}>Нет</option><option value="yes"${selected(inputs.overweight,true)}>Да</option></select></div><div class="field"><label>Шагов в день</label><input id="ofnSteps" type="number" inputmode="numeric" min="0" max="50000" step="500" value="${E(inputs.steps)}" oninput="offlineNutritionRefreshV322(true)"></div><div class="field"><label>Силовых в неделю</label><input id="ofnStrength" type="number" inputmode="numeric" min="0" max="14" value="${E(inputs.strengthSessions)}" oninput="offlineNutritionRefreshV322(true)"></div><div class="field"><label>Активность вне тренировок</label><select id="ofnDaily" onchange="offlineNutritionRefreshV322(true)">${Object.entries(NUT_ACTIVITY).map(([key,name])=>`<option value="${key}"${selected(inputs.dailyActivity,key)}>${name}</option>`).join('')}</select></div><div class="field ofn-wide"><label>Коэффициент активности</label><select id="ofnFactor" onchange="offlineNutritionRefreshV322(true)"><option value=""${selected(inputs.activityFactor,'')}>Авто – ${String(auto).replace('.',',')}</option>${[1.2,1.375,1.55,1.725,1.9].map(value=>`<option value="${value}"${selected(inputs.activityFactor,value)}>${String(value).replace('.',',')} – вручную</option>`).join('')}</select><small id="ofnFactorHint">Авто сейчас: ×${String(auto).replace('.',',')}. Учтены шаги, силовые и активность вне тренировок.</small></div></div><div id="ofnStale" class="ofn-stale" ${nutritionIsStale(data)?'':'hidden'}>Данные отличаются от сохранённого расчёта. Нажми кнопку ниже, чтобы обновить результат.</div><button id="ofnSave" class="btn primary full" onclick="offlineNutritionCalculateV322('${E(data.client.id)}')">Рассчитать и сохранить клиенту</button><div id="ofnResult">${nutritionResultHtml(result)}</div>`
  }
  W.offlineNutritionRefreshV322=function(markStale=false){
    const core=nutritionCore(),select=D.getElementById('ofnFactor');if(!core?.recommendedActivityFactor||!select)return;
    const auto=core.recommendedActivityFactor(nutritionReadInputs()).factor,option=select.querySelector('option[value=""]');if(option)option.textContent=`Авто – ${String(auto).replace('.',',')}`;
    const hint=D.getElementById('ofnFactorHint');if(hint)hint.textContent=select.value?`Выбран вручную: ×${String(select.value).replace('.',',')}.`:`Авто сейчас: ×${String(auto).replace('.',',')}. Учтены шаги, силовые и активность вне тренировок.`;
    if(markStale){const stale=D.getElementById('ofnStale');if(stale)stale.hidden=false}
  };
  W.offlineNutritionOpenV322=async function(id){
    let data=state.id===id&&state.data?state.data:null;
    if(!data){W.modal?.('<div class="ofp-loading"><i></i><span>Загружаю данные клиента</span></div>');data=await loadDetail(id);if(data.error||!data.client)return W.alert?.(data.error?.message||'Клиент не найден');state.id=id;state.data=data}
    if(!nutritionCore()?.calculate)return W.toast?.('Калькулятор ещё загружается. Попробуй снова через секунду.');
    W.modal?.(nutritionForm(data));setTimeout(()=>W.offlineNutritionRefreshV322(false),0)
  };
  W.offlineNutritionCalculateV322=async function(id){
    const button=D.getElementById('ofnSave');try{
      const core=nutritionCore();if(!core?.calculate)throw new Error('Калькулятор ещё не загрузился');
      const result=core.calculate(nutritionReadInputs()),record={version:REV,inputs:result.inputs,result,updatedAt:iso()},c=W.cloud;
      if(!c?.client||!c?.user)throw new Error('Войди в аккаунт тренера');if(button)button.disabled=true;
      const saved=await c.client.from('offline_clients').update({nutrition_plan:record,updated_at:iso()}).eq('id',id).eq('trainer_id',c.user.id).select('id,nutrition_plan').single();if(saved.error)throw saved.error;
      if(state.id===id&&state.data?.client){
        state.data.client.nutrition_plan=saved.data?.nutrition_plan||record;
        try{await syncExistingShare(state.data)}catch(error){console.warn('UNVRSL nutrition share sync',error)}
      }
      const out=D.getElementById('ofnResult');if(out)out.innerHTML=nutritionResultHtml(result);const stale=D.getElementById('ofnStale');if(stale)stale.hidden=true;W.toast?.('КБЖУ клиента сохранено')
    }catch(error){W.toast?.(error?.message||'Проверь данные')}finally{if(button)button.disabled=false}
  };

  function publicRange(value,{min=0,max=10000}={}){
    if(!Array.isArray(value)||value.length!==2)return null;
    const range=value.map(N);if(range.some(x=>x==null||x<min||x>max))return null;
    return range[0]<=range[1]?range:[range[1],range[0]]
  }
  function publicGoal(result,key,title){
    const goal=result?.goals?.[key],calories=publicRange(goal?.calories,{min:500,max:10000}),protein=publicRange(goal?.protein,{max:1000}),fat=publicRange(goal?.fat,{max:1000}),carbs=publicRange(goal?.carbs,{max:2000});
    return calories&&protein&&fat&&carbs?{title,calories,protein,fat,carbs}:null
  }
  function publicNutrition(data){
    if(nutritionIsStale(data))return null;
    const plan=nutritionPlan(data),result=plan?.result,bmr=N(result?.bmr?.value),factor=N(result?.activity?.factor),tdee=N(result?.tdee),formula=String(result?.bmr?.formula||'').slice(0,80);
    const goals={cut:publicGoal(result,'cut','Сушка'),maintain:publicGoal(result,'maintain','Поддержание'),gain:publicGoal(result,'gain','Набор')};
    if(!(bmr>=500&&bmr<=5000)||![1.2,1.375,1.55,1.725,1.9].includes(factor)||!(tdee>=500&&tdee<=10000)||!formula||Object.values(goals).some(x=>!x))return null;
    return{updatedAt:String(plan.updatedAt||'').slice(0,32),bmr:Math.round(bmr),formula,activityFactor:factor,tdee:Math.round(tdee),goals}
  }

  function snapshot(data){
    const cleanMeasures=chronological(data?.measurements,'measure_date').map(row=>{
      const measurements={};MEASURES.forEach(([key])=>{const v=measure(row,key);if(v!=null)measurements[key]=v});
      return{id:String(row.id||''),date:String(row.measure_date||'').slice(0,10),weight:N(row.weight_kg),measurements,note:String(row.notes||'').slice(0,500),source:sourceKey(row.entry_source),createdAt:String(row.created_at||'').slice(0,40)}
    }).filter(x=>x.date&&(x.weight!=null||Object.keys(x.measurements).length));
    const cleanStrengths=chronological(data?.strengths,'measured_at').map(row=>({id:String(row.id||''),date:String(row.measured_at||'').slice(0,10),key:String(row.exercise_key||''),name:String(row.exercise_name||'Упражнение').slice(0,120),weight:N(row.weight_kg),reps:N(row.reps),e1rm:N(row.e1rm),note:String(row.notes||'').slice(0,500),source:sourceKey(row.entry_source),createdAt:String(row.created_at||'').slice(0,40)})).filter(x=>x.date&&x.key);
    return{version:REV,generatedAt:iso(),client:{name:String(data?.client?.display_name||'Клиент').slice(0,100),sex:String(data?.client?.sex||'other'),birthDate:String(data?.client?.birth_date||'').slice(0,10),height:N(data?.client?.height_cm),targetWeight:N(data?.client?.target_weight_kg)},nutrition:publicNutrition(data),exerciseCatalog:catalogNames(),measurements:cleanMeasures,strengths:cleanStrengths}
  }

  function weightCard(data){
    const points=weightPoints(data),last=points[points.length-1],delta=change(points),target=N(data?.client?.target_weight_kg),gap=last&&target!=null?+(target-last.value).toFixed(1):null;
    return `<section class="ofp-panel"><div class="ofp-panel-head"><div><div class="ofp-kicker">ВЕС</div><div class="ofp-panel-value">${last?`${fmt(last.value)} <small>кг</small>`:'Нет записей'}</div></div><div class="ofp-weight-side">${target!=null?`<div class="ofp-goal">Цель <b>${fmt(target)} кг</b>${gap!=null?`<small>${gap===0?'цель достигнута':`${fmt(Math.abs(gap))} кг ${gap>0?'набрать':'снизить'}`}</small>`:''}</div>`:''}${delta==null?'':`<div class="ofp-change neutral">${E(signed(delta,'кг'))}<small>за период</small></div>`}</div></div>${lineChart(points,{color:'#bf5af2',unit:'кг',label:'Динамика веса'})}${!points.length?'<button class="btn primary full" onclick="offlineMeasurementSheet(offlineProgressCurrentIdV321())">Добавить первый замер</button>':''}</section>`
  }

  function measurePanel(data){
    const available=availableMeasures(data);
    if(!available.length)return'<section id="ofpMeasurePanel" class="ofp-panel"><div class="ofp-kicker">ЗАМЕРЫ</div><div class="ofp-empty"><b>Истории замеров пока нет</b><span>Добавь два замера, и здесь появится динамика.</span></div></section>';
    if(!available.some(x=>x.key===state.measureKey))state.measureKey=available[0].key;
    const current=available.find(x=>x.key===state.measureKey)||available[0],last=current.points[current.points.length-1],delta=change(current.points);
    return `<section id="ofpMeasurePanel" class="ofp-panel"><div class="ofp-panel-head"><div><div class="ofp-kicker">ЗАМЕРЫ</div><div class="ofp-panel-value">${fmt(last?.value)} <small>см</small></div></div>${delta==null?'':`<div class="ofp-change neutral">${E(signed(delta,'см'))}<small>за период</small></div>`}</div><div class="ofp-measure-tabs">${available.map(x=>`<button class="${x.key===current.key?'on':''}" onclick="offlineProgressSelectMetricV321('${E(x.key)}')">${E(x.name)}</button>`).join('')}</div>${lineChart(current.points,{color:'#64d2ff',unit:'см',label:`Динамика: ${current.name}`})}</section>`
  }

  function measurementJournal(data){
    const rows=chronological(data?.measurements,'measure_date').reverse();if(!rows.length)return'';
    return `<section class="ofp-panel ofp-journal"><div class="ofp-panel-head"><div><div class="ofp-kicker">ЖУРНАЛ ПРОГРЕССА</div><div class="ofp-journal-title">Вес и обхваты</div></div><span class="ofp-journal-count">${rows.length}</span></div><div class="ofp-journal-list">${rows.map(row=>{const values=[];if(N(row.weight_kg)>0)values.push(`Вес ${fmt(row.weight_kg)} кг`);MEASURES.forEach(([key,name])=>{const value=measure(row,key);if(value!=null)values.push(`${name} ${fmt(value)} см`)});return`<article><div class="ofp-journal-head"><b>${E(day(row.measure_date))}</b><div class="ofp-journal-tools">${sourceBadge(row.entry_source)}<button type="button" class="ofp-delete" onclick="offlineProgressDeleteMeasurementV334('${E(row.id)}')" aria-label="Удалить запись">Удалить</button></div></div><p>${E(values.join(' · '))}</p>${row.notes?`<blockquote>${E(row.notes)}</blockquote>`:''}</article>`}).join('')}</div></section>`
  }

  function latestStrengthText(row){
    if(!row)return'Нет записей';const w=N(row.weight_kg),r=N(row.reps),one=N(row.e1rm),parts=[];
    if(w!=null)parts.push(`${fmt(w)} кг`);if(r!=null)parts.push(`${fmt(r,0)} повт.`);if(one!=null)parts.push(`1ПМ ≈ ${fmt(one)} кг`);return parts.join(' · ')||'Запись без нагрузки'
  }
  function strengthCard(id,group){
    const rows=chronological(group.rows,'measured_at'),latest=rows[rows.length-1],series=strengthSeries(rows),delta=change(series.points);
    return `<article class="ofp-strength"><div class="ofp-strength-head"><div class="grow"><div class="ofp-strength-title"><b>${E(group.name)}</b>${sourceBadge(latest?.entry_source)}</div><span>${E(latestStrengthText(latest))}</span></div><button class="btn tiny" onclick="offlineStrengthSheet('${E(id)}','${T(group.key)}','${T(group.name)}')">＋ Запись</button></div><div class="ofp-strength-meta"><span>${E(series.label)}</span>${delta==null?'':`<b class="${delta<0?'down':''}">${E(signed(delta,series.unit))}</b>`}</div>${lineChart(series.points,{color:'#30d158',unit:series.unit,label:`${group.name}: ${series.label}`})}<button class="ofp-history-link" onclick="offlineStrengthHistory('${E(id)}','${T(group.key)}','${T(group.name)}')">Все записи · ${rows.length}<span>›</span></button></article>`
  }
  function strengthsSection(data){
    const id=data.client.id,groups=strengthGroups(data);
    return `<section class="ofp-section"><div class="ofp-section-head"><div><div class="ofp-kicker">СИЛОВЫЕ</div><h3>Выбранные упражнения</h3></div><button class="btn" onclick="offlineCustomStrengthSheet('${E(id)}')">＋ Добавить</button></div>${groups.length?`<div class="ofp-strength-list">${groups.map(g=>strengthCard(id,g)).join('')}</div>`:`<div class="ofp-empty"><b>Упражнения не выбраны</b><span>Добавь только те упражнения, по которым хочешь отслеживать прогресс этого клиента.</span><button class="btn primary" onclick="offlineCustomStrengthSheet('${E(id)}')">Добавить упражнение</button></div>`}</section>`
  }

  function renderDetail(){
    const data=state.data,c=data?.client;if(!c)return;const a=age(c.birth_date),w=latestWeight(data),initial=String(c.display_name||'К').trim().charAt(0).toUpperCase()||'К';
    W.modal?.(`<div class="ofp-root"><div class="sheet-grabber"></div><header class="ofp-hero"><div class="ofp-avatar">${E(initial)}</div><div class="grow"><h2>${E(c.display_name)}</h2><span>Офлайн-клиент</span></div><div class="ofp-hero-actions"><button class="btn ofp-share" onclick="offlineProgressShareV321('${E(c.id)}')">Поделиться</button><button class="btn" onclick="offlineEditClientSheet('${E(c.id)}')">Изменить</button></div></header><div class="ofp-facts"><div><span>Рост</span><b>${c.height_cm?`${fmt(c.height_cm)} см`:'—'}</b></div><div><span>Вес</span><b>${w?`${fmt(w)} кг`:'—'}</b></div><div><span>Возраст</span><b>${a==null?'—':`${a} лет`}</b></div></div><section class="ofp-sessions"><div><b>Осталось занятий</b><span>Списывай после очной тренировки</span></div><div class="ofp-stepper"><button onclick="offlineAdjustSessions('${E(c.id)}',-1)" aria-label="Списать занятие">−</button><strong>${Math.max(0,Number(c.sessions_remaining)||0)}</strong><button onclick="offlineAdjustSessions('${E(c.id)}',1)" aria-label="Добавить занятие">＋</button></div></section><div class="ofp-main-actions"><button class="btn primary" onclick="offlineMeasurementSheet('${E(c.id)}')">＋ Вес и замеры</button><button class="btn" onclick="offlineCustomStrengthSheet('${E(c.id)}')">＋ Силовой показатель</button></div>${nutritionCard(data)}${weightCard(data)}${measurePanel(data)}${measurementJournal(data)}${strengthsSection(data)}${c.notes?`<section class="ofp-note"><div class="ofp-kicker">ЗАМЕТКА ТРЕНЕРА</div><p>${E(c.notes)}</p></section>`:''}</div>`)
  }

  async function syncExistingShare(data){
    const c=W.cloud;if(!c?.client||!c?.user||!data?.client?.id)return;
    const q=await c.client.from('offline_progress_shares').select('id').eq('trainer_id',c.user.id).eq('offline_client_id',data.client.id).maybeSingle();
    if(q.error||!q.data)return;
    const expires=new Date(Date.now()+180*86400000).toISOString();
    const u=await c.client.from('offline_progress_shares').update({snapshot:snapshot(data),updated_at:iso(),expires_at:expires,revoked_at:null}).eq('id',q.data.id).eq('trainer_id',c.user.id);
    if(u.error)console.warn('UNVRSL offline share sync',u.error)
  }

  async function openDetail(id){
    if(!id)return;state.id=id;
    W.modal?.('<div class="ofp-root"><div class="sheet-grabber"></div><div class="ofp-loading"><i></i><span>Загружаю прогресс клиента</span></div></div>');
    const data=await loadDetail(id);if(data.error||!data.client)return W.modal?.(`<div class="sheet-grabber"></div><div class="card muted">${E(data.error?.message||'Клиент не найден')}</div>`);
    state.data=data;renderDetail();syncExistingShare(data).catch(e=>console.warn('UNVRSL share refresh',e))
  }
  openDetail.__offlineProgressV328=true;openDetail.__offlineProgressV324=true;openDetail.__offlineProgressV323=true;openDetail.__offlineProgressV322=true;openDetail.__offlineProgressV321=true;

  W.offlineProgressCurrentIdV321=()=>state.id||'';
  W.offlineProgressSelectMetricV321=function(key){state.measureKey=String(key||'');const el=D.getElementById('ofpMeasurePanel');if(el&&state.data)el.outerHTML=measurePanel(state.data)};
  W.offlineProgressChartPointV328=function(id,index){
    const graph=D.getElementById(String(id||'')),i=Number(index);if(!graph||!Number.isInteger(i))return;
    graph.querySelectorAll('[data-ofp-point]').forEach(x=>x.classList.toggle('on',Number(x.dataset.ofpPoint)===i));graph.querySelectorAll('[data-ofp-chip]').forEach(x=>x.classList.toggle('on',Number(x.dataset.ofpChip)===i));
    const chip=graph.querySelector(`[data-ofp-chip="${i}"]`),point=graph.querySelector(`[data-ofp-point="${i}"]`),canvas=graph.querySelector('[data-ofp-canvas]');if(!chip)return;
    const value=graph.querySelector('[data-ofp-focus-value]'),date=graph.querySelector('[data-ofp-focus-date]'),source=graph.querySelector('[data-ofp-focus-source]'),note=graph.querySelector('[data-ofp-focus-note]');if(value)value.textContent=chip.dataset.value||'—';if(date)date.textContent=chip.dataset.date||'—';if(source){const key=sourceKey(chip.dataset.source);source.className=`ofp-source ${key}`;source.textContent=sourceName(key)}if(note){note.textContent=chip.dataset.note||'';note.hidden=!chip.dataset.note}if(point&&canvas)canvas.scrollTo({left:Math.max(0,Number(point.dataset.ofpX)-canvas.clientWidth/2),behavior:'smooth'});chip.scrollIntoView?.({inline:'center',block:'nearest',behavior:'smooth'})
  };

  function measurementSheet(id){
    const fields=MEASURES.map(([key,name])=>`<div class="field"><label>${E(name)}, см</label><input id="om${key[0].toUpperCase()+key.slice(1)}" type="number" inputmode="decimal" min="10" max="400" step="0.1"></div>`).join('');
    W.modal?.(`<div class="sheet-grabber"></div><div class="ofp-add-head"><div><h2>Вес и замеры</h2><div class="ofp-form-author">Запись добавит ${sourceBadge('trainer')}</div></div><button class="btn tiny" onclick="offlineClientDetail('${E(id)}')">✕</button></div><div class="field"><label>Дата</label><input id="omDate" type="date" value="${today()}"></div><div class="offline-measure-grid"><div class="field"><label>Вес, кг</label><input id="omWeight" type="number" inputmode="decimal" min="20" max="400" step="0.1"></div>${fields}</div><div class="field"><label>Заметка тренера</label><textarea id="omNotes" maxlength="500" rows="3" placeholder="Например, замер утром натощак"></textarea></div><button id="ofpMeasureSave" class="btn primary full" onclick="offlineSaveMeasurement('${E(id)}')">Сохранить вес и замеры</button>`)
  }
  async function saveMeasurement(id){
    const button=D.getElementById('ofpMeasureSave'),raw=x=>String(D.getElementById(x)?.value||'').trim(),number=x=>N(raw(x)),measurements={};MEASURES.forEach(([key])=>{const v=number(`om${key[0].toUpperCase()+key.slice(1)}`);if(v!=null&&v>0)measurements[key]=v});const weight=number('omWeight');
    try{if(!(weight>0)&&!Object.keys(measurements).length)throw new Error('Добавь вес или хотя бы один обхват');const c=W.cloud;if(!c?.client||!c?.user)throw new Error('Нет подключения к аккаунту тренера');if(button)button.disabled=true;const result=await c.client.from('offline_client_measurements').insert({offline_client_id:id,trainer_id:c.user.id,measure_date:raw('omDate')||today(),weight_kg:weight,measurements,notes:raw('omNotes')||null,entry_source:'trainer'});if(result.error)throw result.error;await c.client.from('offline_clients').update({updated_at:iso()}).eq('id',id).eq('trainer_id',c.user.id);W.toast?.('Вес и замеры сохранены');await openDetail(id)}catch(error){W.alert?.(error?.message||'Не удалось сохранить замер')}finally{if(button)button.disabled=false}
  }
  function strengthSheet(id,keyToken,nameToken){
    const key=decodeURIComponent(keyToken),name=decodeURIComponent(nameToken);
    W.modal?.(`<div class="sheet-grabber"></div><div class="ofp-add-head"><div><h2>${E(name)}</h2><div class="ofp-form-author">Запись добавит ${sourceBadge('trainer')}</div></div><button class="btn tiny" onclick="offlineClientDetail('${E(id)}')">✕</button></div><div class="field"><label>Дата</label><input id="osDate" type="date" value="${today()}"></div><div class="offline-measure-grid"><div class="field"><label>Рабочий вес, кг</label><input id="osWeight" type="number" min="0.1" max="999" step="0.1" inputmode="decimal" oninput="offlineProgressE1rmV328()"></div><div class="field"><label>Повторения</label><input id="osReps" type="number" min="1" max="30" step="1" inputmode="numeric" oninput="offlineProgressE1rmV328()"></div></div><div class="ofp-e1rm"><span>Расчётный 1ПМ</span><b id="ofpE1rmValue">—</b><small>Формула Эпли, сразу после веса и повторений</small></div><div class="field"><label>Заметка тренера</label><textarea id="osNotes" maxlength="500" rows="3" placeholder="Тренажёр, техника, самочувствие"></textarea></div><button id="ofpStrengthSave" class="btn primary full" onclick="offlineSaveStrength('${E(id)}','${T(key)}','${T(name)}')">Сохранить показатель</button><button class="btn full" onclick="offlineStrengthHistory('${E(id)}','${T(key)}','${T(name)}')">Открыть историю</button>`)
  }
  W.offlineProgressE1rmV328=function(){const result=e1rm(D.getElementById('osWeight')?.value,D.getElementById('osReps')?.value),out=D.getElementById('ofpE1rmValue');if(out)out.textContent=result==null?'—':`≈ ${fmt(result)} кг`};
  async function saveStrength(id,keyToken,nameToken){
    const key=decodeURIComponent(keyToken),name=decodeURIComponent(nameToken),raw=x=>String(D.getElementById(x)?.value||'').trim(),weight=N(raw('osWeight')),reps=parseInt(raw('osReps'),10),one=e1rm(weight,reps),button=D.getElementById('ofpStrengthSave');
    try{if(one==null)throw new Error('Укажи рабочий вес и от 1 до 30 повторений');const c=W.cloud;if(!c?.client||!c?.user)throw new Error('Нет подключения к аккаунту тренера');if(button)button.disabled=true;const result=await c.client.from('offline_client_strengths').insert({offline_client_id:id,trainer_id:c.user.id,measured_at:raw('osDate')||today(),exercise_key:key,exercise_name:name,weight_kg:weight,reps,e1rm:one,notes:raw('osNotes')||null,entry_source:'trainer'});if(result.error)throw result.error;await c.client.from('offline_clients').update({updated_at:iso()}).eq('id',id).eq('trainer_id',c.user.id);W.toast?.(`Показатель сохранён · 1ПМ ≈ ${fmt(one)} кг`);await openDetail(id)}catch(error){W.alert?.(error?.message||'Не удалось сохранить показатель')}finally{if(button)button.disabled=false}
  }
  async function strengthHistory(id,keyToken,nameToken){
    const key=decodeURIComponent(keyToken),name=decodeURIComponent(nameToken),c=W.cloud;if(!c?.client||!c?.user)return W.toast?.('Нет подключения к аккаунту тренера');const result=await c.client.from('offline_client_strengths').select('*').eq('offline_client_id',id).eq('exercise_key',key).order('measured_at',{ascending:false}).order('created_at',{ascending:false});if(result.error)return W.alert?.(result.error.message);
    W.modal?.(`<div class="sheet-grabber"></div><div class="ofp-add-head"><div><h2>${E(name)}</h2><div class="muted">Вес, повторения и расчётный 1ПМ</div></div><button class="btn tiny" onclick="offlineClientDetail('${E(id)}')">✕</button></div><div class="ofp-history-list">${A(result.data).map(row=>`<article><div class="ofp-journal-head"><b>${E(day(row.measured_at))}</b>${sourceBadge(row.entry_source)}</div><strong>${E(latestStrengthText(row))}</strong>${row.notes?`<blockquote>${E(row.notes)}</blockquote>`:''}</article>`).join('')||'<div class="ofp-chart-empty">Истории пока нет</div>'}</div><button class="btn primary full" onclick="offlineStrengthSheet('${E(id)}','${T(key)}','${T(name)}')">＋ Новая запись</button>`)
  }

  function catalogNames(){
    try{
      const fn=typeof W.catalogRecords==='function'?W.catalogRecords:typeof catalogRecords==='function'?catalogRecords:null;
      const names=fn?fn().map(x=>x.strictName||(x.custom?x.n:(typeof W.ruExerciseName==='function'?W.ruExerciseName(x.n):x.n))).filter(Boolean):[];
      return W.UNVRSL_EXERCISE_PICKER_V331?.list(names)||[...new Set(names.map(String))].sort((a,b)=>a.localeCompare(b,'ru'))
    }catch(_){return W.UNVRSL_EXERCISE_PICKER_V331?.list()||[]}
  }
  function customStrength(id){
    const options=catalogNames().map(n=>`<option value="${E(n)}">${E(n)}</option>`).join('');
    W.modal?.(`<div class="sheet-grabber"></div><div class="ofp-add-head"><div><h2>Добавить упражнение</h2><div class="muted">Выбери упражнение из общей базы</div></div><button class="btn tiny" onclick="offlineClientDetail('${E(id)}')">✕</button></div><div class="field"><label>Упражнение</label><select id="ofpExerciseName"><option value="">Выбрать упражнение</option>${options}</select></div><div class="field"><label>Тренажёр или вариант, если нужен</label><input id="ofpExerciseVariant" placeholder="Например, Matrix или Technogym"></div><div class="ofp-tip">Одинаковое упражнение на разных тренажёрах лучше вести как два показателя – их веса могут быть несопоставимы.</div><button class="btn primary full" onclick="offlineProgressOpenStrengthV321('${E(id)}')">Добавить и записать результат</button>`)
  }
  customStrength.__offlineProgressV328=true;customStrength.__offlineProgressV324=true;customStrength.__offlineProgressV323=true;customStrength.__offlineProgressV322=true;customStrength.__offlineProgressV321=true;

  async function editClient(id){
    const cloud=W.cloud;if(!id||!cloud?.client||!cloud?.user)return W.toast?.('Нет подключения к аккаунту тренера');
    const r=await cloud.client.from('offline_clients').select('*').eq('id',id).eq('trainer_id',cloud.user.id).single();
    if(r.error||!r.data)return W.alert?.(r.error?.message||'Клиент не найден');
    const c=r.data,invalidBirth=c.birth_date&&age(c.birth_date)==null;
    W.modal?.(`<div class="ofp-edit"><div class="sheet-grabber"></div><header class="ofp-edit-head"><div><div class="ofp-kicker">ПРОФИЛЬ</div><h2>Редактировать клиента</h2></div><button type="button" class="btn tiny" onclick="offlineClientDetail('${E(id)}')" aria-label="Закрыть">✕</button></header><div class="ofp-edit-field ofp-edit-name"><label for="offEditName">Имя</label><input id="offEditName" value="${E(c.display_name)}" autocomplete="name"></div><div class="ofp-edit-grid"><div class="ofp-edit-field"><label for="offEditSex">Пол</label><select id="offEditSex"><option value="female"${c.sex==='female'?' selected':''}>Женский</option><option value="male"${c.sex==='male'?' selected':''}>Мужской</option><option value="other"${c.sex==='other'?' selected':''}>Другой</option></select></div><div class="ofp-edit-field"><label for="offEditHeight">Рост, см</label><input id="offEditHeight" type="number" inputmode="decimal" min="100" max="250" step="0.5" value="${E(c.height_cm??'')}"></div></div><div class="ofp-edit-grid ofp-edit-birth-row"><div class="ofp-edit-field"><label for="offEditBirth">Дата рождения</label><input id="offEditBirth" type="date" value="${E(c.birth_date||'')}">${invalidBirth?'<small class="ofp-edit-warning">Проверь дату – возраст получается меньше 14 лет.</small>':''}</div><div class="ofp-edit-field"><label for="offEditSessions">Занятий</label><input id="offEditSessions" type="number" inputmode="numeric" min="0" step="1" value="${E(c.sessions_remaining??0)}"></div></div><div class="ofp-edit-field"><label for="offEditTargetWeight">Цель по весу, кг</label><input id="offEditTargetWeight" type="number" inputmode="decimal" min="20" max="400" step="0.1" value="${E(c.target_weight_kg??'')}" placeholder="Можно оставить пустым"></div><div class="ofp-edit-field"><label for="offEditNotes">Заметка</label><textarea id="offEditNotes" rows="3" placeholder="Цель, ограничения, особенности">${E(c.notes||'')}</textarea></div><button class="btn primary full ofp-edit-save" onclick="offlineSaveClientEdit('${E(id)}')">Сохранить</button></div>`)
  }
  editClient.__offlineProgressV324=true;
  W.offlineProgressOpenStrengthV321=function(id){
    const name=D.getElementById('ofpExerciseName')?.value.trim(),variant=D.getElementById('ofpExerciseVariant')?.value.trim();if(!name)return W.toast?.('Введи упражнение');
    const full=variant?`${name} · ${variant}`:name,key=`custom_${full.toLowerCase().replace(/ё/g,'е').replace(/[^a-zа-я0-9]+/gi,'_').replace(/^_|_$/g,'')}`;
    W.offlineStrengthSheet?.(id,encodeURIComponent(key),encodeURIComponent(full))
  };

  function randomToken(){const b=new Uint8Array(32);crypto.getRandomValues(b);return btoa(String.fromCharCode(...b)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
  async function tokenHash(token){const bytes=new TextEncoder().encode(token),hash=await crypto.subtle.digest('SHA-256',bytes);return[...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('')}
  async function copyText(value){
    if(navigator.clipboard?.writeText)return navigator.clipboard.writeText(value);
    const x=D.createElement('textarea');x.value=value;x.style.position='fixed';x.style.opacity='0';D.body.appendChild(x);x.select();D.execCommand('copy');x.remove()
  }
  W.offlineProgressShareV321=async function(id){
    try{
      const data=state.id===id&&state.data?state.data:await loadDetail(id);if(data.error||!data.client)throw data.error||new Error('Клиент не найден');
      const c=W.cloud;if(!c?.client||!c?.user)throw new Error('Войди в аккаунт тренера');
      const storageKey=`unvrsl:offline-share-token:${id}`;let token='';try{token=localStorage.getItem(storageKey)||''}catch(_){ }
      let hash=token?await tokenHash(token):'',existing=null;
      if(hash){const q=await c.client.from('offline_progress_shares').select('id,token_hash').eq('trainer_id',c.user.id).eq('offline_client_id',id).maybeSingle();if(!q.error&&q.data?.token_hash===hash)existing=q.data;else{token='';hash=''}}
      if(!token){token=randomToken();hash=await tokenHash(token)}
      const expires=new Date(Date.now()+180*86400000).toISOString(),payload={trainer_id:c.user.id,offline_client_id:id,token_hash:hash,snapshot:snapshot(data),expires_at:expires,revoked_at:null,updated_at:iso()};
      const q=await c.client.from('offline_progress_shares').upsert(payload,{onConflict:'trainer_id,offline_client_id'}).select('id').single();if(q.error)throw q.error;
      try{localStorage.setItem(storageKey,token)}catch(_){ }
      const url=new URL('progress.html',W.location.href);url.search='';url.searchParams.set('v','334');url.hash=`t=${token}`;
      const title=`Прогресс – ${data.client.display_name}`;
      if(navigator.share){try{await navigator.share({title,text:'Вес, КБЖУ, замеры и силовые показатели',url:url.href});return}catch(e){if(e?.name==='AbortError')return}}
      await copyText(url.href);W.toast?.('Ссылка скопирована')
    }catch(e){console.warn('UNVRSL share offline progress',e);W.alert?.(`Не удалось создать ссылку: ${e?.message||'ошибка'}`)}
  };

  async function saveClientEditV334(id){
    const raw=key=>String(D.getElementById(key)?.value||'').trim(),name=raw('offEditName'),target=N(raw('offEditTargetWeight'));
    try{
      if(!name)throw new Error('Введи имя');if(raw('offEditTargetWeight')&&(target==null||target<20||target>400))throw new Error('Цель по весу должна быть от 20 до 400 кг');
      const c=W.cloud;if(!c?.client||!c?.user)throw new Error('Нет подключения к аккаунту тренера');
      const payload={display_name:name,sex:raw('offEditSex')||'other',height_cm:N(raw('offEditHeight')),birth_date:raw('offEditBirth')||null,sessions_remaining:Math.max(0,parseInt(raw('offEditSessions')||'0',10)||0),target_weight_kg:target,notes:raw('offEditNotes')||null,updated_at:iso()};
      const result=await c.client.from('offline_clients').update(payload).eq('id',id).eq('trainer_id',c.user.id);if(result.error)throw result.error;
      W.toast?.('Данные и цель сохранены');await W.renderOfflineClients?.();await openDetail(id)
    }catch(error){W.alert?.(error?.message||'Не удалось сохранить клиента')}
  }
  W.offlineProgressDeleteMeasurementV334=async function(entryId){
    if(!entryId||!state.id)return;const row=A(state.data?.measurements).find(x=>String(x.id)===String(entryId));
    const detail=row&&Object.keys(row.measurements||{}).length?'Вес, обхваты и заметка этой даты будут удалены.':'Запись веса этой даты будет удалена.';
    if(!W.confirm(`Удалить запись?\n\n${detail}`))return;
    try{const c=W.cloud;if(!c?.client||!c?.user)throw new Error('Нет подключения к аккаунту тренера');const result=await c.client.from('offline_client_measurements').delete().eq('id',entryId).eq('offline_client_id',state.id).eq('trainer_id',c.user.id);if(result.error)throw result.error;W.toast?.('Запись удалена');await openDetail(state.id)}catch(error){W.alert?.(error?.message||'Не удалось удалить запись')}
  };

  D.getElementById('unvrsl-offline-progress-v322-style')?.remove();
  D.getElementById('unvrsl-offline-progress-v323-style')?.remove();
  D.getElementById('unvrsl-offline-progress-v324-style')?.remove();
  const style=D.createElement('style');style.id='unvrsl-offline-progress-v328-style';style.textContent=`
    .ofp-root{padding-bottom:12px;color:#f5f5f7}.ofp-root *{min-width:0}.ofp-hero{display:grid;grid-template-columns:58px minmax(0,1fr) auto;gap:13px;align-items:center;padding:2px 0 17px}.ofp-avatar{width:58px;height:58px;border-radius:19px;display:grid;place-items:center;background:linear-gradient(145deg,#bf5af2,#8b3ac1);font-size:25px;font-weight:900;box-shadow:0 12px 28px rgba(191,90,242,.18)}.ofp-hero h2{font-size:29px;line-height:1.05;letter-spacing:-.8px;margin:0}.ofp-hero .grow>span{display:block;color:#8e8e93;margin-top:5px}.ofp-hero-actions{display:flex;gap:7px}.ofp-hero-actions .btn{min-height:42px;padding:10px 12px}.ofp-share{color:#e7bdff!important;border:1px solid rgba(191,90,242,.45)!important;background:rgba(191,90,242,.11)!important}.ofp-facts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-bottom:10px}.ofp-facts>div{padding:13px 14px;border-radius:18px;background:#202024;border:1px solid #34343a}.ofp-facts span{display:block;color:#85858c;font-size:11px;text-transform:uppercase;letter-spacing:.06em}.ofp-facts b{display:block;margin-top:5px;font-size:18px;line-height:1.15}.ofp-sessions{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;padding:16px 17px;border-radius:21px;background:#1f2023;border:1px solid #35363c;margin:10px 0}.ofp-sessions b{display:block;font-size:17px}.ofp-sessions span{display:block;color:#8e8e93;font-size:12px;line-height:1.3;margin-top:4px}.ofp-stepper{display:grid;grid-template-columns:42px 42px 42px;align-items:center;gap:5px}.ofp-stepper button{height:42px;border-radius:13px;background:#303138;border:1px solid #414249;font-size:22px}.ofp-stepper strong{text-align:center;font-size:24px}.ofp-main-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}.ofp-main-actions .btn{min-height:50px}.ofp-nutrition{display:block;width:100%;padding:17px;margin:10px 0 14px;border:1px solid rgba(191,90,242,.38);border-radius:22px;background:linear-gradient(145deg,rgba(191,90,242,.13),rgba(31,32,35,.96) 58%);color:#f5f5f7;text-align:left}.ofp-nutrition-top{display:flex;align-items:center;justify-content:space-between;gap:14px}.ofp-nutrition-top span{display:block;color:#c98af5;font-size:12px;font-weight:850;letter-spacing:.12em}.ofp-nutrition-top b{display:block;margin-top:7px;font-size:19px}.ofp-nutrition-top small{display:block;margin-top:5px;color:#9999a0;font-size:12px;line-height:1.35}.ofp-nutrition-top strong{flex:0 0 auto;color:#e6b9ff;font-size:13px}.ofp-nutrition-top i{font-style:normal;font-size:22px;vertical-align:-2px}.ofp-nutrition-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:13px}.ofp-nutrition-grid span{padding:9px;border-radius:13px;background:rgba(255,255,255,.055)}.ofp-nutrition-grid small{display:block;color:#8e8e95;font-size:10px}.ofp-nutrition-grid b{display:block;margin-top:4px;font-size:13px}.ofp-panel{background:#1c1c20;border:1px solid #303036;border-radius:24px;padding:18px;margin:11px 0;overflow:hidden}.ofp-panel-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.ofp-kicker{color:#85858d;font-size:12px;line-height:1;font-weight:800;letter-spacing:.13em}.ofp-panel-value{font-size:27px;font-weight:850;letter-spacing:-.6px;margin-top:8px}.ofp-panel-value small{font-size:14px;color:#a0a0a7}.ofp-change{font-size:16px;font-weight:850;text-align:right;color:#c98af5}.ofp-change small{display:block;font-size:10px;font-weight:600;color:#818188;margin-top:3px}.ofp-chart{margin-top:12px}.ofp-chart svg{display:block;width:100%;height:132px;overflow:visible}.ofp-axis{display:flex;justify-content:space-between;color:#6f6f77;font-size:10px;margin-top:3px}.ofp-chart-empty{min-height:112px;display:grid;place-items:center;text-align:center;color:#76767d;font-size:13px}.ofp-measure-tabs{display:flex;gap:6px;overflow-x:auto;padding:13px 0 2px;scrollbar-width:none}.ofp-measure-tabs::-webkit-scrollbar{display:none}.ofp-measure-tabs button{flex:0 0 auto;padding:8px 11px;border-radius:999px;background:#292a2f;color:#8e8e95;font-size:12px;font-weight:750}.ofp-measure-tabs button.on{background:rgba(100,210,255,.15);color:#8bddff}.ofp-section{margin-top:22px}.ofp-section-head{display:flex;align-items:end;justify-content:space-between;gap:12px;padding:0 3px 9px}.ofp-section-head h3{font-size:22px;line-height:1.08;margin:7px 0 0}.ofp-section-head .btn{min-height:42px}.ofp-strength-list{display:grid;gap:10px}.ofp-strength{background:#1c1c20;border:1px solid #303036;border-radius:24px;padding:17px;overflow:hidden}.ofp-strength-head{display:flex;align-items:center;gap:10px}.ofp-strength-head b{display:block;font-size:17px;line-height:1.2}.ofp-strength-head span{display:block;color:#8d8d94;font-size:12px;line-height:1.35;margin-top:4px}.ofp-strength-head .btn{flex:0 0 auto}.ofp-strength-meta{display:flex;justify-content:space-between;align-items:center;margin-top:14px;color:#818188;font-size:11px}.ofp-strength-meta b{color:#30d158;font-size:13px}.ofp-strength-meta b.down{color:#ff9f0a}.ofp-strength .ofp-chart svg{height:108px}.ofp-history-link{width:100%;display:flex;justify-content:space-between;align-items:center;color:#a7a7ae;border-top:1px solid #303036;padding:12px 1px 0;margin-top:7px;font-size:12px;text-align:left}.ofp-history-link span{font-size:20px}.ofp-empty{display:grid;gap:8px;justify-items:start;padding:20px;border-radius:22px;background:#1c1c20;border:1px dashed #393940;color:#8e8e95}.ofp-empty b{color:#f4f4f6;font-size:17px}.ofp-empty span{font-size:13px;line-height:1.45}.ofp-empty .btn{margin-top:5px}.ofp-note{margin-top:18px;padding:3px}.ofp-note p{color:#a0a0a7;line-height:1.5;white-space:pre-wrap}.ofp-loading{min-height:360px;display:grid;place-content:center;justify-items:center;gap:15px;color:#8e8e95}.ofp-loading i{width:28px;height:28px;border-radius:50%;border:3px solid #33333a;border-top-color:#bf5af2;animation:ofp-spin .8s linear infinite}.ofp-add-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.ofp-add-head h2{margin-bottom:5px}.ofp-tip{padding:12px 13px;margin:12px 0 15px;border-radius:15px;background:rgba(100,210,255,.08);border:1px solid rgba(100,210,255,.2);color:#9fcfe1;font-size:12px;line-height:1.45}.ofn-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.ofn-head h2{margin:7px 0 4px;font-size:28px}.ofn-head>div>span{color:#8e8e95;font-size:14px}.ofn-back{padding:0;color:#c98af5;font-size:14px;font-weight:750}.ofn-flow{margin-top:14px;padding:12px 13px;border-radius:15px;background:rgba(191,90,242,.09);color:#cda7df;font-size:13px}.ofn-fields{display:grid;grid-template-columns:1fr 1fr;gap:0 10px;margin-top:10px}.ofn-wide{grid-column:1/-1}.ofn-wide>small{display:block;margin:7px 2px 0;color:#85858d;font-size:12px;line-height:1.4}.ofn-stale{margin:12px 0;padding:11px 12px;border-radius:14px;background:rgba(255,159,10,.1);color:#e0b166;font-size:12px;line-height:1.4}.ofn-stale[hidden]{display:none}.ofn-stale+.btn{margin-top:2px}#ofnResult{margin-top:14px}.ofn-empty{padding:17px;border-radius:17px;background:#222226;color:#8e8e95;font-size:14px}.ofn-base{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.ofn-base>div{padding:11px;border-radius:16px;background:#222226;border:1px solid #303036}.ofn-base span,.ofn-base small{display:block;color:#8e8e95;font-size:10px;line-height:1.3}.ofn-base b{display:block;margin:5px 0;font-size:16px}.ofn-formula,.ofn-note{margin-top:9px;padding:12px 13px;border-radius:15px;background:#202024;color:#aaaab1;font-size:12px;line-height:1.45}.ofn-note{background:rgba(255,159,10,.09);color:#d8b06d}.ofn-goal{margin-top:9px;padding:14px;border:1px solid #303036;border-radius:19px;background:#202024}.ofn-goal>div:first-child{display:flex;justify-content:space-between;align-items:baseline;gap:8px}.ofn-goal strong{color:#30d158;font-size:14px}.ofn-macros{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-top:11px}.ofn-macros span{padding:9px 8px;border-radius:13px;background:#2a2a2f}.ofn-macros small{display:block;color:#8e8e95;font-size:10px}.ofn-macros b{display:block;margin-top:4px;font-size:13px}.ofn-check{display:block;margin-top:9px;color:#777780;font-size:11px}@keyframes ofp-spin{to{transform:rotate(360deg)}}
    .ofp-edit{padding-bottom:4px}.ofp-edit-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:16px}.ofp-edit-head h2{margin:6px 0 0;font-size:27px;line-height:1.08}.ofp-edit-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px}.ofp-edit-birth-row{grid-template-columns:minmax(0,1.35fr) minmax(100px,.65fr)}.ofp-edit-field{min-width:0;margin:11px 0}.ofp-edit-field label{display:block;margin:0 0 6px 2px;color:#929299;font-size:13px}.ofp-edit-field input,.ofp-edit-field select,.ofp-edit-field textarea{display:block;width:100%;min-width:0;max-width:100%;box-sizing:border-box;border:1px solid #34343b;border-radius:15px;background:#17171a;color:#f5f5f7;padding:13px 14px;line-height:1.25}.ofp-edit-field input,.ofp-edit-field select{height:50px}.ofp-edit-field input[type=date]{appearance:none;-webkit-appearance:none;text-align:left}.ofp-edit-field textarea{min-height:82px;resize:vertical}.ofp-edit-warning{display:block;margin:6px 2px 0;color:#ffb340;font-size:11px;line-height:1.35}.ofp-edit-save{min-height:52px;margin-top:10px}
    .ofp-source{display:inline-flex;align-items:center;min-height:22px;padding:3px 8px;border-radius:999px;font-size:10px;font-weight:850;white-space:nowrap}.ofp-source.client{color:#9adeff;background:rgba(100,210,255,.13);border:1px solid rgba(100,210,255,.25)}.ofp-source.trainer{color:#e2b9fa;background:rgba(191,90,242,.13);border:1px solid rgba(191,90,242,.27)}.ofp-chart-focus{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;padding:12px 13px;border-radius:16px;background:rgba(191,90,242,.08);border:1px solid rgba(191,90,242,.23)}.ofp-chart-focus span{display:block;color:#8e8e95;font-size:10px}.ofp-chart-focus b{display:block;margin-top:4px;font-size:19px}.ofp-chart-focus-side{display:grid;justify-items:end;gap:5px}.ofp-chart-focus-side strong{color:#d9b0ee;font-size:12px}.ofp-chart-focus p{grid-column:1/-1;margin:2px 0 0;padding:8px 9px;border-radius:11px;background:rgba(255,255,255,.04);color:#b6b6bc;font-size:11px;line-height:1.4;white-space:pre-wrap}.ofp-chart-focus p[hidden]{display:none}.ofp-chart-canvas{overflow-x:auto;margin-top:8px;border-radius:14px;scrollbar-width:none;-webkit-overflow-scrolling:touch}.ofp-chart-canvas::-webkit-scrollbar,.ofp-point-scroll::-webkit-scrollbar{display:none}.ofp-chart-canvas svg{display:block;max-width:none;height:190px}.ofp-x-label{fill:#777780;font-size:10px}.ofp-point-hit{fill:transparent;pointer-events:all}.ofp-point-pill{fill:#29202f;stroke:#72408a}.ofp-point-value{fill:#ead6f5;font-size:10px;font-weight:850;pointer-events:none}.ofp-point-dot{fill:#bf5af2;stroke:#17171a;stroke-width:2}.ofp-graph-point{cursor:pointer;outline:none}.ofp-graph-point.on .ofp-point-pill,.ofp-graph-point:focus .ofp-point-pill{fill:#bf5af2}.ofp-graph-point.on .ofp-point-value,.ofp-graph-point:focus .ofp-point-value{fill:#160b1a}.ofp-graph-point.on .ofp-point-dot{fill:white;stroke:#bf5af2;stroke-width:4}.ofp-point-scroll{display:flex;gap:6px;overflow-x:auto;padding:7px 1px 2px;scrollbar-width:none}.ofp-point-chip{flex:0 0 auto;min-width:105px;padding:9px 10px;border:1px solid #303036;border-radius:13px;background:#232328;color:#9b9ba2;text-align:left}.ofp-point-chip b,.ofp-point-chip span,.ofp-point-chip small{display:block}.ofp-point-chip b{color:#f5f5f7;font-size:12px}.ofp-point-chip span{margin-top:3px;font-size:10px}.ofp-point-chip small{margin-top:3px;color:#73737b;font-size:9px}.ofp-point-chip.on{border-color:#a64fd0;background:rgba(191,90,242,.12)}.ofp-journal-title{margin-top:7px;font-size:20px;font-weight:850}.ofp-journal-count{padding:4px 9px;border-radius:999px;background:#29292e;color:#a0a0a7;font-size:11px}.ofp-journal-list,.ofp-history-list{display:grid;gap:7px;margin-top:13px}.ofp-journal-list article,.ofp-history-list article{padding:11px 12px;border-radius:15px;background:#232328;border:1px solid #303036}.ofp-journal-head{display:flex;align-items:center;justify-content:space-between;gap:8px}.ofp-journal-head b{font-size:12px}.ofp-journal-list p{margin:8px 0 0;color:#b2b2b8;font-size:11px;line-height:1.45}.ofp-journal-list blockquote,.ofp-history-list blockquote{margin:8px 0 0;padding:8px 9px;border-left:2px solid #9a4bc2;background:rgba(191,90,242,.06);color:#b7a9bf;font-size:11px;line-height:1.4;white-space:pre-wrap}.ofp-strength-title{display:flex;align-items:flex-start;gap:7px}.ofp-strength-title b{min-width:0}.ofp-form-author{display:flex;align-items:center;gap:7px;margin-top:6px;color:#8e8e95;font-size:12px}.ofp-e1rm{margin:4px 0 12px;padding:12px 13px;border-radius:16px;background:rgba(48,209,88,.08);border:1px solid rgba(48,209,88,.2)}.ofp-e1rm span,.ofp-e1rm small{display:block;color:#7d9d85;font-size:10px}.ofp-e1rm b{display:block;margin:4px 0;color:#64df83;font-size:21px}.ofp-history-list{margin-bottom:14px}.ofp-history-list strong{display:block;margin-top:9px;font-size:14px}
    @media(max-width:430px){.ofp-hero{grid-template-columns:52px minmax(0,1fr);padding-bottom:13px}.ofp-avatar{width:52px;height:52px;border-radius:17px}.ofp-hero h2{font-size:26px}.ofp-hero-actions{grid-column:1/-1;display:grid;grid-template-columns:1fr 1fr}.ofp-hero-actions .btn{min-height:44px}.ofp-facts>div{padding:12px 10px}.ofp-facts b{font-size:16px}.ofp-sessions{padding:14px}.ofp-stepper{grid-template-columns:38px 36px 38px}.ofp-stepper button{height:40px}.ofp-main-actions{grid-template-columns:1fr}.ofp-panel{padding:16px}.ofp-chart svg{height:120px}.ofp-strength .ofp-chart svg{height:100px}.ofp-section-head{align-items:center}.ofp-section-head h3{font-size:19px}.ofp-section-head .btn{padding:9px 10px;font-size:12px}.ofp-nutrition{padding:15px}.ofp-nutrition-grid{gap:5px}.ofp-nutrition-grid b{font-size:11px}.ofp-edit-head h2{font-size:24px}.ofp-edit-field{margin:8px 0}.ofn-fields{grid-template-columns:1fr}.ofn-wide{grid-column:auto}.ofn-base b{font-size:14px}.ofn-goal>div:first-child{display:block}.ofn-goal strong{display:block;margin-top:5px}.ofn-macros b{font-size:12px}}
    @media(max-width:350px){.ofp-edit-birth-row{grid-template-columns:1fr}}
  `;style.textContent+=`.ofp-weight-side{display:grid;justify-items:end;gap:8px}.ofp-goal{padding:7px 10px;border-radius:13px;background:rgba(191,90,242,.1);color:#a98eb7;font-size:10px;text-align:right}.ofp-goal b,.ofp-goal small{display:block}.ofp-goal b{margin-top:2px;color:#e4bbfa;font-size:15px}.ofp-goal small{margin-top:2px;color:#82828a}.ofp-journal-tools{display:flex;align-items:center;gap:7px}.ofp-delete{min-height:28px;padding:5px 8px;border:0;border-radius:9px;background:rgba(255,69,58,.09);color:#ff7b73;font-size:10px;font-weight:800}`;D.head.appendChild(style);

  function install(){
    if(!W.__unvrslOfflineClients)return;
    W.offlineClientDetail=openDetail;W.offlineCustomStrengthSheet=customStrength;W.offlineEditClientSheet=editClient;W.offlineSaveClientEdit=saveClientEditV334;W.offlineMeasurementSheet=measurementSheet;W.offlineSaveMeasurement=saveMeasurement;W.offlineStrengthSheet=strengthSheet;W.offlineSaveStrength=saveStrength;W.offlineStrengthHistory=strengthHistory;
    try{offlineClientDetail=openDetail;offlineCustomStrengthSheet=customStrength;offlineEditClientSheet=editClient;offlineSaveClientEdit=saveClientEditV334;offlineMeasurementSheet=measurementSheet;offlineSaveMeasurement=saveMeasurement;offlineStrengthSheet=strengthSheet;offlineSaveStrength=saveStrength;offlineStrengthHistory=strengthHistory}catch(_){ }
  }
  [0,120,500,1400,3200].forEach(ms=>setTimeout(install,ms));
  W.addEventListener('unvrsl:cloud-modules-settled',install,{passive:true});
})();
