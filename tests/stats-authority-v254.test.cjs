'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');

test('Statistics contains progress only and history is owned by Plan',()=>{
  const app=read('app.js');
  const dashboard=read('stats-dashboard-v254.js');
  const home=read('home-stats-v254.js');
  const baseStats=app.match(/function statsPage\(\)[\s\S]*?\nfunction openSession/)?.[0]||'';
  const dashboardHtml=dashboard.match(/function dashboardHtml\(\)[\s\S]*?\n  function renderDashboard/)?.[0]||'';
  assert.doesNotMatch(baseStats,/ИСТОРИЯ|История пока|Тренировочный объём/);
  assert.doesNotMatch(dashboardHtml,/ИСТОРИЯ ТРЕНИРОВОК|workoutHistoryHtml|statsOpenWorkout|Вес тела|sd2HeatWrap/);
  assert.match(dashboardHtml,/Прогресс тренировок/);
  assert.match(dashboardHtml,/Средний RPE/);
  assert.match(read('client-journal-profile-v107.js'),/ПРОВЕДЁННЫЕ ТРЕНИРОВКИ/);
  assert.match(read('trainer-self-plan-v110.js'),/ПРОВЕДЁННЫЕ ТРЕНИРОВКИ/);
  assert.match(home,/homeStatsWeightSheet/);
  assert.doesNotMatch(home,/statsWeightSheet|statsGoalSheet|statsSaveWeight|statsSaveGoal/);
});

test('final Statistics authority loads after all asynchronous module chains',()=>{
  const loader=read('frequent-patch.js');
  const settled=loader.indexOf('Promise.allSettled([templateChain,programChain,cloudChain,uiChain])');
  const authority=loader.indexOf("loadExternalScript('stats-authority-v254.js')");
  const postLoad=loader.indexOf("loadExternalScript('cardio-exercise-library.js')");
  const trainerShell=loader.indexOf("loadExternalScript('trainer-shell-v252.js')");
  assert.ok(settled>=0&&postLoad>settled&&authority>postLoad&&trainerShell>authority);
  assert.match(read('stats-authority-v254.js'),/window\.statsPage=canonicalStatsPage/);
  assert.equal((loader.match(/loadExternalScript\('trainer-self-plan-v110\.js\?v=260'\)/g)||[]).length,1);
  assert.doesNotMatch(read('clients-action-layout.js'),/loadExternalScript\('trainer-self-plan-v110\.js'\)/);
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

test('v260 service worker removes old app caches and never writes responses',()=>{
  const sw=read('sw.js');
  assert.match(sw,/key\.startsWith\(CACHE_PREFIX\)/);
  assert.match(sw,/fetch\(event\.request,\{cache:'no-store'\}\)/);
  assert.doesNotMatch(sw,/cache\.put|caches\.match|caches\.open/);
});

test('Anatomy is owned by the final Statistics renderer and every old block is rejected',()=>{
  const dashboard=read('stats-dashboard-v254.js');
  const anatomy=read('anatome-muscle-map.js');
  const cleanup=read('stats-cleanup-v254.js');
  const authority=read('stats-authority-v254.js');
  assert.match(dashboard,/anatomeMuscleCardHtmlV254/);
  assert.match(anatomy,/window\.anatomeMountCardV254=mount/);
  assert.match(anatomy,/root\.querySelector\('\.sd2-grid'\)/);
  assert.match(cleanup,/#statsWorkoutHistory208/);
  assert.match(cleanup,/sd2-weight-head/);
  assert.match(cleanup,/Активность\\s\*—/);
  assert.match(authority,/#statsWorkoutHistory208/);
  assert.match(authority,/\.stats-muscle-week/);
  assert.doesNotMatch(dashboard,/heatmapHtml|weightCardHtml|workoutHistoryHtml/);
});

test('superseded UI layers no longer force delayed Home or Statistics rerenders',()=>{
  const density=read('density-ui.js'),mobile=read('mobile-final-fix.js');
  assert.doesNotMatch(density,/typeof statsPage|compactWeightChart/);
  assert.doesNotMatch(mobile,/typeof statsPage/);
});
