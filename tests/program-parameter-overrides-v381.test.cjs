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
  vm.runInNewContext(read('program-exercise-rules.js'),context);
  return context.programResolveExerciseParametersV381;
}

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
  vm.runInNewContext(read('program-exercise-rules.js'),context);
  context.saveProgramExercise('p-save',0,0,encodeURIComponent('Разгибание ног'),encodeURIComponent('leg-extension'),'legs','quads','machine',null);
  assert.equal(saved,1);assert.equal(opened,1);assert.equal(program.weeks[0].days[0].ex.length,1);
  const exercise=program.weeks[0].days[0].ex[0],overrides=exercise.parameterOverrides;
  assert.deepEqual([exercise.repMin,exercise.repMax],[15,20]);
  assert.deepEqual([exercise.rpeMin,exercise.rpeMax,exercise.rirMin,exercise.rirMax],[8,9,1,2]);
  assert.deepEqual([exercise.restMin,exercise.restMax],[30,45]);
  assert.equal(exercise.tempo,'4-1-2');assert.equal(exercise.weightMode,'manual');assert.equal(exercise.sets[0].w,55);
  assert.deepEqual(JSON.parse(JSON.stringify(overrides.reps)),{mode:'manual',min:15,max:20});
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
