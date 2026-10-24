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
