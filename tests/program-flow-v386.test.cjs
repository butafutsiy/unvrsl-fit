'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const model=require('../program-model.js');

const root=path.resolve(__dirname,'..');
const source=name=>fs.readFileSync(path.join(root,name),'utf8');

test('manual repetition ranges survive save and reload',()=>{
  const program={
    id:42,
    name:'Проверка',
    weeks:[{days:[{ex:[
      {n:'A',method:'STANDARD',parameterOverrides:{reps:{mode:'manual',min:8,max:15}},sets:[{r:8}]},
      {n:'B',method:'STANDARD',repRange:'6-8',sets:[{r:6}]},
      {n:'C',method:'STANDARD',reps:10,sets:[{r:10}]},
      {n:'D',method:'STANDARD',repsMin:12,repsMax:20,sets:[{r:12}]}
    ]}]}]
  };
  model.normalizeProgram(program,prefix=>prefix+'-fixed');
  const restored=JSON.parse(JSON.stringify(program));
  model.normalizeProgram(restored,prefix=>prefix+'-fixed');
  const ranges=restored.weeks[0].days[0].ex.map(ex=>model.formatRange(model.range(ex)));
  assert.deepEqual(ranges,['8–15','6–8','10','12–20']);
  assert.equal(restored.id,'42');
  assert.equal(restored.schemaVersion,386)
});

test('manual range wins over legacy fallback and old fields are removed',()=>{
  const exercise={
    method:'STANDARD',
    parameterOverrides:{reps:{mode:'manual',min:8,max:15},weight:{mode:'auto'}},
    repRange:'8-10',
    repMin:8,
    repMax:10,
    sets:[{r:8,rMin:8,rMax:10,targetRepMin:8,targetRepMax:10,targetRepLabel:'8–10'}]
  };
  model.normalizeExercise(exercise);
  assert.deepEqual(exercise.reps,{mode:'manual',min:8,max:15});
  assert.equal(exercise.parameterOverrides.reps,undefined);
  for(const key of ['repRange','repMin','repMax'])assert.equal(exercise[key],undefined);
  for(const key of ['rMin','rMax','targetRepMin','targetRepMax','targetRepLabel'])assert.equal(exercise.sets[0][key],undefined)
});

test('automatic reps do not become a manual 8-10 range',()=>{
  const exercise={method:'STANDARD',parameterOverrides:{reps:{mode:'auto',min:8,max:10}},sets:[{r:8}]};
  model.normalizeExercise(exercise);
  assert.deepEqual(exercise.reps,{mode:'auto',min:null,max:null});
  assert.equal(model.range(exercise),null)
});

test('program lookup is stable across numeric and string route ids',()=>{
  const programs=[{id:101,name:'A',weeks:[]}];
  model.normalizePrograms(programs,prefix=>prefix+'-fixed');
  assert.equal(model.findProgram(programs,'101').name,'A');
  assert.equal(model.findProgram(programs,101).name,'A')
});

test('only the canonical program flow owns creation, ranges and preparation',()=>{
  const coach=source('coach-programs.js');
  const editor=source('program-editor.js');
  const rules=source('program-exercise-rules.js');
  const startup=source('startup-orchestrator.js');
  const index=source('index.html');
  const readiness=source('readiness-questionnaire.js');
  assert.equal((coach.match(/function createProgram\s*\(/g)||[]).length,1);
  assert.equal((editor.match(/function createProgram\s*\(/g)||[]).length,0);
  assert.match(coach,/programModel\.findProgram\(st\.programs,id\)/);
  assert.match(coach,/programModel\.formatRange/);
  assert.match(rules,/reps:canonicalReps/);
  assert.doesNotMatch(editor,/else if\(typeof window\.beginProgramDay/);
  assert.doesNotMatch(startup,/loadProgramRepRange/);
  assert.match(startup,/__unvrslStorageHydrationSettledV386/);
  assert.match(startup,/__unvrslReadinessStackReadyV386/);
  assert.match(readiness,/<h2>Подготовка тренировки<\/h2>/);
  assert.ok(index.indexOf('program-model.js?v=431')<index.indexOf('coach-programs.js?v=431'));
  assert.ok(index.indexOf('training-engine.js?v=431')<index.indexOf('readiness-autoregulation.js?v=431'));
  assert.doesNotMatch(index,/v=385/)
});
