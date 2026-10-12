'use strict';
(function(root){
  const E=typeof module==='object'&&module.exports?require('./meal-engine.js'):root.UNVRSLMealEngine;
  const clone=x=>JSON.parse(JSON.stringify(x));
  function snapshotIngredients(ingredients){return ingredients.map(i=>{const f=E.catalog.foods[i.id]||i.sourceNutrition,n=i.sourceNutrition||f;if(!n)throw Error('Продукт не найден');return {...clone(i),name:i.name||f.name,sourceNutrition:Object.fromEntries(['k','p','f','c'].map(k=>[k,n[k]])),sourceInfo:(()=>{const s=i.sourceInfo||f.sourceInfo||{};return clone(s.provider==='USDA SR28'?{provider:s.provider,code:s.code,release:s.release}:s);})(),allergens:Array.isArray(i.allergens||f.allergens)?clone(i.allergens||f.allergens):null,vegetarian:i.vegetarian??f.vegetarian};});}
  function create(input){
    const name=String(input.name||'').trim(),steps=String(input.steps||'').trim(),servings=Number(input.servings),time=Number(input.time);
    if(!name||name.length>120)throw Error('Название должно содержать от 1 до 120 символов');
    if(!steps||steps.length>6000)throw Error('Добавь шаги приготовления (до 6000 символов)');
    if(!Number.isFinite(servings)||servings<1||servings>50)throw Error('Укажи от 1 до 50 порций');
    if(!Number.isFinite(time)||time<0||time>1440)throw Error('Проверь время готовки');
    const meal=E.composeMeal({recipeId:null},input.ingredients,input.readyGrams),batchIngredients=snapshotIngredients(meal.ingredients);
    const id=input.id||'custom-recipe-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);
    return {id,name,steps,time,baseServings:servings,batchIngredients,ingredients:batchIngredients.map(i=>({...i,g:i.g/servings,min:i.g/servings*.5,max:i.g/servings*1.75,step:.1})),...(input.readyGrams?{batchReadyGrams:input.readyGrams,readyGrams:input.readyGrams/servings}:{}),fixedRatios:true,custom:true,slots:['breakfast','lunch','dinner','snack'],kind:'custom',nutritionMethod:'ingredient-calculation',updatedAt:Date.now()};
  }
  function totals(recipe){const total=E.nutrition(recipe.batchIngredients),portion=Object.fromEntries(['k','p','f','c'].map(k=>[k,total[k]/recipe.baseServings]));return {total,portion,per100:recipe.batchReadyGrams?Object.fromEntries(['k','p','f','c'].map(k=>[k,total[k]/recipe.batchReadyGrams*100])):null};}
  function hydrate(records=[]){const kept=E.catalog.recipes.filter(r=>!r.custom),seen=new Set(kept.map(r=>r.id));for(const r of records)if(r?.custom&&!seen.has(r.id)){try{E.nutrition(r.ingredients);kept.push(clone(r));seen.add(r.id);}catch(_){}}E.catalog.recipes.splice(0,E.catalog.recipes.length,...kept);}
  const api={create,totals,snapshotIngredients,hydrate};if(typeof module==='object'&&module.exports)module.exports=api;else root.UNVRSLRecipeBuilder=api;
})(typeof window==='object'?window:globalThis);
