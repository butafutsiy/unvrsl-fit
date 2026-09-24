'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');

function loadResolver(program){
  const context={console,programById:id=>String(id)===String(program.id)?program:null};
  context.window=context;
  context.document={
    createElement:()=>({}),head:{appendChild:()=>{}},getElementById:()=>null,
    querySelector:()=>null,querySelectorAll:()=>[]
  };
  context.WorkoutDomain=require('../workout-domain.js');context.workoutRegistry=context.WorkoutDomain.registry([]);context.st={exerciseWeightProfiles:{}};context.programModel=require('../program-model.js');
  vm.runInNewContext(read('program-exercise-rules.js'),context);
  return context.programResolveExerciseParametersV381;
}

test('previously assigned women templates inherit W4 rep and RPE ranges for every client',()=>{
  const model=require('../program-model.js');
  const week={n:4,intensityMin:78,intensityMax:82,rpeMin:8,rpeMax:8.5,
    baseRepMin:6,baseRepMax:8,isolationRepMin:10,isolationRepMax:12,
    days:[{ex:[
      {n:'Тяга верхнего блока',method:'STANDARD',reps:{mode:'manual',min:10,max:10},rpe:8.5,sets:[{r:10,w:35}]},
      {n:'Махи гантелями в стороны',method:'STANDARD',reps:{mode:'manual',min:15,max:15},rpe:8.5,sets:[{r:15,w:5}]}
    ]}]};
  for(const client of ['алёна','лиза']){
    const program={id:client,femaleTemplate:true,weeks:[structuredClone(week)]};
    model.normalizeProgram(program);
    model.normalizeProgram(program);
    const resolve=loadResolver(program);
    const [compound,isolation]=program.weeks[0].days[0].ex.map(ex=>resolve(client,0,ex));
    assert.deepEqual([compound.reps.min,compound.reps.max,compound.effort.rpeMin,compound.effort.rpeMax],[6,8,8,8.5]);
    assert.deepEqual([isolation.reps.min,isolation.reps.max,isolation.effort.rpeMin,isolation.effort.rpeMax],[10,12,8,8.5]);
    assert.equal(program.weeks[0].days[0].ex[0].sets[0].w,35);
  }
});

test('template exercise overrides and fixed repetition plans remain manual',()=>{
  const model=require('../program-model.js');
  const exercise={n:'Тяга верхнего блока',method:'STANDARD',reps:{mode:'manual',min:10,max:10},parameterOverrides:{version:386},
    effortSourceMode:'manual',rpeMin:7,rpeMax:8,sets:[{r:10,w:35}]};
  const program={id:'manual',femaleTemplate:true,weeks:[{n:4,rpeMin:8,rpeMax:8.5,baseRepMin:6,baseRepMax:8,days:[{ex:[exercise]}]}]};
  model.normalizeProgram(program);
  const result=loadResolver(program)('manual',0,exercise);
  assert.deepEqual([result.reps.min,result.reps.max,result.effort.rpeMin,result.effort.rpeMax],[10,10,7,8]);
  const fixed={id:'strength',internetTemplate:true,weeks:[{n:4,baseRepMin:6,baseRepMax:8,days:[{ex:[{n:'Присед',reps:{mode:'manual',min:5,max:5},sets:[{r:5}]}]}]}]};
  model.normalizeProgram(fixed);
  assert.deepEqual([fixed.weeks[0].days[0].ex[0].reps.min,fixed.weeks[0].days[0].ex[0].reps.max],[5,5]);
  const partlyEdited={id:'partly-edited',femaleTemplate:true,weeks:[{n:4,rpeMin:8,rpeMax:8.5,baseRepMin:6,baseRepMax:8,
    days:[{ex:[{n:'Тяга верхнего блока',method:'STANDARD',reps:{mode:'manual',min:10,max:10},
      effortSourceMode:'manual',rpeMin:7,rpeMax:8,sets:[{r:10,w:35}]}]}]}]};
  model.normalizeProgram(partlyEdited);
  const partial=loadResolver(partlyEdited)('partly-edited',0,partlyEdited.weeks[0].days[0].ex[0]);
  assert.deepEqual([partial.reps.min,partial.reps.max,partial.effort.rpeMin,partial.effort.rpeMax],[6,8,7,8]);
});

test('an already opened client workout replaces old point placeholders with weekly ranges',()=>{
  const model=require('../program-model.js');
  const program={id:'assigned',femaleTemplate:true,weeks:Array.from({length:4},(_,i)=>({n:i+1,
    intensityMin:78,intensityMax:82,rpeMin:8,rpeMax:8.5,baseRepMin:6,baseRepMax:8,
    days:[{name:'Upper A',ex:[{n:'Тяга верхнего блока',method:'STANDARD',reps:{mode:'manual',min:10,max:10},rpe:8.5,sets:[{r:10,w:35},{r:10,w:35}]}]}]
  }))};
  model.normalizeProgram(program);
  const resolve=loadResolver(program);
  const pending={r:'',w:35,ok:false,targetRepMin:10,targetRepMax:10,targetRepLabel:'10'};
  const completed={r:10,w:35,ok:true,targetRepMin:10,targetRepMax:10,targetRepLabel:'10'};
  const current={programId:'assigned',w:4,c:'Upper A',ex:[{n:'Тяга верхнего блока',set:[completed,pending]}]};
  let saved=0;
  const context={console,st:{programs:[program],current},save:()=>{saved++},programById:()=>program,
    requestAnimationFrame:()=>0,setTimeout:(fn,ms)=>{if(ms===0)fn();return 0},setInterval:()=>0,CustomEvent:function(type){this.type=type}};
  context.window=context;context.addEventListener=()=>{};context.dispatchEvent=()=>{};
  context.programResolveExerciseParametersV381=resolve;
  context.document={documentElement:{},head:{appendChild:()=>{}},createElement:()=>({}),getElementById:()=>null,
    querySelector:()=>null,querySelectorAll:()=>[]};
  vm.runInNewContext(read('program-rep-range.js'),context);
  assert.deepEqual([pending.targetRepMin,pending.targetRepMax,pending.targetRepLabel],[6,8,'6–8']);
  assert.deepEqual([pending.targetRpeMin,pending.targetRpeMax,pending.targetRirMin,pending.targetRirMax],[8,8.5,1.5,2]);
  assert.equal(pending.r,'');
  assert.equal(completed.r,10);
  assert.ok(saved>0);
});

test('auto exercise parameters inherit the current week ranges',()=>{
  const program={id:'p1',weeks:[{n:1,intensityMin:70,intensityMax:75,rpeMin:7,rpeMax:8,tempo:'3-1-2',baseRepMin:8,baseRepMax:10,baseRestMin:120,baseRestMax:180,days:[]}]};
  const resolve=loadResolver(program),exercise={id:'e1',n:'Присед со штангой',kind:'compound',method:'STANDARD',parameterOverrides:{reps:{mode:'auto'},effort:{mode:'auto',type:'rpe'},tempo:{mode:'auto'},rest:{mode:'auto'},weight:{mode:'auto'}},sets:[{w:0,r:8}]};
  const result=resolve('p1',0,exercise);
  assert.deepEqual(JSON.parse(JSON.stringify(result.reps)),{mode:'auto',min:8,max:10});
  assert.deepEqual(JSON.parse(JSON.stringify(result.effort)),{mode:'auto',type:'rpe',rpeMin:7,rpeMax:8,rirMin:2,rirMax:3});
  assert.equal(result.tempo.value,'3-1-2');
  assert.deepEqual([result.rest.min,result.rest.max],[120,180]);
  assert.equal(result.weight.value,0);
});

test('manual exercise ranges stay independent from changed week settings',()=>{
  const program={id:'p2',weeks:[{n:3,intensityMin:85,intensityMax:88,rpeMin:8,rpeMax:9,tempo:'2-0-2',isolationRepMin:8,isolationRepMax:10,isolationRestMin:60,isolationRestMax:90,days:[]}]};
  const resolve=loadResolver(program),exercise={id:'e2',n:'Разгибание ног',kind:'isolation',method:'STANDARD',parameterOverrides:{reps:{mode:'manual',min:15,max:20},effort:{mode:'manual',type:'rir',rirMin:1,rirMax:2},tempo:{mode:'manual',value:'4-1-2'},rest:{mode:'manual',min:30,max:45},weight:{mode:'manual',value:55}},sets:[{w:55,r:15}]};
  const result=resolve('p2',0,exercise);
  assert.deepEqual([result.reps.min,result.reps.max],[15,20]);
  assert.deepEqual([result.effort.rpeMin,result.effort.rpeMax],[8,9]);
  assert.deepEqual([result.effort.rirMin,result.effort.rirMax],[1,2]);
  assert.equal(result.tempo.value,'4-1-2');
  assert.deepEqual([result.rest.min,result.rest.max],[30,45]);
  assert.equal(result.weight.value,55);
  program.weeks[0].isolationRepMin=4;program.weeks[0].isolationRepMax=6;program.weeks[0].tempo='2-0-X';
  const after=resolve('p2',0,exercise);
  assert.deepEqual([after.reps.min,after.reps.max],[15,20]);
  assert.equal(after.tempo.value,'4-1-2');
});

test('saving manual controls writes one complete exercise override',()=>{
  const program={id:'p-save',weeks:[{n:2,rpeMin:7,rpeMax:8,tempo:'3-1-2',isolationRepMin:10,isolationRepMax:12,isolationRestMin:60,isolationRestMax:90,days:[{ex:[]}]}]};
  const values={
    pmMethod:'STANDARD',pmKind:'isolation',pmRepsMode:'manual',pmEffortMode:'manual',pmEffortType:'rir',pmTempoMode:'manual',pmRestMode:'manual',pmWeightMode:'manual',
    pmSets:'3',pmRepsMin:'15',pmRepsMax:'20',pmRpeMin:'7',pmRpeMax:'8',pmRirMin:'1',pmRirMax:'2',pmTempo:'4-1-2',pmRestMin:'30',pmRestMax:'45',pmWeight:'55',pmNote:'Личный диапазон'
  };
  const elements=Object.fromEntries(Object.entries(values).map(([id,value])=>[id,{value,dataset:{}}]));
  let saved=0,opened=0;
  const context={console,encodeURIComponent,decodeURIComponent,programById:id=>id==='p-save'?program:null,uid:()=> 'exercise-1',save:()=>{saved++},openProgramEditor:()=>{opened++},toast:()=>{throw new Error('unexpected validation error')}};
  context.window=context;
  context.document={createElement:()=>({}),head:{appendChild:()=>{}},getElementById:id=>elements[id]||null,querySelector:()=>null,querySelectorAll:()=>[]};
  context.WorkoutDomain=require('../workout-domain.js');context.workoutRegistry=context.WorkoutDomain.registry([]);context.st={exerciseWeightProfiles:{}};context.programModel=require('../program-model.js');
  vm.runInNewContext(read('program-exercise-rules.js'),context);
  context.saveProgramExercise('p-save',0,0,encodeURIComponent('Разгибание ног'),encodeURIComponent('leg-extension'),'legs','quads','machine',null);
  assert.equal(saved,1);assert.equal(opened,1);assert.equal(program.weeks[0].days[0].ex.length,1);
  const exercise=program.weeks[0].days[0].ex[0],overrides=exercise.parameterOverrides;
  assert.deepEqual([exercise.reps.min,exercise.reps.max],[15,20]);
  assert.deepEqual([exercise.rpeMin,exercise.rpeMax,exercise.rirMin,exercise.rirMax],[8,9,1,2]);
  assert.deepEqual([exercise.restMin,exercise.restMax],[30,45]);
  assert.equal(exercise.tempo,'4-1-2');assert.equal(exercise.weightMode,'manual');assert.equal(exercise.sets[0].w,55);
  assert.deepEqual(JSON.parse(JSON.stringify(exercise.reps)),{mode:'manual',min:15,max:20});
  assert.deepEqual(JSON.parse(JSON.stringify(overrides.effort)),{mode:'manual',type:'rir',rpeMin:7,rpeMax:8,rirMin:1,rirMax:2});
  assert.deepEqual(JSON.parse(JSON.stringify(overrides.rest)),{mode:'manual',min:30,max:45});
});

test('legacy feature modules do not wrap the canonical exercise editor',()=>{
  assert.match(read('program-exercise-rules.js'),/__unvrslProgramParameterOverridesV381=true/);
  for(const file of ['program-intensity-autoweight.js','program-week-rpe-rir.js','program-week-rep-guidance.js','program-rep-range.js']){
    assert.doesNotMatch(read(file),/programExerciseForm|saveProgramExercise/,file);
  }
  const source=read('program-exercise-rules.js');
  assert.match(source,/data-parameter-card="reps"/);
  assert.match(source,/data-parameter-card="effort"/);
  assert.match(source,/data-parameter-card="tempo"/);
  assert.match(source,/data-parameter-card="rest"/);
  assert.match(source,/data-parameter-card="weight"/);
  assert.match(source,/class="px-save-wrap"/);
});

test('exercise form renders one stable full-screen editor with auto and manual controls',()=>{
  const program={id:'p3',weeks:[{n:1,rpeMin:7,rpeMax:8,tempo:'3-1-2',baseRepMin:8,baseRepMax:10,baseRestMin:120,baseRestMax:180,days:[{ex:[]}]}]},modalRoot={classList:{add:()=>{}}};
  let html='';const context={console,encodeURIComponent,decodeURIComponent,setTimeout:()=>0,programById:id=>id==='p3'?program:null,modal:value=>{html=value},esc:value=>String(value),uid:()=> 'new-id'};
  context.window=context;context.document={createElement:()=>({}),head:{appendChild:()=>{}},getElementById:id=>id==='modal'?modalRoot:null,querySelector:()=>null,querySelectorAll:()=>[]};
  context.WorkoutDomain=require('../workout-domain.js');context.workoutRegistry=context.WorkoutDomain.registry([]);context.st={exerciseWeightProfiles:{}};context.programModel=require('../program-model.js');
  vm.runInNewContext(read('program-exercise-rules.js'),context);
  context.programExerciseForm({pid:'p3',wi:0,di:0,n:'Присед со штангой',sourceId:'squat',bp:'legs',tg:'quads',eq:'barbell',existingIndex:null});
  assert.equal((html.match(/id="pmRepsMin"/g)||[]).length,1);
  assert.equal((html.match(/id="pmRepsMax"/g)||[]).length,1);
  assert.equal((html.match(/id="pmRpeMin"/g)||[]).length,1);
  assert.equal((html.match(/id="pmRirMin"/g)||[]).length,1);
  assert.equal((html.match(/class="px-save-wrap"/g)||[]).length,1);
  assert.match(html,/id="pxInheritedCard"/);
  assert.match(html,/Авто/);
  assert.match(html,/Вручную/);
  assert.match(html,/placeholder="8"/);
  assert.match(html,/placeholder="10"/);
});
