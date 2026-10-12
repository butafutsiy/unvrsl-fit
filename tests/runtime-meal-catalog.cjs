'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require(process.env.UNVRSL_JSDOM||'jsdom');
let stored;
function make(seed={accountOwnerId:'alice'}){
 const dom=new JSDOM('<div id="sheet"></div>',{runScripts:'dangerously',url:'https://app.test/'}),w=dom.window;
 w.st=seed;w.modal=html=>w.document.getElementById('sheet').innerHTML=html;w.closeModal=()=>w.document.getElementById('sheet').innerHTML='';w.save=()=>{stored=JSON.stringify(w.st);return true;};
 for(const file of ['meal-recipes-data.js','nutrition-foods-data.js','nutrition-labels-data.js','everyday-recipes-data.js','nutrition-state.js','meal-catalog.js','meal-engine.js','recipe-builder.js','meal-planner-ui.js','recipe-builder-ui.js'])w.eval(fs.readFileSync(path.join(__dirname,'..',file),'utf8'));
 w.openMealPlanner();assert.equal(w.document.querySelectorAll('.mp-library').length,0);assert.equal(w.document.querySelectorAll('#mp-own').length,0);w.document.querySelector('[data-mp="nutrition-view"][data-value="recipes"]').click();return dom;
}
const click=(w,selector)=>{const el=w.document.querySelector(selector);assert.ok(el,selector);el.click();};
const filter=(w,key,value)=>click(w,`[data-mp="catalog-filter"][data-key="${key}"]${value===undefined?'':`[data-value="${value}"]`}`);
const recipes=w=>[...w.document.querySelectorAll('[data-mp="catalog-record"]')].map(b=>w.UNVRSLMealEngine.catalog.recipes.find(r=>r.id===b.dataset.id));
(async()=>{
 let dom=make(),w=dom.window,E=w.UNVRSLMealEngine;
 click(w,'[data-mp="nutrition-view"][data-value="recipes"]');assert.ok(w.document.querySelector('.mp-catalog-page'));assert.ok(w.document.querySelector('.mp-datebar'));assert.equal(w.document.querySelector('.mp-catalog-options').open,false);assert.ok(w.document.getElementById('mp-search').compareDocumentPosition(w.document.querySelector('.mp-catalog-options'))&w.Node.DOCUMENT_POSITION_FOLLOWING);assert.equal(recipes(w).length,24);assert.equal(w.document.querySelectorAll('#mp-catalog-filters img').length,0);
 assert.deepEqual([...w.document.querySelectorAll('.mp-meal-categories button')].map(b=>b.textContent),['Завтрак','Обед','Ужин','Перекус']);
 for(const type of ['breakfast','lunch','dinner','snack']){
  click(w,`[data-mp="meal-category"][data-value="${type}"]`);
  assert.ok(recipes(w).length);assert.ok(recipes(w).every(r=>r.slots.includes(type)));
  assert.equal(w.document.querySelector(`[data-mp="meal-category"][data-value="${type}"]`).getAttribute('aria-pressed'),'true');
 }
 click(w,'[data-mp="nutrition-view"][data-value="products"]');
 click(w,'[data-mp="meal-category"][data-value="breakfast"]');assert.ok(w.document.querySelector('.mp-catalog-page'));assert.ok(recipes(w).every(r=>r.slots.includes('breakfast')));
 click(w,'[data-mp="catalog-reset"]');
 filter(w,'collection','egg');assert.ok(recipes(w).length);assert.ok(recipes(w).every(r=>E.recipeInfo(r).collections.includes('egg')));
 filter(w,'type','breakfast');filter(w,'diet','vegetarian');assert.ok(recipes(w).every(r=>r.slots.includes('breakfast')&&E.recipeInfo(r).vegetarian));
 click(w,'[data-mp="catalog-reset"]');filter(w,'calories','400');assert.ok(recipes(w).length);assert.ok(recipes(w).every(r=>E.recipeInfo(r).nutrition.k>=400&&E.recipeInfo(r).nutrition.k<500));
 click(w,'[data-mp="catalog-reset"]');const country=w.document.getElementById('mp-country');country.value='Япония';country.dispatchEvent(new w.Event('change',{bubbles:true}));assert.ok(recipes(w).length);assert.ok(recipes(w).every(r=>r.country==='Япония'));
 const id=recipes(w)[0].id;click(w,`[data-mp="favorite"][data-id="${id}"]`);assert.ok(w.st.mealNutritionV1.favorites.includes(id));
 click(w,'[data-mp="catalog-reset"]');filter(w,'favorite');assert.equal(recipes(w).length,1);assert.equal(recipes(w)[0].id,id);
 w.document.getElementById('mp-catalog-portion-'+id).value=.5;w.document.getElementById('mp-catalog-portion-'+id).dispatchEvent(new w.Event('input',{bubbles:true}));assert.ok(w.document.getElementById('mp-catalog-preview-'+id).textContent.includes((E.recipeInfo(recipes(w)[0]).nutrition.k*.5).toLocaleString('ru-RU',{maximumFractionDigits:1})));click(w,`[data-mp="catalog-record"][data-id="${id}"]`);
 const date=Object.keys(w.st.mealNutritionV1.days)[0],entry=w.st.mealNutritionV1.days[date].extra[0];assert.equal(entry.servings,.5);assert.equal(entry.recipeId,id);assert.equal(entry.nutrition.k,E.round({k:E.recipeInfo(E.catalog.recipes.find(r=>r.id===id)).nutrition.k*.5}).k);assert.equal(w.document.querySelector('.mp-catalog-page'),null);assert.equal(w.document.getElementById('mp-date').value,date);assert.match(w.document.querySelector('.mp-extra').textContent,/0,5 порц/);assert.ok(!w.document.querySelector('.mp-extra').textContent.includes('0 г'));
 dom.window.close();dom=make(JSON.parse(stored));w=dom.window;filter(w,'favorite');assert.equal(recipes(w).length,1);assert.equal(w.st.mealNutritionV1.days[date].extra.length,1);
 click(w,'[data-mp="nutrition-view"][data-value="recipes"]');assert.ok(w.document.querySelector('.mp-catalog-page'));click(w,'[data-mp="nutrition-view"][data-value="diary"]');assert.ok(w.document.querySelector('.mp-datebar'));assert.ok(w.document.querySelector('.mp-extra'));
 assert.equal(w.document.querySelector('.mp-library'),null);click(w,'[data-mp="nutrition-view"][data-value="recipes"]');
 const before=JSON.stringify(w.st.mealNutritionV1);w.save=()=>false;click(w,`[data-mp="favorite"][data-id="${id}"]`);assert.equal(JSON.stringify(w.st.mealNutritionV1),before);assert.match(w.document.getElementById('mp-error').textContent,/Не удалось сохранить/);
 dom.window.close();console.log('Recipe discovery: combined filters, cuisines, calorie ranges, favorites, direct portion recording and reload passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
