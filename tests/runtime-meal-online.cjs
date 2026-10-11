'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require(process.env.UNVRSL_JSDOM||'jsdom');
const dom=new JSDOM('<div id="sheet"></div>',{runScripts:'dangerously',url:'https://app.test/'}),w=dom.window,D=w.document;
w.st={accountOwnerId:'alice'};w.modal=html=>D.getElementById('sheet').innerHTML=html;w.save=()=>true;
const source={code:'12345678',product_name_ru:'Гречка тестовая',quantity:'500 g',nutriments:{'energy-kcal_100g':330,proteins_100g:13,fat_100g:3,carbohydrates_100g:65}};
let requests=0,pending=null;
w.fetch=async url=>{requests++;if(pending)return pending;return {ok:true,json:async()=>url.includes('/api/')?{status:1,product:source}:{products:[source],count:1}};};
for(const file of ['meal-recipes-data.js','meal-catalog.js','meal-engine.js','meal-food-search.js','meal-planner-ui.js'])w.eval(fs.readFileSync(path.join(__dirname,'..',file),'utf8'));
const click=s=>{assert.ok(D.querySelector(s),s);D.querySelector(s).click();};
const tab=s=>click(`[data-mp="nutrition-view"][data-value="${s}"]`);
const input=(id,v)=>{const el=D.getElementById(id);el.value=v;el.dispatchEvent(new w.Event('input',{bubbles:true}));};
const settle=()=>new Promise(resolve=>setTimeout(resolve,15));
(async()=>{
 w.openMealPlanner();tab('products');input('mp-product-search','гречка тестовая');assert.equal(requests,0);click('[data-mp="online-search"]');await settle();assert.ok(D.querySelector('[data-mp="online-pick"]'));assert.match(D.getElementById('mp-online-results').textContent,/ODbL/);
 click('[data-mp="online-pick"]');await settle();assert.equal(D.getElementById('mp-food-name').value,'Гречка тестовая');input('mp-food-grams',150);assert.match(D.getElementById('mp-food-preview').textContent,/495 ккал/);click('[data-mp="extra"]');
 const date=D.getElementById('mp-date').value,entry=w.st.mealNutritionV1.days[date].extra[0];assert.equal(entry.nutrition.k,495);assert.equal(entry.sourceInfo.code,'12345678');assert.equal(w.st.mealNutritionV1.savedFoods.length,1);
 tab('products');click('[data-mp="saved-food"]');assert.match(D.getElementById('mp-food-source').textContent,/Open Food Facts/);input('mp-food-grams',200);tab('recipes');tab('products');assert.equal(D.getElementById('mp-food-grams').value,'200');assert.match(D.getElementById('mp-food-source').textContent,/ODbL/);
 // An online food can become a weighed ingredient, carrying its source into the saved meal.
 tab('diary');for(const [k,v] of Object.entries({k:2400,p:160,f:80,c:260}))input('mp-'+k,v);click('[data-mp="generate"]');const meal=w.st.mealNutritionV1.days[date].plan.meals[0];click(`[data-mp="ingredient-search"][data-id="${meal.id}"]`);input('mp-product-search','гречка тестовая');click('[data-mp="online-search"]');await settle();click('[data-mp="online-pick"]');await settle();
 const grams=D.querySelector('[data-mp-ingredient="off-12345678"]');assert.ok(grams);grams.value=80;grams.dispatchEvent(new w.Event('input',{bubbles:true}));click(`[data-mp="composition-save"][data-id="${meal.id}"]`);assert.equal(w.st.mealNutritionV1.days[date].plan.meals[0].ingredients.find(i=>i.id==='off-12345678').sourceInfo.code,'12345678');
 // Millilitres are explicit and preserved; incomplete data stays blank and cannot record.
 tab('products');click('[data-mp="saved-food"]');D.getElementById('mp-food-unit').value='ml';D.getElementById('mp-food-unit').dispatchEvent(new w.Event('change',{bubbles:true}));input('mp-food-grams',250);click('[data-mp="extra"]');assert.equal(w.st.mealNutritionV1.days[date].extra.at(-1).unit,'ml');assert.match(D.querySelectorAll('.mp-extra')[1].textContent,/250 мл/);
 tab('products');input('mp-product-search','incomplete');source.code='87654321';delete source.nutriments.proteins_100g;click('[data-mp="online-search"]');await settle();click('[data-mp="online-pick"]');await settle();assert.equal(D.getElementById('mp-food-p').value,'');const before=w.st.mealNutritionV1.days[date].extra.length;click('[data-mp="extra"]');assert.equal(w.st.mealNutritionV1.days[date].extra.length,before);assert.match(D.getElementById('mp-error').textContent,/КБЖУ/);
 // Stale results must not reach a different account or a reopened sheet.
 tab('products');input('mp-product-search','brand-new query');let resolve;pending=new Promise(r=>resolve=r);click('[data-mp="online-search"]');w.st={accountOwnerId:'bob'};w.openMealPlanner();tab('products');resolve({ok:true,json:async()=>({products:[source],count:1})});await settle();assert.equal(D.querySelectorAll('[data-mp="online-pick"]').length,0);assert.equal(w.st.mealNutritionV1.savedFoods,undefined);
 pending=null;Object.defineProperty(w.navigator,'onLine',{value:false,configurable:true});input('mp-product-search','гречка');click('[data-mp="online-search"]');assert.match(D.getElementById('mp-online-results').textContent,/Нет интернета/);
 dom.window.close();console.log('Online search, grams, offline snapshots, ingredient composition, source attribution and account isolation passed');
})().catch(e=>{console.error(e);process.exitCode=1;dom.window.close();});
