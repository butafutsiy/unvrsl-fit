'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const domain=require('../workout-domain.js');
const registry=domain.registry([
  {id:'rdl',n:'Румынская тяга со штангой',aliases:['Румынская тяга'],type:'compound',loadType:'external_total'},
  {id:'squat',n:'Присед HB',type:'compound',loadType:'external_total'},
  {id:'extension',n:'Разгибание ног',type:'isolation',loadType:'machine_stack'}
]);
const prior={id:'old',date:'2026-09-20',ended:Date.parse('2026-09-20'),ex:[
  {n:'Румынская тяга',set:[{w:130,r:6,rpe:8,ok:true}]},
  {n:'Присед HB',set:[{w:170,r:5,rpe:9,ok:true}]},
  {n:'Разгибание ног',set:[{w:70,r:15,rpe:8,ok:true}]}
]};
function current(name,sets){return{id:'new',w:8,c:'A2',date:'2026-09-27',started:Date.parse('2026-09-27'),programWeekIntensityMin:90,programWeekIntensityMax:100,programWeekRpeMin:9,programWeekRpeMax:10,ex:[{n:name,set:sets}]}}
function rec(session,index=0){return domain.recommend(session.ex[index],session.ex[index].set[0],session,[prior],registry,{})}

test('W5 Romanian prescription and W8 isolation are reflected in the source',()=>{
  const readWeek=w=>{const src=fs.readFileSync(path.join(root,`plan-w${w}.js`),'utf8'),start=src.indexOf('.concat(')+8,end=src.indexOf(']);',start);return JSON.parse(src.slice(start,end+1))};
  const w5=readWeek(5).find(x=>x.w===5&&x.c==='A2');
  assert.match(w5.e.find(x=>x.n==='Румынская тяга').d,/4–6 повторений/);
  const w8=readWeek(8);
  assert.ok(w8.find(x=>x.c==='A2').e.some(x=>x.n==='Румынская тяга — тест 2–3ПМ'));
  assert.ok(w8.find(x=>x.c==='A2').e.some(x=>x.n==='Румынская тяга — тест 1ПМ'));
  assert.match(w8.find(x=>x.c==='B').e.find(x=>x.n==='Разводка / бабочка').d,/8–12 повторений/);
  assert.ok(!w8.find(x=>x.c==='D').e.some(x=>/Подъём штанги на бицепс — тест/.test(x.n)));
});

test('W8 test suggestions use exercise history, the completed attempt, and equipment step',()=>{
  const first=current('Румынская тяга — тест 2–3ПМ',[{w:0,r:3,ok:false}]);
  const a=rec(first);
  assert.equal(a.testWeekSuggestion,true);
  assert.ok(a.weight>0);
  assert.equal(a.weight%2.5,0);
  const completed={n:'Румынская тяга — тест 2–3ПМ',set:[{w:a.weight,r:3,rpe:9,ok:true}]};
  const second={n:'Румынская тяга — тест 1ПМ',set:[{w:0,r:1,ok:false}]};
  const s=current('',[]);s.ex=[completed,second];
  const b=domain.recommend(second,second.set[0],s,[prior],registry,{});
  assert.equal(b.testWeekSuggestion,true);
  assert.ok(b.weight>=a.weight);
  assert.ok(b.weight<=a.weight+5);
  completed.set[0].rpe=9.5;
  const hard=domain.recommend(second,second.set[0],s,[prior],registry,{});
  assert.ok(hard.weight<=a.weight);
});

test('W8 back-off uses completed test weight and isolation ignores the test percentage',()=>{
  const first={n:'Присед HB — тест попытка 1',set:[{w:180,r:1,rpe:9,ok:true}]};
  const back={n:'Присед HB — back-off 70%',set:[{w:0,r:5,ok:false}]};
  const s=current('',[]);s.c='A1';s.ex=[first,back];
  const suggestion=domain.recommend(back,back.set[0],s,[prior],registry,{});
  assert.equal(suggestion.testWeekSuggestion,true);
  assert.equal(suggestion.weight,125);
  const iso=current('Разгибание ног',[{w:70,r:12,targetRepMin:8,targetRepMax:12,ok:false}]);
  const r=rec(iso);
  assert.equal(r.weeklyIntensity,null);
  assert.equal(r.testWeekSuggestion,false);
});
