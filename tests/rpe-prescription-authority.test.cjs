'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const R=require('../rpe-range-display.js');
test('effort display retains isolation, preparation and single effort targets',()=>{
 const current={programWeekRpeMin:8,programWeekRpeMax:9,ex:[
  {targetRpeMin:9,targetRpeMax:9.5,set:[{role:'test_preparation',targetRpeMin:9,targetRpeMax:9.5},{role:'test_attempt',targetRpeMin:9.5,targetRpeMax:10}]},
  {targetRpeMin:6,targetRpeMax:8,set:[{targetRpeMin:6,targetRpeMax:8}]}]};
 R.annotate(current);R.annotate(current);
 assert.deepEqual(current.ex.map(e=>e.set.map(s=>[s.targetRpeMin,s.targetRpeMax])),[[[9,9.5],[9.5,10]],[[6,8]]]);
 assert.equal(current.ex[0].set[1].targetRirMin,0);
 assert.equal(current.ex[1].set[0].targetRpeLabel,'6–8');
});
test('strength effort display leaves timed cardio parameters alone',()=>{
 const cardio={kind:'cardio',mode:'timer',target:5,set:[{workSeconds:360,rpe:'',ok:false}]},before=JSON.stringify(cardio);
 R.annotate({programWeekRpeMin:8,programWeekRpeMax:9,ex:[cardio]});
 assert.equal(JSON.stringify(cardio),before);
});
