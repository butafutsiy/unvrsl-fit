'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');

test('statistics renderers do not contain body-weight UI',()=>{
  const app=read('app.js');
  const dashboard=read('stats-dashboard-v2.js');
  const baseStats=app.match(/function statsPage\(\)[\s\S]*?\nfunction exercisesPage/)?.[0]||'';
  const dashboardHtml=dashboard.match(/function dashboardHtml\(\)[\s\S]*?\n  function renderDashboard/)?.[0]||'';
  assert.doesNotMatch(baseStats,/Вес тела|weightChart\(false\)/);
  assert.doesNotMatch(dashboardHtml,/Вес тела|Вес 30 дн\.|weightCardHtml/);
  assert.match(dashboardHtml,/Средний RPE/);
  assert.doesNotMatch(read('online-progress.js'),/root\.appendChild\(box\)|baseStats=window\.statsPage/);
});

test('final statistics authority loads after both async module chains',()=>{
  const loader=read('frequent-patch.js');
  const settled=loader.indexOf('Promise.allSettled([templateChain,programChain,cloudChain,uiChain])');
  const authority=loader.indexOf("loadExternalScript('stats-authority-v252.js')");
  const postLoad=loader.indexOf("loadExternalScript('cardio-exercise-library.js')");
  const trainerShell=loader.indexOf("loadExternalScript('trainer-shell-v252.js')");
  assert.ok(settled>=0&&postLoad>settled&&authority>postLoad&&trainerShell>authority);
  assert.match(read('stats-authority-v252.js'),/window\.statsPage=canonicalStatsPage/);
});

test('trainer shell uses one role predicate and restores both trainer tabs',()=>{
  const trainer=read('trainer.js');
  const mode=read('app-mode.js');
  const shell=read('trainer-shell-v252.js');
  assert.match(trainer,/butafutsiy@mail\.ru/);
  assert.match(mode,/window\.refreshTrainerNav\(\)/);
  assert.match(shell,/ORDER=\['home','plan','programs','start','stats','exercises','clients'\]/);
  assert.match(shell,/window\.trainerIsTrainer=isTrainer/);
  assert.match(shell,/ensureButton\(navEl,id\)/);
  assert.match(shell,/renderTrainerPage\(p\)/);
});

test('v252 service worker removes old app caches and never writes responses',()=>{
  const sw=read('sw.js');
  assert.match(sw,/key\.startsWith\(CACHE_PREFIX\)/);
  assert.match(sw,/fetch\(event\.request,\{cache:'no-store'\}\)/);
  assert.doesNotMatch(sw,/cache\.put|caches\.match|caches\.open/);
});
