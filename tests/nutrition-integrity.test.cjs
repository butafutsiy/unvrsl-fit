'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const E=require('../meal-engine.js'),B=require('../recipe-builder.js'),S=require('../nutrition-state.js');
const f=require('../nutrition-foods-data.js');
test('uncooked dried fruit stays dry and undiluted concentrates are identified',()=>{
 for(const food of Object.values(f)){
  const source=food.sourceInfo.originalName.toLowerCase();
  if(/uncooked/.test(source)&&/dried|dehydrated/.test(source)){
   assert.equal(food.state,'dry');assert.doesNotMatch(food.name,/приготовлен|варён/);
  }
  if(/concentrate/.test(source)&&/undiluted/.test(source)){
   assert.match(food.name,/концентрат/);assert.match(food.name,/неразбавленный/);
  }
 }
 assert.equal(f['sr28-09274'].k,179);
});
test('reference import provides over 500 complete traceable distinct source foods',()=>{
 assert.ok(Object.keys(f).length>=500);assert.equal(new Set(Object.values(f).map(x=>x.name)).size,Object.keys(f).length);
 for(const [id,x] of Object.entries(f)){assert.equal(id,'sr28-'+x.sourceInfo.code);assert.equal(x.basisGrams,100);assert.equal(x.unit,'g');assert.ok(x.state);for(const k of ['k','p','f','c'])assert.ok(Number.isFinite(x[k])&&x[k]>=0);assert.ok(x.p+x.f+x.c<=100.5);}
 assert.match(f['sr28-05027'].sourceInfo.originalName,/liver/);assert.match(f['sr28-05710'].sourceInfo.originalName,/Turkey/);assert.match(f['sr28-11305'].name,/варёный/);assert.doesNotMatch(f['sr28-11305'].name,/масл/);
});
test('ready catalog contains 300 unique ingredient-calculated meals with coverage',()=>{
 const list=E.catalog.recipes.filter(r=>!r.source&&r.ingredients.every(i=>['reference','label'].includes(E.catalog.foods[i.id]?.nutritionQuality)));
 assert.ok(list.length>=300);assert.equal(new Set(list.map(r=>r.id)).size,list.length);
 const composition=r=>r.ingredients.filter(i=>!['salt','water'].includes(i.id)).map(i=>[(E.catalog.foods[i.id].aliasOf||i.id),i.g]).sort().map(x=>x.join(':')).join('|');assert.equal(new Set(list.map(composition)).size,list.length);
 const has=(r,category)=>r.ingredients.some(i=>E.catalog.foods[i.id].category===category);
 assert.ok(list.filter(r=>has(r,'beef')).length>=30);assert.ok(list.filter(r=>has(r,'pork')||r.ingredients.some(i=>i.id==='pork')).length>=20);assert.ok(list.filter(r=>has(r,'poultry')).length>=35);assert.ok(list.filter(r=>has(r,'fish')).length>=20);assert.ok(list.filter(r=>r.slots.includes('breakfast')).length>=30);assert.ok(list.filter(r=>r.kind==='soup').length>=25);assert.ok(list.filter(r=>r.kind==='salad').length>=20);assert.ok(list.filter(r=>r.kind==='sandwich').length>=20);
 for(const r of list){assert.ok(r.steps);assert.ok(r.baseServings>0);assert.ok(E.nutrition(r.ingredients).k>0);assert.ok(E.servingWeight(E.fit(r,E.nutrition(r.ingredients)))?.grams>0);}
});
test('cooked yield does not create calories and recorded snapshots are independent of recipe edits',()=>{
 const ingredients=[{id:'sr28-23562',g:200},{id:'sr28-20444',g:80},{id:'water',g:300}];
 const recipe=B.create({name:'Тестовая партия',steps:'Приготовить и взвесить.',servings:2,time:30,ingredients,readyGrams:600});const first=B.totals(recipe);const dry=B.create({...recipe,ingredients,readyGrams:400,servings:2});assert.deepEqual(B.totals(dry).total,first.total);assert.equal(B.totals(dry).per100.k,first.total.k/4);
 assert.equal(B.totals(B.create({name:'Без выхода',steps:'Приготовить.',servings:2,time:20,ingredients})).per100,null);
 const logged=B.snapshotIngredients(recipe.ingredients);const before=E.nutrition(logged);recipe.ingredients[0].g*=2;assert.deepEqual(E.nutrition(logged),before);const source=E.catalog.foods['sr28-23562'],old=source.k;source.k=old+50;try{assert.deepEqual(E.nutrition(logged),before);}finally{source.k=old;}
 assert.throws(()=>B.create({name:'Неполный',steps:'Готовить.',servings:1,time:30,ingredients:[{id:'missing',g:20}]}));
});
test('search covers beef forms, synonyms, transposed typo and mandatory exclusions',()=>{
 const primary=E.catalog.recipes.filter(r=>!r.source);for(const q of ['говядина','говяжий','фарш','котлеты','бургер','свинина','гречка','омлет','сырники','суп','гавядина','бурегр'])assert.ok(E.searchItems(primary,q,E.recipeSearchText).length,q);
 const beef=primary.find(r=>r.id==='daily-classic-burger');assert.equal(E.allowed(beef,{exclude:'говяжий фарш'}),false);assert.equal(E.allowed(beef,{exclude:'говядина'}),false);assert.equal(E.allowed(beef,{exclude:'мясо'}),false);
 assert.equal(E.allowed(primary.find(r=>r.id==='daily-fish-burger'),{exclude:'рыба'}),false);assert.equal(E.allowed(beef,{allergens:['gluten']}),false);
});
test('nutrition merge retains independent device entries and deletions defeat stale snapshots',()=>{
 const a={days:{'2026-10-12':{eaten:{},extra:[]}}},b=JSON.parse(JSON.stringify(a));
 const before=JSON.parse(JSON.stringify(a));a.days['2026-10-12'].extra.push({id:'a',nutrition:{k:100}});S.track(before,a,100);
 const other=JSON.parse(JSON.stringify(b));b.days['2026-10-12'].extra.push({id:'b',nutrition:{k:200}});S.track(other,b,200);
 const merged=S.merge(a,b,true);assert.deepEqual(merged.days['2026-10-12'].extra.map(x=>x.id).sort(),['a','b']);
 const stale=JSON.parse(JSON.stringify(merged)),prior=JSON.parse(JSON.stringify(merged));merged.days['2026-10-12'].extra=merged.days['2026-10-12'].extra.filter(x=>x.id!=='a');S.track(prior,merged,300);assert.deepEqual(S.merge(merged,stale).days['2026-10-12'].extra.map(x=>x.id),['b']);assert.deepEqual(S.merge(S.merge(merged,stale),stale).days['2026-10-12'].extra.map(x=>x.id),['b']);
});
test('custom recipe deletion, edited quantities and saved products merge by stable IDs',()=>{
 const before={customRecipes:[{id:'r',updatedAt:10}],savedFoods:[{id:'f',updatedAt:10}],days:{}},a=JSON.parse(JSON.stringify(before));a.customRecipes=[];a.savedFoods=[];S.track(before,a,20);const out=S.merge(a,before);assert.equal(out.customRecipes.length,0);assert.equal(out.savedFoods.length,0);
 const newer={customRecipes:[{id:'r',updatedAt:30,name:'Вернули'}],days:{}};assert.equal(S.merge(out,newer).customRecipes[0].name,'Вернули');
});
test('a later diary addition cannot undo edited settings and favorite removals survive stale devices',()=>{
 const before={target:{k:2000},preferences:{exclude:''},favorites:['r'],days:{}},a=JSON.parse(JSON.stringify(before));a.target.k=2400;a.favorites=[];S.track(before,a,100);
 const b=JSON.parse(JSON.stringify(before));b.days['2026-10-12']={eaten:{},extra:[{id:'food'}]};S.track(before,b,200);const result=S.merge(a,b,true);assert.equal(result.target.k,2400);assert.deepEqual(result.favorites,[]);assert.equal(result.days['2026-10-12'].extra[0].id,'food');
});
test('legacy meal totals remain stable after reference corrections and new meals freeze their ingredient values',()=>{
 const old={recipeId:'pork-rice',ingredients:[{id:'pork',g:100}],nutrition:{k:128,p:20.65,f:3.53,c:0}};const half=E.scaleMeal(old,.5);assert.equal(half.nutrition.k,64);assert.equal(half.legacySnapshot,true);
 const recipe=E.catalog.recipes.find(r=>r.id==='pork-rice'),meal=E.fit(recipe,E.nutrition(recipe.ingredients)),value=meal.nutrition.k,f=E.catalog.foods.pork,initial=f.k;f.k+=40;try{assert.equal(E.scaleMeal(meal,1).nutrition.k,value);}finally{f.k=initial;}
});
