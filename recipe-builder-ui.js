'use strict';
(function(W){
  const D=W.document,E=W.UNVRSLMealEngine,B=W.UNVRSLRecipeBuilder;if(!D||!B)return;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const number=v=>String(v??'').trim()===''?NaN:Number(String(v).trim().replace(',','.'));
  const macro=n=>`${Math.round(n.k)} ккал · Б ${n.p.toFixed(1)} · Ж ${n.f.toFixed(1)} · У ${n.c.toFixed(1)} г`;
  const state=()=>W.UNVRSLMealContext?.getState?.()||W.st;
  const owner=()=>String(state()?.accountOwnerId||W.cloud?.user?.id||'local');
  let draft=null,draftOwner=null,dirty=false,replaceIndex=null,busy=false;
  function data(){const s=state();return s.mealNutritionV1||(s.mealNutritionV1={version:1,days:{},preferences:{count:4,maxTime:45,exclude:'',allergens:[],vegetarian:false,simpleOnly:true},target:null});}
  function commit(fn){const before=JSON.stringify(data());try{fn(data());W.UNVRSLNutritionState?.track(JSON.parse(before),data());const ok=W.UNVRSLMealContext?.save?W.UNVRSLMealContext.save():W.save?.();if(ok===false)throw Error('Не удалось сохранить. Освободи место и повтори.');B.hydrate(data().customRecipes);}catch(e){state().mealNutritionV1=JSON.parse(before);throw e;}}
  function read(){
    if(!D.getElementById('cook-name'))return;
    draft.name=D.getElementById('cook-name').value;draft.steps=D.getElementById('cook-steps').value;draft.servings=number(D.getElementById('cook-servings').value);draft.time=number(D.getElementById('cook-time').value);
    const weight=D.getElementById('cook-ready').value;draft.readyGrams=weight.trim()?number(weight):undefined;
    D.querySelectorAll('[data-cook-grams]').forEach(el=>draft.ingredients[Number(el.dataset.cookGrams)].g=number(el.value));
  }
  function summary(){
    const out=D.getElementById('cook-totals');if(!out)return;
    try{read();const recipe=B.create(draft),n=B.totals(recipe);out.textContent='Вся партия: '+macro(n.total)+'\nОдна порция: '+macro(n.portion)+(n.per100?'\nНа 100 г: '+macro(n.per100):'\nНа 100 г: укажи вес готовой партии. Выход пока неизвестен.');out.style.whiteSpace='pre-line';}
    catch(err){out.textContent=err.message;}
  }
  function editor(recipeId){
    const r=E.catalog.recipes.find(r=>r.id===recipeId);if(r?.source)throw Error('Для этого рецепта нет КБЖУ ингредиентов. Создай свой состав по продуктам.');
    const own=r?.custom;
    draft={...(own?{id:r.id}:{}),name:r?.name||'',steps:r?.steps||'',time:r?.time||20,servings:own?r.baseServings:1,ingredients:r?JSON.parse(JSON.stringify(own?r.batchIngredients:r.ingredients)):[],readyGrams:own?r.batchReadyGrams:undefined};
    draftOwner=owner();dirty=false;renderEditor();
  }
  function renderEditor(){
    const host=D.getElementById('mealPlannerRoot');if(!host)return;W.UNVRSLMealUI?.captureViewPosition?.();
    const navigation=host.querySelector('.mp-view-tabs')?.outerHTML||'',date=host.querySelector('.mp-datebar')?.outerHTML||'';
    host.innerHTML=`<h2 class="mp-title-source">Мой рецепт</h2>${navigation}${date}<button class="btn" data-cook="back">‹ Вернуться к рецептам</button><section class="mp-recipe-editor"><label>Название<input id="cook-name" maxlength="120" value="${esc(draft.name)}"></label><div class="mp-fields"><label>Порций в партии<input id="cook-servings" type="text" inputmode="decimal" value="${draft.servings}"></label><label>Время, мин<input id="cook-time" type="text" inputmode="numeric" value="${draft.time}"></label></div><h3>Состав всей партии</h3><p class="mp-copy">Граммы съедобной части. Состояние продукта указано в названии. Масло и соусы входят в расчёт целиком; удали неиспользованное.</p><div id="cook-ingredients">${draft.ingredients.map((i,index)=>`<div class="mp-ingredient-input"><span>${esc(i.name||E.catalog.foods[i.id]?.name)}<button class="btn tiny" data-cook="replace" data-index="${index}">Заменить продукт</button></span><span><input type="text" inputmode="decimal" data-cook-grams="${index}" value="${i.g}" aria-label="${esc(i.name||E.catalog.foods[i.id]?.name)}, граммы"><small>г</small><button class="btn tiny danger" data-cook="remove" data-index="${index}" aria-label="Убрать ингредиент ${esc(i.name||E.catalog.foods[i.id]?.name)}">✕</button></span></div>`).join('')}</div><button class="btn full" data-cook="search">＋ Добавить ингредиент</button><div id="cook-search-area" hidden><label>Название продукта<input id="cook-search" type="search" placeholder="Говяжий фарш, молоко…" autocomplete="off"></label><div id="cook-results"></div></div><label>Вес готовой партии, г<input id="cook-ready" type="text" inputmode="decimal" value="${draft.readyGrams||''}" placeholder="Взвесь без посуды"></label><label>Шаги приготовления<textarea id="cook-steps" rows="4" maxlength="6000">${esc(draft.steps)}</textarea></label><div id="cook-totals" class="mp-editor-totals" role="status" aria-live="polite"></div><button class="btn primary full" data-cook="save">Сохранить рецепт</button><p id="cook-saved" class="mp-save-status" role="status"></p><details><summary>Добавить съеденную порцию</summary><div class="mp-fields"><label>Количество<input id="cook-amount" type="text" inputmode="decimal" value="1"></label><label>Единица<select id="cook-unit"><option value="servings">Порция</option><option value="grams">Граммы готового</option></select></label><label>Приём пищи<select id="cook-meal">${['Завтрак','Обед','Ужин','Перекус'].map(n=>`<option>${n}</option>`).join('')}</select></label></div><button class="btn primary full" data-cook="record">Добавить в дневник</button></details><div id="cook-error" class="mp-error" role="alert"></div></section>`;
    summary();W.refreshModalHeader?.();D.getElementById('sheet')?.scrollTo?.({top:0});
  }
  function pool(){const rows=Object.entries(E.catalog.foods).filter(([id,f])=>!f.aliasOf).map(([id,f])=>({id,name:f.name,raw:f}));for(const f of data().savedFoods||[])if(f.unit!=='ml')rows.unshift({id:'own-'+f.id,name:f.name,raw:f.raw,sourceInfo:f.sourceInfo});return rows;}
  function search(){const q=D.getElementById('cook-search')?.value||'',out=D.getElementById('cook-results');if(!out)return;const list=E.searchItems(pool(),q,x=>x.name+' '+E.foodText(x.id));out.innerHTML=list.slice(0,24).map(x=>`<button class="btn full mp-product-card" data-cook="pick" data-id="${esc(x.id)}"><b>${esc(x.name)}</b><span>${macro(x.raw)} на 100 г</span></button>`).join('')||'<p class="mp-copy">Ничего не найдено. Добавь продукт с маркировки в «Продуктах», затем вернись к рецепту.</p>';}
  D.addEventListener('input',e=>{if(e.target.id==='cook-search'){search();return;}if(e.target.closest?.('.mp-recipe-editor')){dirty=true;summary();}});
  D.addEventListener('click',e=>{
    const button=e.target.closest?.('[data-cook]');if(!button||busy)return;
    try{
      const action=button.dataset.cook;
      if(action==='resume'){if(draft&&draftOwner===owner())renderEditor();else editor();return;}
      if(action==='new'||action==='edit'){editor(button.dataset.id);return;}
      if(owner()!==draftOwner){W.closeModal?.();return;}
      if(action==='back'){read();D.querySelector('[data-mp="nutrition-view"][data-value="recipes"]')?.click();W.UNVRSLMealUI?.restoreViewPosition?.('recipes');return;}
      read();
      if(action==='search'||action==='replace'){replaceIndex=action==='replace'?Number(button.dataset.index):null;D.getElementById('cook-search-area').hidden=false;search();D.getElementById('cook-search').focus();return;}
      if(action==='pick'){const food=pool().find(f=>f.id===button.dataset.id);if(!food)return;const i={id:food.id,g:replaceIndex===null?100:draft.ingredients[replaceIndex].g,...(!E.catalog.foods[food.id]?{name:food.name,sourceNutrition:food.raw,sourceInfo:food.sourceInfo}: {})};if(replaceIndex===null)draft.ingredients.push(i);else draft.ingredients[replaceIndex]=i;replaceIndex=null;dirty=true;renderEditor();return;}
      if(action==='remove'){draft.ingredients.splice(Number(button.dataset.index),1);dirty=true;renderEditor();return;}
      if(action==='save'||action==='record'){
        const recipe=B.create(draft);busy=true;button.disabled=true;
        if(action==='save'){commit(db=>{db.customRecipes=[...(db.customRecipes||[]).filter(r=>r.id!==recipe.id),recipe];});draft.id=recipe.id;dirty=false;D.getElementById('cook-saved').textContent='Рецепт сохранён на этом устройстве. Облачный статус виден в дневнике.';}
        else{
          const amount=number(D.getElementById('cook-amount').value),unit=D.getElementById('cook-unit').value,slot=D.getElementById('cook-meal').value,date=D.querySelector('[data-mp-date]')?.value;
          if(!date||!Number.isFinite(amount)||amount<=0)throw Error('Укажи съеденное количество');
          if(unit==='grams'&&!recipe.batchReadyGrams)throw Error('Для записи граммов взвесь всю готовую партию');
          const factor=unit==='grams'?amount/recipe.batchReadyGrams:amount/recipe.baseServings;
          if(factor>5||amount>(unit==='grams'?10000:50))throw Error('Проверь размер съеденной порции');
          const ingredients=recipe.batchIngredients.map(i=>({...i,g:i.g*factor})),entry={id:'recipe-entry-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10),recipeId:recipe.id,name:recipe.name,slot,ingredients,nutrition:E.nutrition(ingredients),grams:recipe.batchReadyGrams?recipe.batchReadyGrams*factor:null,servings:factor*recipe.baseServings,recipeSnapshot:{id:recipe.id,name:recipe.name,steps:recipe.steps,baseServings:recipe.baseServings,batchReadyGrams:recipe.batchReadyGrams}};
          commit(db=>{const day=db.days[date]||{plan:null,eaten:{},extra:[]};db.days[date]={...day,extra:[...(day.extra||[]),entry]};});dirty=false;D.querySelector('[data-mp="nutrition-view"][data-value="diary"]')?.click();W.toast?.('Порция добавлена в дневник');
        }
      }
    }catch(err){const out=D.getElementById('cook-error');if(out)out.textContent=err.message;else W.toast?.(err.message);}
    finally{busy=false;if(button.isConnected)button.disabled=false;}
  });
  const close=W.closeModal;if(typeof close==='function'){W.closeModal=function(){if(dirty&&D.getElementById('cook-name')&&draftOwner===owner()&&!W.confirm('В рецепте есть несохранённые изменения. Закрыть без сохранения?'))return;dirty=false;return close.apply(this,arguments);};}
  W.addEventListener('beforeunload',e=>{if(dirty&&draftOwner===owner()){e.preventDefault();e.returnValue='';}});
  W.UNVRSLRecipeEditor={open:editor};
})(window);
