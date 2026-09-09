const test=require('node:test');
const assert=require('node:assert/strict');

global.loadStepFor=()=>5;
const api=require('../performance-control-v315.js');

function fixture(mode='adaptive',policy='autoweight'){
  const ex={
    n:'Кроссовер',
    programWeightMode:mode,
    set:[
      {programW:0,plannedW:60,w:60,r:12,rpe:3,ok:true,targetRepMin:12,targetRepMax:12,targetRpeMin:7,targetRpeMax:8},
      {programW:0,plannedW:60,w:60,r:12,rpe:'',ok:false,targetRepMin:12,targetRepMax:12,targetRpeMin:7,targetRpeMax:8}
    ]
  };
  return{session:{trainingWeightPolicy214:policy,target:7.5,ex:[ex]},ex};
}

test('autoweight does not show a recommendation after each set',()=>{
  const{session,ex}=fixture();
  assert.equal(api.liveAllowed(session,ex),false);
  assert.equal(api.liveNextSet(session,ex),null);
  assert.equal(api.feedbackForSet(session,ex,ex.set[0]).recommendation,null);
});

test('zero program weight never collapses 60 kg recommendation to 10 kg',()=>{
  const{session,ex}=fixture();
  const result=api.recommendAfter(session,ex,{ex,set:ex.set[0]},{ex,set:ex.set[1]});
  assert.ok(result.weight>=55&&result.weight<=65,`unexpected ${result.weight} kg`);
  assert.notEqual(result.weight,10);
});

test('prescribed eight-week plan keeps the live recommendation',()=>{
  const{session,ex}=fixture('prescribed','recommendation');
  assert.equal(api.liveAllowed(session,ex),true);
  const result=api.liveNextSet(session,ex);
  assert.ok(result);
  assert.ok(result.weight>=55&&result.weight<=65,`unexpected ${result.weight} kg`);
});

test('final report is allowed only in the workout completion sheet',()=>{
  const sheet=title=>({querySelectorAll:selector=>selector==='h2'?[{textContent:title}]:[]});
  assert.equal(api.isCompletionSheet(sheet('План тренировок')),false);
  assert.equal(api.isCompletionSheet(sheet('Тренировка завершена')),true);
  assert.equal(api.isCompletionSheet(null),false);
});
