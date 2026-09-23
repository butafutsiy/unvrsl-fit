'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');

test('v410 uses one cache version across static and dynamic loaders',()=>{
 for(const name of ['index.html','frequent-patch.js']){
  const versions=[...read(name).matchAll(/\?v=(\d+)\b/g)].map(x=>x[1]);
  assert.ok(versions.length);assert.deepEqual([...new Set(versions)],['410']);
 }
 assert.match(read('startup-orchestrator.js'),/RELEASE=410/);
 assert.match(read('sw.js'),/SW_RELEASE = "v410"/);
 assert.match(read('frequent-patch.js'),/searchParams\.set\('v',String\(window\.__unvrslRelease/);
 assert.doesNotMatch(read('frequent-patch.js'),/searchParams\.set\('v','392'\)/);
});

test('navigation and statistics use stable SVG icons',()=>{
  const nav=read('premium-ui.js'),stats=read('stats-dashboard.js');
  assert.match(nav,/unvrslNavApplyIconsV385/);
  assert.match(nav,/m8 5 11 7-11 7Z/);
  assert.match(stats,/METRIC_ICONS/);
  assert.doesNotMatch(stats,/metric\('Тренировки',ws\.length,'◫'\)/);
});

test('program page and editor have one current owner',()=>{
 assert.match(read('program-editor.js'),/__unvrslProgramEditorV386/);
 assert.match(read('program-management-patch.js'),/window\.trainerProgramsPage=function/);
 assert.match(read('program-management-patch.js'),/openManagedProgramV385/);
});

test('completion delegates analytics and avoids the legacy next-workout report',()=>{
 const completion=read('workout-completion.js');
 assert.match(completion,/A\.summary/);
 assert.match(completion,/r\.exercises\.map/);
 assert.doesNotMatch(completion,/СЛЕДУЮЩАЯ ТРЕНИРОВКА/);
 assert.doesNotMatch(read('advanced-training.js'),/window\.summary\s*=/);
});
