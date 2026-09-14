'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');

test('v385 uses one cache version across static and dynamic loaders',()=>{
  for(const name of ['index.html','startup-orchestrator.js','frequent-patch.js']){
    const source=read(name);
    assert.doesNotMatch(source,/\?v=(?:380|384)\b/);
    assert.match(source,/\?v=385\b/);
  }
  assert.match(read('sw.js'),/v385-ui-program-stability/);
});

test('navigation and statistics use stable SVG icons',()=>{
  const nav=read('premium-ui.js'),stats=read('stats-dashboard.js');
  assert.match(nav,/unvrslNavApplyIconsV385/);
  assert.match(nav,/m8 5 11 7-11 7Z/);
  assert.match(stats,/METRIC_ICONS/);
  assert.doesNotMatch(stats,/metric\('Тренировки',ws\.length,'◫'\)/);
});

test('program creation opens after save and program page has a direct owner',()=>{
  const editor=read('program-editor.js'),management=read('program-management-patch.js');
  assert.ok(editor.indexOf('try{save()}')<editor.indexOf('openEditor(p.id,0,0)'));
  assert.match(management,/window\.trainerProgramsPage=function/);
  assert.match(management,/openManagedProgramV385/);
  assert.match(management,/program-week-intensity-v385/);
});

test('completion is compact and legacy reports are suppressed',()=>{
  const completion=read('workout-completion.js');
  assert.match(completion,/data-compact-completion-v385/);
  assert.doesNotMatch(completion,/СЛЕДУЮЩАЯ ТРЕНИРОВКА/);
  for(const name of ['advanced-training.js','workout-duration.js','performance-control.js']){
    assert.match(read(name),/data-compact-completion-v385/);
  }
});
