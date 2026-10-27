'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const D=require('../workout-domain.js'),{repair}=require('../scripts/repair-cycle-methods.cjs');
test('SLDR/FST-7 recipes survive every percentage phase without an exception flag',()=>{
 for(const method of ['SLDR','FST-7']){
  const sets=Array.from({length:method==='SLDR'?9:7},(_,i)=>({w:30,r:method==='SLDR'?[12,10,8][i%3]:15,rest:15}));
  const e={id:'e',n:'Test',method,kind:'base',sets,dayIndices:[0]};
  const ordinary=D.allocateWeek(D.weekProfiles[4],[{ex:[]}],[e])[0].ex[0];assert.equal(ordinary.method,method);assert.deepEqual(ordinary.sets,sets);
  const authored=D.allocateWeek(D.weekProfiles[4],[{ex:[]}],[{...e,preserveMethodOnDeload:true}])[0].ex[0];
  assert.equal(authored.method,method);assert.deepEqual(authored.sets,sets);assert.equal(authored.cycleManaged,false);
 }
});
test('repair restores hidden recipes; ordinary auto copy cannot regenerate special methods',()=>{
 const profile=D.cycleProfiles(8)[3],ex={id:'same',n:'Squat',kind:'base',method:'STANDARD',cycleOriginalMethod:'SLDR',sets:[{w:45,r:10},{w:50,r:10},{w:55,r:10}],cycleOriginalSets:Array.from({length:9},(_,i)=>({w:30,r:[12,10,8][i%3],rest:i%3===2?75:15}))};
 const p={id:'p',weeks:[{weeklyLoadProfile:profile,days:[{id:'d',ex:[ex]}]}],cycleWeekSources:[[ex]],cycleSources:[ex]};
 const fixed=repair(p),e=fixed.weeks[0].days[0].ex[0];assert.equal(e.id,'same');assert.equal(e.method,'SLDR');assert.deepEqual(e.sets.map(s=>s.w),[45,45,45,50,50,50,55,55,55]);
 assert.equal(fixed.cycleWeekSources[0][0].method,'SLDR');assert.equal(p.weeks[0].days[0].ex[0].method,'STANDARD');
 const auto=repair(fixed,{autoWeight:true});assert.ok(auto.weeks[0].days[0].ex[0].sets.every(s=>s.w===''));
 const normal=repair(fixed,{specialSets:false,autoWeight:true});
 for(const item of [normal.weeks[0].days[0].ex[0],normal.cycleSources[0],normal.cycleWeekSources[0][0]]){assert.equal(item.method,'STANDARD');assert.equal(item.cycleOriginalMethod,'STANDARD');assert.equal(item.sets.length,4);assert.equal(item.parameterOverrides.weight.mode,'auto');}
 const regenerated=D.allocateWeek(profile,[{ex:[]}],normal.cycleWeekSources[0])[0].ex[0];assert.equal(regenerated.method,'STANDARD');
});
