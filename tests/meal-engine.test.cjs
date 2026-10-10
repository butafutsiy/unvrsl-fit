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
 assert.deepEqual(t,{k:2400,p:160,f:80,c:260});
 for(const k of ['k','p','f','c'])assert.throws(()=>E.generate({...t,[k]:NaN},4));
 assert.throws(()=>E.generate(t,2));
});
