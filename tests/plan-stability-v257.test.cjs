'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');

test('startup has one static owner and reveals only the final v260 interface',()=>{
  const html=read('index.html'),style=read('og-style.js'),boot=read('startup-orchestrator-v260.js'),retirement=read('legacy-retirement-v257.js'),weekOne=read('plan-w1.js');
  assert.equal((html.match(/id="unvrsl-startup-v258"/g)||[]).length,1);
  assert.equal((html.match(/id="unvrsl-startup-v258-style"/g)||[]).length,1);
  assert.match(html,/startup-orchestrator-v260\.js\?v=260/);
  assert.match(html,/og-style\.js\?v=260/);
  assert.match(html,/@keyframes unvrslStartupBlinkV258/);
  assert.match(html,/\.u-brand\{font:900 42px\/\.95/);
  assert.match(html,/plan-w1\.js\?v=258/);
  assert.doesNotMatch(weekOne,/unvrslBoot|unvrsl-booting|createElement\('div'\)|unvrslBootPulse/);
  assert.doesNotMatch(html,/controllerchange|location\.reload\(\)/);
  assert.doesNotMatch(style,/unvrslFinalPulse|release\('timeout'\)|classList\.add\('out'\)/);
  assert.match(boot,/__unvrslDynamicModulesReadyV260/);
  assert.match(boot,/__unvrslReadinessStackReadyV260/);
  assert.match(boot,/client-runtime-ready-v260/);
  assert.match(boot,/__unvrslBootRenderGateV260/);
  assert.match(boot,/await paintFinalInterface\(\)[\s\S]*classList\.add\(READY_CLASS\)[\s\S]*splash\?\.classList\.add\('out'\)/);
  assert.doesNotMatch(boot,/release\('timeout'\)|15000/);
  assert.match(html,/html:not\(\.unvrsl-app-ready-v260\) \.app/);
  assert.match(retirement,/unvrsl-startup-splash-final/);
  assert.match(retirement,/#unvrslBoot/);
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
  const owner=loader.indexOf("loadExternalScript('trainer-self-plan-v110.js?v=260')");
  const stats=loader.indexOf("loadExternalScript('stats-authority-v254.js')");
  assert.ok(adaptive>=0&&cardio>adaptive&&owner>cardio&&stats>owner);
  assert.equal((loader.match(/loadExternalScript\('trainer-self-plan-v110\.js\?v=260'\)/g)||[]).length,1);
});

test('v260 queues boot renders and paints once after every canonical owner is ready',async()=>{
  const htmlClasses=new Set(),bodyClasses=new Set();
  const classList=set=>({contains:name=>set.has(name),add:name=>set.add(name)});
  const splashClasses=new Set();let removed=0,renders=0,intervalCleared=0;
  const splash={classList:{add:name=>splashClasses.add(name)},remove:()=>removed++};
  const context={
    console,Promise,CustomEvent:class{constructor(name,init){this.type=name;this.detail=init?.detail}},
    __unvrslDynamicModulesReadyV260:false,__unvrslReadinessStackReadyV260:false,__unvrslCloudModulesSettledV260:false,
    __unvrslStatsAuthorityV254:false,__unvrslTrainerShellV252:false,__unvrslClientWorkoutScrollV259:false,
    cloud:{initSettled:false,user:null,profile:null},render:()=>renders++,
    requestAnimationFrame:fn=>fn(),setTimeout:fn=>{fn();return 1},setInterval:()=>7,clearInterval:id=>{if(id===7)intervalCleared++},
    addEventListener:()=>{},dispatchEvent:()=>{},
    document:{
      readyState:'complete',documentElement:{classList:classList(htmlClasses)},body:{classList:classList(bodyClasses)},
      getElementById:id=>id==='unvrsl-startup-v258'?splash:id==='plan'?{classList:{contains:()=>false}}:id==='unvrsl-startup-v258-style'?{remove:()=>{}}:null
    }
  };
  context.window=context;
  vm.runInNewContext(read('startup-orchestrator-v260.js'),context);
  context.render();assert.equal(renders,0);
  Object.assign(context,{__unvrslDynamicModulesReadyV260:true,__unvrslReadinessStackReadyV260:true,__unvrslCloudModulesSettledV260:true,__unvrslStatsAuthorityV254:true,__unvrslTrainerShellV252:true,__unvrslClientWorkoutScrollV259:true});
  context.cloud.initSettled=true;
  await context.unvrslTryFinalizeStartupV260();
  assert.equal(renders,1);
  assert.ok(htmlClasses.has('unvrsl-app-ready-v260'));
  assert.ok(bodyClasses.has('unvrsl-app-ready-v260'));
  assert.ok(splashClasses.has('out'));
  assert.equal(removed,1);assert.equal(intervalCleared,1);
});

test('v260 preloads only active runtime files before ordered execution',()=>{
  const loader=read('frequent-patch.js'),retired=read('legacy-retirement-v257.js');
  assert.match(loader,/link\.rel='preload';link\.as='script'/);
  assert.match(loader,/__unvrslCanonicalPreloadsV260/);
  for(const old of ['stats-dashboard-v2.js','home-stats-v2.js','stats-cleanup.js','startup-splash-v156.js'])assert.doesNotMatch(loader,new RegExp(old.replaceAll('.','\\.')));
  assert.match(retired,/window\.unvrslLegacyCleanV260=clean/);
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
