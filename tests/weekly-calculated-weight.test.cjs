'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const A=require('../workout-domain');
function fixture(planned=110,equipment={},type='external_total'){
 const reg=A.registry([{id:'bench',n:'Жим штанги лёжа',type:'compound',loadType:type}]);
 const target=()=>({w:planned,plannedW:planned,programW:planned,targetRepMin:8,targetRepMax:10,targetRpeMin:7,targetRpeMax:8});
 const e={exerciseId:'bench',n:'Жим штанги лёжа',equipmentProfile:equipment,set:Array.from({length:4},target)};
 const old={...e,set:Array.from({length:5},(_,i)=>({w:135,r:3,rpe:9,ok:i<3}))};
 const history=[{id:'past',date:'2026-10-02',ended:1,ex:[old]}];
 const cur={id:'now',date:'2026-10-08',programWeekIntensityMin:70,programWeekIntensityMax:75,ex:[e]};
 return {reg,e,history,cur,rec:A.recommend(e,e.set[0],cur,history,reg)};
}
test('135 x 3 remains history; 70–75% of 153 selects 110, preserving strength, range, reps and effort',()=>{
 const {e,rec}=fixture();
 assert.equal(rec.strength.estimate,153);
 assert.equal(rec.weeklyIntensity.estimatedMin,107.1);assert.equal(rec.weeklyIntensity.estimatedMax,114.8);
 assert.ok(Math.abs(rec.allowedWeightRange.min-107.1)<1e-8);
 assert.ok(Math.abs(rec.allowedWeightRange.max-114.75)<1e-8);
 assert.equal(rec.calculatedWeight,110);assert.equal(rec.weight,110);
 assert.equal(A.recommendationWeight(rec),110);assert.equal(rec.previous,135);
 assert.equal(rec.basis.sets[0].weight,135);assert.equal(rec.basis.sets[0].reps,3);
 assert.deepEqual(rec.repRange,{lo:8,hi:10});assert.deepEqual(rec.targetEffort,{lo:7,hi:8});
 assert.equal(rec.conflict,null);assert.equal(rec.planPreserved,false);assert.equal(e.set[0].w,110);
});
test('different manual plan stays unchanged until accept; calculated value survives save and reload',()=>{
 const {e,cur,rec}=fixture(120);const set=e.set[0];set.manualOverride=true;set.weightSource='manual';
 assert.equal(rec.calculatedWeight,110);assert.equal(set.w,120);assert.equal(A.applyAuto(set,rec),false);
 // A stale history/cache field must never override the canonical calculated value.
 assert.equal(A.acceptRecommendation(set,{...rec,weight:135,nextSetSuggestion:{weight:135}}),true);
 const restored=JSON.parse(JSON.stringify(cur)).ex[0].set[0];
 assert.equal(restored.w,110);assert.equal(restored.plannedW,110);assert.equal(restored.recommendationDecision.weight,110);
 assert.equal(restored.programW,120); // Keep the original template until explicitly edited.
 A.dismissRecommendation(restored,rec);assert.equal(restored.w,120);assert.equal(restored.manualOverride,true);
});
for(const [type,equipment,expected] of [
 ['external_total',{weightStep:2.5},110],
 ['machine_stack',{availableLoads:[100,110,115,120]},110],
 ['per_dumbbell',{weightStep:2},110],
 ['bodyweight_added',{weightStep:1.25},111.25],
 ['external_total',{availableLoads:[105,112.5,115]},112.5],
])test(`weekly weight uses ${type} equipment ${JSON.stringify(equipment)}`,()=>{
 const {rec}=fixture(110,equipment,type);assert.equal(rec.calculatedWeight,expected);
 assert.ok(rec.weight>=rec.allowedWeightRange.min&&rec.weight<=rec.allowedWeightRange.max);
});
test('no available weight inside corridor blocks applying an impossible recommendation',()=>{
 const {rec,e}=fixture(110,{availableLoads:[100,120]});
 assert.equal(rec.calculatedWeight,null);assert.equal(rec.canApply,false);
 assert.equal(A.acceptRecommendation(e.set[0],rec),false);assert.equal(e.set[0].w,110);
});
module.exports={fixture};
