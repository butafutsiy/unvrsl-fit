'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const planner = require('../nutrition-planner.js');
const base = {
  sex: 'male', age: 25, height: 183, weight: 95, overweight: false,
  steps: 9000, strengthSessions: 4, cardioSessions: 0, cardioMinutes: 30,
  workType: 'sedentary', dailyActivity: 'low', trainingIntensity: 'moderate',
  activityFactor: ''
};
test('BMR formula switches only with excess weight flag', () => {
  const h=planner.calculate(base);
  assert.equal(h.bmr.value,2097);
  assert.match(h.bmr.formula,/Харрис/);
  const m=planner.calculate({...base,overweight:true});
  assert.equal(m.bmr.value,1974);
  assert.match(m.bmr.formula,/Миффлин/);
});
test('conservative activity examples and manual override', () => {
  for(const [steps,sessions,expected] of [[3000,3,1.375],[10000,3,1.55],[15000,2,1.55],[6500,3,1.375],[2800,0,1.2]]){
    assert.equal(planner.calculate({...base,steps,strengthSessions:sessions}).activity.factor,expected);
  }
  const manual=planner.calculate({...base,activityFactor:'1.2'});
  assert.equal(manual.activity.factor,1.2);
  assert.equal(manual.activity.automatic,false);
});
test('all goals follow fixed protein/fat per kg and use remaining carbohydrate kcal',()=>{
  const r=planner.calculate(base);
  assert.equal(r.tdee,3251);
  for(const [key,pro,fat] of [['cut',[1.8,2.4],[.6,.9]],['maintain',[1.5,2],[.7,1]],['gain',[1.6,2.2],[.8,1.1]]]){
    const g=r.goals[key];
    assert.deepEqual(g.protein,pro.map(v=>Math.round(v*95)));
    assert.deepEqual(g.fat,fat.map(v=>Math.round(v*95)));
    assert.ok(g.delta.every(d=>Math.abs(d)<=3),key+' macro tolerance');
    assert.ok(g.carbs[0]<=g.carbs[1],key+' carb bounds');
  }
  assert.deepEqual(r.goals.maintain.calories,[3201,3301]);
});
test('female overweight Mifflin values match defined formula',()=>{
  const data={...base,sex:'female',weight:73,height:170,age:22,overweight:true};
  const r=planner.calculate(data);
  assert.equal(r.bmr.value,1522);
});