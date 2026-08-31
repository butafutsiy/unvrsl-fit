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

test('autoweight is used only when the program has no initial weight',async()=>{
  const program={id:'mine',weeks:[{days:[{name:'B',ex:[
    {n:'Жим лёжа',sourceId:'bench',method:'STANDARD',sets:[{w:110,r:6}]},
    {n:'Тяга блока',sourceId:'row',method:'STANDARD',sets:[{w:0,r:8}]}
  ]}]}]};
  const previous={id:'previous',ended:1,date:'2026-08-29',target:8,ex:[
    {n:'Жим лёжа',sourceId:'bench',set:[{w:100,r:6,rpe:8,ok:true}]},
    {n:'Тяга блока',sourceId:'row',set:[{w:60,r:8,rpe:8,ok:true}]}
  ]};
  const context={
    console,setInterval:()=>0,setTimeout:()=>0,
    document:{createElement:()=>({}),head:{appendChild:()=>{}},getElementById:()=>null,querySelectorAll:()=>[]},
    st:{programs:[program],sessions:[previous],readinessLog:[],current:{id:'current',programId:'mine',w:1,c:'B',target:8,ex:[
      {n:'Жим лёжа',sourceId:'bench',set:[{w:110,r:6,ok:false}]},
      {n:'Тяга блока',sourceId:'row',set:[{w:0,r:8,ok:false}]}
    ]}},
    programById:id=>id==='mine'?program:null,baseExerciseName:name=>String(name).replace(/\s+—\s+.*$/,'').trim(),save:()=>{},startPage:()=>{},UNVRSL_METHOD_V211:require('../unvrsl-method-v211.js'),loadStepFor:()=>2.5
  };
  context.window=context;
  vm.runInNewContext(fs.readFileSync(require.resolve('../training-engine-v200.js'),'utf8'),context);
  await context.trainingEngine200Tick();
  const [prescribed,adaptive]=context.st.current.ex;
  assert.equal(prescribed.programWeightMode,'prescribed');
  assert.equal(prescribed.set[0].w,110);
  assert.equal(prescribed.set[0].recommendedW,undefined);
  assert.equal(adaptive.programWeightMode,'adaptive');
  assert.equal(adaptive.weightDecision,'adaptive_auto');
  assert.ok(adaptive.set[0].w>0);
  assert.equal(adaptive.set[0].w,adaptive.set[0].plannedW);
});

test('client workout rerender keeps the visible exercise anchored',()=>{
  const classList={contains:name=>name==='active'};
  let cards=[
    {getBoundingClientRect:()=>({top:-300,bottom:-80})},
    {getBoundingClientRect:()=>({top:100,bottom:320})}
  ];
  const root={classList,querySelectorAll:selector=>selector==='.exercise'?cards:[]};
  const moves=[];
  const context={
    console,cloud:{user:{id:'client'},profile:{role:'client'}},scrollY:600,
    startPage:()=>{context.scrollY=0;cards=[
      {getBoundingClientRect:()=>({top:300,bottom:520})},
      {getBoundingClientRect:()=>({top:700,bottom:920})}
    ]},
    scrollBy:options=>moves.push(options),scrollTo:()=>{},setTimeout:()=>0,requestAnimationFrame:fn=>fn(),
    document:{
      createElement:()=>({}),head:{appendChild:()=>{}},body:{classList:{toggle:()=>{}}},documentElement:{scrollTop:0},
      getElementById:id=>id==='start'?root:null,querySelector:selector=>selector==='.page.active'?{id:'start'}:null
    }
  };
  context.window=context;
  vm.runInNewContext(fs.readFileSync(require.resolve('../client-ui-fix.js'),'utf8'),context);
  context.startPage();
  assert.deepEqual(JSON.parse(JSON.stringify(moves)),[{top:600,left:0,behavior:'auto'}]);
});

test('start picker opens the workout preview before beginning the session',()=>{
  const calls=[];
  const context={
    console,encodeURIComponent,decodeURIComponent,
    st:{startProgramWeeks:{},programs:[],week:3,primaryProgramId:'__builtin_cycle__',startProgramId:'__builtin_cycle__'},
    ROUTINES:[],RPE:{3:8.5},save:()=>{},
    begin:()=>calls.push(['begin']),preview:(week,day)=>calls.push(['preview',week,day]),
    document:{createElement:()=>({}),head:{appendChild:()=>{}},getElementById:()=>null}
  };
  context.window=context;
  vm.runInNewContext(fs.readFileSync(require.resolve('../start-program-picker.js'),'utf8'),context);
  context.startPickedBuiltin(3,encodeURIComponent('B'));
  assert.deepEqual(calls,[['preview',3,'B']]);
});

test('calendar planner can remove, restore and replace a planned workout',()=>{
  const base={w:1,c:'A1',t:'Ноги',e:[]},calls=[];
  const context={
    console,encodeURIComponent,decodeURIComponent,confirm:()=>true,setTimeout:()=>0,
    st:{calendarPlans:{},sessions:[],programs:[{id:'custom',name:'Моя программа',weeks:[{days:[{name:'День рук',ex:[]}]}]}],week:1,primaryProgramId:'__builtin_cycle__'},
    ROUTINES:[base,{w:2,c:'B',t:'Грудь',e:[]}],RPE:{1:7,2:8},
    plannedForDate:d=>String(d instanceof Date?d.toISOString().slice(0,10):d).slice(0,10)==='2026-08-31'?base:null,
    iso:d=>d.toISOString().slice(0,10),parseDate:s=>new Date(`${s}T12:00:00`),
    save:()=>{},home:()=>{},modal:()=>{},closeModal:()=>{},toast:()=>{},preview:(w,c)=>calls.push(['builtin',w,c]),previewPrimaryProgramDay:(id,wi,di)=>calls.push(['program',id,wi,di]),
    document:{createElement:()=>({}),head:{appendChild:()=>{}},getElementById:()=>null}
  };
  context.window=context;
  vm.runInNewContext(fs.readFileSync(require.resolve('../calendar-planner-v234.js'),'utf8'),context);
  assert.equal(context.plannedForDate('2026-08-31').c,'A1');
  context.calendarPlannerDeleteV234(encodeURIComponent('2026-08-31'));
  assert.equal(context.plannedForDate('2026-08-31'),null);
  context.calendarPlannerRestoreV234(encodeURIComponent('2026-08-31'));
  assert.equal(context.plannedForDate('2026-08-31').c,'A1');
  context.calendarPlannerAddV234(encodeURIComponent('2026-09-01'));
  context.calendarPlannerAssignBuiltinV234(2,encodeURIComponent('B'));
  assert.equal(context.plannedForDate('2026-09-01').c,'B');
  context.calendarPlannerPreviewDateV234(encodeURIComponent('2026-09-01'));
  context.calendarPlannerAddV234(encodeURIComponent('2026-09-02'));
  context.calendarPlannerAssignProgramV234(encodeURIComponent('custom'),0,0);
  assert.equal(context.plannedForDate('2026-09-02').c,'День рук');
  context.calendarPlannerPreviewDateV234(encodeURIComponent('2026-09-02'));
  assert.deepEqual(calls,[['builtin',2,'B'],['program','custom',0,0]]);
});
