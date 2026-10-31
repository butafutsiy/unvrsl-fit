'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const Domain=require('../workout-domain');
const Program=require('../program-model');

const rope='Разгибание рук на верхнем блоке с канатом';
const pushdown=(count,w=42.5)=>({
  n:rope,kind:'isolation',method:'STANDARD',cycleManaged:true,
  reps:{mode:'auto',min:null,max:null},weeklySets:3,
  sets:Array.from({length:count},()=>({w,r:10,targetRepMin:10,targetRepMax:12,
    targetRpeMin:8,targetRpeMax:9,equipmentProfileId:'techno-gym'}))
});
const curl=()=>({
  n:'Сгибание рук со штангой',kind:'isolation',method:'STANDARD',
  reps:{mode:'auto',min:null,max:null},
  sets:Array.from({length:3},()=>({w:47.5,r:10}))
});
function program(){
  const p={
    id:'self',independentCopy:true,legacyCopyLoadRevision:550,
    cycleOptions:{periodizationMode:'auto'},
    weeks:Array.from({length:8},(_,i)=>{
      const profile=Domain.weekProfiles[i+1];
      return {n:i+1,intensityMin:profile.pct[0],intensityMax:profile.pct[1],
        sessionVolumeRevision:548,days:[{
          id:'D',name:'D · Руки + армейский жим',
          ex:[pushdown(i===7?3:1),curl()]
        }]}
    }),
    sessions:[{id:'finished',ex:[{n:rope,set:[{w:30,r:8,ok:true}]}]}]
  };
  return p;
}
test('repairs only rope pushdown, keeping 42.5 kg, equipment and unrelated exercises',()=>{
  const p=program(),other=JSON.stringify(p.weeks.map(w=>w.days[0].ex[1].sets));
  const history=JSON.stringify(p.sessions);
  Program.normalizeProgram(p);
  const first=p.weeks[0].days[0].ex[0];
  assert.equal(first.sets.length,3);
  assert.deepEqual(first.sets.map(s=>s.w),[42.5,42.5,42.5]);
  assert.ok(first.sets.every(s=>s.targetRepMin===10&&s.targetRepMax===12&&
    s.targetRpeMin===8&&s.targetRpeMax===9&&s.equipmentProfileId==='techno-gym'));
  assert.equal(p.weeks[2].days[0].ex[0].sets.length,4);
  assert.equal(p.weeks[7].days[0].ex[0].sets.length,3);
  assert.equal(JSON.stringify(p.weeks.map(w=>w.days[0].ex[1].sets)),other);
  assert.equal(JSON.stringify(p.sessions),history);
  const after=JSON.stringify(p);Program.normalizeProgram(p);
  assert.equal(JSON.stringify(p),after,'migration must not run again');
});
test('does not rewrite manually controlled triceps or client-assigned programs',()=>{
  for(const type of ['manual','client','edited']){
    const p=program(),e=p.weeks[0].days[0].ex[0];
    if(type==='manual')p.cycleOptions.periodizationMode='manual';
    if(type==='client')p.cloudPlanId='assigned';
    if(type==='edited')e.setCountManual=true;
    Program.normalizeProgram(p);
    assert.equal(p.weeks[0].days[0].ex[0].sets.length,1,type);
  }
});
test('does not rewrite unrelated triceps extension variants',()=>{
  const p=program(),d=p.weeks[0].days[0];
  d.ex.push({...pushdown(1),n:'Разгибание одной гантели из-за головы'});
  Program.normalizeProgram(p);
  assert.equal(d.ex[0].sets.length,3);
  assert.equal(d.ex[2].sets.length,1);
});
