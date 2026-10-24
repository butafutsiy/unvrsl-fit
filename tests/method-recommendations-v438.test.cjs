'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const A=require('../workout-domain');
const reg=A.registry([{id:'bench',n:'Жим штанги лёжа',aliases:['Жим лёжа'],type:'compound',loadType:'external_total'}]);
const work=(w,r,rpe,extra={})=>({w,r,rpe,ok:true,...extra});
const waiting=(w,r,extra={})=>({w,programW:w,r,plannedReps:r,ok:false,...extra});
const bench=(sets,extra={})=>({n:'Жим лёжа',set:sets,...extra});
const past=(id,date,ex)=>({id,date,started:Date.parse(date+'T04:00:00Z'),ended:Date.parse(date+'T05:00:00Z'),ex});
const old=past('aug','2026-08-29',[bench([work(120,7,8)])]);
const fresh=past('sep','2026-09-26',[bench([work(135,3,8,{role:'unvrsl-heavy'}),work(100,9,8,{role:'unvrsl-light'}),work(135,3,9,{role:'unvrsl-heavy'})],{method:'UNVRSL'})]);
const now=(ex,extra={})=>({id:'today',date:'2026-09-27',started:Date.parse('2026-09-27T04:00:00Z'),ex,programWeekRpeMin:8,programWeekRpeMax:9,...extra});
const rec=(s,ei=0,si=0,h=[old,fresh])=>A.recommend(s.ex[ei],s.ex[ei].set[si],s,h,reg);
const unvrsl=()=>bench([
  ...Array.from({length:3},(_,i)=>[waiting(130,3,{role:'unvrsl-heavy',round:i+1}),waiting(115,9,{role:'unvrsl-light',round:i+1})]).flat(),
  waiting(120,6,{role:'unvrsl-middle'}),waiting(120,6,{role:'unvrsl-middle'})
],{method:'UNVRSL'});
const sldr=()=>bench(Array.from({length:3},(_,i)=>[12,10,8].map((r,j)=>waiting(100,r,{role:'sldr-mini',round:i+1,mini:j+1}))).flat(),{method:'SLDR'});








test('wrong equipment and a future session never inflate the recommendation',()=>{
  const other=past('other','2026-09-26',[bench([work(200,3,8)],{equipmentProfileId:'other'})]);
  const future=past('future','2026-09-28',[bench([work(250,3,8)])]);
  const s=now([bench([waiting(0,5)])]);const r=rec(s,0,0,[old,fresh,other,future]);
  assert.ok(r.strength.estimate<160);assert.ok(!r.sessionIds.includes('other'));assert.ok(!r.sessionIds.includes('future'));
});

test('a live suggestion works without old sessions and never overwrites manual or completed sets',()=>{
  const e=sldr(),s=now([e]);Object.assign(e.set[0],work(90,12,8));
  const r=rec(s,0,1,[]);assert.equal(r.nextSetSuggestion.weight,90);
  e.set[1].manualOverride=true;e.set[1].w=95;assert.equal(A.applyAuto(e.set[1],r),false);assert.equal(e.set[1].w,95);
  assert.equal(A.applyAuto(e.set[0],{weight:10}),false);assert.equal(e.set[0].w,90);
});
test('prescription bridge keeps exact test and back-off targets after reload',()=>{
  const ctx={console,setTimeout(){},document:{addEventListener(){}},addEventListener(){},save(){},
    st:{sessions:[],current:now([bench([waiting(0,1)],{n:'Жим лёжа — тест 1–3ПМ'}),bench([waiting(0,5)],{n:'Жим лёжа — back-off 70%'})],{w:8,c:'B'})},
    UNVRSL_ROUTINES:[{w:8,c:'B',e:[{n:'Жим лёжа — тест 1–3ПМ',r:1},{n:'Жим лёжа — back-off 70%',r:5}]}],
    unvrslActiveRepRangeV316:(w,e)=>/тест/.test(e.n)?null:{min:e.r,max:e.r}};
  ctx.window=ctx;vm.runInNewContext(fs.readFileSync(require.resolve('../training-prescription-bridge.js'),'utf8'),ctx);
  ctx.unvrslTrainingPrescriptionPrepareV292();const ex=ctx.st.current.ex;
  assert.equal(ex[0].set[0].targetRepLabel,'1');assert.equal(ex[1].set[0].targetRepLabel,'5');
  assert.equal(ex[0].set[0].role,'test_attempt');assert.equal(ex[0].set[0].plannedReps,1);
});






test('outlier, one bad day and deload have bounded influence, repeated gains are learned',()=>{
  const e=bench([]),base=[18,20,22].map(d=>past('b'+d,'2026-09-'+d,[bench([work(135,3,8)])]));
  const estimate=h=>A.strengthEstimate(e,A.history(e,h,reg),reg).estimate;
  const baseline=estimate(base);
  for(const weight of [115,180]){
    const latest=past('out','2026-09-25',[bench([work(weight,3,8)])]);
    assert.ok(Math.abs(estimate([...base,latest])-baseline)<4);
  }
  const light={...past('deload','2026-09-25',[bench([work(90,8,5)])]),deload:true};
  assert.ok(Math.abs(estimate([...base,light])-baseline)<1);
  const gains=[24,25,26].map(d=>past('new'+d,'2026-09-'+d,[bench([work(150,3,8)])]));
  assert.ok(estimate([...base,...gains])>baseline+5);
});
