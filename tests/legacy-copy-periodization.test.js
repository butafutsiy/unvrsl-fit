'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const Domain=require('../workout-domain');
const Program=require('../program-model');

const names=['A1 · Квадрицепс','B · Грудь','C · Спина','A2 · Бицепс бедра + ягодицы','D · Руки'];
const move=(name,kind,w)=>({n:name,kind,method:'STANDARD',reps:{mode:'auto',min:null,max:null},
  sets:Array.from({length:4},()=>({w,r:12}))});
function oldCopy(independentCopy=true){
  return {id:'old-cycle',name:'Без SLDR и UNVRSL',independentCopy,
    weeks:Array.from({length:8},(_,i)=>({n:i+1,days:names.map((name,j)=>({
      id:'day'+j,name,ex:j===3?[
        move('Румынская тяга со штангой','base',120),
        move('Хип-траст со штангой','base',115),
        move('Сгибание ног лёжа в тренажёре','isolation',57.5),
        move('Выпады назад с гантелями','base',28),
        move('Зашагивания на платформу с гантелями','base',22),
        move('Разведение ног в тренажёре','isolation',60)
      ]:[]}))})),
    sessions:[{id:'completed',ex:[{n:'Тяга',set:[{ok:true,w:120,r:10}]}]}]};
}
test('copied W1 A2 uses the approved base/isolation volume and keeps every working weight',()=>{
  const p=oldCopy(),history=JSON.stringify(p.sessions);
  Program.normalizeProgram(p);
  const exercises=p.weeks[0].days[3].ex;
  assert.deepEqual(exercises.map(e=>e.sets.length),[4,4,3,4,4,3]);
  assert.deepEqual(exercises.map(e=>e.sets[0].w),[120,115,57.5,28,22,60]);
  assert.ok(exercises.every(e=>e.reps.mode==='auto'&&e.sets[0].r===10));
  assert.deepEqual(p.weeks[0].weeklyLoadProfile.base.reps,[10,12]);
  assert.deepEqual(p.weeks[0].weeklyLoadProfile.isolation.reps,[10,12]);
  assert.equal(JSON.stringify(p.sessions),history);
  const already=JSON.stringify(p);Program.normalizeProgram(p);assert.equal(JSON.stringify(p),already);
});
test('old five-day program without independentCopy marker migrates too',()=>{
  const p=oldCopy(false);Program.normalizeProgram(p);
  assert.equal(p.weeks[0].days[3].ex[2].sets.length,3);
});
test('manual RPE and explicit rep edits survive',()=>{
  const p=oldCopy();
  const manual=p.weeks[0].days[3].ex[2];
  manual.parameterOverrides={version:386,effort:{mode:'manual',rpeMin:7,rpeMax:8}};
  const old=JSON.stringify(manual);
  Program.normalizeProgram(p);
  assert.equal(JSON.stringify(p.weeks[0].days[3].ex[2].sets),JSON.stringify(JSON.parse(old).sets));
  assert.equal(p.weeks[0].days[3].ex[2].parameterOverrides.effort.mode,'manual');
});
test('manually authored program and active sessions are unchanged',()=>{
  const p=oldCopy(false);
  p.weeks[0].days[3].ex[0].parameterOverrides={version:386,reps:{mode:'manual',min:5,max:8}};
  const before=JSON.stringify(p.weeks[0].days[3].ex[0].sets);
  Program.normalizeProgram(p);
  assert.equal(JSON.stringify(p.weeks[0].days[3].ex[0].sets),before);
  const q=oldCopy(true);q.cycleOptions={periodizationMode:'manual'};
  const original=JSON.stringify(q.weeks);Program.normalizeProgram(q);
  assert.equal(q.weeks[0].days[3].ex[2].sets.length,4);
  assert.equal(JSON.stringify(q.weeks),original);
});
