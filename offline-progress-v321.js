'use strict';
(()=>{
  const W=window,D=document,REV=323;
  if(W.__unvrslOfflineProgressV323)return;
  W.__unvrslOfflineProgressV323=true;W.__unvrslOfflineProgressV322=true;W.__unvrslOfflineProgressV321=true;

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
  const day=v=>{if(!v)return'—';const p=String(v).slice(0,10).split('-');return p.length===3?`${p[2]}.${p[1]}.${p[0]}`:String(v)};
  const shortDay=v=>{if(!v)return'';const p=String(v).slice(0,10).split('-');return p.length===3?`${p[2]}.${p[1]}`:String(v)};
  function age(v){if(!v)return null;const d=new Date(`${v}T12:00:00`);if(Number.isNaN(d.getTime()))return null;const n=new Date();let x=n.getFullYear()-d.getFullYear(),m=n.getMonth()-d.getMonth();if(m<0||(m===0&&n.getDate()<d.getDate()))x--;return x>=0&&x<130?x:null}
  function measure(row,key){const n=N(row?.measurements?.[key]);return n!=null&&n>0?n:null}
  function signed(v,unit){const n=N(v);if(n==null)return'';const x=Math.round(n*10)/10;return`${x>0?'+':''}${String(x).replace('.',',')} ${unit}`}
  function change(points){if(points.length<2)return null;return +(points[points.length-1].value-points[0].value).toFixed(1)}
  function chronological(rows,dateKey){return A(rows).slice().sort((a,b)=>String(a?.[dateKey]||'').localeCompare(String(b?.[dateKey]||'')))}

  function lineChart(points,{color='#bf5af2',unit='',label='Динамика'}={}){
    const clean=A(points).map(x=>({date:String(x.date||''),value:N(x.value)})).filter(x=>x.date&&x.value!=null).slice(-80);
    if(!clean.length)return'<div class="ofp-chart-empty">Пока нет данных для графика</div>';
    const w=360,h=150,px=18,py=18,vals=clean.map(x=>x.value),lo0=Math.min(...vals),hi0=Math.max(...vals),span=Math.max(1,hi0-lo0),lo=lo0-span*.12,hi=hi0+span*.12,range=hi-lo;
    const xy=clean.map((x,i)=>({x:clean.length===1?w/2:px+i*(w-px*2)/(clean.length-1),y:h-py-(x.value-lo)/range*(h-py*2),...x}));
    const path=xy.map((p,i)=>`${i?'L':'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' '),area=`M ${xy[0].x.toFixed(1)} ${(h-py).toFixed(1)} ${path.replace(/^M/,'L')} L ${xy[xy.length-1].x.toFixed(1)} ${(h-py).toFixed(1)} Z`,id=`ofp-grad-${REV}-${++chartId}`;
    return `<div class="ofp-chart" role="img" aria-label="${E(label)}"><svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".24"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs><line x1="${px}" y1="${h-py}" x2="${w-px}" y2="${h-py}" stroke="#34343a" stroke-width="1"/><line x1="${px}" y1="${h/2}" x2="${w-px}" y2="${h/2}" stroke="#29292e" stroke-width="1" stroke-dasharray="4 5"/><path d="${area}" fill="url(#${id})"/><path d="${path}" fill="none" stroke="${color}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>${xy.map((p,i)=>`<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${i===xy.length-1?5:3}" fill="${color}" stroke="#17171a" stroke-width="2" vector-effect="non-scaling-stroke"><title>${E(day(p.date))}: ${E(fmt(p.value))} ${E(unit)}</title></circle>`).join('')}</svg><div class="ofp-axis"><span>${E(shortDay(clean[0].date))}</span><span>${clean.length===1?'Нужна ещё одна запись':E(shortDay(clean[clean.length-1].date))}</span></div></div>`
  }

  function strengthSeries(rows){
    const sorted=chronological(rows,'measured_at');
    const mode=sorted.some(x=>N(x.e1rm)>0)?'e1rm':sorted.some(x=>N(x.weight_kg)>0)?'weight':'reps';
    const label=mode==='e1rm'?'Расчётный 1ПМ':mode==='weight'?'Рабочий вес':'Повторения',unit=mode==='reps'?'повт.':'кг';
    const points=sorted.map(x=>({date:x.measured_at,value:mode==='e1rm'?N(x.e1rm):mode==='weight'?N(x.weight_kg):N(x.reps)})).filter(x=>x.value!=null);
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

  function weightPoints(data){return chronological(data?.measurements,'measure_date').map(x=>({date:x.measure_date,value:N(x.weight_kg)})).filter(x=>x.value!=null&&x.value>0)}
  function availableMeasures(data){return MEASURES.map(([key,name])=>({key,name,points:chronological(data?.measurements,'measure_date').map(x=>({date:x.measure_date,value:measure(x,key)})).filter(x=>x.value!=null)})).filter(x=>x.points.length)}
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
    const c=data?.client||{},saved=nutritionPlan(data)?.inputs||{},profileSex=['male','female'].includes(c.sex)?c.sex:'';
    return{
      sex:profileSex||(['male','female'].includes(saved.sex)?saved.sex:''),
      age:age(c.birth_date)??saved.age??'',height:N(c.height_cm)??saved.height??'',weight:latestWeight(data)??saved.weight??'',
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
      return{date:String(row.measure_date||'').slice(0,10),weight:N(row.weight_kg),measurements}
    }).filter(x=>x.date&&(x.weight!=null||Object.keys(x.measurements).length));
    const cleanStrengths=chronological(data?.strengths,'measured_at').map(row=>({date:String(row.measured_at||'').slice(0,10),key:String(row.exercise_key||''),name:String(row.exercise_name||'Упражнение').slice(0,120),weight:N(row.weight_kg),reps:N(row.reps),e1rm:N(row.e1rm)})).filter(x=>x.date&&x.key);
    return{version:REV,generatedAt:iso(),client:{name:String(data?.client?.display_name||'Клиент').slice(0,100)},nutrition:publicNutrition(data),measurements:cleanMeasures,strengths:cleanStrengths}
  }

  function weightCard(data){
    const points=weightPoints(data),last=points[points.length-1],delta=change(points);
    return `<section class="ofp-panel"><div class="ofp-panel-head"><div><div class="ofp-kicker">ВЕС</div><div class="ofp-panel-value">${last?`${fmt(last.value)} <small>кг</small>`:'Нет записей'}</div></div>${delta==null?'':`<div class="ofp-change neutral">${E(signed(delta,'кг'))}<small>за период</small></div>`}</div>${lineChart(points,{color:'#bf5af2',unit:'кг',label:'Динамика веса'})}${!points.length?'<button class="btn primary full" onclick="offlineMeasurementSheet(offlineProgressCurrentIdV321())">Добавить первый замер</button>':''}</section>`
  }

  function measurePanel(data){
    const available=availableMeasures(data);
    if(!available.length)return'<section id="ofpMeasurePanel" class="ofp-panel"><div class="ofp-kicker">ЗАМЕРЫ</div><div class="ofp-empty"><b>Истории замеров пока нет</b><span>Добавь два замера, и здесь появится динамика.</span></div></section>';
    if(!available.some(x=>x.key===state.measureKey))state.measureKey=available[0].key;
    const current=available.find(x=>x.key===state.measureKey)||available[0],last=current.points[current.points.length-1],delta=change(current.points);
    return `<section id="ofpMeasurePanel" class="ofp-panel"><div class="ofp-panel-head"><div><div class="ofp-kicker">ЗАМЕРЫ</div><div class="ofp-panel-value">${fmt(last?.value)} <small>см</small></div></div>${delta==null?'':`<div class="ofp-change neutral">${E(signed(delta,'см'))}<small>за период</small></div>`}</div><div class="ofp-measure-tabs">${available.map(x=>`<button class="${x.key===current.key?'on':''}" onclick="offlineProgressSelectMetricV321('${E(x.key)}')">${E(x.name)}</button>`).join('')}</div>${lineChart(current.points,{color:'#64d2ff',unit:'см',label:`Динамика: ${current.name}`})}</section>`
  }

  function latestStrengthText(row){
    if(!row)return'Нет записей';const w=N(row.weight_kg),r=N(row.reps),one=N(row.e1rm),parts=[];
    if(w!=null)parts.push(`${fmt(w)} кг`);if(r!=null)parts.push(`${fmt(r,0)} повт.`);if(one!=null)parts.push(`1ПМ ≈ ${fmt(one)} кг`);return parts.join(' · ')||'Запись без нагрузки'
  }
  function strengthCard(id,group){
    const rows=chronological(group.rows,'measured_at'),latest=rows[rows.length-1],series=strengthSeries(rows),delta=change(series.points);
    return `<article class="ofp-strength"><div class="ofp-strength-head"><div class="grow"><b>${E(group.name)}</b><span>${E(latestStrengthText(latest))}</span></div><button class="btn tiny" onclick="offlineStrengthSheet('${E(id)}','${T(group.key)}','${T(group.name)}')">＋ Запись</button></div><div class="ofp-strength-meta"><span>${E(series.label)}</span>${delta==null?'':`<b class="${delta<0?'down':''}">${E(signed(delta,series.unit))}</b>`}</div>${lineChart(series.points,{color:'#30d158',unit:series.unit,label:`${group.name}: ${series.label}`})}<button class="ofp-history-link" onclick="offlineStrengthHistory('${E(id)}','${T(group.key)}','${T(group.name)}')">Все записи · ${rows.length}<span>›</span></button></article>`
  }
  function strengthsSection(data){
    const id=data.client.id,groups=strengthGroups(data);
    return `<section class="ofp-section"><div class="ofp-section-head"><div><div class="ofp-kicker">СИЛОВЫЕ</div><h3>Выбранные упражнения</h3></div><button class="btn" onclick="offlineCustomStrengthSheet('${E(id)}')">＋ Добавить</button></div>${groups.length?`<div class="ofp-strength-list">${groups.map(g=>strengthCard(id,g)).join('')}</div>`:`<div class="ofp-empty"><b>Упражнения не выбраны</b><span>Добавь только те упражнения, по которым хочешь отслеживать прогресс этого клиента.</span><button class="btn primary" onclick="offlineCustomStrengthSheet('${E(id)}')">Добавить упражнение</button></div>`}</section>`
  }

  function renderDetail(){
    const data=state.data,c=data?.client;if(!c)return;const a=age(c.birth_date),w=latestWeight(data),initial=String(c.display_name||'К').trim().charAt(0).toUpperCase()||'К';
    W.modal?.(`<div class="ofp-root"><div class="sheet-grabber"></div><header class="ofp-hero"><div class="ofp-avatar">${E(initial)}</div><div class="grow"><h2>${E(c.display_name)}</h2><span>Офлайн-клиент</span></div><div class="ofp-hero-actions"><button class="btn ofp-share" onclick="offlineProgressShareV321('${E(c.id)}')">Поделиться</button><button class="btn" onclick="offlineEditClientSheet('${E(c.id)}')">Изменить</button></div></header><div class="ofp-facts"><div><span>Рост</span><b>${c.height_cm?`${fmt(c.height_cm)} см`:'—'}</b></div><div><span>Вес</span><b>${w?`${fmt(w)} кг`:'—'}</b></div><div><span>Возраст</span><b>${a==null?'—':`${a} лет`}</b></div></div><section class="ofp-sessions"><div><b>Осталось занятий</b><span>Списывай после очной тренировки</span></div><div class="ofp-stepper"><button onclick="offlineAdjustSessions('${E(c.id)}',-1)" aria-label="Списать занятие">−</button><strong>${Math.max(0,Number(c.sessions_remaining)||0)}</strong><button onclick="offlineAdjustSessions('${E(c.id)}',1)" aria-label="Добавить занятие">＋</button></div></section><div class="ofp-main-actions"><button class="btn primary" onclick="offlineMeasurementSheet('${E(c.id)}')">＋ Новый замер</button><button class="btn" onclick="offlineCustomStrengthSheet('${E(c.id)}')">＋ Упражнение</button></div>${nutritionCard(data)}${weightCard(data)}${measurePanel(data)}${strengthsSection(data)}${c.notes?`<section class="ofp-note"><div class="ofp-kicker">ЗАМЕТКА ТРЕНЕРА</div><p>${E(c.notes)}</p></section>`:''}</div>`)
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
  openDetail.__offlineProgressV323=true;openDetail.__offlineProgressV322=true;openDetail.__offlineProgressV321=true;

  W.offlineProgressCurrentIdV321=()=>state.id||'';
  W.offlineProgressSelectMetricV321=function(key){state.measureKey=String(key||'');const el=D.getElementById('ofpMeasurePanel');if(el&&state.data)el.outerHTML=measurePanel(state.data)};

  function catalogNames(){
    try{
      const fn=typeof W.catalogRecords==='function'?W.catalogRecords:typeof catalogRecords==='function'?catalogRecords:null;if(!fn)return[];
      const names=fn().map(x=>x.custom?x.n:(typeof W.ruExerciseName==='function'?W.ruExerciseName(x.n):x.n)).filter(Boolean);
      return[...new Set(names.map(String))].sort((a,b)=>a.localeCompare(b,'ru')).slice(0,350)
    }catch(_){return[]}
  }
  function customStrength(id){
    const options=catalogNames().map(n=>`<option value="${E(n)}"></option>`).join('');
    W.modal?.(`<div class="sheet-grabber"></div><div class="ofp-add-head"><div><h2>Добавить упражнение</h2><div class="muted">Для каждого клиента – свой список</div></div><button class="btn tiny" onclick="closeModal()">✕</button></div><div class="field"><label>Упражнение</label><input id="ofpExerciseName" list="ofpExerciseList" placeholder="Начни вводить или напиши своё" autocomplete="off"><datalist id="ofpExerciseList">${options}</datalist></div><div class="field"><label>Тренажёр или вариант, если нужен</label><input id="ofpExerciseVariant" placeholder="Например, Matrix или Technogym"></div><div class="ofp-tip">Одинаковое упражнение на разных тренажёрах лучше вести как два показателя – их веса могут быть несопоставимы.</div><button class="btn primary full" onclick="offlineProgressOpenStrengthV321('${E(id)}')">Добавить и записать результат</button>`)
  }
  customStrength.__offlineProgressV323=true;customStrength.__offlineProgressV322=true;customStrength.__offlineProgressV321=true;
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
      const url=new URL('progress.html',W.location.href);url.search='';url.hash=`t=${token}`;
      const title=`Прогресс – ${data.client.display_name}`;
      if(navigator.share){try{await navigator.share({title,text:'Вес, КБЖУ, замеры и силовые показатели',url:url.href});return}catch(e){if(e?.name==='AbortError')return}}
      await copyText(url.href);W.toast?.('Ссылка скопирована')
    }catch(e){console.warn('UNVRSL share offline progress',e);W.alert?.(`Не удалось создать ссылку: ${e?.message||'ошибка'}`)}
  };

  D.getElementById('unvrsl-offline-progress-v322-style')?.remove();
  const style=D.createElement('style');style.id='unvrsl-offline-progress-v323-style';style.textContent=`
    .ofp-root{padding-bottom:12px;color:#f5f5f7}.ofp-root *{min-width:0}.ofp-hero{display:grid;grid-template-columns:58px minmax(0,1fr) auto;gap:13px;align-items:center;padding:2px 0 17px}.ofp-avatar{width:58px;height:58px;border-radius:19px;display:grid;place-items:center;background:linear-gradient(145deg,#bf5af2,#8b3ac1);font-size:25px;font-weight:900;box-shadow:0 12px 28px rgba(191,90,242,.18)}.ofp-hero h2{font-size:29px;line-height:1.05;letter-spacing:-.8px;margin:0}.ofp-hero .grow>span{display:block;color:#8e8e93;margin-top:5px}.ofp-hero-actions{display:flex;gap:7px}.ofp-hero-actions .btn{min-height:42px;padding:10px 12px}.ofp-share{color:#e7bdff!important;border:1px solid rgba(191,90,242,.45)!important;background:rgba(191,90,242,.11)!important}.ofp-facts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-bottom:10px}.ofp-facts>div{padding:13px 14px;border-radius:18px;background:#202024;border:1px solid #34343a}.ofp-facts span{display:block;color:#85858c;font-size:11px;text-transform:uppercase;letter-spacing:.06em}.ofp-facts b{display:block;margin-top:5px;font-size:18px;line-height:1.15}.ofp-sessions{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;padding:16px 17px;border-radius:21px;background:#1f2023;border:1px solid #35363c;margin:10px 0}.ofp-sessions b{display:block;font-size:17px}.ofp-sessions span{display:block;color:#8e8e93;font-size:12px;line-height:1.3;margin-top:4px}.ofp-stepper{display:grid;grid-template-columns:42px 42px 42px;align-items:center;gap:5px}.ofp-stepper button{height:42px;border-radius:13px;background:#303138;border:1px solid #414249;font-size:22px}.ofp-stepper strong{text-align:center;font-size:24px}.ofp-main-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}.ofp-main-actions .btn{min-height:50px}.ofp-nutrition{display:block;width:100%;padding:17px;margin:10px 0 14px;border:1px solid rgba(191,90,242,.38);border-radius:22px;background:linear-gradient(145deg,rgba(191,90,242,.13),rgba(31,32,35,.96) 58%);color:#f5f5f7;text-align:left}.ofp-nutrition-top{display:flex;align-items:center;justify-content:space-between;gap:14px}.ofp-nutrition-top span{display:block;color:#c98af5;font-size:12px;font-weight:850;letter-spacing:.12em}.ofp-nutrition-top b{display:block;margin-top:7px;font-size:19px}.ofp-nutrition-top small{display:block;margin-top:5px;color:#9999a0;font-size:12px;line-height:1.35}.ofp-nutrition-top strong{flex:0 0 auto;color:#e6b9ff;font-size:13px}.ofp-nutrition-top i{font-style:normal;font-size:22px;vertical-align:-2px}.ofp-nutrition-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:13px}.ofp-nutrition-grid span{padding:9px;border-radius:13px;background:rgba(255,255,255,.055)}.ofp-nutrition-grid small{display:block;color:#8e8e95;font-size:10px}.ofp-nutrition-grid b{display:block;margin-top:4px;font-size:13px}.ofp-panel{background:#1c1c20;border:1px solid #303036;border-radius:24px;padding:18px;margin:11px 0;overflow:hidden}.ofp-panel-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.ofp-kicker{color:#85858d;font-size:12px;line-height:1;font-weight:800;letter-spacing:.13em}.ofp-panel-value{font-size:27px;font-weight:850;letter-spacing:-.6px;margin-top:8px}.ofp-panel-value small{font-size:14px;color:#a0a0a7}.ofp-change{font-size:16px;font-weight:850;text-align:right;color:#c98af5}.ofp-change small{display:block;font-size:10px;font-weight:600;color:#818188;margin-top:3px}.ofp-chart{margin-top:12px}.ofp-chart svg{display:block;width:100%;height:132px;overflow:visible}.ofp-axis{display:flex;justify-content:space-between;color:#6f6f77;font-size:10px;margin-top:3px}.ofp-chart-empty{min-height:112px;display:grid;place-items:center;text-align:center;color:#76767d;font-size:13px}.ofp-measure-tabs{display:flex;gap:6px;overflow-x:auto;padding:13px 0 2px;scrollbar-width:none}.ofp-measure-tabs::-webkit-scrollbar{display:none}.ofp-measure-tabs button{flex:0 0 auto;padding:8px 11px;border-radius:999px;background:#292a2f;color:#8e8e95;font-size:12px;font-weight:750}.ofp-measure-tabs button.on{background:rgba(100,210,255,.15);color:#8bddff}.ofp-section{margin-top:22px}.ofp-section-head{display:flex;align-items:end;justify-content:space-between;gap:12px;padding:0 3px 9px}.ofp-section-head h3{font-size:22px;line-height:1.08;margin:7px 0 0}.ofp-section-head .btn{min-height:42px}.ofp-strength-list{display:grid;gap:10px}.ofp-strength{background:#1c1c20;border:1px solid #303036;border-radius:24px;padding:17px;overflow:hidden}.ofp-strength-head{display:flex;align-items:center;gap:10px}.ofp-strength-head b{display:block;font-size:17px;line-height:1.2}.ofp-strength-head span{display:block;color:#8d8d94;font-size:12px;line-height:1.35;margin-top:4px}.ofp-strength-head .btn{flex:0 0 auto}.ofp-strength-meta{display:flex;justify-content:space-between;align-items:center;margin-top:14px;color:#818188;font-size:11px}.ofp-strength-meta b{color:#30d158;font-size:13px}.ofp-strength-meta b.down{color:#ff9f0a}.ofp-strength .ofp-chart svg{height:108px}.ofp-history-link{width:100%;display:flex;justify-content:space-between;align-items:center;color:#a7a7ae;border-top:1px solid #303036;padding:12px 1px 0;margin-top:7px;font-size:12px;text-align:left}.ofp-history-link span{font-size:20px}.ofp-empty{display:grid;gap:8px;justify-items:start;padding:20px;border-radius:22px;background:#1c1c20;border:1px dashed #393940;color:#8e8e95}.ofp-empty b{color:#f4f4f6;font-size:17px}.ofp-empty span{font-size:13px;line-height:1.45}.ofp-empty .btn{margin-top:5px}.ofp-note{margin-top:18px;padding:3px}.ofp-note p{color:#a0a0a7;line-height:1.5;white-space:pre-wrap}.ofp-loading{min-height:360px;display:grid;place-content:center;justify-items:center;gap:15px;color:#8e8e95}.ofp-loading i{width:28px;height:28px;border-radius:50%;border:3px solid #33333a;border-top-color:#bf5af2;animation:ofp-spin .8s linear infinite}.ofp-add-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.ofp-add-head h2{margin-bottom:5px}.ofp-tip{padding:12px 13px;margin:12px 0 15px;border-radius:15px;background:rgba(100,210,255,.08);border:1px solid rgba(100,210,255,.2);color:#9fcfe1;font-size:12px;line-height:1.45}.ofn-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.ofn-head h2{margin:7px 0 4px;font-size:28px}.ofn-head>div>span{color:#8e8e95;font-size:14px}.ofn-back{padding:0;color:#c98af5;font-size:14px;font-weight:750}.ofn-flow{margin-top:14px;padding:12px 13px;border-radius:15px;background:rgba(191,90,242,.09);color:#cda7df;font-size:13px}.ofn-fields{display:grid;grid-template-columns:1fr 1fr;gap:0 10px;margin-top:10px}.ofn-wide{grid-column:1/-1}.ofn-wide>small{display:block;margin:7px 2px 0;color:#85858d;font-size:12px;line-height:1.4}.ofn-stale{margin:12px 0;padding:11px 12px;border-radius:14px;background:rgba(255,159,10,.1);color:#e0b166;font-size:12px;line-height:1.4}.ofn-stale[hidden]{display:none}.ofn-stale+.btn{margin-top:2px}#ofnResult{margin-top:14px}.ofn-empty{padding:17px;border-radius:17px;background:#222226;color:#8e8e95;font-size:14px}.ofn-base{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.ofn-base>div{padding:11px;border-radius:16px;background:#222226;border:1px solid #303036}.ofn-base span,.ofn-base small{display:block;color:#8e8e95;font-size:10px;line-height:1.3}.ofn-base b{display:block;margin:5px 0;font-size:16px}.ofn-formula,.ofn-note{margin-top:9px;padding:12px 13px;border-radius:15px;background:#202024;color:#aaaab1;font-size:12px;line-height:1.45}.ofn-note{background:rgba(255,159,10,.09);color:#d8b06d}.ofn-goal{margin-top:9px;padding:14px;border:1px solid #303036;border-radius:19px;background:#202024}.ofn-goal>div:first-child{display:flex;justify-content:space-between;align-items:baseline;gap:8px}.ofn-goal strong{color:#30d158;font-size:14px}.ofn-macros{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-top:11px}.ofn-macros span{padding:9px 8px;border-radius:13px;background:#2a2a2f}.ofn-macros small{display:block;color:#8e8e95;font-size:10px}.ofn-macros b{display:block;margin-top:4px;font-size:13px}.ofn-check{display:block;margin-top:9px;color:#777780;font-size:11px}@keyframes ofp-spin{to{transform:rotate(360deg)}}
    @media(max-width:430px){.ofp-hero{grid-template-columns:52px minmax(0,1fr);padding-bottom:13px}.ofp-avatar{width:52px;height:52px;border-radius:17px}.ofp-hero h2{font-size:26px}.ofp-hero-actions{grid-column:1/-1;display:grid;grid-template-columns:1fr 1fr}.ofp-hero-actions .btn{min-height:44px}.ofp-facts>div{padding:12px 10px}.ofp-facts b{font-size:16px}.ofp-sessions{padding:14px}.ofp-stepper{grid-template-columns:38px 36px 38px}.ofp-stepper button{height:40px}.ofp-main-actions{grid-template-columns:1fr}.ofp-panel{padding:16px}.ofp-chart svg{height:120px}.ofp-strength .ofp-chart svg{height:100px}.ofp-section-head{align-items:center}.ofp-section-head h3{font-size:19px}.ofp-section-head .btn{padding:9px 10px;font-size:12px}.ofp-nutrition{padding:15px}.ofp-nutrition-grid{gap:5px}.ofp-nutrition-grid b{font-size:11px}.ofn-fields{grid-template-columns:1fr}.ofn-wide{grid-column:auto}.ofn-base b{font-size:14px}.ofn-goal>div:first-child{display:block}.ofn-goal strong{display:block;margin-top:5px}.ofn-macros b{font-size:12px}}
  `;D.head.appendChild(style);

  function install(){
    if(!W.__unvrslOfflineClients)return;
    W.offlineClientDetail=openDetail;W.offlineCustomStrengthSheet=customStrength;
    try{offlineClientDetail=openDetail;offlineCustomStrengthSheet=customStrength}catch(_){ }
  }
  [0,120,500,1400,3200].forEach(ms=>setTimeout(install,ms));
  W.addEventListener('unvrsl:cloud-modules-settled',install,{passive:true});
})();
