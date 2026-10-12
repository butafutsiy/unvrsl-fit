'use strict';
(function(W){
  const D=W.document,E=W.UNVRSLMealEngine;
  if(!D||!E)return;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const number=v=>String(v??'').trim()===''?NaN:Number(String(v).replace(',','.'));
  const fmt=v=>Number(v||0).toLocaleString('ru-RU',{maximumFractionDigits:1});
  const dateNow=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
  const state=()=>{if(W.UNVRSLMealContext?.getState)return W.UNVRSLMealContext.getState();try{return typeof st!=='undefined'?st:W.st}catch(_){return W.st}};
  const owner=()=>String(state()?.accountOwnerId||W.cloud?.user?.id||'local');
  let activeDate=dateNow(),openedOwner=null,browseQuery='',browseType='',browseLimit=24,replacementSlot=null,catalogOpen=false,catalogView=false,filtersOpen=false,lastRemoved=null;
  let productView=false,productQuery='',productFilter='',ingredientSlot=null,selectedProduct=null,foodDraft=null;
  const viewPositions=new Map();
  function currentView(){return D.querySelector('.mp-catalog-page')?'recipes':D.getElementById('mp-product-search')?'products':'diary';}
  function captureViewPosition(){if(D.getElementById('cook-name'))return;viewPositions.set(owner()+'|'+activeDate+'|'+currentView(),D.getElementById('sheet')?.scrollTop||0);}
  function restoreViewPosition(view){D.getElementById('sheet')?.scrollTo?.({top:viewPositions.get(owner()+'|'+activeDate+'|'+view)||0});}
  const mealDrafts=new Map(),settingsDrafts=new Map(),catalogDrafts=new Map();
  let productLimit=30,editingExtraId=null;
  const onlineClient=W.UNVRSLFoodSearch?.createClient();
  let onlineRows=[],onlinePage=0,onlineMore=false,onlineQuery='',onlineToken=0,onlineController=null,foodUnit='g';
  function resetOnline(){onlineToken++;onlineController?.abort();onlineController=null;onlineRows=[];onlinePage=0;onlineMore=false;onlineQuery='';const host=D.getElementById('mp-online-results');if(host)host.innerHTML='';}
  const foodUnitText=()=>foodUnit==='piece'?'шт.':foodUnit==='ml'?'мл':'г';
  const foodBasisText=()=>foodUnit==='ml'?'мл':'г';
  function foodAmountQuantity(){const amount=number(D.getElementById('mp-food-grams')?.value);if(foodUnit!=='piece')return amount;const piece=number(D.getElementById('mp-food-piece-weight')?.value);return piece>0&&piece<=10000?amount*piece:NaN;}
  function setFoodUnit(unit){foodUnit=['g','ml','piece'].includes(unit)?unit:'g';const select=D.getElementById('mp-food-unit');if(select)select.value=foodUnit;const label=D.querySelector('label[for="mp-food-grams"]');if(label)label.textContent='Съедено, '+foodUnitText();const summary=D.querySelector('.mp-raw-values summary');if(summary)summary.textContent='КБЖУ на 100 '+foodBasisText()+' · проверить или изменить';const pieceField=D.getElementById('mp-food-piece-field');if(pieceField)pieceField.hidden=foodUnit!=='piece';const presets=D.querySelector('.mp-food-presets');if(presets)presets.hidden=foodUnit==='piece';D.querySelectorAll('[data-mp="food-grams"]').forEach(b=>b.textContent=b.dataset.value+' '+foodUnitText());}
  function sourceHTML(food){const source=food?.sourceInfo;if(!source)return '';let url='';try{const parsed=new URL(source.url||(source.provider==='USDA SR28'?E.catalog.foods['sr28-'+source.code]?.sourceInfo?.url:''));if(['https:','http:'].includes(parsed.protocol))url=parsed.href;}catch(_){}
    return `<p class="mp-copy mp-source-badge">Источник: ${url?`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(source.provider==='openfoodfacts'?'Open Food Facts':source.provider||'Справочник')} ↗</a>`:esc(source.provider||'Своя маркировка')}${source.provider==='openfoodfacts'?' · <a href="https://opendatacommons.org/licenses/odbl/1-0/" target="_blank" rel="noopener noreferrer">ODbL</a>':''}${source.code?' · '+esc(source.code):''}${source.unitEstimated?'<br>Единицы предположены по упаковке. Проверь, указаны ли значения на 100 г или 100 мл.':''}${source.originalName?'<br>'+esc(source.originalName):''}. ${source.provider==='USDA SR28'?'КБЖУ на 100 г съедобной части; углеводы включают клетчатку.':'Проверь единицы и состав по упаковке.'}</p>`;
  }
  function onlineHTML(){const host=D.getElementById('mp-online-results');if(!host)return;host.innerHTML=`<h4>Онлайн · Open Food Facts</h4><p class="mp-copy">${onlineRows.length?'Выбери свою марку. Данные вносят пользователи.':'Ничего не найдено. Попробуй марку или штрихкод.'}</p>${onlineRows.map(f=>`<div class="mp-product-row"><button class="btn mp-product-card" data-mp="online-pick" data-id="${esc(f.sourceInfo.code)}"><small>Open Food Facts · ${esc(f.sourceInfo.code)}</small><b>${esc(f.name)}</b><span>${f.complete?macros(f.raw)+' на 100 '+(f.unit==='ml'?'мл':'г'):'КБЖУ неполные · заполни с упаковки'}</span></button></div>`).join('')}${onlineMore?'<button class="btn full" data-mp="online-more">Ещё из онлайн-базы</button>':''}<p class="mp-copy">Данные <a href="https://world.openfoodfacts.org" target="_blank" rel="noopener noreferrer">Open Food Facts</a> · <a href="https://opendatacommons.org/licenses/odbl/1-0/" target="_blank" rel="noopener noreferrer">ODbL</a>. Домашние блюда ищи в «Рецептах».</p>`;}
  async function searchOnline(more=false){
    const query=productQuery.trim();if(!onlineClient||!productView)return;
    if(W.navigator.onLine===false){D.getElementById('mp-online-results').textContent='Нет интернета. Справочник и сохранённые продукты доступны.';return;}
    if(!more)resetOnline();const token=++onlineToken,account=owner(),root=D.getElementById('mealPlannerRoot'),host=D.getElementById('mp-online-results'),page=more?onlinePage+1:1;
    onlineController?.abort();onlineController=new W.AbortController();host.innerHTML='<p class="mp-copy" role="status">Ищем продукты онлайн…</p>';host.scrollIntoView?.({block:'nearest',behavior:'smooth'});
    const current=()=>token===onlineToken&&owner()===account&&openedOwner===account&&productView&&productQuery.trim()===query&&D.getElementById('mealPlannerRoot')===root&&host.isConnected;
    try{const result=await onlineClient.search(query,page,onlineController.signal);if(!current())return;onlineQuery=query;onlinePage=page;onlineMore=result.more;onlineRows=more?[...onlineRows,...result.foods.filter(f=>!onlineRows.some(r=>r.key===f.key))]:result.foods;onlineHTML();}
    catch(err){if(current()){host.innerHTML='<p class="mp-copy" role="alert">'+esc(err.message==='Failed to fetch'?'Не удалось связаться с базой. Проверь интернет и повтори.':err.message)+'</p>';if(more)host.insertAdjacentHTML('beforeend','<button class="btn" data-mp="online-more">Повторить загрузку</button>');}}
  }
  async function pickOnline(code){
    const token=++onlineToken,account=owner(),root=D.getElementById('mealPlannerRoot'),query=productQuery;
    onlineController?.abort();onlineController=new W.AbortController();const host=D.getElementById('mp-online-results');host.setAttribute('aria-busy','true');
    try{const food=await onlineClient.product(code,onlineController.signal);if(token!==onlineToken||account!==owner()||account!==openedOwner||!productView||D.getElementById('mealPlannerRoot')!==root||query!==productQuery)return;
      if(!food)throw Error('Продукт больше не доступен. Попробуй другую карточку.');
      if(ingredientSlot&&(!food.complete||food.unit==='ml'))throw Error(food.unit==='ml'?'У продукта КБЖУ на 100 мл. Для состава в граммах добавь продукт вручную с КБЖУ на 100 г.':'Для этого продукта не хватает КБЖУ. Добавь его вручную с данными упаковки.');
      chooseProduct(food);
    }catch(err){if(token===onlineToken&&account===owner()&&host.isConnected){onlineHTML();host.insertAdjacentHTML('afterbegin','<p class="mp-copy" role="alert">'+esc(err.message)+'</p>');}}
    finally{if(token===onlineToken)host.removeAttribute('aria-busy');}
  }
  const normalize=v=>String(v||'').toLowerCase().replace(/ё/g,'е').trim();
  let catalogFilters={diet:'',collection:'',calories:'',country:'',favorite:false,world:false};
  function db(){const s=state();if(!s)throw Error('Данные приложения ещё загружаются');return s.mealNutritionV1||(s.mealNutritionV1={version:1,days:{},preferences:{count:4,maxTime:45,exclude:'',allergens:[],vegetarian:false,simpleOnly:true},target:null});}
  function day(){return db().days[activeDate]||{plan:null,eaten:{},extra:[]};}
  function mutate(fn){
    const s=state(),before=JSON.stringify(s.mealNutritionV1);
    try{
      fn(db());W.UNVRSLNutritionState?.track(before?JSON.parse(before):null,db());const ok=W.UNVRSLMealContext?.save?W.UNVRSLMealContext.save():typeof save==='function'?save():W.save?.();
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
    return `<section class="mp-protocol"><div class="mp-head"><div><small>Текущий протокол</small><strong>${esc(protocolTitles[key]||(target?'Свои КБЖУ':result?.goals?'Выбери протокол ниже':'Выбери после расчёта'))}</strong></div>${target?`<span class="mp-tag">${rangeText(target,'k')} ккал</span>`:''}</div>${result?`<div class="mp-protocol-options">${['cut','maintain','gain'].filter(k=>result.goals?.[k]).map(k=>`<button data-mp="goal" data-value="${k}" aria-pressed="${key===k}">${protocolTitles[k]}</button>`).join('')}</div>`:''}</section>`;
  }
  const totals=d=>E.round(E.sum([...Object.values(d.eaten||{}).map(m=>m.nutrition),...(d.extra||[]).map(m=>m.nutrition)]));
  const macros=n=>`${fmt(n.k)} ккал · Б ${fmt(n.p)} · Ж ${fmt(n.f)} · У ${fmt(n.c)} г`;
  function fields(t){return ['k','p','f','c'].map((k,i)=>`<div class="field"><label for="mp-${k}">${['Калории, ккал','Белки, г','Жиры, г','Углеводы, г'][i]}</label><input id="mp-${k}" type="text" min="1" step="1" inputmode="decimal" value="${t?esc(t[k]):''}"></div>`).join('');}
  const recipeOf=m=>E.catalog.recipes.find(r=>r.id===m.recipeId);
  const unitName=u=>({g:'г',kg:'кг',ml:'мл',l:'л',piece:'шт.',clove:'зубч.',tbsp:'ст. л.',tsp:'ч. л.',pinch:'щеп.',sprig:'вет.',slice:'ломт.'}[u]||u);
  function ingredientRows(m){
    const recipe=recipeOf(m);
    if(recipe?.source){const factor=m.ingredients[0].g/100/recipe.baseServings;return recipe.details.map(i=>({name:i.name,amount:i.quantity===null?'по вкусу':fmt(i.quantity*factor)+' '+unitName(i.unit),note:i.note}));}
    return m.ingredients.map(i=>({name:i.name||E.catalog.foods[i.id]?.name||'Свой продукт',amount:fmt(i.g)+' г',note:i.id==='egg'?'примерно '+fmt(i.g/50)+' шт.':''}));
  }
  function weightHTML(m){const w=E.servingWeight(m);return `<div class="mp-ready"><span>Готовая порция${w?.estimated?' ≈':''}</span><b>${w?fmt(w.grams)+' г':'Взвесь после готовки'}</b></div>`;}
  function ownFoodHTML(){return `<details class="mp-settings mp-own" id="mp-own"><summary>＋ Свой продукт или блюдо</summary><div class="field"><label for="mp-food-name">Название</label><input id="mp-food-name" maxlength="120" placeholder="Например: йогурт с упаковки"></div><div class="field"><label for="mp-food-unit">Единицы с упаковки</label><select id="mp-food-unit"><option value="g">На 100 г · вес в граммах</option><option value="ml">На 100 мл · объём в миллилитрах</option><option value="piece">Штуки · КБЖУ на 100 г</option></select></div><div id="mp-food-source"></div><div class="field" id="mp-food-piece-field" hidden><label for="mp-food-piece-weight">Масса одной штуки, г · измеренная или оценочная</label><input id="mp-food-piece-weight" type="text" inputmode="decimal" placeholder="Взвесь или укажи оценку"><p class="mp-copy">Без массы штуки пересчёт недоступен. Среднее яйцо без скорлупы ≈ 50 г; свой вес можно уточнить.</p></div><div class="mp-fields"><div class="field"><label for="mp-food-grams">Съедено, г</label><input id="mp-food-grams" type="text" min="1" max="3000" inputmode="decimal"></div><div class="field"><label for="mp-food-slot">Приём пищи</label><select id="mp-food-slot">${['Завтрак','Обед','Ужин','Перекус'].map(x=>`<option>${x}</option>`).join('')}</select></div></div><div class="mp-food-presets">${[50,100,150,200].map(g=>`<button class="btn tiny" data-mp="food-grams" data-value="${g}">${g} г</button>`).join('')}</div><details class="mp-raw-values" open><summary>КБЖУ на 100 г · проверить или изменить</summary><p class="mp-copy">Введи значения с упаковки или своей карточки рецепта.</p><div class="mp-fields">${['k','p','f','c'].map((k,i)=>`<div class="field"><label for="mp-food-${k}">${['Ккал','Белки, г','Жиры, г','Углеводы, г'][i]}</label><input id="mp-food-${k}" type="text" min="0" inputmode="decimal" step="0.1"></div>`).join('')}</div></details><p class="mp-copy mp-portion-preview" id="mp-food-preview" aria-live="polite">Укажи граммы и КБЖУ на 100 г</p><label class="mp-check"><input id="mp-food-keep" type="checkbox" checked>Сохранить в моих продуктах</label><button class="btn primary full" data-mp="extra">Записать в дневник</button></details>`;}
  function referencesHTML(){const labels=['Белки · Лента','Белки · Пятёрочка','Жиры · Лента','Жиры · Пятёрочка','Углеводы · Лента','Углеводы · Пятёрочка','Клетчатка · Лента','Клетчатка · Пятёрочка','Сладости · Лента','Сладости · Пятёрочка'];return `<details class="mp-settings"><summary>Что купить · продукты и КБЖУ</summary><p class="mp-copy">Твои подборки продуктов. Для записи проверяй актуальную упаковку: на карточках часть БЖУ не указана, а значения могут отличаться у разных марок.</p><div class="mp-reference-grid">${labels.map((x,i)=>`<a href="assets/nutrition/products-${i}.jpg" target="_blank" rel="noopener noreferrer"><img src="assets/nutrition/products-${i}.jpg" alt="${x}" loading="lazy" decoding="async" width="240" height="320"><span>${x} ↗</span></a>`).join('')}</div></details>`;}
  function ingredientsHTML(m){const recipe=recipeOf(m);return `<ul>${ingredientRows(m).map(i=>`<li><span>${esc(i.name)}</span><b>${esc(i.amount)}</b>${i.note?`<small>${esc(i.note)}</small>`:''}</li>`).join('')}</ul>${recipe?.source?`<p class="mp-copy">Количество на ${fmt(m.ingredients[0].g/100)} порц. Шаги описывают исходный рецепт на ${recipe.baseServings} порц. Можно приготовить весь рецепт и отделить свою порцию.</p>`:''}<p class="mp-steps">${esc(m.steps).replace(/\n/g,'<br><br>')}</p>${m.ingredients.filter(i=>i.sourceInfo).map(sourceHTML).join('')}${recipe?.guideUrl?`<a class="mp-guide" href="${esc(recipe.guideUrl)}" target="_blank" rel="noopener noreferrer">Фото и пошаговый рецепт · ${esc(recipe.guideSite)} ↗</a><p class="mp-copy">Пример приготовления. Для дневника используй состав и граммовки выше: рецепт на сайте может отличаться.</p>`:''}`;}
  function ingredientInputHTML(i){return `<label class="mp-ingredient-input"><span>${esc(i.name||E.catalog.foods[i.id]?.name||'Свой продукт')}${i.id==='egg'?'<small>Вес без скорлупы; 1 яйцо ≈ 50 г</small>':''}</span><span><input type="text" data-mp-ingredient="${esc(i.id)}"${i.sourceNutrition?` data-source="${esc(JSON.stringify(i.sourceNutrition))}" data-name="${esc(i.name)}"${i.sourceInfo?` data-provenance="${esc(JSON.stringify(i.sourceInfo))}"`:""}`:""} value="${i.g}" min="0" max="10000" step="0.1" inputmode="decimal" aria-label="${esc(i.name||E.catalog.foods[i.id]?.name||'Свой продукт')}, граммы"><small>г</small></span></label>`;}
  function compositionHTML(m){
    if(recipeOf(m)?.source)return '<p class="mp-copy">В этом рецепте известны только КБЖУ всей порции. Пересчёт отдельных ингредиентов недоступен.</p>';
    return `<div class="mp-composition" data-meal="${m.id}" data-snapshot="${esc(JSON.stringify(m))}"><p class="mp-copy">Укажи, сколько использовал каждого продукта. Вес сырой, если в названии не указано другое. 0 г – убрать продукт. Масло тоже учитывается.</p><div class="mp-ingredient-inputs">${m.ingredients.map(ingredientInputHTML).join('')}</div><div class="mp-add-ingredient"><button class="btn full" data-mp="ingredient-search" data-id="${m.id}">＋ Найти ингредиент</button></div><p class="mp-copy mp-composition-preview" aria-live="polite">Всё блюдо: ${macros(m.nutrition)}</p><button class="btn primary full" data-mp="composition-save" data-id="${m.id}">Сохранить состав и пересчитать</button></div>`;
  }
  function compositionDraft(editor){
    const meal=day().plan?.meals.find(m=>m.id===editor.dataset.meal);
    const ingredients=[...editor.querySelectorAll('[data-mp-ingredient]')].map(input=>({id:input.dataset.mpIngredient,g:input.value.trim()===''?NaN:number(input.value),...(input.dataset.source?{name:input.dataset.name,sourceNutrition:JSON.parse(input.dataset.source),...(input.dataset.provenance?{sourceInfo:JSON.parse(input.dataset.provenance)}:{})}:{})}));
    const weight=D.getElementById('mp-ready-'+meal.id)?.value;
    return E.composeMeal(meal,ingredients,weight?number(weight):undefined);
  }
  function compositionPreview(editor){
    const out=editor.querySelector('.mp-composition-preview');
    try{const m=compositionDraft(editor),weight=E.servingWeight(m);out.textContent='Всё блюдо: '+macros(m.nutrition)+(weight?' · '+(weight.estimated?'≈ ':'')+fmt(weight.grams)+' г':'')+(m.readyGrams?' · На 100 г: '+macros(E.round(Object.fromEntries(['k','p','f','c'].map(k=>[k,m.nutrition[k]/m.readyGrams*100])))):'');}catch(err){out.textContent=err.message;}
  }
  const quickSearchTerms=['Свинина','Курица','Говядина','Индейка','Рыба','Рис','Гречка','Булгур','Картофель','Яйца','Творог','Овсянка','Фасоль'];
  function quickSearchHTML(context){
    const query=context==='products'?productQuery:browseQuery;
    const ingredients=`<div class="mp-quick-search" aria-label="Быстрый поиск по продукту">${quickSearchTerms.map(value=>`<button class="btn tiny" data-mp="search-term" data-context="${context}" data-value="${value}" aria-pressed="${E.normalizeSearch(query)===E.normalizeSearch(value)}">${value}</button>`).join('')}</div>`;
    const ingredientFilters=`<section class="mp-ingredient-filters"><div class="mp-section-label">По ингредиентам</div>${ingredients}</section>`;
    if(context==='products')return ingredientFilters;
    return `<div class="mp-meal-categories" aria-label="Приём пищи">${mealCategories.map(([value,icon,label])=>`<button type="button" class="btn tiny" data-mp="meal-category" data-value="${value}" aria-pressed="${context==='recipes'&&browseType===value}">${label}</button>`).join('')}</div>${ingredientFilters}`;
  }
  function updateSearchTerms(context,query){D.querySelectorAll('[data-mp="meal-category"]').forEach(b=>b.setAttribute('aria-pressed',String(context==='recipes'&&browseType===b.dataset.value)));D.querySelectorAll(`[data-mp="search-term"][data-context="${context}"]`).forEach(b=>b.setAttribute('aria-pressed',String(E.normalizeSearch(query)===E.normalizeSearch(b.dataset.value))));}
  const aliasTargets=new Set(Object.values(E.catalog.foods).map(f=>f.aliasOf).filter(Boolean));
  function productPool(){
    const rows=Object.entries(E.catalog.foods).filter(([id,f])=>!id.startsWith('ut-')&&!aliasTargets.has(id)).map(([id,f])=>({key:'base:'+id,id,name:f.name,raw:f,source:f.nutritionQuality==='label'?'Маркировка':f.nutritionQuality==='legacy-estimate'?'Оценка':'Справочник',sourceInfo:f.sourceInfo,aliases:E.foodText(id)}));
    for(const f of db().savedFoods||[])rows.unshift({key:'own:'+f.id,id:'own-'+f.id,name:f.name,raw:f.raw,source:'Мой продукт',savedId:f.id,lastGrams:f.lastGrams,unit:f.unit,sourceInfo:f.sourceInfo});
    const recent=Object.values(db().days).flatMap(d=>d.extra||[]).filter(e=>e.raw).slice(-100).reverse();
    for(const e of recent)if(!rows.some(f=>f.key===e.productKey))rows.push({key:e.productKey||'recent:'+e.id,id:'recent-'+e.id,name:e.name,raw:e.raw,source:'Недавно записано',lastGrams:e.grams,unit:e.unit,sourceInfo:e.sourceInfo});
    const recentKeys=new Set(recent.map(e=>e.productKey));
    return rows.map(f=>({...f,lastGrams:recent.find(e=>e.productKey===f.key)?.grams||f.lastGrams,recent:recentKeys.has(f.key)}));
  }
  function productsHTML(){return `<div class="mp-product-heading"><div class="mp-eyebrow">${ingredientSlot?'СОСТАВ БЛЮДА':'ЗАПИСЬ ЕДЫ'}</div><h3>${ingredientSlot?'Найди ингредиент':'Что ты съел?'}</h3><p class="mp-copy">${ingredientSlot?'Выбери продукт, затем укажи его вес в составе блюда.':'Выбери продукт, укажи граммы – КБЖУ посчитаются автоматически.'}</p></div>${ingredientSlot?'<button class="btn" data-mp="ingredient-back">‹ Вернуться к блюду</button>':ownFoodHTML()}<label class="mp-product-search">Поиск продуктов<input id="mp-product-search" type="search" value="${esc(productQuery)}" placeholder="Яйца, свинина, гречка…" aria-label="Поиск продуктов" autocomplete="off" maxlength="100"></label>${onlineClient?'<button class="btn full" data-mp="online-search">Найти онлайн · название или штрихкод</button><p class="mp-copy">Онлайн-поиск запускается по кнопке или Enter.</p>':''}${quickSearchHTML('products')}<div class="mp-product-filters">${[['','Все продукты'],['recent','Недавние'],['own','Мои'],['dairy','Молочное'],['grain','Крупы']].map(([key,label])=>`<button class="btn tiny" data-mp="product-filter" data-value="${key}" aria-pressed="${productFilter===key}">${label}</button>`).join('')}</div><div id="mp-online-results" aria-live="polite"></div><div id="mp-product-results" aria-live="polite"></div><p class="mp-copy">Справочник содержит усреднённые КБЖУ на 100 г. Для конкретной марки добавь значения с упаковки в «Свой продукт или блюдо».</p>`;}
  function browseProducts(){
    const host=D.getElementById('mp-product-results');if(!host)return;
    const list=E.searchItems(productPool().filter(f=>(!productFilter||productFilter==='beef'&&(f.raw.category==='beef'||f.id==='beef')||productFilter==='pork'&&(f.raw.category==='pork'||f.id==='pork')||productFilter==='recent'&&f.recent||productFilter==='own'&&f.savedId||productFilter==='dairy'&&/молок|творог|сыр|йогурт|кефир/.test(normalize(f.name))||productFilter==='grain'&&/круп|рис|греч|овся|пшено|манн|булгур/.test(normalize(f.name)))),productQuery,f=>f.name+' '+(f.aliases||'')).sort((a,b)=>E.searchRank(a.name,productQuery)-E.searchRank(b.name,productQuery)||Number(b.recent)-Number(a.recent)||a.name.localeCompare(b.name,'ru'));
    host.innerHTML=`<p class="mp-copy">${list.length?'Найдено: '+list.length:'Ничего не найдено. Проверь название или добавь свой продукт.'}</p>${list.slice(0,productLimit).map(f=>`<div class="mp-product-row"><button class="btn mp-product-card" data-mp="${f.savedId&&!ingredientSlot?'saved-food':'product-pick'}" data-id="${esc(f.savedId&&!ingredientSlot?f.savedId:f.key)}"><small>${esc(f.source)}${f.recent?' · недавно':''}</small><b>${esc(f.name)}</b><span>${macros(f.raw)} на 100 ${f.unit==='ml'?'мл':'г'}</span></button>${f.savedId&&!ingredientSlot?`<button class="btn tiny" data-mp="saved-delete" data-id="${esc(f.savedId)}" aria-label="Удалить сохранённый продукт ${esc(f.name)}">✕</button>`:''}</div>`).join('')}${list.length>productLimit?'<button class="btn full" data-mp="product-more">Показать ещё продукты</button>':''}`;
    updateSearchTerms('products',productQuery);
    D.querySelectorAll('[data-mp="product-filter"]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.value===productFilter)));
  }
  function foodPreview(){setFoodUnit(foodUnit);const out=D.getElementById('mp-food-preview');if(!out)return;const grams=foodAmountQuantity(),inputs=['k','p','f','c'].map(k=>D.getElementById('mp-food-'+k));out.textContent=grams>0&&inputs.every(el=>el.value!==''&&Number.isFinite(number(el.value))&&number(el.value)>=0)?'Будет записано: '+macros(E.round(Object.fromEntries(inputs.map((el,i)=>[['k','p','f','c'][i],number(el.value)*grams/100])))):'Укажи количество и КБЖУ на 100 '+foodBasisText();}
  function captureCatalogDrafts(){
    if(D.getElementById('mealPlannerRoot')?.dataset.date!==activeDate)return;
    for(const box of D.querySelectorAll('.mp-record-options')){const input=box.querySelector('[id^="mp-catalog-portion-"]');if(input)catalogDrafts.set(activeDate+'|'+input.id,{portion:input.value,slot:box.querySelector('select').value,open:box.open});}
  }
  function restoreCatalogDrafts(){for(const box of D.querySelectorAll('.mp-record-options')){const input=box.querySelector('[id^="mp-catalog-portion-"]'),draft=catalogDrafts.get(activeDate+'|'+input.id);if(draft){input.value=draft.portion;box.querySelector('select').value=draft.slot;box.open=draft.open;input.dispatchEvent(new W.Event('input',{bubbles:true}));}}}
  function captureDrafts(){
    if(openedOwner!==owner()||D.getElementById('mealPlannerRoot')?.dataset.date!==activeDate)return;
    captureCatalogDrafts();
    if(D.getElementById('mp-k'))settingsDrafts.set(activeDate,{signature:D.getElementById('mealPlannerRoot').dataset.settingsSnapshot,values:[...D.querySelectorAll('.mp-settings input,.mp-settings select')].filter(el=>el.id||el.name==='mp-allergen').map(el=>({id:el.id,allergen:el.name==='mp-allergen'?el.value:null,value:el.value,checked:el.checked}))});
    if(D.getElementById('mp-own'))foodDraft={values:Object.fromEntries([...D.querySelectorAll('#mp-own input,#mp-own select')].map(el=>[el.id,{value:el.value,checked:el.checked}])),open:D.getElementById('mp-own').open,rawOpen:D.querySelector('.mp-raw-values').open,title:D.querySelector('#mp-own>summary').textContent};
    for(const editor of D.querySelectorAll('.mp-composition')){const m=day().plan?.meals.find(x=>x.id===editor.dataset.meal);if(m)mealDrafts.set(activeDate+'|'+m.id,{signature:editor.dataset.snapshot,html:editor.querySelector('.mp-ingredient-inputs').innerHTML,values:[...editor.querySelectorAll('[data-mp-ingredient]')].map(el=>el.value),dirty:editor.dataset.dirty,ready:D.getElementById('mp-ready-'+m.id)?.value,portion:D.getElementById('mp-portion-'+m.id)?.value,eaten:D.getElementById('mp-eaten-'+m.id)?.value,open:editor.closest('details').open});}
  }
  function restoreDrafts(){
    const settings=settingsDrafts.get(activeDate);if(D.getElementById('mp-k')&&settings?.signature===D.getElementById('mealPlannerRoot').dataset.settingsSnapshot){for(const x of settings.values){const el=x.id?D.getElementById(x.id):D.querySelector(`[name="mp-allergen"][value="${x.allergen}"]`);if(el){el.value=x.value;el.checked=x.checked;}}}
    if(foodDraft&&D.getElementById('mp-own')){for(const [id,x] of Object.entries(foodDraft.values)){const el=D.getElementById(id);if(el){el.value=x.value;el.checked=x.checked;}}D.getElementById('mp-own').open=foodDraft.open;D.querySelector('#mp-own>summary').textContent=foodDraft.title;D.querySelector('.mp-raw-values').open=foodDraft.rawOpen;setFoodUnit(D.getElementById('mp-food-unit').value);D.getElementById('mp-food-source').innerHTML=sourceHTML(selectedProduct);foodPreview();}
    for(const m of day().plan?.meals||[]){const draft=mealDrafts.get(activeDate+'|'+m.id),editor=D.querySelector(`.mp-composition[data-meal="${m.id}"]`);if(!editor||!draft||draft.signature!==JSON.stringify(m))continue;editor.querySelector('.mp-ingredient-inputs').innerHTML=draft.html;editor.querySelectorAll('[data-mp-ingredient]').forEach((el,i)=>el.value=draft.values[i]);if(draft.dirty)editor.dataset.dirty=draft.dirty;for(const [prefix,value] of [['ready',draft.ready],['portion',draft.portion],['eaten',draft.eaten]]){const el=D.getElementById('mp-'+prefix+'-'+m.id);if(el&&value!==undefined)el.value=value;}editor.closest('details').open=draft.open;compositionPreview(editor);}
  }
  function chooseProduct(food){
    if(!food)return;if(ingredientSlot&&food.unit==='ml')throw Error('Для ингредиента укажи КБЖУ на 100 г: миллилитры нельзя считать граммами');
    if(ingredientSlot){const slot=ingredientSlot;ingredientSlot=null;productView=false;render(false);const editor=D.querySelector(`.mp-composition[data-meal="${slot}"]`);if(!editor)return;let input=[...editor.querySelectorAll('[data-mp-ingredient]')].find(el=>el.dataset.mpIngredient===food.id);if(!input){editor.querySelector('.mp-ingredient-inputs').insertAdjacentHTML('beforeend',ingredientInputHTML({id:food.id,g:0,...(!E.catalog.foods[food.id]?{name:food.name,sourceNutrition:food.raw,...(food.sourceInfo?{sourceInfo:food.sourceInfo}:{})}:{})}));input=[...editor.querySelectorAll('[data-mp-ingredient]')].at(-1);}editor.dataset.dirty='true';D.getElementById('mp-ready-'+slot).value='';editor.closest('details').open=true;compositionPreview(editor);input.focus();return;}
    selectedProduct=food;setFoodUnit(food.unit);D.getElementById('mp-food-source').innerHTML=sourceHTML(food);const own=D.getElementById('mp-own');own.open=true;own.querySelector('summary').textContent=food.name;D.querySelector('.mp-raw-values').open=food.complete===false;D.getElementById('mp-food-name').value=food.name;for(const k of ['k','p','f','c'])D.getElementById('mp-food-'+k).value=food.raw[k]??'';D.getElementById('mp-food-grams').value=food.lastGrams||100;const pieceInput=D.getElementById('mp-food-piece-weight');if(pieceInput)pieceInput.value=['egg','sr28-01123'].includes(food.id)?50:'';D.getElementById('mp-food-keep').checked=!!food.savedId||food.sourceInfo?.provider==='openfoodfacts';foodPreview();own.scrollIntoView?.({block:'start',behavior:'smooth'});D.getElementById('mp-food-grams').focus();
  }
  const collections=[['mine','♡','Мои рецепты'],['breakfast','🍳','Простые завтраки'],['quick','⏱','Ужин до 20 минут'],['protein','💪','Белковые блюда'],['portable','🥪','Взять с собой'],['egg','🥚','Блюда из яиц'],['buckwheat','🌾','С гречкой']];
  const mealCategories=[['breakfast','🍳','Завтрак'],['lunch','🍲','Обед'],['dinner','🍽','Ужин'],['snack','🍎','Перекус']];
  function catalogFiltersHTML(){
    const tile=(key,value,icon,label,selected,extra='')=>`<button type="button" class="mp-catalog-tile ${extra}" data-mp="catalog-filter" data-key="${key}" data-value="${esc(value)}" aria-pressed="${selected}">${icon?`<span aria-hidden="true">${icon}</span>`:''}<b>${esc(label)}</b></button>`;
    return `      <h4>Тип питания</h4><div class="mp-catalog-row">${[['','🍽','Все'],['vegetarian','🥦','Вегетарианское'],['pescatarian','🐟','Без мяса, с рыбой']].map(([v,i,n])=>tile('diet',v,i,n,catalogFilters.diet===v)).join('')}</div>
      <h4>Подборки</h4><div class="mp-catalog-collections">${collections.map(([v,i,n])=>tile('collection',v,i,n,catalogFilters.collection===v,'mp-collection-tile')).join('')}</div>
      <h4>Калорийность порции</h4><div class="mp-catalog-calories">${[0,100,200,300,400,500,600,700].map(v=>tile('calories',String(v),'',v===0?'До 100':v===700?'700+':v+'–'+(v+100),catalogFilters.calories===String(v)) .replace('</b></button>','</b><small>ккал</small></button>')).join('')}</div>
      <p class="mp-copy">Калории указаны для исходной порции. В меню количество подбирается под твои КБЖУ.</p>
      <div class="mp-catalog-reset"><span>${catalogFilters.favorite?'Избранное':catalogFilters.collection?collections.find(x=>x[0]===catalogFilters.collection)?.[2]:'Все рецепты'}</span><button class="btn tiny" data-mp="catalog-reset">Сбросить фильтры</button></div>`;
  }
  function activeFiltersHTML(){
    const labels=[catalogFilters.maxTime&&'До '+catalogFilters.maxTime+' мин',catalogFilters.kind&&({main:'Основное блюдо',soup:'Суп',salad:'Салат',sandwich:'Бутерброд / бургер',breakfast:'Завтрак'})[catalogFilters.kind],browseType&&mealCategories.find(x=>x[0]===browseType)?.[2],catalogFilters.diet&&({vegetarian:'Без мяса и рыбы',pescatarian:'Без мяса, с рыбой'}[catalogFilters.diet]),catalogFilters.collection&&collections.find(x=>x[0]===catalogFilters.collection)?.[2],catalogFilters.country,catalogFilters.calories!==''&&(catalogFilters.calories==='700'?'700+ ккал':catalogFilters.calories==='0'?'До 100 ккал':catalogFilters.calories+'–'+(Number(catalogFilters.calories)+100)+' ккал'),catalogFilters.favorite&&'Избранное'].filter(Boolean);
    return labels.length?`<div class="mp-active-filters">${labels.map(x=>`<span class="mp-tag">${esc(x)}</span>`).join('')}<button class="btn tiny" data-mp="catalog-reset">Сбросить</button></div>`:'';
  }
  function catalogHTML(){return `<details class="mp-library"${catalogOpen?' open':''}><summary><span>Рецепты и подборки</span><span class="mp-tag">${E.catalog.recipes.filter(r=>!r.source).length} рецептов</span></summary>
    <div class="mp-catalog-heading"><div><div class="mp-eyebrow">${E.catalog.recipes.filter(r=>!r.source).length} РЕЦЕПТОВ</div><h3>Что приготовим?</h3></div><button class="btn mp-favorites-toggle" data-mp="catalog-filter" data-key="favorite" aria-pressed="${catalogFilters.favorite}" aria-label="Показать избранные рецепты">${catalogFilters.favorite?'♥':'♡'} <span id="mp-favorite-count">${(db().favorites||[]).length}</span></button></div>
    <div class="mp-searchbar"><input id="mp-search" type="search" placeholder="Название или продукт" aria-label="Поиск рецептов" value="${esc(browseQuery)}"></div>${quickSearchHTML('recipes')}<div class="mp-actions"><button class="btn primary" data-cook="new">＋ Создать рецепт</button><button class="btn" data-cook="resume">Мой черновик</button></div><label class="mp-check"><input type="checkbox" id="mp-show-world"${catalogFilters.world?' checked':''}>Дополнительная мировая подборка · КБЖУ автора</label>
    <details class="mp-catalog-options"${filtersOpen?' open':''}><summary>Подборки и фильтры</summary><p id="mp-filter-count" class="mp-copy" role="status" aria-live="polite"></p><div id="mp-catalog-filters">${catalogFiltersHTML()}</div><div class="mp-catalog-selects"><select id="mp-country" aria-label="Кухня">${['','Повседневная кухня',...Array.from(new Set(E.catalog.recipes.map(r=>r.country).filter(Boolean))).sort((a,b)=>a.localeCompare(b,'ru'))].map(v=>`<option value="${esc(v)}"${v===catalogFilters.country?' selected':''}>${esc(v||'Все кухни')}</option>`).join('')}</select></div></details>
    <div class="mp-catalog-selects"><label>Тип блюда<select id="mp-kind-filter" aria-label="Тип блюда">${[['','Любой'],['main','Основное блюдо'],['soup','Суп'],['salad','Салат'],['sandwich','Бутерброд, бургер, шаурма'],['breakfast','Завтрак']].map(([key,label])=>`<option value="${key}"${catalogFilters.kind===key?' selected':''}>${label}</option>`).join('')}</select></label><label>Время готовки<select id="mp-cook-time-filter" aria-label="Время готовки">${[0,15,30,45,60,90,120].map(v=>`<option value="${v}"${Number(catalogFilters.maxTime||0)===v?' selected':''}>${v?'До '+v+' мин':'Любое'}</option>`).join('')}</select></label></div><div id="mp-active-filters">${activeFiltersHTML()}</div><div id="mp-recipes"></div></details>`;}
  const dateHTML=()=>`<div class="mp-datebar"><button data-mp="date-prev" aria-label="Предыдущий день">‹</button><input aria-label="Дата дневника" id="mp-date" type="date" value="${activeDate}" data-mp-date><button data-mp="date-next" aria-label="Следующий день">›</button></div>`;
  const planTotal=d=>E.round(E.sum((d.plan?.meals||[]).map(m=>(d.eaten[m.id]||m).nutrition)));

  function browse(){
    const host=D.getElementById('mp-recipes');if(!host)return;
    captureCatalogDrafts();
    if(replacementSlot)return browseReplacements();
    const prefs={...db().preferences,maxTime:0,simpleOnly:false},q=browseQuery;
    const list=E.searchItems(E.catalog.recipes.filter(r=>(catalogFilters.world||catalogFilters.favorite||!r.source)&&E.matchesCatalog(r,{...catalogFilters,type:browseType},db().favorites||[])&&E.allowed(r,prefs)),q,E.recipeSearchText);
    if(q.trim())list.sort((a,b)=>Number(!E.searchMatches(a.name,q))-Number(!E.searchMatches(b.name,q))||Number(!!a.source)-Number(!!b.source));
    updateSearchTerms('recipes',q);
    const filtersHost=D.getElementById('mp-catalog-filters');if(filtersHost)filtersHost.innerHTML=catalogFiltersHTML();
    const active=D.getElementById('mp-active-filters');if(active)active.innerHTML=activeFiltersHTML();
    const favoriteButton=D.querySelector('.mp-favorites-toggle');if(favoriteButton){favoriteButton.setAttribute('aria-pressed',String(catalogFilters.favorite));favoriteButton.innerHTML=(catalogFilters.favorite?'♥':'♡')+' <span id="mp-favorite-count">'+(db().favorites||[]).length+'</span>';}
    if(D.getElementById('mp-country'))D.getElementById('mp-country').value=catalogFilters.country;
    if(D.getElementById('mp-kind-filter'))D.getElementById('mp-kind-filter').value=catalogFilters.kind||'';
    if(D.getElementById('mp-cook-time-filter'))D.getElementById('mp-cook-time-filter').value=String(catalogFilters.maxTime||0);
    if(D.getElementById('mp-show-world'))D.getElementById('mp-show-world').checked=!!catalogFilters.world;
    const status=D.getElementById('mp-filter-count');if(status)status.textContent='Найдено '+list.length+' '+({one:'блюдо',few:'блюда',many:'блюд',other:'блюда'})[new Intl.PluralRules('ru').select(list.length)];
    host.innerHTML=`<div class="mp-copy" aria-live="polite">Найдено ${list.length} · с учётом предпочтений</div>${list.slice(0,browseLimit).map(r=>{
      const m=E.fit(r,r.portionNutrition||E.nutrition(r.ingredients));
      const available=(day().plan?.meals||[]).filter(x=>!day().eaten[x.id]&&r.slots.includes(x.type));
      return `<article class="mp-recipe"><div class="mp-head"><span class="mp-tag">${esc(r.country||'Простой рецепт')}</span><div class="mp-recipe-tools"><small>${r.time} мин</small><button class="btn tiny mp-favorite" data-mp="favorite" data-id="${r.id}" aria-pressed="${(db().favorites||[]).includes(r.id)}" aria-label="${(db().favorites||[]).includes(r.id)?'Убрать из избранного':'В избранное'}: ${esc(r.name)}">${(db().favorites||[]).includes(r.id)?'♥':'♡'}</button></div></div><h3>${esc(r.name)}</h3>${weightHTML(m)}<div class="mp-copy">${macros(m.nutrition)}${r.source?' · 1 порц.':''}</div><details><summary>Посмотреть рецепт</summary>${ingredientsHTML(m)}</details>${!r.source?`<button class="btn full" data-cook="edit" data-id="${r.id}">${r.custom?'Изменить рецепт':'Изменить состав и порцию'}</button>`:''}${available.length?`<div class="mp-pick"><select aria-label="Приём пищи для блюда" id="mp-pick-${r.id}">${available.map(x=>`<option value="${x.id}">${esc(x.title)}</option>`).join('')}</select><button class="btn tiny" data-mp="pick" data-id="${r.id}">В план меню ＋</button></div>`:''}<details class="mp-record-options"><summary>Записать в дневник</summary><div class="mp-catalog-record"><label>Сколько порций<input aria-label="Количество порций: ${esc(r.name)}" id="mp-catalog-portion-${r.id}" type="text" value="1" min="0.05" max="5" step="0.25" inputmode="decimal"></label><select id="mp-catalog-slot-${r.id}" aria-label="Записать в приём пищи">${mealCategories.filter(([v])=>r.slots.includes(v)).map(([v,i,n])=>`<option>${n}</option>`).join('')}</select><p id="mp-catalog-preview-${r.id}" class="mp-copy mp-portion-preview" aria-live="polite">${macros(m.nutrition)}</p><button class="btn primary" data-mp="catalog-record" data-id="${r.id}">Записать порцию</button></div></details></article>`;
    }).join('')}${list.length>browseLimit?'<button class="btn full" data-mp="more">Показать ещё 24</button>':''}${!list.length?`<div class="mp-empty"><b>${catalogFilters.favorite?'В избранном пока нет подходящих блюд':'Ничего не найдено'}</b><p>${catalogFilters.favorite?'Нажми сердечко у рецепта, чтобы сохранить его. Если рецепты уже сохранены, проверь фильтры.':'Попробуй другое название или сбрось фильтры. Исключённые продукты учитываются всегда.'}</p><button class="btn" data-mp="catalog-reset">Показать все рецепты</button></div>`:''}`;
    restoreCatalogDrafts();
  }
  function replacementTarget(d,current){const others=E.sum(d.plan.meals.filter(m=>m.id!==current.id).map(m=>m.nutrition)),extras=E.sum(d.extra.map(m=>m.nutrition));return E.subtractTarget(d.target||d.plan.target,E.sum([others,extras]));}
  function browseReplacements(){
    const host=D.getElementById('mp-recipes'),d=day(),current=d.plan?.meals.find(m=>m.id===replacementSlot);if(!host||!current)return;
    const aim=replacementTarget(d,current),prefs={...db().preferences,maxTime:0,simpleOnly:false},q=browseQuery;
    const score=n=>E.loss(n,aim);
    const list=E.searchItems(E.catalog.recipes.filter(r=>r.id!==current.recipeId&&r.slots.includes(browseType||current.type)&&E.allowed(r,prefs)),q,E.recipeSearchText).map(r=>({recipe:r,meal:E.fit(r,aim)})).sort((a,b)=>Number(!!a.recipe.source)-Number(!!b.recipe.source)||score(a.meal.nutrition)-score(b.meal.nutrition));
    updateSearchTerms('recipes',q);
    host.innerHTML=`<p class="mp-copy">${list.length} вариантов${browseType&&browseType!==current.type?' · категория «'+mealCategories.find(x=>x[0]===browseType)?.[2]+'», запись в «'+esc(current.title)+'»':''} · сначала простые блюда, затем мировая кухня. Количество уже подобрано под этот приём.</p>${list.slice(0,browseLimit).map(({recipe:r,meal:m})=>`<article class="mp-recipe"><div class="mp-head"><span class="mp-tag">${esc(r.country||'Простой рецепт')}</span><div class="mp-recipe-tools"><small>${r.time} мин</small><button class="btn tiny mp-favorite" data-mp="favorite" data-id="${r.id}" aria-pressed="${(db().favorites||[]).includes(r.id)}" aria-label="${(db().favorites||[]).includes(r.id)?'Убрать из избранного':'В избранное'}: ${esc(r.name)}">${(db().favorites||[]).includes(r.id)?'♥':'♡'}</button></div></div><h3>${esc(r.name)}</h3>${weightHTML(m)}<b class="mp-macro">${macros(m.nutrition)}</b>${E.isLegacyMeal(m)||m.legacySnapshot?'<p class="mp-copy">КБЖУ сохранены по прежнему расчёту. Для новых справочных значений обнови состав или подбери меню заново. Прошлые записи сохранят свои значения.</p>':''}<details><summary>Рецепт и ингредиенты</summary>${ingredientsHTML(m)}</details><button class="btn full" data-mp="replace-choice" data-id="${r.id}">Выбрать это блюдо</button></article>`).join('')}${list.length>browseLimit?'<button class="btn full" data-mp="more">Показать ещё 24</button>':''}${!list.length?'<p class="mp-copy">Нет совпадений. Попробуй другой запрос или измени исключения.</p>':''}`;
  }
  function replaceWithRecipe(recipe,slotId){
    const d=day(),current=d.plan?.meals.find(m=>m.id===slotId);if(!recipe||!current||d.eaten[current.id])return;
    if(!E.allowed(recipe,{...db().preferences,maxTime:0,simpleOnly:false})||!recipe.slots.includes(browseType||current.type))throw Error('Блюдо не подходит текущим предпочтениям');
    const meal={...E.fit(recipe,replacementTarget(d,current)),id:current.id,type:current.type,title:current.title,share:current.share};
    const plan={...d.plan,meals:d.plan.meals.map(m=>m.id===slotId?meal:m)};plan.total=E.round(E.sum(plan.meals.map(m=>m.nutrition)));
    mutate(data=>{data.days[activeDate]={...d,plan};});
  }
  const navigationHTML=()=>`<nav class="mp-view-tabs" aria-label="Раздел питания"><button data-mp="nutrition-view" data-value="diary" aria-pressed="${!catalogView&&!productView}">Дневник</button><button data-mp="nutrition-view" data-value="products" aria-pressed="${productView}">Продукты</button><button data-mp="nutrition-view" data-value="recipes" aria-pressed="${catalogView}">Рецепты</button></nav>`;
  function render(capture=true){
    if(capture)captureDrafts();
    const host=D.getElementById('mealPlannerRoot');if(!host)return;
    if(openedOwner!==owner()){W.closeModal?.();return;}
    host.dataset.date=activeDate;
    const data=db();W.UNVRSLRecipeBuilder?.hydrate(data.customRecipes||[]);const d=day(),prefs={simpleOnly:true,...data.preferences},t=d.target||d.plan?.target||data.target,eaten=totals(d);
    if(productView){host.innerHTML=`<h2 class="mp-title-source">Продукты</h2>${navigationHTML()}${dateHTML()}${productsHTML()}<div id="mp-error" role="alert" class="mp-error"></div>`;restoreDrafts();browseProducts();W.refreshModalHeader?.();return;}
    if(catalogView){catalogOpen=true;host.innerHTML=`<h2 class="mp-title-source">Рецепты</h2>${navigationHTML()}${dateHTML()}<p class="mp-copy">Добавь блюдо в план меню или запиши уже съеденную порцию. После выбора вернёшься в дневник за этот день.</p><div class="mp-catalog-page">${catalogHTML()}</div><p class="mp-copy" aria-live="polite">Дневник за ${esc(new Date(activeDate+'T12:00:00').toLocaleDateString('ru-RU'))}: ${macros(eaten)}</p><div id="mp-error" role="alert" class="mp-error"></div>`;browse();W.refreshModalHeader?.();return;}
    if(replacementSlot){const current=d.plan?.meals.find(m=>m.id===replacementSlot);if(current&&!d.eaten[current.id]){host.innerHTML=`<h2 class="mp-title-source">Заменить блюдо</h2><button class="btn tiny" data-mp="replace-back">‹ Назад к меню</button><div class="mp-replace-head"><small>${esc(current.title)}</small><h3>Выбери блюдо</h3><p class="mp-copy">Сейчас: ${esc(current.name)}</p></div><input id="mp-search" type="search" placeholder="Название или продукт" aria-label="Поиск замены" value="${esc(browseQuery)}">${quickSearchHTML('recipes')}<div id="mp-recipes"></div><div id="mp-error" class="mp-error" role="alert"></div>`;browseReplacements();W.refreshModalHeader?.();return;}replacementSlot=null;}
    host.dataset.settingsSnapshot=JSON.stringify({t,prefs});
    const np=state()?.nutritionPlannerV311?.result;
    const metric=()=>['k','p','f','c'].map((k,i)=>`<div class="mp-metric${k==='k'?' mp-energy':''}" style="--mp-color:${['var(--green)','#6899e8','#e0a34e','#b28ae5'][i]}"><small>${['Ккал','Белки','Жиры','Углеводы'][i]}</small><b>${fmt(eaten[k])}</b><span>${t?'Цель '+rangeText(t,k)+(k==='k'?'':' г'):'Нет цели'}</span><div class="mp-track" role="progressbar" aria-label="${['Калории','Белки','Жиры','Углеводы'][i]}" aria-valuenow="${eaten[k]}" aria-valuemin="0" aria-valuemax="${t?E.bounds(t,k)[1]:1}"><i style="width:${Math.min(100,t?eaten[k]/E.bounds(t,k)[1]*100:0)}%"></i></div></div>`).join('');
    const planned=d.plan?E.round(E.sum([planTotal(d),...d.extra.map(x=>x.nutrition)])):null;
    const within=planned&&t&&E.within(planned,t);
    host.innerHTML=`<h2 class="mp-title-source">Питание</h2>${navigationHTML()}<div class="mp-head mp-intro"><div><div class="mp-eyebrow">ТВОЙ РАЦИОН</div><strong>Меню под твои КБЖУ</strong></div><button class="btn tiny" data-mp="calculator">КБЖУ</button></div>
      ${protocolHTML()}
      ${dateHTML()}
      <div class="mp-section-label">Съедено за день</div><div class="mp-metrics">${metric()}</div>
      ${t?`<div class="mp-remaining"><span>Осталось до цели</span><b>${remainingText(t,eaten,'k')} <small>ккал</small></b></div><div class="mp-remaining-macros">${['p','f','c'].map((k,i)=>`<span class="mp-tag">${['Б','Ж','У'][i]} ${remainingText(t,eaten,k)} г</span>`).join('')}</div>${['k','p','f','c'].some(k=>eaten[k]>E.bounds(t,k)[1])?'<p class="mp-copy">Превышение: '+['k','p','f','c'].filter(k=>eaten[k]>E.bounds(t,k)[1]).map(k=>({k:'калории',p:'белки',f:'жиры',c:'углеводы'})[k]+' +'+fmt(eaten[k]-E.bounds(t,k)[1])+(k==='k'?' ккал':' г')).join(' · ')+'</p>':''}${Math.abs(4*t.p+9*t.f+4*t.c-t.k)>t.k*.1?'<p class="mp-copy">Калории и БЖУ расходятся больше чем на 10%. Проверь цели.</p>':''}`:''}
      <details class="mp-settings"><summary>Цели и предпочтения</summary>
      <p class="mp-copy">${np?'Цель задана диапазонами из расчёта. Числа ниже нужны для ручной цели; если их не менять, диапазоны сохранятся.':'Задай свои цели или рассчитай КБЖУ по своим данным.'}</p>
      <div class="mp-fields">${fields(t)}
      <div class="field"><label for="mp-count">Приёмов пищи</label><select id="mp-count">${[3,4,5].map(n=>`<option value="${n}"${prefs.count==n?' selected':''}>${n}</option>`).join('')}</select></div>
      <div class="field"><label for="mp-time">Готовка одного блюда</label><select id="mp-time">${[15,30,45,60].map(n=>`<option value="${n}"${prefs.maxTime==n?' selected':''}>До ${n} минут</option>`).join('')}</select></div></div>
      <div class="field"><label for="mp-exclude">Исключить продукты, через запятую</label><input id="mp-exclude" value="${esc(prefs.exclude)}" placeholder="Например: банан, рыба"></div>
      <label class="mp-check"><input id="mp-world" type="checkbox"${prefs.simpleOnly===false?' checked':''}>Добавлять мировую кухню в подбор</label>
      <label class="mp-check"><input id="mp-vegetarian" type="checkbox"${prefs.vegetarian?' checked':''}>Без мяса и рыбы</label>
      <div class="mp-actions">${[['milk','Молочное'],['egg','Яйца'],['nuts','Орехи'],['fish','Рыба'],['soy','Соя'],['gluten','Глютен'],['shellfish','Ракообразные'],['seeds','Семечки'],['peanuts','Арахис'],['mollusks','Моллюски'],['mustard','Горчица'],['celery','Сельдерей'],['sesame','Кунжут']].map(([id,label])=>`<label class="mp-check"><input type="checkbox" name="mp-allergen" value="${id}"${prefs.allergens.includes(id)?' checked':''}>Без: ${label.toLowerCase()}</label>`).join('')}</div>
      <button class="btn full" data-mp="save">Сохранить настройки</button></details>
      <button class="btn primary full" data-mp="generate"${d.plan&&d.plan.meals.every(m=>d.eaten[m.id])?' disabled':''}>${d.plan&&d.plan.meals.every(m=>d.eaten[m.id])?'Все приёмы записаны':d.plan?'Подобрать оставшееся меню':'Подобрать меню на день'}</button>
      <button class="btn full mp-add-food" data-mp="nutrition-view" data-value="products">＋ Записать еду</button>
      ${d.plan?`<div class="mp-summary"><div class="mp-head"><b>Итог с выбранным меню</b><span class="mp-tag ${within?'mp-ok':''}">${within?(t.ranges?'В диапазоне':'Близко к цели'):'Есть отклонение'}</span></div><div class="mp-plan-metrics">${['k','p','f','c'].map((k,i)=>`<div class="${k==='k'?'mp-plan-energy':''}"><small>${['Ккал','Белки','Жиры','Углеводы'][i]}</small><b>${fmt(planned[k])}</b><span>${statusText(planned,t,k)}</span></div>`).join('')}</div><p class="mp-copy">Учитывает записанное и ${d.plan.meals.filter(m=>!d.eaten[m.id]).length} незаписанных приёмов. ${within?"":"Замени блюдо или подбери меню заново, чтобы приблизиться к цели."}</p></div>`:''}
      ${!d.plan?`<div class="mp-empty"><b>${t?'Меню ещё не составлено':np?.goals?'Выбери протокол':'Начни с расчёта КБЖУ'}</b><p>${t?'Нажми «Подобрать» или выбери блюдо в рецептах. Свою еду можно записать в любой момент.':np?.goals?'Нажми «Сушка», «Поддержание» или «Набор» выше – дневник получит диапазоны из твоего расчёта.':'Выбери сушку, поддержание или набор после расчёта. Дневник и рецепты доступны и без цели.'}</p>${!t&&!np?.goals?'<button class="btn" data-mp="calculator">Рассчитать КБЖУ</button>':''}</div>`:''}
      ${(d.plan?.meals||[]).map(original=>{
        const m=d.eaten[original.id]||original,done=!!d.eaten[m.id];
        return `<article class="mp-meal${done?' mp-done':''}"><div class="mp-head"><small>${esc(m.title)}${done?' · записано':''}</small><span class="muted">${m.time} мин</span></div><h3>${esc(m.name)}</h3>${weightHTML(m)}<b class="mp-macro">${macros(m.nutrition)}</b>${E.isLegacyMeal(m)||m.legacySnapshot?'<p class="mp-copy">КБЖУ сохранены по прежнему расчёту. Для новых справочных значений обнови состав или подбери меню заново. Прошлые записи сохранят свои значения.</p>':''}
        <details><summary>Рецепт и ингредиенты</summary>${done?ingredientsHTML(m):compositionHTML(m)+ingredientsHTML(recipeOf(m)?.source?m:{...m,ingredients:[]})}<p class="mp-copy">Готовый вес зависит от воды и способа приготовления. Для точной записи взвесь всё блюдо из состава выше после готовки, без посуды. Вода меняет вес, но не КБЖУ. Для части порции сохраняй пропорции ингредиентов.</p>${done?'':`<div class="mp-ready-edit"><label for="mp-ready-${m.id}">Фактический вес всей этой порции, г</label><input id="mp-ready-${m.id}" type="text" min="1" max="10000" inputmode="decimal" value="${m.readyGrams||''}" placeholder="Взвесь готовое блюдо"><button class="btn" data-mp="ready-weight" data-id="${m.id}">Сохранить вес</button></div>`}</details>
        <div class="mp-actions"><button class="btn${done?'':' primary'}" data-mp="eat" data-id="${m.id}">${done?'✓ Съедено · отменить':'✓ Записать приём'}</button>${done?'':`<button class="btn" data-mp="swap" data-id="${m.id}">Заменить</button>${E.servingWeight(m)?`<label class="mp-portion mp-eaten-grams">${E.servingWeight(m)?.estimated?"Съём, г · вес блюда примерный":"Съём готового, г"}<input id="mp-eaten-${m.id}" type="text" min="1" max="10000" inputmode="decimal" value="${E.servingWeight(m).grams}" aria-label="Съедено готового блюда, г"></label>`:''}<label class="mp-portion"><span>Доля порции ×</span><input type="text" min="0.05" max="5" step="0.05" value="1" aria-label="Множитель съеденной порции" id="mp-portion-${m.id}"></label><p id="mp-portion-preview-${m.id}" class="mp-copy mp-portion-preview" aria-live="polite">Будет записано: ${macros(m.nutrition)}</p>`}</div></article>`;
      }).join('')}

      ${d.extra.length?'<h3 class="mp-section-label">Записано отдельно</h3>':''}
      ${d.extra.map(x=>`<div class="mp-extra"><div><b>${esc(x.name)} · ${x.grams?fmt(x.grams)+(x.unit==='ml'?' мл':' г')+(x.quantity?' · '+fmt(x.quantity.amount)+' шт.':''):fmt(x.servings||1)+' порц.'}</b><div class="mp-copy">${esc(x.slot||'Своя еда')} · ${macros(x.nutrition)}</div></div><div class="row"><button class="btn tiny" data-mp="edit-extra" data-id="${esc(x.id)}" aria-label="Изменить порцию ${esc(x.name)}">Порция</button><button class="btn tiny danger" data-mp="remove" data-id="${esc(x.id)}" aria-label="Удалить запись">✕</button></div></div>${editingExtraId===x.id?`<div class="mp-ready-edit"><label for="mp-extra-quantity-${esc(x.id)}">Съедено, ${x.grams?(x.unit==='ml'?'мл':'г'):'порций'}</label><input id="mp-extra-quantity-${esc(x.id)}" type="text" inputmode="decimal" value="${x.grams||x.servings||1}"><button class="btn primary" data-mp="save-extra" data-id="${esc(x.id)}">Сохранить порцию</button><button class="btn" data-mp="cancel-extra">Отмена</button></div>`:''}`).join('')}
      ${lastRemoved?.date===activeDate?'<div class="mp-undo" role="status">Запись удалена<button class="btn tiny" data-mp="undo-remove">Вернуть</button></div>':''}
      ${d.plan?`<details class="mp-settings"><summary>Список покупок на этот день</summary><ul>${shopping(d.plan).map(i=>`<li>${esc(i.name)} · ${esc(i.amount)}</li>`).join('')}</ul><p class="mp-copy">Количество для всего выбранного меню.</p></details>`:''}
      ${referencesHTML()}
      <details class="mp-source"><summary>О КБЖУ и источниках</summary><p class="mp-copy">КБЖУ приблизительные. Для основных рецептов используются USDA SR28 и данные маркировки с источником у продукта; справочник USDA исторический, для своей марки проверь упаковку. Углеводы USDA включают клетчатку. Состав рассчитан по ингредиентам, масло учтено целиком; количество до приготовления, если не указано иное. Для мировой кухни взяты расчётные значения автора на порцию, состав масштабируется целиком.</p><p class="mp-copy">Дополнительная мировая подборка (501 рецепт): <a href="https://theunitools.com/en/data" target="_blank" rel="noopener">UniTools</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">CC BY-SA 4.0</a>. Данные адаптированы, фотографии не использованы. При исключении аллергенов подбор использует только простые рецепты с известным составом.</p></details>
      <p id="mp-save-status" class="mp-save-status" role="status">Записи хранятся на этом устройстве.</p><div id="mp-error" role="alert" class="mp-error"></div>`;
    restoreDrafts();
    if(catalogOpen)browse();
    W.refreshModalHeader?.();
  }
  function shopping(plan){
    const grouped=new Map();
    const add=(name,amount,unit)=>{const key=name+'|'+unit;const previous=grouped.get(key);if(previous&&amount!==null)previous.amount+=amount;else if(!previous)grouped.set(key,{name,amount,unit});};
    for(const m of plan.meals){const r=recipeOf(m);if(r?.source){const factor=m.ingredients[0].g/100/r.baseServings;for(const i of r.details)add(i.name,i.quantity===null?null:i.quantity*factor,i.unit);}else for(const i of m.ingredients)add(i.name||E.catalog.foods[i.id]?.name||'Свой продукт',i.g,'g');}
    return [...grouped.values()].map(x=>({name:x.name,amount:x.amount===null?'по вкусу':fmt(x.amount)+' '+unitName(x.unit)}));
  }

  function readSettings(){
    let target=E.validateTarget(Object.fromEntries(['k','p','f','c'].map(k=>[k,number(D.getElementById('mp-'+k).value.replace(',','.'))])));
    const previousTarget=day().target||day().plan?.target||db().target;if(sameValues(previousTarget,target)&&previousTarget.ranges)target={...target,ranges:previousTarget.ranges};
    const preferences={simpleOnly:!D.getElementById('mp-world').checked,count:number(D.getElementById('mp-count').value),maxTime:number(D.getElementById('mp-time').value),exclude:D.getElementById('mp-exclude').value,vegetarian:D.getElementById('mp-vegetarian').checked,allergens:[...D.querySelectorAll('[name="mp-allergen"]:checked')].map(x=>x.value)};
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
  function open(){resetOnline();foodUnit='g';activeDate=dateNow();browseQuery='';browseType='';browseLimit=24;replacementSlot=null;catalogOpen=false;catalogView=false;filtersOpen=false;lastRemoved=null;catalogFilters={diet:'',collection:'',calories:'',country:'',favorite:false};productView=false;productQuery='';productFilter='';ingredientSlot=null;selectedProduct=null;foodDraft=null;mealDrafts.clear();settingsDrafts.clear();catalogDrafts.clear();productLimit=30;openedOwner=owner();W.modal('<div id="mealPlannerRoot"></div>');
    try{let data=db();W.UNVRSLRecipeBuilder?.hydrate(data.customRecipes||[]);if(data.protocol&&data.protocol!=='manual'&&state()?.nutritionPlannerV311?.result?.goals?.[data.protocol]&&!data.target?.ranges){selectProtocol(data.protocol);data=db();}const d=day(),target=d.target||data.target;
      if(data.protocol&&data.protocol!=='manual'&&target&&(!d.plan||d.menuStale)){const plan=build(target,data.preferences,d);mutate(data=>{data.days[activeDate]={...d,plan,target:{...target},protocol:data.protocol,menuStale:false};});}
      render();
    }catch(error){render();const out=D.getElementById('mp-error');if(out)out.textContent=error.message;}
  }
  W.openMealPlanner=open;
  D.addEventListener('toggle',e=>{if(e.target.matches?.('.mp-catalog-options')&&e.target.isConnected)filtersOpen=e.target.open;if(e.target.matches?.('.mp-library')&&e.target.isConnected){catalogOpen=e.target.open;if(catalogOpen)browse();}},true);
  D.addEventListener('input',e=>{if(e.target.id==='mp-search'){browseQuery=e.target.value;browseLimit=24;browse();}});
  D.addEventListener('input',e=>{
    if(!e.target.closest?.('#mealPlannerRoot'))return;
    if(e.target.id==='mp-product-search'){resetOnline();productQuery=e.target.value;productLimit=30;browseProducts();return;}
    if(e.target.id.startsWith('mp-food-')){if(e.target.id==='mp-food-name'||/^mp-food-[kpfc]$/.test(e.target.id)){selectedProduct=null;D.getElementById('mp-food-source').innerHTML='';}foodPreview();return;}
    const editor=e.target.closest('.mp-composition');
    if(editor&&e.target.matches('[data-mp-ingredient]')){editor.dataset.dirty='true';const ready=D.getElementById('mp-ready-'+editor.dataset.meal);if(ready)ready.value='';compositionPreview(editor);return;}
    if(e.target.id.startsWith('mp-ready-')){const box=D.querySelector(`.mp-composition[data-meal="${e.target.id.slice(9)}"]`);if(box){box.dataset.dirty='true';compositionPreview(box);}return;}
    if(e.target.id.startsWith('mp-catalog-portion-')){
      const id=e.target.id.slice('mp-catalog-portion-'.length),r=E.catalog.recipes.find(r=>r.id===id),out=D.getElementById('mp-catalog-preview-'+id);
      if(r&&out){try{out.textContent=macros(E.scaleMeal(E.fit(r,E.recipeInfo(r).nutrition),number(e.target.value)).nutrition);}catch(_){out.textContent='Укажи от 0,05 до 5 порций';}}return;
    }
    if(!/^mp-(eaten|portion)-/.test(e.target.id))return;
    const m=day().plan?.meals.find(m=>e.target.id==='mp-eaten-'+m.id||e.target.id==='mp-portion-'+m.id);if(!m)return;
    const w=E.servingWeight(m);
    if(w&&e.target.id==='mp-eaten-'+m.id)D.getElementById('mp-portion-'+m.id).value=Math.round(number(e.target.value)/w.grams*10000)/10000;
    else if(w)D.getElementById('mp-eaten-'+m.id).value=Math.round(number(e.target.value)*w.grams*10)/10;
    const out=D.getElementById('mp-portion-preview-'+m.id);if(out){try{out.textContent='Будет записано: '+macros(E.scaleMeal(m,number(D.getElementById('mp-portion-'+m.id).value)).nutrition);}catch(_){out.textContent='Укажи от 0,05 до 5 порций';}}
  });
  D.addEventListener('keydown',e=>{if(e.target.id==='mp-product-search'&&e.key==='Enter'){e.preventDefault();searchOnline();}});
  D.addEventListener('change',e=>{if(e.target.id==='mp-show-world'){catalogFilters.world=e.target.checked;browseLimit=24;browse();return;}if(e.target.id==='mp-food-unit'){const previous=foodUnit,next=e.target.value,changedBasis=(previous==='ml')!==(next==='ml');setFoodUnit(next);if(changedBasis){selectedProduct=null;for(const k of ['k','p','f','c'])D.getElementById('mp-food-'+k).value='';D.querySelector('.mp-raw-values').open=true;D.getElementById('mp-food-source').innerHTML='';W.toast?.('Укажи КБЖУ на 100 '+foodBasisText()+': миллилитры не переводятся в граммы без плотности.');}foodPreview();}});
  D.addEventListener('change',e=>{if(e.target.id==='mp-kind-filter'||e.target.id==='mp-cook-time-filter'){catalogFilters[e.target.id==='mp-kind-filter'?'kind':'maxTime']=e.target.value;browseLimit=24;browse();return;}if(e.target.id==='mp-country'){catalogFilters.country=e.target.value;if(e.target.value&&e.target.value!=='Повседневная кухня'){catalogFilters.world=true;const toggle=D.getElementById('mp-show-world');if(toggle)toggle.checked=true;}browseLimit=24;browse();}});
  D.addEventListener('change',e=>{if(!e.target.matches?.('[data-mp-date]'))return;if(/^\d{4}-\d{2}-\d{2}$/.test(e.target.value)){captureDrafts();activeDate=e.target.value;render();}});
  D.addEventListener('click',e=>{
    const b=e.target.closest?.('[data-mp]');if(!b)return;
    if(b.dataset.mp==='open'){open();return;}
    if(!b.closest('#mealPlannerRoot'))return;
    if(openedOwner!==owner()){W.closeModal?.();return;}
    try{
      const action=b.dataset.mp,d=day();
      if(action==='nutrition-view'){resetOnline();captureDrafts();captureViewPosition();catalogView=b.dataset.value==='recipes';productView=b.dataset.value==='products';ingredientSlot=null;replacementSlot=null;render(false);restoreViewPosition(b.dataset.value);return;}
      if(action==='meal-category'){
        browseType=!replacementSlot&&browseType===b.dataset.value?'':b.dataset.value;browseLimit=24;
        browse();return;
      }
      if(action==='search-term'){
        if(b.dataset.context==='products'){resetOnline();productQuery=b.dataset.value;productFilter='';productLimit=30;D.getElementById('mp-product-search').value=productQuery;browseProducts();}
        else{browseQuery=b.dataset.value;browseLimit=24;D.getElementById('mp-search').value=browseQuery;browse();}
        return;
      }
      if(action==='catalog-filter'){
        const key=b.dataset.key,value=b.dataset.value||'';
        if(key==='favorite')catalogFilters.favorite=!catalogFilters.favorite;
        else if(['diet','collection','calories'].includes(key))catalogFilters[key]=catalogFilters[key]===value?'':value;
        browseLimit=24;browse();return;
      }
      if(action==='catalog-reset'){browseQuery='';browseType='';catalogFilters={diet:'',collection:'',calories:'',country:'',favorite:false};browseLimit=24;D.getElementById('mp-search').value='';browse();return;}
      if(action==='favorite'){
        if(!E.catalog.recipes.some(r=>r.id===b.dataset.id))return;
        mutate(data=>{const favorites=data.favorites||[];data.favorites=favorites.includes(b.dataset.id)?favorites.filter(id=>id!==b.dataset.id):[...favorites,b.dataset.id];});browse();return;
      }
      if(action==='catalog-record'){
        const recipe=E.catalog.recipes.find(r=>r.id===b.dataset.id);if(!recipe||!E.allowed(recipe,{...db().preferences,maxTime:0,simpleOnly:false}))throw Error('Блюдо не подходит текущим предпочтениям');
        const factor=number(D.getElementById('mp-catalog-portion-'+recipe.id).value);
        const meal=E.scaleMeal(E.fit(recipe,E.recipeInfo(recipe).nutrition),factor),weight=E.servingWeight(meal);
        const slot=D.getElementById('mp-catalog-slot-'+recipe.id).value;
        mutate(data=>{data.days[activeDate]={...d,extra:[...d.extra,{id:'recipe-'+Date.now()+'-'+Math.random().toString(36).slice(2,8),recipeId:recipe.id,name:recipe.name,slot,nutrition:meal.nutrition,ingredients:W.UNVRSLRecipeBuilder?W.UNVRSLRecipeBuilder.snapshotIngredients(meal.ingredients):JSON.parse(JSON.stringify(meal.ingredients)),readyGrams:meal.readyGrams||null,yieldEstimated:weight?.estimated??true,grams:weight?.grams||null,servings:factor}]};});
        catalogView=false;render();mount();[...D.querySelectorAll('.mp-extra')].at(-1)?.scrollIntoView?.({block:'center',behavior:'smooth'});W.toast?.('Порция записана в дневник');return;
      }
      if(action==='date-prev'||action==='date-next'){captureDrafts();const date=new Date(activeDate+'T12:00:00');date.setDate(date.getDate()+(action==='date-prev'?-1:1));activeDate=[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');render();return;}
      if(action==='online-search'){searchOnline();return;}
      if(action==='online-more'){searchOnline(true);return;}
      if(action==='online-pick'){pickOnline(b.dataset.id);return;}
      if(action==='product-more'){productLimit+=30;browseProducts();return;}
      if(action==='product-filter'){resetOnline();productFilter=b.dataset.value;productQuery='';D.getElementById('mp-product-search').value='';productLimit=30;browseProducts();return;}
      if(action==='food-grams'){D.getElementById('mp-food-grams').value=b.dataset.value;foodPreview();return;}
      if(action==='product-pick'){chooseProduct(productPool().find(f=>f.key===b.dataset.id));return;}
      if(action==='saved-food'){chooseProduct(productPool().find(f=>f.savedId===b.dataset.id));return;}
      if(action==='saved-delete'){mutate(data=>{data.savedFoods=(data.savedFoods||[]).filter(x=>x.id!==b.dataset.id);});browseProducts();return;}
      if(action==='ingredient-search'){resetOnline();captureDrafts();ingredientSlot=b.dataset.id;productView=true;catalogView=false;productQuery='';productFilter='';render(false);return;}
      if(action==='ingredient-back'){resetOnline();ingredientSlot=null;productView=false;render(false);return;}
      if(action==='composition-save'){
        const editor=D.querySelector(`.mp-composition[data-meal="${b.dataset.id}"]`);if(!editor||d.eaten[b.dataset.id])return;
        const meal=compositionDraft(editor),plan={...d.plan,meals:d.plan.meals.map(m=>m.id===meal.id?meal:m)};
        plan.total=planTotal({...d,plan});
        mutate(data=>{data.days[activeDate]={...d,plan};});render();
        const card=[...D.querySelectorAll('.mp-meal')].find(el=>el.querySelector('[data-mp="eat"]')?.dataset.id===meal.id);if(card){card.querySelector('details').open=true;card.scrollIntoView?.({block:'start',behavior:'smooth'});}W.toast?.('Состав и КБЖУ обновлены');return;
      }
      if(action==='ready-weight'){
        const meal=d.plan?.meals.find(x=>x.id===b.dataset.id);if(!meal||d.eaten[meal.id])return;
        const grams=number(D.getElementById('mp-ready-'+meal.id).value);
        if(!Number.isFinite(grams)||grams<=0||grams>10000)throw Error('Укажи готовый вес от 1 до 10 000 г');
        const editor=D.querySelector(`.mp-composition[data-meal="${meal.id}"]`),updated=editor?compositionDraft(editor):{...meal,readyGrams:grams};const plan={...d.plan,meals:d.plan.meals.map(m=>m.id===meal.id?updated:m)};plan.total=planTotal({...d,plan});mutate(data=>{data.days[activeDate]={...d,plan};});render();return;
      }
      if(action==='more'){browseLimit+=24;browse();return;}
      if(action==='replace-back'){replacementSlot=null;browseQuery='';render();return;}
      if(action==='pick'||action==='replace-choice'){
        const recipe=E.catalog.recipes.find(r=>r.id===b.dataset.id),slotId=action==='replace-choice'?replacementSlot:D.getElementById('mp-pick-'+b.dataset.id)?.value;
        replaceWithRecipe(recipe,slotId);replacementSlot=null;catalogView=false;render();[...D.querySelectorAll('.mp-meal')].find(el=>el.querySelector('[data-mp="eat"]')?.dataset.id===slotId)?.scrollIntoView?.({block:'start',behavior:'smooth'});return;
      }
      if(action==='calculator'){if(W.UNVRSLMealContext?.calculator)W.UNVRSLMealContext.calculator();else W.openNutritionPlannerV311();return;}
      if(action==='goal'){
        selectProtocol(b.dataset.value);open();return;
      }
      if(action==='save'||action==='generate'){
        if(action==='generate'&&['k','p','f','c'].some(k=>!D.getElementById('mp-'+k).value)){D.querySelector('.mp-settings').open=true;throw Error('Выбери протокол после расчёта КБЖУ или задай цель в настройках');}
        const {target,preferences}=readSettings();
        const plan=action==='generate'?build(target,preferences,d,undefined,true):d.plan&&d.plan.meals.length===preferences.count?{...d.plan,target}:null;
        mutate(data=>{if(!sameTarget(data.target,target))data.protocol='manual';data.target=target;data.preferences=preferences;data.days[activeDate]={...d,plan,target:{...target},protocol:data.protocol||'manual',menuStale:false};});
      }
      if(action==='swap'){
        const current=d.plan?.meals.find(m=>m.id===b.dataset.id);if(!current||d.eaten[current.id])return;
        replacementSlot=current.id;browseType=current.type;browseQuery='';browseLimit=24;render();D.getElementById('sheet')?.scrollTo?.({top:0});return;
      }
      if(action==='eat'){
        if(D.querySelector(`.mp-composition[data-meal="${b.dataset.id}"]`)?.dataset.dirty==='true')throw Error('Сначала сохрани изменённый состав и готовый вес блюда');
        const meal=d.plan?.meals.find(m=>m.id===b.dataset.id);if(!meal)return;
        const eaten={...d.eaten};
        const original=eaten[meal.id]?.planned||meal;
        if(eaten[meal.id])delete eaten[meal.id];
        else{
          const factor=number(D.getElementById('mp-portion-'+meal.id).value);
          if(!Number.isFinite(factor)||factor<.05||factor>5)throw Error('Порция должна быть от 0,05 до 5');
          const consumed=E.scaleMeal(meal,factor);eaten[meal.id]={...consumed,ingredients:W.UNVRSLRecipeBuilder&&!consumed.legacySnapshot?W.UNVRSLRecipeBuilder.snapshotIngredients(consumed.ingredients):consumed.ingredients,planned:{...meal,planned:undefined}};
        }
        const plan={...d.plan,meals:d.plan.meals.map(m=>m.id===meal.id?original:m)};plan.total=planTotal({...d,plan,eaten});
        mutate(data=>{data.days[activeDate]={...d,plan,eaten};});
      }
      if(action==='extra'){
        const name=D.getElementById('mp-food-name').value.trim(),grams=foodAmountQuantity();
        if(foodUnit==='piece'&&!Number.isFinite(grams))throw Error('Укажи массу одной штуки в граммах');
        const raw=Object.fromEntries(['k','p','f','c'].map(k=>[k,number(D.getElementById('mp-food-'+k).value.replace(',','.'))]));
        if(!name||!Number.isFinite(grams)||grams<=0||grams>3000||['k','p','f','c'].some(k=>D.getElementById('mp-food-'+k).value===''||!Number.isFinite(raw[k])||raw[k]<0)||raw.k>1000||raw.p+raw.f+raw.c>100.5)throw Error('Проверь название, количество и КБЖУ на 100 '+foodBasisText());
        const productKey=selectedProduct?.key||'manual:'+normalize(name);
        const entry={raw,productKey,unit:foodUnit==='piece'?'g':foodUnit,...(foodUnit==='piece'?{quantity:{unit:'piece',amount:number(D.getElementById('mp-food-grams').value),gramsPerPiece:number(D.getElementById('mp-food-piece-weight').value),estimated:true}}:{}),...(selectedProduct?.sourceInfo?{sourceInfo:selectedProduct.sourceInfo}:{}),id:'food-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),name,grams,slot:D.getElementById('mp-food-slot').value,nutrition:E.foodAmount(raw,grams)};
        mutate(data=>{
          data.days[activeDate]={...d,extra:[...d.extra,entry]};
          if(D.getElementById('mp-food-keep').checked){
            const existing=(data.savedFoods||[]).find(x=>normalize(x.name)===normalize(name)),saved=(data.savedFoods||[]).filter(x=>x!==existing),id=existing?.id||entry.id;entry.productKey='own:'+id;
            data.savedFoods=[{id,name,raw,lastGrams:grams,unit:foodUnit==='piece'?'g':foodUnit,...(entry.sourceInfo?{sourceInfo:entry.sourceInfo}:{})},...saved].slice(0,100);
          }
        });
        productView=false;selectedProduct=null;foodDraft=null;render(false);mount();[...D.querySelectorAll('.mp-extra')].at(-1)?.scrollIntoView?.({block:'center',behavior:'smooth'});W.toast?.('Еда записана');return;
      }
      if(action==='edit-extra'){editingExtraId=b.dataset.id;render();D.getElementById('mp-extra-quantity-'+editingExtraId)?.focus();return;}
      if(action==='cancel-extra'){editingExtraId=null;render();return;}
      if(action==='save-extra'){
        const x=d.extra.find(x=>x.id===b.dataset.id);if(!x)return;const amount=number(D.getElementById('mp-extra-quantity-'+x.id).value),previous=x.grams||x.servings||1,factor=amount/previous;
        if(!Number.isFinite(amount)||amount<=0||amount>(x.grams?10000:50)||factor>5)throw Error('Проверь размер порции');
        const ingredients=x.ingredients?.map(i=>({...i,g:i.g*factor})),nutrition=ingredients&&x.ingredients.every(i=>i.sourceNutrition)?E.nutrition(ingredients):x.raw?E.foodAmount(x.raw,amount):Object.fromEntries(['k','p','f','c'].map(k=>[k,x.nutrition[k]*factor]));
        const updated={...x,nutrition,...(ingredients?{ingredients}:{}),...(x.grams?{grams:amount}:{}),...(x.servings?{servings:x.servings*factor}:{}),...(x.quantity?{quantity:{...x.quantity,amount:x.quantity.amount*factor}}:{})};
        mutate(data=>{data.days[activeDate]={...d,extra:d.extra.map(row=>row.id===x.id?updated:row)};});editingExtraId=null;render();mount();W.toast?.('Порция сохранена');return;
      }
      if(action==='remove'){const entry=d.extra.find(x=>x.id===b.dataset.id);mutate(data=>{data.days[activeDate]={...d,extra:d.extra.filter(x=>x.id!==b.dataset.id)};});if(entry)lastRemoved={date:activeDate,entry};}
      if(action==='undo-remove'&&lastRemoved?.date===activeDate){const entry=lastRemoved.entry;mutate(data=>{data.days[activeDate]={...d,extra:d.extra.some(x=>x.id===entry.id)?d.extra:[...d.extra,entry]};});lastRemoved=null;}
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
  W.UNVRSLMealUI={shopping,totals,selectProtocol,refresh:mount,redraw:render,captureViewPosition,restoreViewPosition};
})(window);
