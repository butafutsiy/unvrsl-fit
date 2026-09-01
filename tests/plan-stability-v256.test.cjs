'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');

test('startup has one static owner and never reloads the page',()=>{
  const html=read('index.html'),style=read('og-style.js'),retirement=read('legacy-retirement-v256.js');
  assert.equal((html.match(/id="unvrsl-startup-v256"/g)||[]).length,1);
  assert.equal((html.match(/id="unvrsl-startup-v256-style"/g)||[]).length,1);
  assert.match(html,/og-style\.js\?v=256/);
  assert.doesNotMatch(html,/controllerchange|location\.reload\(\)/);
  assert.doesNotMatch(style,/new MutationObserver|unvrslFinalPulse|createElement\('div'\)/);
  assert.match(style,/setTimeout\(release,1800\)/);
  assert.match(retirement,/unvrsl-startup-splash-final/);
});

test('trainer Plan owns its old journal style and renders only on demand',()=>{
  const trainer=read('trainer-self-plan-v110.js'),loader=read('frequent-patch.js');
  assert.match(trainer,/trainer-self-plan-v256-style/);
  assert.match(trainer,/text-align:left!important/);
  assert.match(trainer,/stableHtml\(hosts\.history/);
  assert.match(trainer,/__trainerSelfPlanAuthorityV256/);
  assert.doesNotMatch(trainer,/setInterval\([^\n]*renderSelf/);
  assert.doesNotMatch(trainer,/\[200,700,1600,3000[^\n]*renderSelf/);
  const adaptive=loader.indexOf("loadExternalScript('adaptive-effort-v2.js')");
  const cardio=loader.indexOf("loadExternalScript('cardio-exercise-library.js')");
  const owner=loader.indexOf("loadExternalScript('trainer-self-plan-v110.js?v=256')");
  const stats=loader.indexOf("loadExternalScript('stats-authority-v254.js')");
  assert.ok(adaptive>=0&&cardio>adaptive&&owner>cardio&&stats>owner);
  assert.equal((loader.match(/trainer-self-plan-v110\.js/g)||[]).length,1);
});

test('client Plan history supplements one canonical renderer without wrapping it',()=>{
  const journal=read('client-journal-profile-v107.js'),picker=read('client-program-picker.js');
  assert.match(picker,/clientPlanPageV3\.__clientPlanV255=true/);
  assert.match(journal,/client-plan-history-v256/);
  assert.match(journal,/__clientPlanHistoryHtml!==html/);
  assert.doesNotMatch(journal,/window\.clientCleanPlanPage=w/);
  assert.doesNotMatch(journal,/\[0,300,900,1800\]/);
  assert.doesNotMatch(journal,/setInterval\([^\n]*planExtras/);
});
