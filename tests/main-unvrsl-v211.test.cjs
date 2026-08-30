const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {aggregateRecommendation,expandPlanEntries}=require('../unvrsl-method-v211.js');

const plan=[
  {n:'Жим лёжа — UNVRSL 1/3',s:1,r:3,w:130},
  {n:'Жим лёжа — UNVRSL 2/3',s:1,r:9,w:115},
  {n:'Жим лёжа — UNVRSL 3/3',s:2,r:6,w:120}
];

test('UNVRSL expands to three heavy-light rounds and two finishing sets',()=>{
  const result=expandPlanEntries(plan);
  assert.equal(result.method,'UNVRSL');
  assert.deepEqual(result.sets.map(set=>set.w),[130,115,130,115,130,115,120,120]);
  assert.deepEqual(result.sets.map(set=>set.r),[3,9,3,9,3,9,6,6]);
});

test('UNVRSL recommendation uses average weight and average reps of the whole block',()=>{
  const expanded=expandPlanEntries(plan).sets;
  const rows=expanded.map(set=>({w:set.w,r:set.r,rpe:8.5,rir:1.5}));
  const result=aggregateRecommendation(rows,expanded.map(set=>set.w),expanded.map(set=>set.r),expanded.map(()=>8.5),2.5);
  assert.equal(result.averageWeight,121.9);
  assert.equal(result.averageReps,6);
  assert.equal(result.averageRpe,8.5);
  assert.deepEqual(result.weights,[130,115,130,115,130,115,120,120]);
});

test('main workout session opens the complete eight-set UNVRSL block',()=>{
  const context={
    st:{planAdds:{},aliases:{}},BASEWORDS:['жим лёжа'],BASE:{3:120},ISO:{3:60},RPE:{3:8.5},
    iso:()=> '2026-08-30',console
  };
  vm.runInNewContext(fs.readFileSync(require.resolve('../og-core.js'),'utf8'),context);
  const routine={w:3,c:'B',t:'Грудь',p:'2-0-2',e:plan.map(entry=>({...entry,g:'bench-unvrsl'}))};
  const workout=context.session(routine),sets=JSON.parse(JSON.stringify(workout.ex.flatMap(exercise=>exercise.set))),exercises=JSON.parse(JSON.stringify(workout.ex));
  assert.deepEqual(sets.map(set=>set.w),[130,115,130,115,130,115,120,120]);
  assert.deepEqual(sets.map(set=>set.r),[3,9,3,9,3,9,6,6]);
  assert.deepEqual(exercises.map(exercise=>exercise.rest),[30,120,30,120,30,120,120]);
  assert.equal(context.formatPrescription(routine.e),'3×(130×3 + 30с + 115×9), затем 2×6 – 120 кг');
});
