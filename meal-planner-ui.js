'use strict';
(function(W){
  const D=W.document,E=W.UNVRSLMealEngine;
  if(!D||!E)return;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=v=>Number(v||0).toLocaleString('ru-RU',{maximumFractionDigits:1});
  const dateNow=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
  const state=()=>{if(W.UNVRSLMealContext?.getState)return W.UNVRSLMealContext.getState();try{return typeof st!=='undefined'?st:W.st}catch(_){return W.st}};
  const owner=()=>String(state()?.accountOwnerId||W.cloud?.user?.id||'local');
  let activeDate=dateNow(),openedOwner=null,browseQuery='',browseType='',browseLimit=24,replacementSlot=null;
  function db(){const s=state();if(!s)throw Error('Данные приложения ещё загружаются');return s.mealNutritionV1||(s.mealNutritionV1={version:1,days:{},preferences:{count:4,maxTime:45,exclude:'',allergens:[],vegetarian:false,simpleOnly:true},target:null});}
  function day(){return db().days[activeDate]||{plan:null,eaten:{},extra:[]};}
  function mutate(fn){
    const s=state(),before=JSON.stringify(s.mealNutritionV1);
    try{
      fn(db());const ok=W.UNVRSLMealContext?.save?W.UNVRSLMealContext.save():typeof save==='function'?save():W.save?.();
      if(ok===false)throw Error('Не удалось сохранить питание. Освободи место и повтори.');
    }catch(e){if(before)s.mealNutritionV1=JSON.parse(before);else delete s.mealNutritionV1;throw e;}
  }
  const protocolTitles={cut:'Сушка',maintain:'Поддержание',gain:'Набор',manual:'Свои КБЖУ'};
  const sameValues=(a,b)=>a&&b&&['k','p','f','c'].every(k=>Math.abs(a[k]-b[k])<.1);
  const sameTarget=(a,b)=>sameValues(a,b)&&JSON.stringify(a.ranges||null)===JSON.stringify(b.ranges||null);
  const rangeText=(t,k)=>t?.ranges?E.bounds(t,k).map(fmt).join('–'):fmt(t?.[k]);
  const remainingText=(t,n,k)=>{const [lo,hi]=E.bounds(t,k);return lo===hi?fmt(Math.max(0,hi-n[k])):[lo,hi].map(v=>fmt(Math.max(0,v-n[k]))).join('–')};
  const statusText=(n,t,k)=>{const delta=E.deviation(n,t,k);return t.ranges?(delta===0?'В диапазоне':(delta<0?'До минимума '+fmt(-delta):'Выше максимума '+fmt(delta))+(k==='k'?' ккал':' г')):(delta>=0?'+':'')+fmt(delta)+(k==='k'?' ккал':' г')};
  function selectProtocol(key,result=state()?.nutritionPlannerV311?.result){
    const goal=result?.goals?.[key];if(!goal||!['cut','maintain','gain'].includes(key))throw Error('Сначала рассчитай КБЖУ');
    const target=E.validateTarget(E.fromGoal(goal)),date=dateNow();
    mutate(data=>{const d=data.days[date]||{plan:null,eaten:{},extra:[]};
      const changed=!sameTarget(d.target||d.plan?.target||data.target,target);
      data.protocol=key;data.target=target;
      data.days[date]={...d,target:{...target},protocol:key,menuStale:changed||d.menuStale||!d.plan};
    });
    W.UNVRSLMealContext?.onProtocolChange?.(key);mount();return target;
  }
  function protocolHTML(){const data=db(),d=day(),result=state()?.nutritionPlannerV311?.result,key=d.protocol||data.protocol,target=d.target||d.plan?.target||data.target;
    return `<section class="mp-protocol"><div class="mp-head"><div><small>Текущий протокол</small><strong>${esc(protocolTitles[key]||(target?'Свои КБЖУ':'Выбери после расчёта'))}</strong></div>${target?`<span class="mp-tag">${rangeText(target,'k')} ккал</span>`:''}</div>${result?`<div class="mp-protocol-options">${['cut','maintain','gain'].filter(k=>result.goals?.[k]).map(k=>`<button data-mp="goal" data-value="${k}" aria-pressed="${key===k}">${protocolTitles[k]}</button>`).join('')}</div>`:''}</section>`;
  }
  const totals=d=>E.round(E.sum([...Object.values(d.eaten||{}).map(m=>m.nutrition),...(d.extra||[]).map(m=>m.nutrition)]));
  const macros=n=>`${fmt(n.k)} ккал · Б ${fmt(n.p)} · Ж ${fmt(n.f)} · У ${fmt(n.c)} г`;
  function fields(t){return ['k','p','f','c'].map((k,i)=>`<div class="field"><label>${['Калории, ккал','Белки, г','Жиры, г','Углеводы, г'][i]}</label><input id="mp-${k}" type="number" min="1" step="1" inputmode="decimal" value="${t?esc(t[k]):''}"></div>`).join('');}
  const recipeOf=m=>E.catalog.recipes.find(r=>r.id===m.recipeId);
  const unitName=u=>({g:'г',kg:'кг',ml:'мл',l:'л',piece:'шт.',clove:'зубч.',tbsp:'ст. л.',tsp:'ч. л.',pinch:'щеп.',sprig:'вет.',slice:'ломт.'}[u]||u);
  function ingredientRows(m){
    const recipe=recipeOf(m);
    if(recipe?.source){const factor=m.ingredients[0].g/100/recipe.baseServings;return recipe.details.map(i=>({name:i.name,amount:i.quantity===null?'по вкусу':fmt(i.quantity*factor)+' '+unitName(i.unit),note:i.note}));}
    return m.ingredients.map(i=>({name:E.catalog.foods[i.id].name,amount:fmt(i.g)+' г',note:i.id==='egg'?'примерно '+fmt(i.g/50)+' шт.':''}));
  }
  function weightHTML(m){const w=E.servingWeight(m);return `<div class="mp-ready"><span>Готовая порция${w?.estimated?' ≈':''}</span><b>${w?fmt(w.grams)+' г':'Взвесь после готовки'}</b></div>`;}
  function ownFoodHTML(){return `<details class="mp-settings mp-own" id="mp-own"><summary>＋ Добавить своё</summary><p class="mp-copy">Продукт или готовое блюдо: КБЖУ на 100 г с упаковки или из своей карточки рецепта.</p><div class="field"><label for="mp-food-name">Название</label><input id="mp-food-name" maxlength="120" placeholder="Например: домашний борщ"></div><div class="mp-fields"><div class="field"><label for="mp-food-grams">Съедено, г</label><input id="mp-food-grams" type="number" min="1" max="3000" inputmode="decimal"></div>${['k','p','f','c'].map((k,i)=>`<div class="field"><label for="mp-food-${k}">${['Ккал','Белки','Жиры','Углеводы'][i]} на 100 г</label><input id="mp-food-${k}" type="number" min="0" inputmode="decimal" step="0.1"></div>`).join('')}<div class="field"><label for="mp-food-slot">Приём пищи</label><select id="mp-food-slot">${['Завтрак','Обед','Ужин','Перекус'].map(x=>`<option>${x}</option>`).join('')}</select></div></div><label class="mp-check"><input id="mp-food-keep" type="checkbox" checked>Сохранить в «Мои продукты и блюда»</label><button class="btn primary full" data-mp="extra">Записать в дневник</button>${(db().savedFoods||[]).length?`<div class="mp-saved"><h3>Мои продукты и блюда</h3>${db().savedFoods.map(x=>`<div class="mp-saved-row"><button class="btn" data-mp="saved-food" data-id="${esc(x.id)}"><b>${esc(x.name)}</b><small>${macros(x.raw)} на 100 г</small></button><button class="btn tiny" data-mp="saved-delete" data-id="${esc(x.id)}" aria-label="Удалить сохранённое блюдо ${esc(x.name)}">✕</button></div>`).join('')}</div>`:''}</details>`;}
  function referencesHTML(){const labels=['Белки · Лента','Белки · Пятёрочка','Жиры · Лента','Жиры · Пятёрочка','Углеводы · Лента','Углеводы · Пятёрочка','Клетчатка · Лента','Клетчатка · Пятёрочка','Сладости · Лента','Сладости · Пятёрочка'];return `<details class="mp-settings"><summary>Что купить · продукты и КБЖУ</summary><p class="mp-copy">Твои подборки продуктов. Для записи проверяй актуальную упаковку: на карточках часть БЖУ не указана, а значения могут отличаться у разных марок.</p><div class="mp-reference-grid">${labels.map((x,i)=>`<a href="assets/nutrition/products-${i}.jpg" target="_blank" rel="noopener noreferrer"><img src="assets/nutrition/products-${i}.jpg" alt="${x}" loading="lazy" decoding="async" width="240" height="320"><span>${x} ↗</span></a>`).join('')}</div></details>`;}
  function ingredientsHTML(m){const recipe=recipeOf(m);return `<ul>${ingredientRows(m).map(i=>`<li><span>${esc(i.name)}</span><b>${esc(i.amount)}</b>${i.note?`<small>${esc(i.note)}</small>`:''}</li>`).join('')}</ul>${recipe?.source?`<p class="mp-copy">Количество на ${fmt(m.ingredients[0].g/100)} порц. Шаги описывают исходный рецепт на ${recipe.baseServings} порц. Можно приготовить весь рецепт и отделить свою порцию.</p>`:''}<p class="mp-steps">${esc(m.steps).replace(/\n/g,'<br><br>')}</p>${recipe?.guideUrl?`<a class="mp-guide" href="${esc(recipe.guideUrl)}" target="_blank" rel="noopener noreferrer">Фото и пошаговый рецепт · ${esc(recipe.guideSite)} ↗</a><p class="mp-copy">Пример приготовления. Для дневника используй состав и граммовки выше: рецепт на сайте может отличаться.</p>`:''}`;}
  function browse(){
    const host=D.getElementById('mp-recipes');if(!host)return;
    if(replacementSlot)return browseReplacements();
    const prefs={...db().preferences,maxTime:0,simpleOnly:false},q=browseQuery.toLowerCase().trim();
    const list=E.catalog.recipes.filter(r=>(!browseType||r.slots.includes(browseType))&&E.allowed(r,prefs)&&(!q||[r.name,r.country||'',...(r.details||[]).map(i=>i.name),...r.ingredients.map(i=>E.catalog.foods[i.id]?.name||'')].join(' ').toLowerCase().includes(q)));
    host.innerHTML=`<div class="mp-copy">Найдено ${list.length} · с учётом предпочтений</div>${list.slice(0,browseLimit).map(r=>{
      const m=E.fit(r,r.portionNutrition||E.nutrition(r.ingredients));
      const available=(day().plan?.meals||[]).filter(x=>!day().eaten[x.id]&&r.slots.includes(x.type));
      return `<article class="mp-recipe"><div class="mp-head"><span class="mp-tag">${esc(r.country||'Простой рецепт')}</span><small>${r.time} мин</small></div><h3>${esc(r.name)}</h3>${weightHTML(m)}<div class="mp-copy">${macros(m.nutrition)}${r.source?' · 1 порц.':''}</div><details><summary>Посмотреть рецепт</summary>${ingredientsHTML(m)}</details>${available.length?`<div class="mp-pick"><select aria-label="Приём пищи для блюда" id="mp-pick-${r.id}">${available.map(x=>`<option value="${x.id}">${esc(x.title)}</option>`).join('')}</select><button class="btn tiny" data-mp="pick" data-id="${r.id}">В меню ＋</button></div>`:''}</article>`;
    }).join('')}${list.length>browseLimit?'<button class="btn full" data-mp="more">Показать ещё 24</button>':''}${!list.length?'<p class="mp-copy">Нет совпадений. Измени поиск или предпочтения.</p>':''}`;
  }
  function replacementTarget(d,current){const others=E.sum(d.plan.meals.filter(m=>m.id!==current.id).map(m=>m.nutrition)),extras=E.sum(d.extra.map(m=>m.nutrition));return E.subtractTarget(d.target||d.plan.target,E.sum([others,extras]));}
  function browseReplacements(){
    const host=D.getElementById('mp-recipes'),d=day(),current=d.plan?.meals.find(m=>m.id===replacementSlot);if(!host||!current)return;
    const aim=replacementTarget(d,current),prefs={...db().preferences,maxTime:0,simpleOnly:false},q=browseQuery.toLowerCase().trim();
    const score=n=>E.loss(n,aim);
    const list=E.catalog.recipes.filter(r=>r.id!==current.recipeId&&r.slots.includes(current.type)&&E.allowed(r,prefs)&&(!q||[r.name,r.country||'',...(r.details||[]).map(i=>i.name),...r.ingredients.map(i=>E.catalog.foods[i.id]?.name||'')].join(' ').toLowerCase().includes(q))).map(r=>({recipe:r,meal:E.fit(r,aim)})).sort((a,b)=>Number(!!a.recipe.source)-Number(!!b.recipe.source)||score(a.meal.nutrition)-score(b.meal.nutrition));
    host.innerHTML=`<p class="mp-copy">${list.length} вариантов · сначала простые блюда, затем мировая кухня. Количество уже подобрано под этот приём.</p>${list.slice(0,browseLimit).map(({recipe:r,meal:m})=>`<article class="mp-recipe"><div class="mp-head"><span class="mp-tag">${esc(r.country||'Простой рецепт')}</span><small>${r.time} мин</small></div><h3>${esc(r.name)}</h3>${weightHTML(m)}<b class="mp-macro">${macros(m.nutrition)}</b><details><summary>Рецепт и ингредиенты</summary>${ingredientsHTML(m)}</details><button class="btn full" data-mp="replace-choice" data-id="${r.id}">Выбрать это блюдо</button></article>`).join('')}${list.length>browseLimit?'<button class="btn full" data-mp="more">Показать ещё 24</button>':''}${!list.length?'<p class="mp-copy">Нет совпадений. Попробуй другой запрос или измени исключения.</p>':''}`;
  }
  function replaceWithRecipe(recipe,slotId){
    const d=day(),current=d.plan?.meals.find(m=>m.id===slotId);if(!recipe||!current||d.eaten[current.id])return;
    if(!E.allowed(recipe,{...db().preferences,maxTime:0,simpleOnly:false})||!recipe.slots.includes(current.type))throw Error('Блюдо не подходит текущим предпочтениям');
    const meal={...E.fit(recipe,replacementTarget(d,current)),id:current.id,type:current.type,title:current.title,share:current.share};
    const plan={...d.plan,meals:d.plan.meals.map(m=>m.id===slotId?meal:m)};plan.total=E.round(E.sum(plan.meals.map(m=>m.nutrition)));
    mutate(data=>{data.days[activeDate]={...d,plan};});
  }
  function render(){
    const host=D.getElementById('mealPlannerRoot');if(!host)return;
    if(openedOwner!==owner()){W.closeModal?.();return;}
    const data=db(),d=day(),prefs={simpleOnly:true,...data.preferences},t=d.target||d.plan?.target||data.target,eaten=totals(d);
    if(replacementSlot){const current=d.plan?.meals.find(m=>m.id===replacementSlot);if(current&&!d.eaten[current.id]){host.innerHTML=`<h2 class="mp-title-source">Заменить блюдо</h2><button class="btn tiny" data-mp="replace-back">‹ Назад к меню</button><div class="mp-replace-head"><small>${esc(current.title)}</small><h3>Выбери блюдо</h3><p class="mp-copy">Сейчас: ${esc(current.name)}</p></div><input id="mp-search" type="search" placeholder="Блюдо, продукт или кухня" aria-label="Поиск замены" value="${esc(browseQuery)}"><div id="mp-recipes"></div><div id="mp-error" class="mp-error" role="alert"></div>`;browseReplacements();W.refreshModalHeader?.();return;}replacementSlot=null;}
    const np=state()?.nutritionPlannerV311?.result;
    const metric=()=>['k','p','f','c'].map((k,i)=>`<div class="mp-metric${k==='k'?' mp-energy':''}" style="--mp-color:${['var(--green)','#6899e8','#e0a34e','#b28ae5'][i]}"><small>${['Ккал','Белки','Жиры','Углеводы'][i]}</small><b>${fmt(eaten[k])}</b><span>${t?'Цель '+rangeText(t,k)+(k==='k'?'':' г'):'Нет цели'}</span><div class="mp-track" role="progressbar" aria-label="${['Калории','Белки','Жиры','Углеводы'][i]}" aria-valuenow="${eaten[k]}" aria-valuemin="0" aria-valuemax="${t?E.bounds(t,k)[1]:1}"><i style="width:${Math.min(100,t?eaten[k]/E.bounds(t,k)[1]*100:0)}%"></i></div></div>`).join('');
    const planned=d.plan?E.round(E.sum([d.plan.total,...d.extra.map(x=>x.nutrition)])):null;
    const within=planned&&t&&E.within(planned,t);
    host.innerHTML=`<h2 class="mp-title-source">Питание</h2><div class="mp-head mp-intro"><div><div class="mp-eyebrow">ТВОЙ РАЦИОН</div><strong>Меню под твои КБЖУ</strong></div><button class="btn tiny" data-mp="calculator">КБЖУ</button></div>
      ${protocolHTML()}
      <div class="mp-datebar"><button data-mp="date-prev" aria-label="Предыдущий день">‹</button><input aria-label="Дата дневника" id="mp-date" type="date" value="${activeDate}" data-mp-date><button data-mp="date-next" aria-label="Следующий день">›</button></div>
      <div class="mp-metrics">${metric()}</div>
      ${t?`<div class="mp-remaining"><span>Осталось на сегодня</span><b>${remainingText(t,eaten,'k')} <small>ккал</small></b></div>${['k','p','f','c'].some(k=>eaten[k]>E.bounds(t,k)[1])?'<p class="mp-copy">Часть целей уже превышена.</p>':''}${Math.abs(4*t.p+9*t.f+4*t.c-t.k)>t.k*.1?'<p class="mp-copy">Калории и БЖУ расходятся больше чем на 10%. Проверь цели.</p>':''}`:''}
      <details class="mp-settings"${t?'':' open'}><summary>Цели и предпочтения</summary>
      <p class="mp-copy">${np?'Цель задана диапазонами из расчёта. Числа ниже нужны для ручной цели; если их не менять, диапазоны сохранятся.':'Задай свои цели или рассчитай КБЖУ по своим данным.'}</p>
      <div class="mp-fields">${fields(t)}
      <div class="field"><label>Приёмов пищи</label><select id="mp-count">${[3,4,5].map(n=>`<option value="${n}"${prefs.count==n?' selected':''}>${n}</option>`).join('')}</select></div>
      <div class="field"><label>Готовка одного блюда</label><select id="mp-time">${[15,30,45,60].map(n=>`<option value="${n}"${prefs.maxTime==n?' selected':''}>До ${n} минут</option>`).join('')}</select></div></div>
      <div class="field"><label>Исключить продукты, через запятую</label><input id="mp-exclude" value="${esc(prefs.exclude)}" placeholder="Например: банан, рыба"></div>
      <label class="mp-check"><input id="mp-world" type="checkbox"${prefs.simpleOnly===false?' checked':''}>Добавлять мировую кухню в подбор</label>
      <label class="mp-check"><input id="mp-vegetarian" type="checkbox"${prefs.vegetarian?' checked':''}>Без мяса и рыбы</label>
      <div class="mp-actions">${[['milk','Молочное'],['egg','Яйца'],['nuts','Орехи'],['fish','Рыба'],['soy','Соя'],['gluten','Глютен'],['shellfish','Ракообразные'],['seeds','Семечки']].map(([id,label])=>`<label class="mp-check"><input type="checkbox" name="mp-allergen" value="${id}"${prefs.allergens.includes(id)?' checked':''}>Без: ${label.toLowerCase()}</label>`).join('')}</div>
      <button class="btn full" data-mp="save">Сохранить настройки</button></details>
      <button class="btn primary full" data-mp="generate">${d.plan?'Подобрать оставшееся меню':'Подобрать меню на день'}</button>
      ${ownFoodHTML()}
      <details class="mp-library"><summary><span>Каталог блюд</span><span class="mp-tag">${E.catalog.recipes.length} рецептов</span></summary><div class="mp-browse-controls"><input id="mp-search" type="search" placeholder="Блюдо, продукт или кухня" aria-label="Поиск рецептов" value="${esc(browseQuery)}"><select id="mp-filter" aria-label="Фильтр приёма пищи">${[['','Все приёмы'],['breakfast','Завтраки'],['lunch','Обеды'],['dinner','Ужины'],['snack','Перекусы']].map(([v,n])=>`<option value="${v}"${v===browseType?' selected':''}>${n}</option>`).join('')}</select></div><div id="mp-recipes"></div></details>
      ${d.plan?`<div class="mp-summary"><div class="mp-head"><b>Меню на день</b><span class="mp-tag ${within?'mp-ok':''}">${within?(t.ranges?'В диапазоне':'Близко к цели'):'Есть отклонение'}</span></div><div class="mp-plan-metrics">${['k','p','f','c'].map((k,i)=>`<div class="${k==='k'?'mp-plan-energy':''}"><small>${['Ккал','Белки','Жиры','Углеводы'][i]}</small><b>${fmt(planned[k])}</b><span>${statusText(planned,t,k)}</span></div>`).join('')}</div>${within?'':'<p class="mp-copy">Попробуй заменить блюдо, чтобы приблизиться к цели.</p>'}</div>`:''}
      ${(d.plan?.meals||[]).map(m=>{
        const done=!!d.eaten[m.id];
        return `<article class="mp-meal${done?' mp-done':''}"><div class="mp-head"><small>${esc(m.title)}${done?' · записано':''}</small><span class="muted">${m.time} мин</span></div><h3>${esc(m.name)}</h3>${weightHTML(m)}<b class="mp-macro">${macros(m.nutrition)}</b>
        <details><summary>Рецепт и ингредиенты</summary>${ingredientsHTML(m)}<p class="mp-copy">Готовый вес зависит от воды и способа приготовления. Для точной записи взвесь всё блюдо из состава выше после готовки, без посуды. Вода меняет вес, но не КБЖУ. Для части порции сохраняй пропорции ингредиентов.</p>${done?'':`<div class="mp-ready-edit"><label for="mp-ready-${m.id}">Фактический вес всей этой порции, г</label><input id="mp-ready-${m.id}" type="number" min="1" max="10000" inputmode="decimal" value="${m.readyGrams||''}" placeholder="Взвесь готовое блюдо"><button class="btn" data-mp="ready-weight" data-id="${m.id}">Сохранить вес</button></div>`}</details>
        <div class="mp-actions"><button class="btn${done?'':' primary'}" data-mp="eat" data-id="${m.id}">${done?'✓ Съедено · отменить':'✓ Записать приём'}</button>${done?'':`<button class="btn" data-mp="swap" data-id="${m.id}">Заменить</button>${E.servingWeight(m)?`<label class="mp-portion mp-eaten-grams">Съем готового, г<input id="mp-eaten-${m.id}" type="number" min="1" max="10000" inputmode="decimal" value="${E.servingWeight(m).grams}" aria-label="Съедено готового блюда, г"></label>`:''}<label class="mp-portion">Порция ×<input type="number" min="0.05" max="5" step="0.05" value="1" aria-label="Множитель съеденной порции" id="mp-portion-${m.id}"></label>`}</div></article>`;
      }).join('')}

      ${d.extra.map(x=>`<div class="mp-extra"><div><b>${esc(x.name)} · ${fmt(x.grams)} г</b><div class="mp-copy">${esc(x.slot||'Своя еда')} · ${macros(x.nutrition)}</div></div><button class="btn tiny" data-mp="remove" data-id="${esc(x.id)}" aria-label="Удалить запись">✕</button></div>`).join('')}
      ${d.plan?`<details class="mp-settings"><summary>Список покупок на этот день</summary><ul>${shopping(d.plan).map(i=>`<li>${esc(i.name)} · ${esc(i.amount)}</li>`).join('')}</ul><p class="mp-copy">Количество для всего выбранного меню.</p></details>`:''}
      ${referencesHTML()}
      <details class="mp-source"><summary>О КБЖУ и источниках</summary><p class="mp-copy">КБЖУ приблизительные. Для простых рецептов использованы усреднённые продукты; количество до приготовления, если не указано иное. Для мировой кухни взяты расчётные значения автора на порцию, состав масштабируется целиком.</p><p class="mp-copy">501 рецепт: <a href="https://theunitools.com/en/data" target="_blank" rel="noopener">UniTools</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">CC BY-SA 4.0</a>. Данные адаптированы, фотографии не использованы. При исключении аллергенов подбор использует только простые рецепты с известным составом.</p></details>
      <div id="mp-error" role="alert" class="mp-error"></div>`;
    W.refreshModalHeader?.();
  }
  function shopping(plan){const grouped=new Map();for(const m of plan.meals){for(const row of ingredientRows(m)){const key=row.name+'|'+row.amount;const prev=grouped.get(key);if(prev)prev.count++;else grouped.set(key,{...row,count:1});}}return [...grouped.values()].map(r=>({...r,amount:r.amount+(r.count>1?' × '+r.count:'')}));}
  function readSettings(){
    let target=E.validateTarget(Object.fromEntries(['k','p','f','c'].map(k=>[k,Number(D.getElementById('mp-'+k).value.replace(',','.'))])));
    const previousTarget=day().target||day().plan?.target||db().target;if(sameValues(previousTarget,target)&&previousTarget.ranges)target={...target,ranges:previousTarget.ranges};
    const preferences={simpleOnly:!D.getElementById('mp-world').checked,count:Number(D.getElementById('mp-count').value),maxTime:Number(D.getElementById('mp-time').value),exclude:D.getElementById('mp-exclude').value,vegetarian:D.getElementById('mp-vegetarian').checked,allergens:[...D.querySelectorAll('[name="mp-allergen"]:checked')].map(x=>x.value)};
    const current=day();if(current.plan&&Object.keys(current.eaten).length&&preferences.count!==current.plan.meals.length)throw Error('Сначала убери записи съеденных блюд, чтобы изменить число приёмов.');
    return {target,preferences};
  }
  function build(target,prefs,d,banned,randomize=false){
    const extras=E.sum(d.extra.map(x=>x.nutrition));
    const remaining=E.subtractTarget(target,extras);
    const plan=E.generate(remaining,prefs.count,{simpleOnly:true,...prefs},{locked:d.eaten,prior:d.plan?.meals||[],banned,randomize});
    const all=E.round(E.sum([plan.total,extras]));plan.target={...target};plan.protocol=db().protocol||'manual';plan.delta=E.round(Object.fromEntries(['k','p','f','c'].map(k=>[k,all[k]-target[k]])));
    plan.withinTarget=E.within(all,target);return plan;
  }
  function open(){activeDate=dateNow();browseQuery='';browseType='';browseLimit=24;replacementSlot=null;openedOwner=owner();W.modal('<div id="mealPlannerRoot"></div>');
    try{let data=db();if(data.protocol&&data.protocol!=='manual'&&state()?.nutritionPlannerV311?.result?.goals?.[data.protocol]&&!data.target?.ranges){selectProtocol(data.protocol);data=db();}const d=day(),target=d.target||data.target;
      if(data.protocol&&data.protocol!=='manual'&&target&&(!d.plan||d.menuStale)){const plan=build(target,data.preferences,d);mutate(data=>{data.days[activeDate]={...d,plan,target:{...target},protocol:data.protocol,menuStale:false};});}
      render();
    }catch(error){render();const out=D.getElementById('mp-error');if(out)out.textContent=error.message;}
  }
  W.openMealPlanner=open;
  D.addEventListener('toggle',e=>{if(e.target.matches?.('.mp-library')&&e.target.open)browse();},true);
  D.addEventListener('input',e=>{if(e.target.id==='mp-search'){browseQuery=e.target.value;browseLimit=24;browse();}});
  D.addEventListener('input',e=>{
    if(!e.target.closest?.('#mealPlannerRoot')||!/^mp-(eaten|portion)-/.test(e.target.id))return;
    const m=day().plan?.meals.find(m=>e.target.id==='mp-eaten-'+m.id||e.target.id==='mp-portion-'+m.id);if(!m)return;
    const w=E.servingWeight(m);if(!w)return;
    if(e.target.id==='mp-eaten-'+m.id)D.getElementById('mp-portion-'+m.id).value=Math.round(Number(e.target.value)/w.grams*10000)/10000;
    else D.getElementById('mp-eaten-'+m.id).value=Math.round(Number(e.target.value)*w.grams*10)/10;
  });
  D.addEventListener('change',e=>{if(e.target.id==='mp-filter'){browseType=e.target.value;browseLimit=24;browse();}});
  D.addEventListener('change',e=>{if(!e.target.matches?.('[data-mp-date]'))return;if(/^\d{4}-\d{2}-\d{2}$/.test(e.target.value)){activeDate=e.target.value;render();}});
  D.addEventListener('click',e=>{
    const b=e.target.closest?.('[data-mp]');if(!b)return;
    if(b.dataset.mp==='open'){open();return;}
    if(!b.closest('#mealPlannerRoot'))return;
    if(openedOwner!==owner()){W.closeModal?.();return;}
    try{
      const action=b.dataset.mp,d=day();
      if(action==='date-prev'||action==='date-next'){const date=new Date(activeDate+'T12:00:00');date.setDate(date.getDate()+(action==='date-prev'?-1:1));activeDate=[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');render();return;}
      if(action==='saved-food'){
        const food=(db().savedFoods||[]).find(x=>x.id===b.dataset.id);if(!food)return;
        D.getElementById('mp-own').open=true;D.getElementById('mp-food-name').value=food.name;
        for(const k of ['k','p','f','c'])D.getElementById('mp-food-'+k).value=food.raw[k];
        D.getElementById('mp-food-grams').value=food.lastGrams||100;D.getElementById('mp-food-name').focus();return;
      }
      if(action==='saved-delete'){mutate(data=>{data.savedFoods=(data.savedFoods||[]).filter(x=>x.id!==b.dataset.id);});render();D.getElementById('mp-own').open=true;return;}
      if(action==='ready-weight'){
        const meal=d.plan?.meals.find(x=>x.id===b.dataset.id);if(!meal||d.eaten[meal.id])return;
        const grams=Number(D.getElementById('mp-ready-'+meal.id).value);
        if(!Number.isFinite(grams)||grams<=0||grams>10000)throw Error('Укажи готовый вес от 1 до 10 000 г');
        mutate(data=>{data.days[activeDate]={...d,plan:{...d.plan,meals:d.plan.meals.map(m=>m.id===meal.id?{...m,readyGrams:grams}:m)}};});render();return;
      }
      if(action==='more'){browseLimit+=24;browse();return;}
      if(action==='replace-back'){replacementSlot=null;browseQuery='';render();return;}
      if(action==='pick'||action==='replace-choice'){
        const recipe=E.catalog.recipes.find(r=>r.id===b.dataset.id),slotId=action==='replace-choice'?replacementSlot:D.getElementById('mp-pick-'+b.dataset.id)?.value;
        replaceWithRecipe(recipe,slotId);replacementSlot=null;browseQuery='';render();D.getElementById('sheet')?.scrollTo?.({top:0});return;
      }
      if(action==='calculator'){if(W.UNVRSLMealContext?.calculator)W.UNVRSLMealContext.calculator();else W.openNutritionPlannerV311();return;}
      if(action==='goal'){
        selectProtocol(b.dataset.value);open();return;
      }
      if(action==='save'||action==='generate'){
        const {target,preferences}=readSettings();
        const plan=action==='generate'?build(target,preferences,d,undefined,true):d.plan&&d.plan.meals.length===preferences.count?{...d.plan,target}:null;
        mutate(data=>{if(!sameTarget(data.target,target))data.protocol='manual';data.target=target;data.preferences=preferences;data.days[activeDate]={...d,plan,target:{...target},protocol:data.protocol||'manual',menuStale:false};});
      }
      if(action==='swap'){
        const current=d.plan?.meals.find(m=>m.id===b.dataset.id);if(!current||d.eaten[current.id])return;
        replacementSlot=current.id;browseQuery='';browseLimit=24;render();D.getElementById('sheet')?.scrollTo?.({top:0});return;
      }
      if(action==='eat'){
        const meal=d.plan?.meals.find(m=>m.id===b.dataset.id);if(!meal)return;
        const eaten={...d.eaten};
        if(eaten[meal.id])delete eaten[meal.id];
        else{
          const factor=Number(D.getElementById('mp-portion-'+meal.id).value);
          if(!Number.isFinite(factor)||factor<.05||factor>5)throw Error('Порция должна быть от 0,05 до 5');
          eaten[meal.id]=E.scaleMeal(meal,factor);
        }
        const plan={...d.plan,meals:d.plan.meals.map(m=>eaten[m.id]||m)};plan.total=E.round(E.sum(plan.meals.map(m=>m.nutrition)));
        mutate(data=>{data.days[activeDate]={...d,plan,eaten};});
      }
      if(action==='extra'){
        const name=D.getElementById('mp-food-name').value.trim(),grams=Number(D.getElementById('mp-food-grams').value);
        const raw=Object.fromEntries(['k','p','f','c'].map(k=>[k,Number(D.getElementById('mp-food-'+k).value.replace(',','.'))]));
        if(!name||!Number.isFinite(grams)||grams<=0||grams>3000||['k','p','f','c'].some(k=>D.getElementById('mp-food-'+k).value===''||!Number.isFinite(raw[k])||raw[k]<0)||raw.k>1000||raw.p+raw.f+raw.c>100.5)throw Error('Проверь название, граммовку и КБЖУ на 100 г');
        const entry={id:'food-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),name,grams,slot:D.getElementById('mp-food-slot').value,nutrition:E.round(Object.fromEntries(['k','p','f','c'].map(k=>[k,raw[k]*grams/100])))};
        mutate(data=>{
          data.days[activeDate]={...d,extra:[...d.extra,entry]};
          if(D.getElementById('mp-food-keep').checked){
            const saved=(data.savedFoods||[]).filter(x=>x.name.toLowerCase()!==name.toLowerCase());
            data.savedFoods=[{id:entry.id,name,raw,lastGrams:grams},...saved].slice(0,100);
          }
        });
      }
      if(action==='remove')mutate(data=>{data.days[activeDate]={...d,extra:d.extra.filter(x=>x.id!==b.dataset.id)};});
      render();mount();
    }catch(err){const out=D.getElementById('mp-error');if(out){out.textContent=err.message;out.scrollIntoView?.({block:'nearest'});}else W.toast?.(err.message);}
  });
  function mount(){
    const plan=D.getElementById('plan');if(!plan)return;
    let button=D.getElementById('mealPlannerEntry');
    if(!button){button=D.createElement('button');button.id='mealPlannerEntry';button.type='button';button.className='card mp-entry';button.dataset.mp='open';}
    const anchor=D.getElementById('np311PlanMount');if(anchor){if(anchor.nextElementSibling!==button)anchor.after(button);}else if(!button.isConnected)plan.append(button);
    const data=state()?.mealNutritionV1,key=data?.protocol,target=data?.target;
    const html=`<div><div class="title">Меню и дневник питания</div><div class="muted">${key?esc(protocolTitles[key]||'Свои КБЖУ')+(target?' · '+rangeText(target,'k')+' ккал':''):'Выбери протокол после расчёта КБЖУ'}</div></div><span aria-hidden="true">›</span>`;
    if(button.dataset.mpEntrySignature!==html){button.innerHTML=html;button.dataset.mpEntrySignature=html;}
  }
  function boot(){mount();const plan=D.getElementById('plan');if(plan)new MutationObserver(mount).observe(plan,{childList:true,subtree:true});}
  if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  W.UNVRSLMealUI={shopping,totals,selectProtocol,refresh:mount};
})(window);
