'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{JSDOM}=require(process.env.UNVRSL_JSDOM||'jsdom');
let persisted;
function make(seed={accountOwnerId:'test-only'}){
 const dom=new JSDOM('<div id="sheet"></div>',{runScripts:'dangerously',url:'https://fixture.test/'}),w=dom.window;
 w.st=seed;w.modal=html=>w.document.getElementById('sheet').innerHTML=html;w.closeModal=()=>w.document.getElementById('sheet').innerHTML='';w.save=()=>{persisted=JSON.stringify(w.st);return true;};w.confirm=()=>false;
 for(const file of ['meal-recipes-data.js','nutrition-foods-data.js','nutrition-labels-data.js','everyday-recipes-data.js','nutrition-state.js','meal-catalog.js','meal-engine.js','recipe-builder.js','meal-planner-ui.js','recipe-builder-ui.js'])w.eval(fs.readFileSync(path.join(__dirname,'..',file),'utf8'));
 w.openMealPlanner();return dom;
}
const click=(w,selector)=>{const el=w.document.querySelector(selector);assert.ok(el,selector);el.click();};
const fill=(w,id,value)=>{const el=w.document.getElementById(id);assert.ok(el,id);el.value=value;el.dispatchEvent(new w.Event('input',{bubbles:true}));};
const plain=x=>JSON.parse(JSON.stringify(x));
let dom=make(),w=dom.window;
click(w,'[data-mp="nutrition-view"][data-value="recipes"]');fill(w,'mp-search','бурегр');assert.ok(w.document.querySelector('[data-cook="edit"]'));const selected=w.document.querySelector('[data-cook="edit"]').dataset.id;click(w,`[data-cook="edit"][data-id="${selected}"]`);
fill(w,'cook-name','Тестовый бургер');fill(w,'cook-ready','600,5');fill(w,'cook-servings','2');
const ingredient=w.document.querySelector('[data-cook-grams]');ingredient.value='150,5';ingredient.dispatchEvent(new w.Event('input',{bubbles:true}));assert.match(w.document.getElementById('cook-totals').textContent,/На 100 г/);
click(w,'[data-cook="save"]');const recipe=plain(w.st.mealNutritionV1.customRecipes[0]);assert.equal(recipe.batchIngredients[0].g,150.5);assert.equal(recipe.batchReadyGrams,600.5);assert.equal(recipe.baseServings,2);
fill(w,'cook-unit','grams');fill(w,'cook-amount','300,25');click(w,'[data-cook="record"]');const date=w.document.getElementById('mp-date').value,entry=plain(w.st.mealNutritionV1.days[date].extra[0]);assert.equal(entry.grams,300.25);assert.equal(entry.servings,1);assert.ok(entry.ingredients.every(i=>i.sourceNutrition));
click(w,'[data-mp="nutrition-view"][data-value="recipes"]');click(w,'[data-mp="catalog-filter"][data-key="collection"][data-value="mine"]');click(w,`[data-cook="edit"][data-id="${recipe.id}"]`);fill(w,'cook-ready','800');const next=w.document.querySelector('[data-cook-grams]');next.value='250';next.dispatchEvent(new w.Event('input',{bubbles:true}));click(w,'[data-cook="save"]');assert.deepEqual(plain(w.st.mealNutritionV1.days[date].extra[0]),entry);
const before=JSON.stringify(w.st);w.save=()=>false;fill(w,'cook-name','Не должен сохраниться');click(w,'[data-cook="save"]');assert.equal(JSON.stringify(w.st),before);assert.match(w.document.getElementById('cook-error').textContent,/Не удалось сохранить/);
dom.window.close();dom=make(JSON.parse(persisted));w=dom.window;assert.deepEqual(plain(w.st.mealNutritionV1.days[date].extra[0]),entry);click(w,'[data-mp="nutrition-view"][data-value="recipes"]');click(w,'[data-mp="catalog-filter"][data-key="collection"][data-value="mine"]');assert.ok(w.document.querySelector(`[data-cook="edit"][data-id="${recipe.id}"]`));
w.st={accountOwnerId:'other-test'};w.openMealPlanner();assert.equal(w.UNVRSLMealEngine.catalog.recipes.filter(r=>r.custom).length,0);assert.equal(w.st.mealNutritionV1.customRecipes,undefined);
dom.window.close();console.log('Recipe editor: beef burger, transposed search, comma quantities, cooked yield, saved recipe, immutable diary, reload, failed-save rollback and account isolation passed');
