'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const E=require('../meal-engine.js');
test('daily menus meet realistic macro targets with bounded ingredient portions',()=>{
  for(const target of [{k:1800,p:120,f:60,c:195},{k:2400,p:160,f:80,c:260},{k:3200,p:190,f:100,c:385}])for(const count of [3,4,5]){
    const plan=E.generate(target,count);assert.equal(plan.meals.length,count);
    assert.equal(plan.withinTarget,true,JSON.stringify({target,count,delta:plan.delta}));
    assert.deepEqual(plan.total,E.round(E.sum(plan.meals.map(m=>E.nutrition(m.ingredients)))));
    for(const m of plan.meals)for(const i of m.ingredients){assert.ok(i.g>=i.min&&i.g<=i.max);if(i.id==='egg')assert.equal(i.g%50,0);}
  }
});
test('exclusions and food restrictions apply to every selected ingredient',()=>{
 const prefs={vegetarian:true,allergens:['milk','egg','nuts'],exclude:'банан',maxTime:30};
 const plan=E.generate({k:2200,p:120,f:80,c:250},4,prefs);
 for(const m of plan.meals)assert.ok(E.allowed(E.catalog.recipes.find(r=>r.id===m.recipeId),prefs));
 assert.throws(()=>E.generate({k:2000,p:120,f:70,c:220},3,{maxTime:5}),/Нет блюд/);
});
test('consumed snapshots survive generation and recipe swaps',()=>{
 const target={k:2400,p:160,f:80,c:260},initial=E.generate(target,4),locked={[initial.meals[0].id]:initial.meals[0]};
 const snapshot=JSON.stringify(initial);
 const next=E.generate(target,4,{}, {locked,banned:{'meal-1':[initial.meals[1].recipeId]}});
 assert.deepEqual(next.meals[0].ingredients,initial.meals[0].ingredients);
 assert.deepEqual(next.meals[0].nutrition,initial.meals[0].nutrition);
 assert.notEqual(next.meals[1].recipeId,initial.meals[1].recipeId);
 E.generate({k:1800,p:120,f:60,c:195},4,{}, {prior:initial.meals});
 assert.equal(JSON.stringify(initial),snapshot);
});
test('existing calorie goals produce coherent macro targets and invalid inputs fail',()=>{
 const t=E.fromGoal({calories:[2300,2500],protein:[150,170],fat:[70,90]});
 assert.deepEqual(t,{k:2400,p:160,f:80,c:260,ranges:{k:[2300,2500],p:[150,170],f:[70,90],c:[202,318]}});
 for(const k of ['k','p','f','c'])assert.throws(()=>E.generate({...t,[k]:NaN},4));
 assert.throws(()=>E.generate(t,2));
});
test('world recipe dataset preserves 501 complete recipes and coherent serving scaling',()=>{
 const world=E.catalog.recipes.filter(r=>r.source);
 assert.equal(world.length,501);assert.equal(E.catalog.recipes.length,648);
 assert.equal(new Set(world.map(r=>r.id)).size,501);
 for(const r of world){
  assert.ok(r.name&&r.steps&&r.details.length&&r.baseServings>0);
  assert.ok(r.time>=0&&Object.values(r.portionNutrition).every(v=>Number.isFinite(v)&&v>=0));
  const m=E.fit(r,r.portionNutrition);assert.deepEqual(m.nutrition,E.round(r.portionNutrition));
  const doubled=m.ingredients.map(i=>({...i,g:i.g*2}));
  assert.deepEqual(E.nutrition(doubled),E.round(Object.fromEntries(Object.entries(r.portionNutrition).map(([k,v])=>[k,v*2]))));
  assert.equal(E.allowed(r,{allergens:['milk']}),false);
 }
 const r=world.find(r=>r.name==='Спагетти карбонара');
 assert.equal(E.allowed(r,{exclude:'гуанчале'}),false);assert.equal(E.allowed(r,{vegetarian:true}),false);
 const target={k:3611,p:177,f:88,c:528},plan=E.generate(target,4,{maxTime:45});
 assert.equal(plan.withinTarget,true);assert.ok(Math.abs(plan.delta.c)<20,JSON.stringify(plan.delta));
});
test('range targets accept the full interval and reject values just outside it',()=>{
 const t=E.fromGoal({calories:[2300,2500],protein:[150,170],fat:[70,90],carbs:[200,320]});
 assert.ok(E.within({k:2300,p:170,f:70,c:320},t));
 assert.ok(E.within({k:2500,p:150,f:90,c:200},t));
 assert.equal(E.within({...t,k:2501},t),false);
 assert.equal(E.within({...t,p:149.9},t),false);
 assert.equal(E.loss({k:2300,p:170,f:70,c:320},t),0);
 assert.deepEqual(E.subtractTarget(t,{k:500,p:20,f:10,c:50}).ranges,{k:[1800,2000],p:[130,150],f:[60,80],c:[150,270]});
 assert.throws(()=>E.validateTarget({...t,ranges:{...t.ranges,k:[2500,2300]}}),/диапазоны/);
 const plan=E.generate(t,4,{simpleOnly:true,maxTime:45});assert.equal(plan.withinTarget,true,JSON.stringify(plan.total));
 assert.ok(plan.meals.every(m=>!E.catalog.recipes.find(r=>r.id===m.recipeId).source));
});
test('everyday catalog offers 147 simple meals including 54 breakfasts and keeps ingredient allergens and nutrition',()=>{
 const simple=E.catalog.recipes.filter(r=>!r.source);
 assert.equal(simple.length,147);assert.equal(simple.filter(r=>r.slots.includes('breakfast')).length,54);
 for(const r of simple){assert.ok(E.nutrition(r.ingredients).k>0);assert.ok(r.steps);assert.ok(r.ingredients.every(i=>E.catalog.foods[i.id]));}
 const cheese=E.catalog.recipes.find(r=>r.id==='omelet-cheese');assert.equal(E.allowed(cheese,{allergens:['milk']}),false);
 assert.ok(simple.filter(r=>r.guideUrl).every(r=>/^https:\/\/(www\.iamcook\.ru|www\.russianfood\.com)\//.test(r.guideUrl)));
});

test('cooked weight is distinct from nutrition and exact weighed portions scale consistently',()=>{
 const r=E.catalog.recipes.find(x=>x.id==='chicken-rice'),m=E.fit(r,E.nutrition(r.ingredients));
 const n={...m.nutrition},w=E.servingWeight(m);assert.equal(w.estimated,true);assert.ok(w.grams>0);
 const exact={...m,readyGrams:600},half=E.scaleMeal(exact,.5);
 assert.deepEqual(E.servingWeight(exact),{grams:600,estimated:false});
 assert.deepEqual(E.servingWeight(half),{grams:300,estimated:false});
 assert.deepEqual(half.nutrition,E.nutrition(half.ingredients));assert.deepEqual(m.nutrition,n);
 assert.throws(()=>E.scaleMeal(m,0));assert.throws(()=>E.scaleMeal(m,NaN));
 const world=E.fit(E.catalog.recipes.find(x=>x.source),{k:600,p:30,f:20,c:80});assert.equal(E.servingWeight(world),null);
 assert.deepEqual(E.servingWeight({...world,readyGrams:420}),{grams:420,estimated:false});
 const snack=E.catalog.recipes.find(x=>x.id==='curd-apple');assert.equal(E.servingWeight(E.fit(snack,E.nutrition(snack.ingredients))).estimated,false);
});


test('random menu refresh varies unfinished dishes while respecting ranges, exclusions and recorded meals',()=>{
 const target=E.fromGoal({calories:[2300,2500],protein:[150,170],fat:[70,90],carbs:[200,320]});
 const prefs={simpleOnly:true,maxTime:45,exclude:'рыба'};
 let prior=E.generate(target,4,prefs),seed=12345;
 const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const locked={[prior.meals[0].id]:prior.meals[0]},names=new Set();
 for(let i=0;i<8;i++){
  const plan=E.generate(target,4,prefs,{randomize:true,rng,prior:prior.meals,locked});
  assert.equal(plan.withinTarget,true,JSON.stringify(plan.total));
  assert.deepEqual(plan.meals[0].ingredients,locked[plan.meals[0].id].ingredients);
  for(const m of plan.meals.slice(1)){
   assert.notEqual(m.recipeId,prior.meals.find(x=>x.id===m.id).recipeId);
   assert.ok(E.allowed(E.catalog.recipes.find(r=>r.id===m.recipeId),prefs));
  }
  names.add(plan.meals.map(m=>m.recipeId).join(','));prior=plan;
 }
 assert.equal(names.size,8);
});


test('random menus retain high-calorie protocol ranges after repeated refreshes',()=>{
 const target=E.fromGoal({calories:[3530,3691],protein:[149,205],fat:[74,102],carbs:[448,607]});
 let prior=[],seed=9;const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<20;i++){
  const plan=E.generate(target,4,{simpleOnly:true,maxTime:45},{randomize:true,rng,prior});
  assert.equal(plan.withinTarget,true,JSON.stringify(plan.total));
  for(const m of plan.meals)assert.notEqual(m.recipeId,prior.find(x=>x.id===m.id)?.recipeId);
  prior=plan.meals;
 }
});
