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

test('UNVRSL history is isolated from ordinary weeks',()=>{
  for(const [lo,hi,reps] of [[70,75,10],[75,80,7],[80,85,6],[85,88,5],[88,90,3]]){
    const s=now([bench([waiting(0,reps)])],{programWeekIntensityMin:lo,programWeekIntensityMax:hi});
    const r=rec(s);assert.equal(r.basis.date,'2026-08-29');assert.equal(r.excludedHistory,null);
    assert.ok(!r.sessionIds.includes('sep'));assert.ok(r.weight>0);
    const strength=A.strengthEstimate(s.ex[0],A.history(s.ex[0],[old,fresh],reg),reg);
    assert.equal(r.strength.estimate,Number(strength.estimate.toFixed(1)));
  }
});
test('test singleton is never calculated as back-off five and works in custom plans too',()=>{
  for(const custom of [false,true]){
    const ex=bench([waiting(0,1,{targetRepLabel:'5',targetRepMin:5,targetRepMax:5})],{n:'Жим лёжа — тест 1–3ПМ'});
    const s=now([ex],{w:8,c:'B',...(custom?{programId:'custom'}:{}),programWeekIntensityMin:90,programWeekIntensityMax:100});
    const r=rec(s);assert.deepEqual(r.repRange,{lo:1,hi:1});assert.ok(r.weight>=140&&r.weight<=150);
    assert.equal(r.testWeekSuggestion,true);assert.equal(r.nextSetSuggestion,null);assert.equal(r.basis.date,'2026-08-29');
  }
});
test('UNVRSL keeps three linked loads and updates the next heavy set after a hard round',()=>{
  const s=now([unvrsl()],{programWeekIntensityMin:80,programWeekIntensityMax:85});
  const values=s.ex[0].set.map((_,i)=>rec(s,0,i).weight);
  assert.ok(values[0]>values[1]);assert.ok(values[0]>values[6]);assert.ok(values[6]>values[1]);
  assert.equal(values[0],values[2]);assert.equal(values[1],values[3]);
  Object.assign(s.ex[0].set[0],work(values[0],3,10));
  Object.assign(s.ex[0].set[1],work(values[1],7,10));
  const next=rec(s,0,2);assert.ok(next.weight<values[0]);assert.ok(next.nextSetSuggestion);
});
test('SLDR keeps one weight within the round and lowers the next round after failure',()=>{
  const s=now([sldr()],{programWeekIntensityMin:60,programWeekIntensityMax:70,programWeekRpeMin:4,programWeekRpeMax:6});
  const initial=rec(s);assert.ok(initial.weight>0);
  Object.assign(s.ex[0].set[0],work(100,12,6));assert.equal(rec(s,0,1).weight,100);
  Object.assign(s.ex[0].set[1],work(100,8,9));assert.equal(rec(s,0,2).weight,100);
  Object.assign(s.ex[0].set[2],work(100,5,10));assert.equal(rec(s,0,3).weight,97.5);
});
test('SLDR without method history preserves its seed instead of importing ordinary e1RM',()=>{
  const a=now([sldr()],{programWeekIntensityMin:60,programWeekIntensityMax:65});
  const b=now([sldr()],{programWeekIntensityMin:70,programWeekIntensityMax:75});
  assert.equal(rec(a).weight,rec(b).weight);assert.ok(rec(a).weight>0);
});
test('test back-off cannot be replaced by the normal next-set suggestion',()=>{
  const s=now([bench([work(150,1,9)],{n:'Жим лёжа — тест 1–3ПМ'}),bench([waiting(0,5)],{n:'Жим лёжа — back-off 70%'})],{w:8,c:'B'});
  const r=rec(s,1);assert.equal(r.weight,105);assert.equal(r.nextSetSuggestion,null);
});
test('estimated single follows the requested formula; confirmed single is stored separately',()=>{
  const e=bench([work(150,1,10)]);assert.equal(A.e1rm(e,e.set[0],now([e]),reg),155);
  assert.ok(Math.abs(A.estimateMaxFromSet(e.set[0])-155)<1e-9);
});
test('wrong equipment and a future session never inflate the recommendation',()=>{
  const other=past('other','2026-09-26',[bench([work(200,3,8)],{equipmentProfileId:'other'})]);
  const future=past('future','2026-09-28',[bench([work(250,3,8)])]);
  const s=now([bench([waiting(0,5)])]);const r=rec(s,0,0,[old,fresh,other,future]);
  assert.ok(r.strength.estimate<160);assert.ok(!r.sessionIds.includes('other'));assert.ok(!r.sessionIds.includes('future'));
});
test('DS descends using the recipe and FST-7 responds to actual failed reps',()=>{
  const ds=bench([100,80,64,51,41].map((w,i)=>waiting(w,[12,10,10,8,8][i],{label:'DS'+(i+1)})),{method:'DS'});
  const s=now([ds]);const weights=ds.set.map((_,i)=>rec(s,0,i).weight);
  assert.ok(weights.every((w,i)=>i===0||w<=weights[i-1]));
  const fst=bench(Array.from({length:7},()=>waiting(80,12)),{method:'FST-7'}),f=now([fst]);
  Object.assign(fst.set[0],work(80,8,10));assert.equal(rec(f,0,1).weight,77.5);
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

test('ordinary TARGET holds manual actual weight, tolerance and one easy set increase',()=>{
  for(const [felt,expected,state] of [[7.5,125,'TARGET'],[8,125,'TARGET'],[8.5,125,'TARGET'],[6,127.5,'TOO_EASY'],[9,125,'TARGET']]){
    const e=bench([work(125,6,felt,{weightSource:'manual'}),waiting(120,6,{targetRpeMin:8,targetRpeMax:8})]);
    const s=now([e],{trainingReadinessDone:true,readinessAdjusted:true,readiness:{factor:.9}});
    const r=rec(s,0,1);assert.equal(r.nextSetSuggestion.weight,expected);assert.equal(r.nextSetSuggestion.state,state);assert.equal(r.wellbeingApplied,false);
  }
});
test('UNVRSL increases Heavy after one easy set while Light on target holds',()=>{
  const e=unvrsl(),s=now([e]);
  for(const set of e.set){set.targetRpeMin=8;set.targetRpeMax=8;}
  Object.assign(e.set[0],work(135,3,6));Object.assign(e.set[1],work(105,9,8));
  assert.equal(rec(s,0,2).nextSetSuggestion.weight,137.5);
  assert.equal(rec(s,0,3).nextSetSuggestion.weight,105);
});
test('SLDR increases only after a complete easy circle',()=>{
  const e=sldr(),s=now([e]);
  Object.assign(e.set[0],work(100,12,6));assert.equal(rec(s,0,1).weight,100);
  Object.assign(e.set[1],work(100,10,6));assert.equal(rec(s,0,2).weight,100);
  Object.assign(e.set[2],work(100,8,6));assert.equal(rec(s,0,3).weight,102.5);
});
test('method strength histories remain separate with their own confidence',()=>{
  const heavy=past('heavy','2026-09-20',[bench([work(135,3,8)],{method:'UNVRSL',phaseRole:'heavy'})]);
  const ds=past('drops','2026-09-21',[bench([work(120,8,8),work(50,8,10)],{method:'DS'})]);
  const e=bench([]),rows=A.history(e,[heavy,ds],reg);
  assert.equal(A.strengthEstimate(e,rows,reg).estimate,null);
  const own=A.strengthEstimate({...e,method:'UNVRSL'},rows,reg);
  assert.equal(own.points.length,1);assert.ok(own.estimate>150);
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
test('wellbeing changes initial load only and never changes e1RM',()=>{
  const e=bench([waiting(0,6)]),s=now([e]),a=rec(s);
  Object.assign(s,{trainingReadinessDone:true,readinessAdjusted:true,readiness:{factor:.9}});
  const b=rec(s);assert.ok(b.weight<a.weight);assert.equal(b.strength.estimate,a.strength.estimate);assert.equal(b.wellbeingApplied,true);
});
test('TEST advances from today effort and stops at RPE9.5 without filling another attempt',()=>{
  const e=bench([work(150,1,7,{role:'test_attempt'}),waiting(0,1,{role:'test_attempt',attemptNumber:2})]),s=now([e]);
  assert.equal(rec(s,0,1).weight,157.5);
  e.set[0].rpe=9.5;const r=rec(s,0,1);assert.equal(r.action,'stop');
  assert.equal(A.applyAuto(e.set[1],r),false);assert.equal(e.set[1].w,0);
});
test('RPE has one priority over conflicting RIR and unknown effort lowers confidence',()=>{
  assert.equal(A.estimateMaxFromSet(work(120,5,8,{rir:1})),148);
  const e=bench([work(120,5,8),work(120,5,null)]),s=past('effort','2026-09-20',[e]);
  const result=A.strengthEstimate(e,A.history(e,[s],reg),reg);
  assert.ok(result.points[0].confidenceWeight>result.points[1].confidenceWeight);
});

test('single TEST matches its target effort, preview back-off uses that attempt, then the actual result',()=>{
  const e=bench([waiting(0,1,{role:'test_attempt'})],{n:'Жим лёжа — тест 1–3ПМ'});
  const b=bench([waiting(120,5,{role:'backoff',targetRpeMin:9,targetRpeMax:10})],{n:'Жим лёжа — back-off 70%'});
  const s=now([e,b],{w:8,c:'B',programWeekRpeMin:9,programWeekRpeMax:10});
  const attempt=rec(s),back=rec(s,1);
  assert.ok(attempt.weight>=attempt.strength.estimate*.95);
  assert.equal(back.weight,Math.floor(attempt.weight*.7/2.5)*2.5);
  assert.equal(back.backoffPreview,true);assert.deepEqual(back.targetEffort,{lo:7,hi:8});
  Object.assign(e.set[0],work(150,1,9));
  const actual=rec(s,1);assert.equal(actual.weight,105);assert.equal(actual.backoffPreview,false);
});
