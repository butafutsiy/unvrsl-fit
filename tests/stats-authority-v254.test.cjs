'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');

test('Statistics contains progress only and history is owned by Plan',()=>{
  const app=read('app.js');
  const dashboard=read('stats-dashboard.js');
  const home=read('home-stats.js');
  const baseStats=app.match(/function statsPage\(\)[\s\S]*?\nfunction openSession/)?.[0]||'';
  const dashboardHtml=dashboard.match(/function dashboardHtml\(\)[\s\S]*?\n  function renderDashboard/)?.[0]||'';
  assert.doesNotMatch(baseStats,/ИСТОРИЯ|История пока|Тренировочный объём/);
  assert.doesNotMatch(dashboardHtml,/ИСТОРИЯ ТРЕНИРОВОК|workoutHistoryHtml|statsOpenWorkout|Вес тела|sd2HeatWrap/);
  assert.match(dashboardHtml,/Прогресс тренировок/);
  assert.match(dashboardHtml,/Средний RPE/);
  assert.match(read('client-journal-profile.js'),/ПРОВЕДЁННЫЕ ТРЕНИРОВКИ/);
  assert.match(read('trainer-self-plan.js'),/ПРОВЕДЁННЫЕ ТРЕНИРОВКИ/);
  assert.match(home,/homeStatsWeightSheet/);
  assert.doesNotMatch(home,/statsWeightSheet|statsGoalSheet|statsSaveWeight|statsSaveGoal/);
});

test('Statistics authority follows its dashboard in the deferred chain',()=>{
 const loader=read('frequent-patch.js');
 assert.match(loader,/'stats-dashboard\.js\?v=392','stats-authority\.js\?v=392'/);
 assert.match(loader,/Promise\.allSettled\(\[templates,programs,workout,stats\]\)/);
 assert.match(read('stats-authority.js'),/window\.statsPage=canonicalStatsPage/);
});

test('trainer shell uses one role predicate and restores both trainer tabs',()=>{
  const trainer=read('trainer.js');
  const mode=read('app-mode.js');
  const shell=read('trainer-shell.js');
  assert.match(trainer,/butafutsiy@mail\.ru/);
  assert.match(mode,/window\.refreshTrainerNav\(\)/);
  assert.match(shell,/ORDER=\['home','plan','programs','start','stats','exercises','clients'\]/);
  assert.match(shell,/window\.trainerIsTrainer=isTrainer/);
  assert.match(shell,/ensureButton\(navEl,id\)/);
  assert.match(shell,/renderTrainerPage\(p\)/);
});

test('service worker stores versioned assets for offline use',()=>{
 assert.match(read('sw.js'),/SHELL = `\$\{CACHE_PREFIX\}shell-\$\{SW_RELEASE\}`/);
 assert.match(read('sw.js'),/MEDIA = `\$\{CACHE_PREFIX\}media-\$\{SW_RELEASE\}`/);
});

test('Anatomy is owned by the final Statistics renderer and every old block is rejected',()=>{
  const dashboard=read('stats-dashboard.js');
  const anatomy=read('anatome-muscle-map.js');
  const authority=read('stats-authority.js');
  assert.match(dashboard,/anatomeMuscleCardHtmlV254/);
  assert.match(anatomy,/window\.anatomeMountCardV254=mount/);
  assert.match(anatomy,/root\.querySelector\('\.sd2-grid'\)/);
  assert.match(authority,/#statsWorkoutHistory208/);
  assert.match(authority,/\.stats-muscle-week/);
  assert.equal(fs.existsSync(path.join(root,'stats-cleanup.js')),false);
  assert.doesNotMatch(dashboard,/heatmapHtml|weightCardHtml|workoutHistoryHtml/);
});

test('superseded UI layers no longer force delayed Home or Statistics rerenders',()=>{
  const density=read('density-ui.js'),mobile=read('mobile-final-fix.js');
  assert.doesNotMatch(density,/typeof statsPage|compactWeightChart/);
  assert.doesNotMatch(mobile,/typeof statsPage/);
});
