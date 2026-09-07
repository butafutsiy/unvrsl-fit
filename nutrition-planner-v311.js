'use strict';
(function(root,factory){
  const api=factory(root||{});
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root&&root.document)api.boot();
})(typeof window!=='undefined'?window:globalThis,function(W){
  const D=W.document;
  const VERSION=312;
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
    const sessions=clamp(num(inputs.strengthSessions)||0,0,14);
    const daily={sedentary:0,low:1,moderate:2,high:3,very_high:4}[inputs.dailyActivity]??0;
    const stepLevel=steps<3500?0:steps<7000?1:steps<10000?2:steps<14000?3:4;
    const trainingLevel=sessions===0?0:sessions<=2?.5:sessions<=4?1:sessions<=6?1.5:2;
    const score=stepLevel*.5+trainingLevel*.25+daily*.25;
    const factor=score<=.5?1.2:score<=1.5?1.375:score<=2.5?1.55:score<=3.5?1.725:1.9;
    return {factor,score:+score.toFixed(2),stepLevel,trainingLevel,dailyLevel:daily};
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
      [Object.prototype.hasOwnProperty.call(ACTIVITY_LABELS,inputs.dailyActivity),'Укажи активность вне тренировок']
    ];
    return rules.find(x=>!x[0])?.[1]||null;
  }

  function calculate(inputs){
    const error=validate(inputs);if(error)throw new Error(error);
    const clean={...inputs,age:num(inputs.age),height:num(inputs.height),weight:num(inputs.weight),steps:num(inputs.steps),strengthSessions:num(inputs.strengthSessions),overweight:inputs.overweight===true||inputs.overweight==='yes'};
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
      dailyActivity:saved.dailyActivity||'moderate',
      activityFactor:saved.activityFactor??''
    };
  }

  function readInputs(){
    const val=id=>D.getElementById(id)?.value??'';
    return {
      sex:val('np311Sex'),age:val('np311Age'),height:val('np311Height'),weight:val('np311Weight'),
      overweight:val('np311Overweight')==='yes',steps:val('np311Steps'),strengthSessions:val('np311Strength'),
      dailyActivity:val('np311Daily'),activityFactor:val('np311Factor')
    };
  }

  function refreshActivityPreview(markStale=false){
    if(!D)return null;
    const select=D.getElementById('np311Factor');if(!select)return null;
    const inputs=readInputs(),auto=recommendedActivityFactor(inputs),shown=String(auto.factor).replace('.',',');
    const option=select.querySelector('option[value=""]');if(option)option.textContent=`Авто – ${shown}`;
    const hint=D.getElementById('np311FactorHint');
    if(hint)hint.innerHTML=select.value
      ?`Выбран вручную: <b>×${String(select.value).replace('.',',')}</b>.`
      :`Авто сейчас: <b>×${shown}</b>. Учтены шаги, силовые и активность вне тренировок.`;
    if(markStale){
      const out=D.getElementById('np311Result');
      if(out&&out.dataset.np311Calculated==='1'){
        const active=select.value?String(select.value).replace('.',','):shown,mode=select.value?'Выбранный коэффициент':'Автокоэффициент сейчас';
        out.innerHTML=`<div class="np311-empty">Данные изменены. ${mode} <b>×${active}</b>. Нажми «Рассчитать и сохранить», чтобы обновить КБЖУ.</div>`;
      }
    }
    return auto.factor;
  }

  function resultHtml(result){
    if(!result)return '<div class="np311-empty">Заполни данные и нажми «Рассчитать».</div>';
    const cards=Object.values(result.goals).map(g=>`<div class="np311-goal">
      <div class="np311-goal-title"><b>${g.title}</b><strong>${fmt(g.calories[0])}–${fmt(g.calories[1])} ккал</strong></div>
      <div class="np311-macros"><span><small>Белок</small><b>${g.protein[0]}–${g.protein[1]} г</b></span><span><small>Жиры</small><b>${g.fat[0]}–${g.fat[1]} г</b></span><span><small>Углеводы</small><b>${g.carbs[0]}–${g.carbs[1]} г</b></span></div>
      <div class="np311-check">Проверка границ: ${fmt(g.check[0])} / ${fmt(g.check[1])} ккал</div>
    </div>`).join('');
    const activityMode=result.activity.automatic?'подобран автоматически':'выбран вручную';
    const female=result.inputs.sex==='female'?'<div class="np311-note">Для девушек не стоит надолго фиксировать жиры на самой нижней границе без отдельной причины.</div>':'';
    return `<div class="np311-base">
      <div><span>BMR</span><b>${fmt(result.bmr.value)} ккал</b><small>${esc(result.bmr.formula)}</small></div>
      <div><span>Активность</span><b>× ${String(result.activity.factor).replace('.',',')}</b><small>${activityMode}</small></div>
      <div><span>TDEE</span><b>${fmt(result.tdee)} ккал</b><small>расчётное поддержание</small></div>
    </div><div class="np311-formula">Использована формула <b>${esc(result.bmr.formula)}</b>: ${esc(result.bmr.reason)}. Коэффициент учитывает ${fmt(result.inputs.steps)} шагов, ${fmt(result.inputs.strengthSessions)} силовых и активность «${esc(ACTIVITY_LABELS[result.inputs.dailyActivity].toLowerCase())}».</div>${cards}${female}
    <details class="np311-guide"><summary>Как проверить расчёт на практике</summary><ol><li>7–10 дней записывай обычное питание в FatSecret или YAZIO и используй кухонные весы.</li><li>Учитывай масло, соусы, напитки и перекусы. Сырой и готовый вес продукта не смешивай.</li><li>Корректируй рацион плавно – примерно на 100–200 ккал.</li><li>На сушке оценивай динамику 10–14 дней. Если прогресса нет, сначала добавь шаги или снизь 100–200 ккал.</li></ol></details>`;
  }

  function formHtml(inputs,result){
    const selected=(a,b)=>String(a)===String(b)?' selected':'';
    const auto=recommendedActivityFactor(inputs);
    return `<div class="sheet-grabber"></div><div class="row between"><div><h2>Расчёт КБЖУ</h2><div class="muted">BMR → TDEE → цель → Б/Ж → углеводы остатком</div></div><button class="btn tiny" onclick="closeModal()">✕</button></div>
      <div class="np311-fields">
        <div class="field"><label>Пол</label><select id="np311Sex"><option value="male"${selected(inputs.sex,'male')}>Мужской</option><option value="female"${selected(inputs.sex,'female')}>Женский</option></select></div>
        <div class="field"><label>Возраст, лет</label><input id="np311Age" type="number" inputmode="numeric" min="14" max="100" value="${esc(inputs.age)}"></div>
        <div class="field"><label>Рост, см</label><input id="np311Height" type="number" inputmode="decimal" min="120" max="230" value="${esc(inputs.height)}"></div>
        <div class="field"><label>Вес, кг</label><input id="np311Weight" type="number" inputmode="decimal" step="0.1" min="35" max="300" value="${esc(inputs.weight)}"></div>
        <div class="field"><label>Есть лишний вес?</label><select id="np311Overweight"><option value="no"${selected(inputs.overweight,false)}>Нет</option><option value="yes"${selected(inputs.overweight,true)}>Да</option></select></div>
        <div class="field"><label>Среднее шагов в день</label><input id="np311Steps" type="number" inputmode="numeric" min="0" max="50000" step="500" value="${esc(inputs.steps)}" oninput="refreshNutritionActivityV312(true)"></div>
        <div class="field"><label>Силовых в неделю</label><input id="np311Strength" type="number" inputmode="numeric" min="0" max="14" value="${esc(inputs.strengthSessions)}" oninput="refreshNutritionActivityV312(true)"></div>
        <div class="field"><label>Активность вне тренировок</label><select id="np311Daily" onchange="refreshNutritionActivityV312(true)">${Object.entries(ACTIVITY_LABELS).map(([k,v])=>`<option value="${k}"${selected(inputs.dailyActivity,k)}>${v}</option>`).join('')}</select></div>
        <div class="field np311-wide"><label>Коэффициент активности</label><select id="np311Factor" onchange="refreshNutritionActivityV312(true)"><option value=""${selected(inputs.activityFactor,'')}>Авто – ${String(auto.factor).replace('.',',')}</option>${[1.2,1.375,1.55,1.725,1.9].map(v=>`<option value="${v}"${selected(inputs.activityFactor,v)}>${String(v).replace('.',',')} – вручную</option>`).join('')}</select><div id="np311FactorHint" class="np311-hint">Авто сейчас: <b>×${String(auto.factor).replace('.',',')}</b>. Учтены шаги, силовые и активность вне тренировок.</div></div>
      </div>
      <button class="btn primary full" onclick="calculateNutritionPlannerV311()">Рассчитать и сохранить</button>
      <div id="np311Result" data-np311-calculated="${result?'1':'0'}">${resultHtml(result)}</div>`;
  }

  function open(){
    const s=state()||{},inputs=profileDefaults(),result=s.nutritionPlannerV311?.result||null;
    if(typeof W.modal==='function')W.modal(formHtml(inputs,result));
    else{try{modal(formHtml(inputs,result))}catch(_){ }}
    setTimeout(()=>refreshActivityPreview(false),0);
  }

  function run(){
    try{
      const inputs=readInputs(),result=calculate(inputs),s=state();
      if(s){s.nutritionPlannerV311={inputs:result.inputs,result,updatedAt:Date.now()};saveState()}
      const out=D.getElementById('np311Result');if(out){out.innerHTML=resultHtml(result);out.dataset.np311Calculated='1'}
      refreshActivityPreview(false);
      renderCard();W.toast?.('Расчёт КБЖУ сохранён');
      return result;
    }catch(e){W.toast?.(e.message||'Проверь данные');return null}
  }

  function cardHtml(result){
    if(!result)return `<div class="np311-card-copy"><div class="title">Расчёт КБЖУ</div><div class="muted">Сушка, поддержание и набор по твоим данным</div></div><span class="np311-chevron">›</span>`;
    const g=result.goals;
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
    const signature=JSON.stringify(result?{tdee:result.tdee,goals:Object.values(result.goals||{}).map(g=>g.calories)}:null);
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
    `;D.head.appendChild(style);
  }

  function boot(){
    if(!D||W.__unvrslNutritionPlannerV311)return;W.__unvrslNutritionPlannerV311=true;
    W.openNutritionPlannerV311=open;W.calculateNutritionPlannerV311=run;W.refreshNutritionActivityV312=refreshActivityPreview;W.unvrslNutritionPlannerV311={calculate,recommendedActivityFactor,bmrFor,goalResult,refreshActivityPreview,version:VERSION};
    const start=()=>{ensureStyle();renderCard()};
    if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',start,{once:true});else start();
    let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;renderCard()})}).observe(D.documentElement,{childList:true,subtree:true});
    D.addEventListener('click',e=>{if(e.target?.closest?.('[data-p="plan"]'))setTimeout(renderCard,60)},true);
  }
  return {calculate,recommendedActivityFactor,bmrFor,goalResult,validate,refreshActivityPreview,boot,version:VERSION};
});
