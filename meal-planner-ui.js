'use strict';
(function(W){
  const D=W.document,E=W.UNVRSLMealEngine;
  if(!D||!E)return;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=v=>Number(v||0).toLocaleString('ru-RU',{maximumFractionDigits:1});
  const dateNow=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
  const state=()=>{try{return typeof st!=='undefined'?st:W.st}catch(_){return W.st}};
  const owner=()=>String(state()?.accountOwnerId||W.cloud?.user?.id||'local');
  let activeDate=dateNow(),openedOwner=null;
  function db(){const s=state();if(!s)throw Error('Данные приложения ещё загружаются');return s.mealNutritionV1||(s.mealNutritionV1={version:1,days:{},preferences:{count:4,maxTime:45,exclude:'',allergens:[],vegetarian:false},target:null});}
  function day(){return db().days[activeDate]||{plan:null,eaten:{},extra:[]};}
  function mutate(fn){
    const s=state(),before=JSON.stringify(s.mealNutritionV1);
    try{
      fn(db());const ok=typeof save==='function'?save():W.save?.();
      if(ok===false)throw Error('Не удалось сохранить питание. Освободи место и повтори.');
    }catch(e){if(before)s.mealNutritionV1=JSON.parse(before);else delete s.mealNutritionV1;throw e;}
  }
  const totals=d=>E.round(E.sum([...Object.values(d.eaten||{}).map(m=>m.nutrition),...(d.extra||[]).map(m=>m.nutrition)]));
  const macros=n=>`${fmt(n.k)} ккал · Б ${fmt(n.p)} · Ж ${fmt(n.f)} · У ${fmt(n.c)} г`;
  function fields(t){return ['k','p','f','c'].map((k,i)=>`<div class="field"><label>${['Калории, ккал','Белки, г','Жиры, г','Углеводы, г'][i]}</label><input id="mp-${k}" type="number" min="1" step="1" inputmode="decimal" value="${t?esc(t[k]):''}"></div>`).join('');}
  function render(){
    const host=D.getElementById('mealPlannerRoot');if(!host)return;
    if(openedOwner!==owner()){W.closeModal?.();return;}
    const data=db(),d=day(),prefs=data.preferences,t=d.plan?.target||data.target,eaten=totals(d);
    const np=state()?.nutritionPlannerV311?.result;
    const metric=label=>['k','p','f','c'].map((k,i)=>`<div><small>${['Ккал','Белки','Жиры','Углеводы'][i]}</small><b>${fmt(eaten[k])}</b><span>${t?'/ '+fmt(t[k]):'цель не задана'}</span></div>`).join('');
    const planned=d.plan?E.round(E.sum([d.plan.total,...d.extra.map(x=>x.nutrition)])):null;
    const within=planned&&t&&['k','p','f','c'].every(k=>Math.abs(planned[k]-t[k])<=Math.max(t[k]*.1,k==='k'?50:5));
    host.innerHTML=`<div class="mp-head"><div><h2>Питание</h2><div class="muted">Меню под твои КБЖУ</div></div><button class="btn tiny" data-mp="calculator">Расчёт КБЖУ</button></div>
      <div class="field"><label>Дата дневника</label><input id="mp-date" type="date" value="${activeDate}" data-mp-date></div>
      <div class="mp-metrics">${metric()}</div>
      ${t?`<p class="mp-copy">Осталось: ${macros(E.round(Object.fromEntries(['k','p','f','c'].map(k=>[k,Math.max(0,t[k]-eaten[k])]))))}${['k','p','f','c'].some(k=>eaten[k]>t[k])?'<br>По части показателей цель уже превышена.':''}${Math.abs(4*t.p+9*t.f+4*t.c-t.k)>t.k*.1?'<br>Калории и заданные БЖУ расходятся больше чем на 10%. Проверь цели.':''}</p>`:''}
      <details class="mp-settings"${t?'':' open'}><summary>Цели и предпочтения</summary>
      ${np?`<div class="mp-actions">${[['cut','Сушка'],['maintain','Поддержание'],['gain','Набор']].map(([key,title])=>`<button class="btn tiny" data-mp="goal" data-value="${key}">${title}</button>`).join('')}</div><p class="mp-copy">Цель из калькулятора можно отредактировать ниже.</p>`:'<p class="mp-copy">Задай цели вручную или рассчитай КБЖУ по своим данным.</p>'}
      <div class="mp-fields">${fields(t)}
      <div class="field"><label>Приёмов пищи</label><select id="mp-count">${[3,4,5].map(n=>`<option value="${n}"${prefs.count==n?' selected':''}>${n}</option>`).join('')}</select></div>
      <div class="field"><label>Готовка одного блюда</label><select id="mp-time">${[15,30,45,60].map(n=>`<option value="${n}"${prefs.maxTime==n?' selected':''}>До ${n} минут</option>`).join('')}</select></div></div>
      <div class="field"><label>Исключить продукты, через запятую</label><input id="mp-exclude" value="${esc(prefs.exclude)}" placeholder="Например: банан, рыба"></div>
      <label class="mp-check"><input id="mp-vegetarian" type="checkbox"${prefs.vegetarian?' checked':''}>Без мяса и рыбы</label>
      <div class="mp-actions">${[['milk','Молочное'],['egg','Яйца'],['nuts','Орехи'],['fish','Рыба'],['soy','Соя'],['gluten','Глютен']].map(([id,label])=>`<label class="mp-check"><input type="checkbox" name="mp-allergen" value="${id}"${prefs.allergens.includes(id)?' checked':''}>Без: ${label.toLowerCase()}</label>`).join('')}</div>
      <button class="btn full" data-mp="save">Сохранить настройки</button></details>
      <button class="btn primary full" data-mp="generate">${d.plan?'Подобрать оставшееся меню':'Подобрать меню на день'}</button>
      <p class="mp-copy">${E.catalog.recipes.length} блюда. КБЖУ приблизительные: использованы усреднённые значения продуктов. Все граммовки до приготовления; у готовых продуктов это указано в названии. Масло включено.</p>
      ${d.plan?`<div class="mp-summary"><b>Меню на день: ${macros(planned)}</b><p class="mp-copy">Отклонение от цели: ${['k','p','f','c'].map((k,i)=>`${['Ккал','Б','Ж','У'][i]} ${planned[k]-t[k]>=0?'+':''}${fmt(planned[k]-t[k])}`).join(' · ')}. ${within?'':'Точное попадание не найдено; попробуй другие блюда или исключения.'}</p></div>`:''}
      ${(d.plan?.meals||[]).map(m=>{
        const done=!!d.eaten[m.id];
        return `<article class="mp-meal"><div class="mp-head"><small>${esc(m.title)}${done?' · записано':''}</small><span class="muted">${m.time} мин</span></div><h3>${esc(m.name)}</h3><b class="mp-macro">${macros(m.nutrition)}</b>
        <details><summary>Ингредиенты и приготовление</summary><ul>${m.ingredients.map(i=>`<li>${esc(E.catalog.foods[i.id].name)} – ${fmt(i.g)} г${i.id==='egg'?' (примерно '+fmt(i.g/50)+' шт.)':''}</li>`).join('')}</ul><p>${esc(m.steps)}</p></details>
        <div class="mp-actions"><button class="btn${done?'':' primary'}" data-mp="eat" data-id="${m.id}">${done?'Убрать из съеденного':'Съел эту порцию'}</button>${done?'':`<button class="btn" data-mp="swap" data-id="${m.id}">Заменить</button><label class="mp-portion">Порция ×<input type="number" min="0.25" max="3" step="0.05" value="1" aria-label="Множитель съеденной порции" id="mp-portion-${m.id}"></label>`}</div></article>`;
      }).join('')}
      <details class="mp-settings"><summary>Записать свою еду</summary><p class="mp-copy">Укажи КБЖУ на 100 г с упаковки или из проверенной карточки продукта.</p><div class="field"><label>Название</label><input id="mp-food-name" maxlength="120"></div><div class="mp-fields"><div class="field"><label>Съедено, г</label><input id="mp-food-grams" type="number" min="1" max="3000" inputmode="decimal"></div>${['k','p','f','c'].map((k,i)=>`<div class="field"><label>${['Ккал','Белки','Жиры','Углеводы'][i]} на 100 г</label><input id="mp-food-${k}" type="number" min="0" inputmode="decimal" step="0.1"></div>`).join('')}</div><button class="btn full" data-mp="extra">Записать</button></details>
      ${d.extra.map(x=>`<div class="mp-extra"><div><b>${esc(x.name)} · ${fmt(x.grams)} г</b><div class="mp-copy">${macros(x.nutrition)}</div></div><button class="btn tiny" data-mp="remove" data-id="${esc(x.id)}" aria-label="Удалить запись">✕</button></div>`).join('')}
      ${d.plan?`<details class="mp-settings"><summary>Список покупок на этот день</summary><ul>${shopping(d.plan).map(i=>`<li>${esc(E.catalog.foods[i.id].name)} – ${fmt(i.g)} г</li>`).join('')}</ul><p class="mp-copy">Количество до приготовления для всего выбранного меню.</p></details>`:''}
      <div id="mp-error" role="alert" class="mp-error"></div>`;
  }
  function shopping(plan){const amounts={};for(const m of plan.meals)for(const i of m.ingredients)amounts[i.id]=(amounts[i.id]||0)+i.g;return Object.entries(amounts).map(([id,g])=>({id,g}));}
  function readSettings(){
    const target=E.validateTarget(Object.fromEntries(['k','p','f','c'].map(k=>[k,Number(D.getElementById('mp-'+k).value.replace(',','.'))])));
    const preferences={count:Number(D.getElementById('mp-count').value),maxTime:Number(D.getElementById('mp-time').value),exclude:D.getElementById('mp-exclude').value,vegetarian:D.getElementById('mp-vegetarian').checked,allergens:[...D.querySelectorAll('[name="mp-allergen"]:checked')].map(x=>x.value)};
    const current=day();if(current.plan&&Object.keys(current.eaten).length&&preferences.count!==current.plan.meals.length)throw Error('Сначала убери записи съеденных блюд, чтобы изменить число приёмов.');
    return {target,preferences};
  }
  function build(target,prefs,d,banned){
    const extras=E.sum(d.extra.map(x=>x.nutrition));
    const remaining=Object.fromEntries(['k','p','f','c'].map(k=>[k,Math.max(k==='k'?100:1,target[k]-extras[k])]));
    const plan=E.generate(remaining,prefs.count,prefs,{locked:d.eaten,prior:d.plan?.meals||[],banned});
    const all=E.round(E.sum([plan.total,extras]));plan.target={...target};plan.delta=E.round(Object.fromEntries(['k','p','f','c'].map(k=>[k,all[k]-target[k]])));
    plan.withinTarget=['k','p','f','c'].every(k=>Math.abs(plan.delta[k])<=Math.max(target[k]*.1,k==='k'?50:5));return plan;
  }
  function open(){activeDate=dateNow();openedOwner=owner();W.modal('<div id="mealPlannerRoot"></div>');render();}
  W.openMealPlanner=open;
  D.addEventListener('change',e=>{if(!e.target.matches?.('[data-mp-date]'))return;if(/^\d{4}-\d{2}-\d{2}$/.test(e.target.value)){activeDate=e.target.value;render();}});
  D.addEventListener('click',e=>{
    const b=e.target.closest?.('[data-mp]');if(!b)return;
    if(b.dataset.mp==='open'){open();return;}
    if(!b.closest('#mealPlannerRoot'))return;
    if(openedOwner!==owner()){W.closeModal?.();return;}
    try{
      const action=b.dataset.mp,d=day();
      if(action==='calculator'){W.openNutritionPlannerV311();return;}
      if(action==='goal'){
        const result=state()?.nutritionPlannerV311?.result,g=result?.goals?.[b.dataset.value];if(!g)throw Error('Сначала рассчитай КБЖУ');
        const t=E.fromGoal(g);for(const k of ['k','p','f','c'])D.getElementById('mp-'+k).value=t[k];return;
      }
      if(action==='save'||action==='generate'){
        const {target,preferences}=readSettings();
        const plan=action==='generate'?build(target,preferences,d):d.plan&&d.plan.meals.length===preferences.count?{...d.plan,target}:null;
        mutate(data=>{data.target=target;data.preferences=preferences;data.days[activeDate]={...d,plan};});
      }
      if(action==='swap'){
        const current=d.plan?.meals.find(m=>m.id===b.dataset.id);if(!current||d.eaten[current.id])return;
        const {target,preferences}=readSettings();
        const locked=Object.fromEntries(d.plan.meals.filter(m=>m.id!==current.id).map(m=>[m.id,m]));
        const plan=build(target,preferences,{...d,eaten:locked},{[current.id]:[current.recipeId]});
        mutate(data=>{data.target=target;data.preferences=preferences;data.days[activeDate]={...d,plan};});
      }
      if(action==='eat'){
        const meal=d.plan?.meals.find(m=>m.id===b.dataset.id);if(!meal)return;
        const eaten={...d.eaten};
        if(eaten[meal.id])delete eaten[meal.id];
        else{
          const factor=Number(D.getElementById('mp-portion-'+meal.id).value);
          if(!Number.isFinite(factor)||factor<.25||factor>3)throw Error('Порция должна быть от 0,25 до 3');
          const ingredients=meal.ingredients.map(i=>({...i,g:Math.round(i.g*factor*10)/10}));
          eaten[meal.id]={...meal,ingredients,nutrition:E.nutrition(ingredients)};
        }
        const plan={...d.plan,meals:d.plan.meals.map(m=>eaten[m.id]||m)};plan.total=E.round(E.sum(plan.meals.map(m=>m.nutrition)));
        mutate(data=>{data.days[activeDate]={...d,plan,eaten};});
      }
      if(action==='extra'){
        const name=D.getElementById('mp-food-name').value.trim(),grams=Number(D.getElementById('mp-food-grams').value);
        const raw=Object.fromEntries(['k','p','f','c'].map(k=>[k,Number(D.getElementById('mp-food-'+k).value.replace(',','.'))]));
        if(!name||!Number.isFinite(grams)||grams<=0||grams>3000||['k','p','f','c'].some(k=>D.getElementById('mp-food-'+k).value===''||!Number.isFinite(raw[k])||raw[k]<0)||raw.k>1000||raw.p+raw.f+raw.c>100.5)throw Error('Проверь название, граммовку и КБЖУ на 100 г');
        const entry={id:'food-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),name,grams,nutrition:E.round(Object.fromEntries(['k','p','f','c'].map(k=>[k,raw[k]*grams/100])))};
        mutate(data=>{data.days[activeDate]={...d,extra:[...d.extra,entry]};});
      }
      if(action==='remove')mutate(data=>{data.days[activeDate]={...d,extra:d.extra.filter(x=>x.id!==b.dataset.id)};});
      render();mount();
    }catch(err){const out=D.getElementById('mp-error');if(out){out.textContent=err.message;out.scrollIntoView?.({block:'nearest'});}else W.toast?.(err.message);}
  });
  function mount(){
    const plan=D.getElementById('plan');if(!plan)return;
    let button=D.getElementById('mealPlannerEntry');
    if(!button){button=D.createElement('button');button.id='mealPlannerEntry';button.type='button';button.className='card mp-entry';button.dataset.mp='open';}
    const anchor=D.getElementById('np311PlanMount');if(!button.isConnected){if(anchor)anchor.after(button);else plan.append(button);}
    const html='<div><div class="title">Меню и дневник питания</div><div class="muted">Блюда под КБЖУ · порции · замены</div></div><span aria-hidden="true">›</span>';
    if(button.innerHTML!==html)button.innerHTML=html;
  }
  function boot(){mount();const plan=D.getElementById('plan');if(plan)new MutationObserver(mount).observe(plan,{childList:true,subtree:true});}
  if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  W.UNVRSLMealUI={shopping,totals};
})(window);
