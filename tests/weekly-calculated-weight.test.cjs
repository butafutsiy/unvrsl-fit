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


for(const [type,equipment,expected] of [
 ['external_total',{weightStep:2.5},110],
 ['machine_stack',{availableLoads:[100,110,115,120]},110],
 ['per_dumbbell',{weightStep:2},110],
 ['bodyweight_added',{weightStep:1.25},111.25],
 ['external_total',{availableLoads:[105,112.5,115]},112.5],
])

module.exports={fixture};



test('rounding generated loads never mutates the original trainer assignment',()=>{
 const {e,cur,reg}=fixture(95.1,{availableLoads:[81.5,86,90.5,95.1]});
 Object.assign(e.set[0],{assignedW:95.1,programW:95.1,w:86.00001,selectedW:86.00001,weightSource:'recommendation'});
 A.normalizePendingWeights(cur,reg);assert.equal(e.set[0].w,86);assert.equal(e.set[0].assignedW,95.1);assert.equal(e.set[0].programW,95.1);
});
