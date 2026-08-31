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

function loadProgramMethodBuilder(){
  const context={console};
  context.window=context;
  context.document={
    createElement:()=>({}),
    head:{appendChild:()=>{}},
    getElementById:()=>null,
    querySelectorAll:()=>[]
  };
  vm.runInNewContext(fs.readFileSync(require.resolve('../program-exercise-rules-v162.js'),'utf8'),context);
  return context.programBuildMethodSets;
}

test('program editor builds UNVRSL as three heavy-light rounds plus middle sets',()=>{
  const build=loadProgramMethodBuilder();
  const sets=build('UNVRSL',3,130,0,150,{heavyReps:3,lightWeight:115,lightReps:9,middleSets:2,middleWeight:120,middleReps:6,tempo:'2-0-X',tempoLight:'3-1-2'});
  assert.deepEqual(JSON.parse(JSON.stringify(sets.map(set=>[set.role,set.w,set.r,set.rest]))),[
    ['heavy',130,3,30],['light',115,9,150],
    ['heavy',130,3,30],['light',115,9,150],
    ['heavy',130,3,30],['light',115,9,150],
    ['middle',120,6,150],['middle',120,6,150]
  ]);
});

test('program editor builds SLDR on one weight with falling reps and 15-second pauses',()=>{
  const build=loadProgramMethodBuilder();
  const sets=build('SLDR',3,100,12,120,{sldrSets:3,sldrDrop:2,tempo:'2-1-1'});
  assert.deepEqual(JSON.parse(JSON.stringify(sets.map(set=>[set.w,set.r,set.rest]))),[[100,12,15],[100,10,15],[100,8,120]]);
});

test('automatic readiness never raises the program weight at workout start',async()=>{
  const program={id:'mine',weeks:[{days:[{name:'B',ex:[{n:'Жим лёжа',sourceId:'bench',method:'STANDARD',sets:[{w:110,r:6},{w:110,r:6}]}]}]}]};
  const context={
    console,setInterval:()=>0,setTimeout:()=>0,
    document:{createElement:()=>({}),head:{appendChild:()=>{}},getElementById:()=>null,querySelectorAll:()=>[]},
    st:{programs:[program],sessions:[],readinessLog:[],current:{id:'current',programId:'mine',w:1,c:'B',target:8,trainingReadinessDone:true,readinessAdjusted:true,readiness:{percent:10,factor:1.1,manual:false},ex:[{n:'Жим лёжа',sourceId:'bench',set:[{w:125,r:6,ok:false},{w:125,r:6,ok:false}]}]}},
    programById:id=>id==='mine'?program:null,baseExerciseName:name=>String(name).replace(/\s+—\s+.*$/,'').trim(),save:()=>{},startPage:()=>{},UNVRSL_METHOD_V211:require('../unvrsl-method-v211.js')
  };
  context.window=context;
  vm.runInNewContext(fs.readFileSync(require.resolve('../training-engine-v200.js'),'utf8'),context);
  await context.trainingEngine200Tick();
  assert.deepEqual(JSON.parse(JSON.stringify(context.st.current.ex[0].set.map(set=>set.w))),[110,110]);
  assert.equal(context.st.current.readiness.factor,1);
  assert.equal(context.st.current.readinessAdjusted,false);
});
