'use strict';
(function(root,factory){
  const api=factory(root||{});
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root&&root.document)api.boot();
})(typeof window!=='undefined'?window:globalThis,function(W){
  const D=W.document;
  const VERSION=600;
  let activeGoal='cut',livePreview=null;
  const GOALS={
    cut:{title:'Сушка',cal:[.85,.90],protein:[1.8,2.4],fat:[.6,.9]},
    maintain:{title:'Поддержание',cal:null,protein:[1.5,2],fat:[.7,1]},
    gain:{title:'Набор',cal:[1.10,1.15],protein:[1.6,2.2],fat:[.8,1.1]}
  };
  const ACTIVITY_LABELS={
    sedentary:'Сидячая',
    low:'Невысокая',
    moderate:'Умеренная',
    high:'Высокая',
    very_high:'Очень высокая'
  };
  const num=v=>{if(v===''||v==null)return null;const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:null};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const fmt=v=>Number(v).toLocaleString('ru-RU',{maximumFractionDigits:1});
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const state=()=>{try{if(typeof st!=='undefined'){W.st=st;return st}}catch(_){ }return W.st||null};
  const saveState=()=>{try{if(typeof save==='function')save();else W.save?.()}catch(_){ }};

  function recommendedActivityFactor(inputs){
    const steps=clamp(num(inputs.steps)||0,0,50000);
    const strength=clamp(num(inputs.strengthSessions)||0,0,14);
    const cardio=clamp(num(inputs.cardioSessions)||0,0,14);
    const minutes=clamp(num(inputs.cardioMinutes)||30,10,180);
    const cardioLoad=cardio*minutes;
    const work=inputs.workType||'sedentary';
    const daily=inputs.dailyActivity||'low';
    const intensity=inputs.trainingIntensity||'moderate';
    const veryHigh=steps>=18000&&strength>=6&&cardio>=4&&work==='heavy'&&intensity==='high';
    const high=(steps>=12000&&strength>=5&&cardioLoad>=90&&work!=='sedentary'&&intensity==='high')||
      (steps>=16000&&strength>=5&&cardioLoad>=90&&work==='heavy');
    const moderate=(steps>=8000&&strength>=3)||(steps>=7000&&strength>=4)||
      (steps>=14000&&strength>=2)||(steps>=10000&&work==='heavy')||
      (work==='mobile'&&strength>=3&&steps>=7000)||
      (steps>=6500&&strength>=3&&cardioLoad>=120&&intensity!=='low')||
      (work==='heavy'&&strength>=3&&steps>=6000);
    const light=strength>=3||(strength>=2&&(steps>=3000||cardio>=1||work!=='sedentary'))||
      steps>=4000||cardioLoad>=60||work!=='sedentary'||daily==='high'||daily==='very_high';
    const factor=veryHigh?1.9:high?1.725:moderate?1.55:light?1.375:1.2;
    const reason=factor===1.9?'Экстремально высокая совокупная нагрузка':
      factor===1.725?'Высокая ежедневная и тренировочная нагрузка':
      factor===1.55?'Шаги и тренировки дают умеренную общую активность':
      factor===1.375?'Невысокая общая нагрузка вне зала':
      'Минимальная подвижность большую часть дня';
    return {factor,reason,steps,strengthSessions:strength,cardioSessions:cardio,cardioMinutes:minutes,workType:work,trainingIntensity:intensity};
  }

  function bmrFor(inputs){
    const sex=inputs.sex,weight=num(inputs.weight),height=num(inputs.height),age=num(inputs.age);
    if(!['male','female'].includes(sex)||!(weight>0)||!(height>0)||!(age>0))throw new Error('Не хватает данных для BMR');
    const overweight=inputs.overweight===true||inputs.overweight==='yes';
    if(overweight){
      const value=10*weight+6.25*height-5*age+(sex==='male'?5:-161);
      return {value,formula:'Миффлин – Сан Жеор',reason:'выбрано наличие лишнего веса'};
    }
    const value=sex==='male'
      ?88.36+13.4*weight+4.8*height-5.7*age
      :447.6+9.2*weight+3.1*height-4.3*age;
    return {value,formula:'Харрис – Бенедикт',reason:'лишний вес не указан'};
  }

  function goalResult(key,tdee,weight){
    const g=GOALS[key];
    const calories=key==='maintain'
      ?[Math.round(tdee-50),Math.round(tdee+50)]
      :[Math.round(tdee*g.cal[0]),Math.round(tdee*g.cal[1])];
    const protein=[Math.round(weight*g.protein[0]),Math.round(weight*g.protein[1])];
    const fat=[Math.round(weight*g.fat[0]),Math.round(weight*g.fat[1])];
    const carbs=[
      Math.max(0,Math.round((calories[0]-protein[1]*4-fat[1]*9)/4)),
      Math.max(0,Math.round((calories[1]-protein[0]*4-fat[0]*9)/4))
    ];
    const check=[
      protein[1]*4+fat[1]*9+carbs[0]*4,
      protein[0]*4+fat[0]*9+carbs[1]*4
    ];
    return {key,title:g.title,calories,protein,fat,carbs,check,delta:[check[0]-calories[0],check[1]-calories[1]]};
  }

  function validate(inputs){
    const rules=[
      [['male','female'].includes(inputs.sex),'Укажи пол'],
      [num(inputs.age)>=14&&num(inputs.age)<=100,'Возраст должен быть от 14 до 100 лет'],
      [num(inputs.height)>=120&&num(inputs.height)<=230,'Проверь рост'],
      [num(inputs.weight)>=35&&num(inputs.weight)<=300,'Проверь вес'],
      [num(inputs.steps)>=0&&num(inputs.steps)<=50000,'Проверь среднее количество шагов'],
      [num(inputs.strengthSessions)>=0&&num(inputs.strengthSessions)<=14,'Проверь количество силовых'],
      [Object.prototype.hasOwnProperty.call(ACTIVITY_LABELS,inputs.dailyActivity),'Укажи активность вне тренировок'],
      [['sedentary','mobile','heavy'].includes(inputs.workType||'sedentary'),'Укажи характер работы'],
      [['low','moderate','high'].includes(inputs.trainingIntensity||'moderate'),'Укажи интенсивность тренировок'],
      [num(inputs.cardioSessions??0)>=0&&num(inputs.cardioSessions??0)<=14,'Проверь количество кардиотренировок'],
      [num(inputs.cardioMinutes??30)>=10&&num(inputs.cardioMinutes??30)<=180,'Проверь длительность кардио']
    ];
    return rules.find(x=>!x[0])?.[1]||null;
  }

  function calculate(inputs){
    const error=validate(inputs);if(error)throw new Error(error);
    const clean={...inputs,age:num(inputs.age),height:num(inputs.height),weight:num(inputs.weight),steps:num(inputs.steps),strengthSessions:num(inputs.strengthSessions),cardioSessions:num(inputs.cardioSessions??0),cardioMinutes:num(inputs.cardioMinutes??30),overweight:inputs.overweight===true||inputs.overweight==='yes'};
    const bmr=bmrFor(clean),auto=recommendedActivityFactor(clean);
    const manual=num(clean.activityFactor);
    const factor=manual&&[1.2,1.375,1.55,1.725,1.9].includes(manual)?manual:auto.factor;
    const tdee=bmr.value*factor;
    return {version:VERSION,inputs:clean,bmr:{...bmr,value:Math.round(bmr.value)},activity:{...auto,factor,automatic:!manual},tdee:Math.round(tdee),goals:Object.fromEntries(Object.keys(GOALS).map(k=>[k,goalResult(k,tdee,clean.weight)]))};
  }

  function ageFromBirthDate(value){
    if(!value)return null;const d=new Date(String(value).slice(0,10)+'T12:00:00');if(Number.isNaN(d.getTime()))return null;
    const now=new Date();let age=now.getFullYear()-d.getFullYear();
    if(now<new Date(now.getFullYear(),d.getMonth(),d.getDate()))age--;
    return age;
  }

  function profileDefaults(){
    const s=state()||{},saved=s.nutritionPlannerV311?.inputs||{},cloud=W.cloud?.profile||{};
    const bio=s.profileBio||{},last=Array.isArray(s.bw)&&s.bw.length?s.bw[s.bw.length-1]:null;
    const rawSex=saved.sex||bio.sex||cloud.sex||'male';
    const sex=/female|жен/i.test(rawSex)?'female':'male';
    return {
      sex,
      age:saved.age??ageFromBirthDate(bio.birthDate||bio.birth_date||cloud.birth_date)??'',
      height:saved.height??bio.heightCm??bio.height_cm??cloud.height_cm??'',
      weight:saved.weight??num(last?.w??last?.weight_kg)??'',
      overweight:saved.overweight===true||saved.overweight==='yes',
      steps:saved.steps??8000,
      strengthSessions:saved.strengthSessions??3,
      dailyActivity:saved.dailyActivity||'low',
      workType:saved.workType||'sedentary',
      trainingIntensity:saved.trainingIntensity||'moderate',
      cardioSessions:saved.cardioSessions??0,
      cardioMinutes:saved.cardioMinutes??30,
      activityFactor:saved.activityFactor??''
    };
  }

  function readInputs(){
    const val=id=>D.getElementById(id)?.value??'';
    return {
      sex:val('np311Sex'),age:val('np311Age'),height:val('np311Height'),weight:val('np311Weight'),
      overweight:val('np311Overweight')==='yes',steps:val('np311Steps'),strengthSessions:val('np311Strength'),
      dailyActivity:val('np311Daily'),workType:val('np600Work'),trainingIntensity:val('np600Intensity'),
      cardioSessions:val('np600Cardio'),cardioMinutes:val('np600CardioMinutes'),activityFactor:val('np311Factor')
    };
  }

  function refreshActivityPreview(){
    if(!D)return null;
    const factorSelect=D.getElementById('np311Factor');
    if(!factorSelect)return null;
    const inputs=readInputs(),automatic=recommendedActivityFactor(inputs);
    const option=factorSelect.querySelector('option[value=""]');
    if(option)option.textContent=`Авто – ×${String(automatic.factor).replace('.',',')}`;
    const hint=D.getElementById('np311FactorHint');
    if(hint)hint.textContent=factorSelect.value
      ?`Выбран вручную: ×${String(factorSelect.value).replace('.',',')}`
      :`Авто: ×${String(automatic.factor).replace('.',',')}. ${automatic.reason}.`;
    const cardioBox=D.getElementById('np600CardioDuration');
    if(cardioBox)cardioBox.hidden=!(num(inputs.cardioSessions)>0);
    const host=D.getElementById('np311Result');
    if(host)try{
      livePreview=calculate(inputs);
      host.innerHTML=resultHtml(livePreview);
      host.dataset.np311Calculated='1';
    }catch(error){
      livePreview=null;
      host.innerHTML=`<div class="np311-empty" role="status">${esc(error.message)}</div>`;
    }
    const saveHint=D.getElementById('np600SaveHint');
    if(saveHint)saveHint.textContent='Предпросмотр пересчитывается сразу. Нажми «Сохранить», чтобы обновить цели дневника.';
    return automatic.factor;
  }

  function resultHtml(result){
    if(!result)return '<div class="np311-empty">Заполни данные для расчёта.</div>';
    const goal=result.goals[activeGoal]||result.goals.cut;
    const midpoint=(goal.calories[0]+goal.calories[1])/2;
    const p=Math.round((goal.protein[0]+goal.protein[1])/2);
    const f=Math.round((goal.fat[0]+goal.fat[1])/2);
    const c=Math.max(0,Math.round((midpoint-p*4-f*9)/4));
    const total=p*4+f*9+c*4;
    const pct=v=>Math.max(0,100*v/Math.max(1,total));
    const selectedProtocol=state()?.mealNutritionV1?.protocol;
    const goalTabs=Object.values(result.goals).map(g=>`<button type="button" class="np600-tab" aria-pressed="${g.key===activeGoal}" onclick="selectNutritionGoalV600('${g.key}')">${esc(g.title)}</button>`).join('');
    const macro=(name,v,grams,cls)=>`<div class="np600-macro ${cls}"><small>${name}</small><b>${fmt(v[0])}–${fmt(v[1])}</b><span>г/сутки</span><small>${fmt(grams[0])}–${fmt(grams[1])} г/кг</small></div>`;
    return `
      <div class="np311-base np600-base">
        <div><span>BMR</span><b>${fmt(result.bmr.value)}</b><small>ккал в сутки</small></div>
        <div><span>Активность</span><b>×${String(result.activity.factor).replace('.',',')}</b><small>${result.activity.automatic?'Авто':'Вручную'}</small></div>
        <div><span>TDEE</span><b>${fmt(result.tdee)}</b><small>ккал в сутки</small></div>
      </div>
      <div class="np311-formula">Формула: <b>${esc(result.bmr.formula)}</b>. ${esc(result.bmr.reason)}. Это стартовая оценка, а не точный расход.</div>
      <div class="np600-goal-tabs" role="group" aria-label="Цель питания">${goalTabs}</div>
      <div class="np600-calorie">
        <small>${goal.key==='cut'?'ДЕФИЦИТ 10–15%':goal.key==='gain'?'ПРОФИЦИТ 10–15%':'ПОДДЕРЖАНИЕ ±50 ККАЛ'}</small>
        <strong>${fmt(goal.calories[0])}–${fmt(goal.calories[1])}</strong><span>ккал/день</span>
      </div>
      <div class="np600-macros">
        ${macro('Белки',goal.protein,[GOALS[goal.key].protein[0],GOALS[goal.key].protein[1]],'np600-protein')}
        ${macro('Жиры',goal.fat,[GOALS[goal.key].fat[0],GOALS[goal.key].fat[1]],'np600-fat')}
        ${macro('Углеводы',goal.carbs,[goal.carbs[0]/result.inputs.weight,goal.carbs[1]/result.inputs.weight],'np600-carbs')}
      </div>
      <p class="np600-subnote">Границы БЖУ – возможные сочетания внутри калорий, а не независимые цели.</p>
      <div class="np600-example">
        <div class="np600-example-head"><b>Пример рабочего сочетания</b><strong>${fmt(total)} ккал</strong></div>
        <div class="np600-bar" aria-hidden="true"><i style="width:${pct(p*4)}%;background:#5277c3"></i><i style="width:${pct(f*9)}%;background:#cc954c"></i><i style="width:${pct(c*4)}%;background:#429a87"></i></div>
        <div class="np600-example-key"><span>Б <b>${p} г</b></span><span>Ж <b>${f} г</b></span><span>У <b>${c} г</b></span></div>
        <small>Проверка: ${p} × 4 + ${f} × 9 + ${c} × 4 = ${fmt(total)} ккал</small>
      </div>
      ${result.inputs.age<18?'<div class="np311-note">До 18 лет расчёт ориентировочный. Жёсткий дефицит и спортивную сушку без медицинского сопровождения не назначаем.</div>':''}
      ${result.inputs.sex==='female'&&goal.key==='cut'?'<div class="np311-note">Для длительной сушки у девушек чаще выбирай жиры 0,7–0,9 г/кг; нижняя граница 0,6 допустима, но не обязательна.</div>':''}
      <div class="np600-actions">
        <button type="button" class="btn full" onclick="copyNutritionResultV600()">Скопировать расчёт</button>
        <button type="button" class="btn primary full" onclick="saveAndApplyNutritionGoalV600()">Сохранить и применить «${esc(goal.title)}»</button>
        <small>${selectedProtocol?'Сейчас в дневнике: '+esc(result.goals[selectedProtocol]?.title||'Свои КБЖУ'):'Протокол дневника ещё не выбран'}</small>
      </div>
      <details class="np311-guide"><summary>Как проверять расчёт</summary><ol>
        <li>7–10 дней записывай привычное питание в FatSecret или YAZIO; взвешивай продукты, по возможности сырыми.</li>
        <li>Учитывай масла, соусы, напитки, перекусы. Не путай сухие и готовые продукты.</li>
        <li>После 10–14 дней сравни средний вес за 7 дней, талию, силовые и самочувствие.</li>
        <li>Корректируй питание на 100–200 ккал или меняй активность по результатам.</li>
      </ol></details>
    `;
  }

  function formHtml(inputs,result){
    const selected=(a,b)=>String(a)===String(b)?' selected':'';
    const auto=recommendedActivityFactor(inputs);
    const range=(label,id,slider,value,min,max,step,units)=>`
      <div class="np600-slider-field">
        <div class="np600-slider-head"><label for="${id}">${label}</label><div><input id="${id}" type="number" min="${min}" max="${max}" step="${step}" inputmode="numeric" value="${esc(value)}" aria-label="${label}"><small>${units}</small></div></div>
        <input id="${slider}" type="range" min="${min}" max="${max}" step="${step}" value="${esc(value)}" aria-label="${label}, ползунок">
      </div>`;
    return `<div class="sheet-grabber"></div>
      <div class="row between np600-heading"><div><h2>Калькулятор КБЖУ</h2><div class="muted">UNVRSL FIT · интерактивный расчёт</div></div><button class="btn tiny" onclick="closeModal()">✕</button></div>
      <div class="np600-section-title">Параметры</div>
      <div class="np311-fields">
        <div class="field"><label>Пол</label><select id="np311Sex"><option value="male"${selected(inputs.sex,'male')}>Мужской</option><option value="female"${selected(inputs.sex,'female')}>Женский</option></select></div>
        <div class="field"><label>Лишний вес</label><select id="np311Overweight"><option value="no"${selected(inputs.overweight,false)}>Нет</option><option value="yes"${selected(inputs.overweight,true)}>Да</option></select></div>
        <div class="field"><label>Возраст, лет</label><input id="np311Age" type="number" min="14" max="100" value="${esc(inputs.age)}"></div>
        <div class="field"><label>Рост, см</label><input id="np311Height" type="number" min="120" max="230" value="${esc(inputs.height)}"></div>
        <div class="field"><label>Вес, кг</label><input id="np311Weight" type="number" min="35" max="300" step="0.1" value="${esc(inputs.weight)}"></div>
        <div class="field"><label>Характер работы</label><select id="np600Work"><option value="sedentary"${selected(inputs.workType,'sedentary')}>Сидячая</option><option value="mobile"${selected(inputs.workType,'mobile')}>Подвижная</option><option value="heavy"${selected(inputs.workType,'heavy')}>Физически тяжёлая</option></select></div>
      </div>
      <div class="np600-section-title">Движение и тренировки</div>
      ${range('Шаги в день','np311Steps','np600StepsSlider',inputs.steps,0,25000,500,'шагов')}
      ${range('Силовые в неделю','np311Strength','np600StrengthSlider',inputs.strengthSessions,0,7,1,'раз')}
      ${range('Кардио в неделю','np600Cardio','np600CardioSlider',inputs.cardioSessions||0,0,7,1,'раз')}
      <div id="np600CardioDuration" ${inputs.cardioSessions?'':'hidden'}>${range('Длительность кардио','np600CardioMinutes','np600MinutesSlider',inputs.cardioMinutes||30,10,120,5,'мин')}</div>
      <div class="np311-fields">
        <div class="field"><label>Интенсивность тренировок</label><select id="np600Intensity"><option value="low"${selected(inputs.trainingIntensity,'low')}>Низкая</option><option value="moderate"${selected(inputs.trainingIntensity,'moderate')}>Средняя</option><option value="high"${selected(inputs.trainingIntensity,'high')}>Высокая</option></select></div>
        <div class="field"><label>Активность вне зала</label><select id="np311Daily">${Object.entries(ACTIVITY_LABELS).map(([k,v])=>`<option value="${k}"${selected(inputs.dailyActivity,k)}>${v}</option>`).join('')}</select></div>
        <div class="field np311-wide"><label>Коэффициент активности</label><select id="np311Factor"><option value=""${selected(inputs.activityFactor,'')}>Авто – ×${String(auto.factor).replace('.',',')}</option>${[1.2,1.375,1.55,1.725,1.9].map(v=>`<option value="${v}"${selected(inputs.activityFactor,v)}>×${String(v).replace('.',',')} – вручную</option>`).join('')}</select><div class="np311-hint" id="np311FactorHint"></div></div>
      </div>
      <div id="np600SaveHint" class="np600-subnote">Меняй данные – результат обновляется сразу.</div>
      <button class="btn primary full np600-save" onclick="calculateNutritionPlannerV311()">Сохранить расчёт</button>
      <div id="np311Result" data-np311-calculated="${result?'1':'0'}">${resultHtml(result)}</div>
    `;
  }

  function open(){
    const s=state()||{},inputs=profileDefaults();
    activeGoal=['cut','maintain','gain'].includes(s.mealNutritionV1?.protocol)?s.mealNutritionV1.protocol:'cut';
    livePreview=null;
    if(typeof W.modal==='function')W.modal(formHtml(inputs,s.nutritionPlannerV311?.result||null));
    else{try{modal(formHtml(inputs,s.nutritionPlannerV311?.result||null))}catch(_){ }}
    setTimeout(()=>refreshActivityPreview(),0);
  }

  function run(){
    try{
      const inputs=readInputs(),result=calculate(inputs),s=state();
      if(s){s.nutritionPlannerV311={inputs:result.inputs,result,updatedAt:Date.now()};saveState();const key=s.mealNutritionV1?.protocol;if(result.goals[key])W.UNVRSLMealUI?.selectProtocol(key,result)}
      const out=D.getElementById('np311Result');if(out){out.innerHTML=resultHtml(result);out.dataset.np311Calculated='1'}
      livePreview=result;
      refreshActivityPreview();
      renderCard();W.toast?.('Расчёт КБЖУ сохранён');
      return result;
    }catch(e){W.toast?.(e.message||'Проверь данные');return null}
  }

  function cardHtml(result){
    if(!result)return `<div class="np311-card-copy"><div class="title">Расчёт КБЖУ</div><div class="muted">Сушка, поддержание и набор по твоим данным</div></div><span class="np311-chevron">›</span>`;
    const g=result.goals,key=state()?.mealNutritionV1?.protocol,target=state()?.mealNutritionV1?.target;
    if(g[key]&&target)return `<div class="np311-card-copy"><div class="title">Расчёт КБЖУ</div><div class="muted">Текущий протокол: ${esc(g[key].title)}</div><div class="np311-card-grid np311-current-goal">${[['Ккал','k'],['Белки','p'],['Жиры','f'],['Углеводы','c']].map(([label,metric])=>`<span><small>${label}</small><b>${target.ranges?target.ranges[metric].map(fmt).join('–'):fmt(target[metric])}</b></span>`).join('')}</div></div><span class="np311-chevron">›</span>`;
    return `<div class="np311-card-copy"><div class="title">Расчёт КБЖУ</div><div class="np311-card-grid"><span><small>Сушка</small><b>${fmt(g.cut.calories[0])}–${fmt(g.cut.calories[1])}</b></span><span><small>Поддержание</small><b>${fmt(g.maintain.calories[0])}–${fmt(g.maintain.calories[1])}</b></span><span><small>Набор</small><b>${fmt(g.gain.calories[0])}–${fmt(g.gain.calories[1])}</b></span></div></div><span class="np311-chevron">›</span>`;
  }

  function findProgramCard(plan){
    const nodes=[...plan.querySelectorAll('*')].filter(el=>String(el.textContent||'').trim()==='ОСНОВНАЯ ПРОГРАММА');
    return nodes[0]?.closest('.card')||null;
  }

  function renderCard(){
    if(!D)return;const plan=D.getElementById('plan');if(!plan)return;
    let mount=D.getElementById('np311PlanMount');
    if(!mount){mount=D.createElement('div');mount.id='np311PlanMount';mount.innerHTML='<div class="section">ПИТАНИЕ</div><button type="button" class="card np311-plan-card" onclick="openNutritionPlannerV311()"></button>'}
    const anchor=findProgramCard(plan);
    if(!mount.isConnected){if(anchor)anchor.insertAdjacentElement('beforebegin',mount);else plan.appendChild(mount)}
    const btn=mount.querySelector('.np311-plan-card'),result=state()?.nutritionPlannerV311?.result||null,html=cardHtml(result);
    const signature=JSON.stringify(result?{tdee:result.tdee,goals:Object.values(result.goals||{}).map(g=>g.calories),protocol:state()?.mealNutritionV1?.protocol,target:state()?.mealNutritionV1?.target}:null);
    if(btn&&btn.dataset.np311Signature!==signature){btn.innerHTML=html;btn.dataset.np311Signature=signature}
  }

  function ensureStyle(){
    if(!D||D.getElementById('nutrition-planner-v311-style'))return;
    const style=D.createElement('style');style.id='nutrition-planner-v311-style';style.textContent=`
      .np311-plan-card{width:100%;display:flex;align-items:center;justify-content:space-between;gap:12px;text-align:left}
      .np311-card-copy{min-width:0;flex:1}.np311-card-copy>.muted{margin-top:5px;line-height:1.35}.np311-chevron{font-size:34px;color:#777}
      .np311-card-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:12px}.np311-card-grid span{display:block;min-width:0;padding:9px 8px;border-radius:14px;background:#27272a}.np311-card-grid small{display:block;color:#8e8e93;font-size:10px}.np311-card-grid b{display:block;margin-top:3px;font-size:12px;white-space:nowrap}
      .np311-fields{display:grid;grid-template-columns:1fr 1fr;gap:0 10px;margin-top:14px}.np311-fields .field{min-width:0}.np311-wide{grid-column:1/-1}.np311-hint{font-size:11px;color:#7f7f85;margin:6px 2px 0}
      #np311Result{margin-top:14px}.np311-empty{padding:14px;border-radius:16px;background:#222225;color:#8e8e93;line-height:1.4}
      .np311-base{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.np311-base>div{background:#232326;border:1px solid #303034;border-radius:15px;padding:10px;min-width:0}.np311-base span,.np311-base small{display:block;color:#8e8e93;font-size:10px}.np311-base b{display:block;font-size:16px;margin:4px 0}.np311-base small{line-height:1.25}
      .np311-formula,.np311-note{margin-top:9px;padding:11px 12px;border-radius:14px;background:#202023;color:#aaaab0;font-size:11px;line-height:1.45}.np311-note{background:rgba(255,159,10,.09);color:#d8b06d}
      .np311-goal{margin-top:9px;padding:13px;border:1px solid #303034;border-radius:18px;background:#202023}.np311-goal-title{display:flex;justify-content:space-between;gap:8px;align-items:baseline}.np311-goal-title strong{color:var(--green);font-size:14px;white-space:nowrap}
      .np311-macros{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-top:10px}.np311-macros span{padding:8px;border-radius:12px;background:#29292d;min-width:0}.np311-macros small{display:block;color:#8e8e93;font-size:10px}.np311-macros b{display:block;margin-top:3px;font-size:13px;white-space:nowrap}.np311-check{margin-top:8px;color:#777;font-size:10px}
      .np311-guide{margin-top:10px;padding:12px;border-radius:16px;background:#232326;color:#c9c9cd}.np311-guide summary{font-weight:750;cursor:pointer}.np311-guide ol{margin:10px 0 0;padding-left:20px;color:#9d9da3;font-size:12px;line-height:1.45}.np311-guide li+li{margin-top:5px}
      @media(max-width:390px){.np311-fields{grid-template-columns:1fr}.np311-wide{grid-column:auto}.np311-card-grid{gap:5px}.np311-card-grid b{font-size:11px}.np311-base b{font-size:14px}.np311-goal-title{display:block}.np311-goal-title strong{display:block;margin-top:4px}.np311-macros b{font-size:12px}}
      .np600-heading h2{margin:0 0 4px;font-size:24px}
      .np600-section-title{color:var(--muted);font-size:12px;font-weight:750;text-transform:uppercase;letter-spacing:.08em;margin:20px 2px 8px}
      .np600-slider-field{padding:13px 12px 11px;border-radius:16px;background:var(--panel2);margin:9px 0}
      .np600-slider-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:9px}
      .np600-slider-head label{margin:0;font-size:14px;font-weight:650}
      .np600-slider-head>div{display:flex;align-items:center;gap:5px}
      .np600-slider-head input{max-width:94px;min-width:48px;text-align:right;padding:7px 5px;border-radius:9px}
      .np600-slider-head small{font-size:10px;color:var(--muted)}
      .np600-slider-field input[type=range]{display:block;width:100%;margin:0;accent-color:var(--accent)}
      .np600-subnote{color:var(--muted);font-size:11px;line-height:1.45;margin:9px 2px}
      .np600-save{margin-top:10px}
      .np600-base{margin-top:13px}
      .np600-goal-tabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px;padding:5px;border-radius:15px;background:var(--panel2);margin-top:15px}
      .np600-tab{padding:11px 3px;font-size:12px;font-weight:700;border-radius:11px}
      .np600-tab[aria-pressed=true]{background:var(--accent);color:#fff}
      .np600-calorie{display:flex;flex-direction:column;gap:3px;margin:15px 0 12px}
      .np600-calorie small{font-size:10px;color:var(--muted);font-weight:700}
      .np600-calorie strong{font-size:28px;line-height:1.2;letter-spacing:-.5px;font-variant-numeric:tabular-nums}
      .np600-calorie span{font-size:12px;color:var(--muted)}
      .np600-macros{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
      .np600-macro{min-width:0;padding:12px 7px;border-radius:14px;background:var(--panel2);display:flex;flex-direction:column;gap:4px}
      .np600-macro b{font-size:14px;white-space:nowrap;font-variant-numeric:tabular-nums}
      .np600-macro small,.np600-macro span{font-size:10px;color:var(--muted)}
      .np600-macro.np600-protein{border-top:3px solid #5277c3}
      .np600-macro.np600-fat{border-top:3px solid #cc954c}
      .np600-macro.np600-carbs{border-top:3px solid #429a87}
      .np600-example{background:var(--panel2);border-radius:16px;padding:13px;margin-top:13px}
      .np600-example-head{display:flex;justify-content:space-between;gap:6px;align-items:center;font-size:12px}
      .np600-bar{display:flex;width:100%;height:12px;margin:12px 0 10px;border-radius:99px;overflow:hidden;gap:2px}
      .np600-bar i{display:block;height:100%}
      .np600-example-key{display:flex;justify-content:space-between;gap:5px;font-size:12px;margin-bottom:8px}
      .np600-example>small{display:block;font-size:10px;color:var(--muted);line-height:1.5}
      .np600-actions{display:grid;gap:8px;margin-top:13px}
      .np600-actions>small{color:var(--muted);font-size:11px;text-align:center}
      #np600CardioDuration[hidden]{display:none}
      @media(max-width:390px){.np600-macro b{font-size:12px}.np600-calorie strong{font-size:25px}.np600-example-head{font-size:11px}}
    `;D.head.appendChild(style);
  }

  function boot(){
    if(!D||W.__unvrslNutritionPlannerV311)return;W.__unvrslNutritionPlannerV311=true;
    W.chooseNutritionProtocolV480=function(key){try{W.UNVRSLMealUI.selectProtocol(key,state()?.nutritionPlannerV311?.result);const out=D.getElementById('np311Result');if(out)out.innerHTML=resultHtml(state()?.nutritionPlannerV311?.result);W.toast?.('Протокол выбран')}catch(error){W.toast?.(error.message)}};
    W.openNutritionPlannerV311=open;W.calculateNutritionPlannerV311=run;W.refreshNutritionActivityV312=refreshActivityPreview;
    W.selectNutritionGoalV600=function(key){if(!GOALS[key])return;activeGoal=key;const out=D.getElementById('np311Result');if(out)out.innerHTML=resultHtml(livePreview);};
    W.saveAndApplyNutritionGoalV600=function(){const result=run();if(result)W.chooseNutritionProtocolV480(activeGoal);};
    W.copyNutritionResultV600=async function(){
      const result=livePreview;if(!result)return;
      const g=result.goals[activeGoal],text=[g.title,'BMR: '+fmt(result.bmr.value)+' ккал ('+result.bmr.formula+')','Активность: '+result.activity.factor,'TDEE: '+fmt(result.tdee)+' ккал','Ккал: '+g.calories.map(fmt).join('–'),'Б: '+g.protein.map(fmt).join('–')+' г','Ж: '+g.fat.map(fmt).join('–')+' г','У: '+g.carbs.map(fmt).join('–')+' г'].join('\n');
      try{await W.navigator.clipboard.writeText(text);W.toast?.('Расчёт скопирован')}catch(_){W.prompt?.('Скопируй расчёт',text)}
    };
    const linked={np600StepsSlider:'np311Steps',np600StrengthSlider:'np311Strength',np600CardioSlider:'np600Cardio',np600MinutesSlider:'np600CardioMinutes'};
    const reverse=Object.fromEntries(Object.entries(linked).map(([a,b])=>[b,a]));
    function onFieldChange(event){
      const target=event.target,root=D.getElementById('sheet');
      if(!root?.contains(target)||!target?.id||!/^np(311|600)/.test(target.id)||target.id==='np311Result')return;
      const other=linked[target.id]||reverse[target.id];
      if(other){const peer=D.getElementById(other);if(peer)peer.value=target.value}
      refreshActivityPreview();
    }
    D.addEventListener('input',onFieldChange);
    D.addEventListener('change',onFieldChange);W.unvrslNutritionPlannerV311={calculate,recommendedActivityFactor,bmrFor,goalResult,refreshActivityPreview,version:VERSION};
    const start=()=>{ensureStyle();renderCard()};
    if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',start,{once:true});else start();
    let queued=false;const plan=D.getElementById('plan');if(plan)new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;renderCard()})}).observe(plan,{childList:true,subtree:true});
    D.addEventListener('click',e=>{if(e.target?.closest?.('[data-p="plan"]'))setTimeout(renderCard,60)},true);
  }
  return {calculate,recommendedActivityFactor,bmrFor,goalResult,validate,refreshActivityPreview,boot,version:VERSION};
});

