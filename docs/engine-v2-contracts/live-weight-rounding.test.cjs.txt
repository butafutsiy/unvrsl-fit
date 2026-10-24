'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const A=require('../workout-domain');
const reg=A.registry([{id:'bench',n:'Жим лёжа',type:'compound',loadType:'external_total',weightProfile:{step:2.5}}]);
function fixture(equipmentProfile){
 const sets=Array.from({length:3},()=>[
  {w:110,programW:130,plannedW:130,r:3,rpe:8,ok:true,role:'heavy'},
  {w:80,programW:95,plannedW:95,r:9,rpe:8,ok:true,role:'light'}
 ]).flat();sets[5].ok=false;
 sets.push(...[1,2].map(()=>({w:120,programW:120,plannedW:120,r:6,role:'middle',ok:false})));
 const e={n:'Жим лёжа',method:'UNVRSL',equipmentProfile,set:sets};
 const cur={id:'now',date:'2026-10-18',programWeekRpeMin:8,programWeekRpeMax:9,ex:[e]};
 const history=[{id:'old',date:'2026-10-17',ended:Date.parse('2026-10-17'),ex:[{...e,set:sets.map(s=>({...s,w:s.role==='heavy'?150:s.role==='light'?110:130,ok:true}))}]}];
 return {e,cur,history};
}
test('live UNVRSL middle stages apply the rounded next-set weight, not 110 × 120 / 130',()=>{
 for(const [equipment,expected] of [[undefined,102.5],[{weightStep:5},100],[{weightStep:.5},101.5],[{weightStep:.25},101.5],[{weightStep:5,availableLoads:[95,102,110]},102]]){
  const {e,cur,history}=fixture(equipment);
  for(const s of e.set.slice(6)){
   const rec=A.recommend(e,s,cur,history,reg);assert.equal(rec.nextSetSuggestion.weight,expected);assert.equal(A.recommendationWeight(rec),expected);
   assert.equal(A.acceptRecommendation(s,rec),true);assert.equal(s.w,expected);assert.equal(s.plannedW,expected);
  }
 }
});
test('pending floating-point loads repair once, preserving manual, skipped and completed data',()=>{
 const raw=110*120/130;
 for(const extra of [{},{weightSource:'auto'},{weightSource:'recommendation'}]){
  const s={w:raw,plannedW:raw,programW:raw,baselineW:raw,launchW:raw,recommendedW:raw,recommendationDecision:{weight:raw},recommendationRestore:{w:raw},...extra};
  const done={w:raw,ok:true},manual={w:raw,manualOverride:true},entered={w:raw,weightSource:'manual'},skipped={w:raw,skipped:true};
  const cur={ex:[{n:'Жим лёжа',set:[s,done,manual,entered,skipped]}]};
  assert.equal(A.normalizePendingWeights(cur,reg),true);assert.equal(s.w,102.5);assert.equal(s.plannedW,102.5);assert.equal(s.recommendationDecision.weight,102.5);assert.equal(s.recommendationRestore.w,102.5);
  for(const x of [done,manual,entered,skipped])assert.equal(x.w,raw);
  assert.equal(A.normalizePendingWeights(cur,reg),false);
 }
 const authored={w:17.5},cur={ex:[{n:'Жим лёжа',set:[authored]}]};
 assert.equal(A.normalizePendingWeights(cur,reg),false);assert.equal(authored.w,17.5);
 cur.ended=1;cur.ex[0].set[0].w=raw;assert.equal(A.normalizePendingWeights(cur,reg),false);assert.equal(cur.ex[0].set[0].w,raw);
});
test('draft repair respects the set equipment snapshot, available loads and fractional step',()=>{
 const cur={ex:[{n:'Жим лёжа',equipmentProfile:{weightStep:5},set:[{w:110*120/130,equipmentSnapshot:{weightStep:.5}},{w:110*120/130,equipmentSnapshot:{weightStep:5,availableLoads:[95,102,110]}}]}]};
 assert.equal(A.normalizePendingWeights(cur,reg),true);assert.deepEqual(cur.ex[0].set.map(s=>s.w),[101.5,102]);
});
