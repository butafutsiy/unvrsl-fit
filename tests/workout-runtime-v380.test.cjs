'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');

test('active workout has one native RPE/RIR row with inverse ranges',()=>{
  const app=read('app.js');
  assert.match(app,/<span>RPE<\/span><span>RIR<\/span>/);
  assert.match(app,/data-effort="rpe"/);
  assert.match(app,/data-effort="rir"/);
  assert.match(app,/const other=k==='rpe'\?'rir':'rpe'/);
  assert.match(app,/10-n/);
  assert.match(app,/effortLabel\(rpeMax==null\?null:10-rpeMax,rpeMin==null\?null:10-rpeMin\)/);
  for(const file of ['og-core.js','smart-training.js']){
    const source=read(file);
    assert.match(source,/<span>RPE<\/span><span>RIR<\/span>/,file);
    assert.match(source,/data-effort="rpe"/,file);
    assert.match(source,/data-effort="rir"/,file);
  }
  assert.match(read('og-core.js'),/unvrsl:workout-rendered/);
});

test('retired RPE/RIR injector is absent from the production graph',()=>{
  const index=read('index.html');
  const detail=read('exercise-detail-rules.js');
  assert.doesNotMatch(index,/rpe-rir\.js/);
  assert.doesNotMatch(detail,/rpe-rir\.js/);
  assert.equal(fs.existsSync(path.join(__dirname,'..','rpe-rir.js')),false);
});

test('per-set legacy feedback is removed instead of appended',()=>{
  const source=read('performance-control.js');
  const start=source.indexOf('function enhanceRows()');
  const end=source.indexOf('function restoreTop',start);
  const body=source.slice(start,end);
  assert.match(body,/querySelectorAll\('\.pc315-feedback'\).*\.remove/);
  assert.doesNotMatch(body,/insertAdjacentElement/);
});

test('active workout enhancers are event driven',()=>{
  for(const file of ['training-engine.js','machine-weight-adaptation.js','rpe-range-display.js','workout-weight-integrity.js']){
    const source=read(file);
    assert.match(source,/unvrsl:workout-rendered/,file);
  }
  assert.doesNotMatch(read('training-engine.js'),/setInterval\(tick,300\)/);
  assert.doesNotMatch(read('machine-weight-adaptation.js'),/setInterval\(enhance,450\)/);
  assert.doesNotMatch(read('rpe-range-display.js'),/setInterval\(/);
  assert.doesNotMatch(read('cardio-metric-fixes.js'),/setInterval\(/);
  assert.doesNotMatch(read('active-rep-ranges.js'),/startPage|exerciseCard\s*=|addEventListener/);
  assert.doesNotMatch(read('advanced-training.js'),/advAskReadiness|advConfirmReadiness|setInterval/);
});

test('obsolete runtime layers are absent from the final load graph',()=>{
  const index=read('index.html');
  const loader=read('frequent-patch.js');
  assert.equal(fs.existsSync(path.join(__dirname,'..','legacy-retirement.js')),false);
  assert.equal(fs.existsSync(path.join(__dirname,'..','stats-cleanup.js')),false);
  assert.doesNotMatch(index,/legacy-retirement\.js/);
  assert.doesNotMatch(loader,/stats-cleanup\.js|unvrslScriptRetired/);
  assert.doesNotMatch(read('cardio-metric-fixes.js'),/active-workout-compact\.js/);
  assert.doesNotMatch(read('smart-training.js'),/smart-suggest|suggestionFor|applySuggestion/);
  assert.doesNotMatch(read('active-workout-compact.js'),/startPage|setTimeout|requestAnimationFrame/);
});
