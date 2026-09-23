'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');

test('startup reveals the current shell after storage and program hydration',()=>{
 const html=read('index.html'),boot=read('startup-orchestrator.js');
 assert.equal((html.match(/id="unvrsl-startup-v258"/g)||[]).length,1);
 assert.equal((html.match(/src="startup-orchestrator\.js\?v=406"/g)||[]).length,1);
 assert.match(boot,/__unvrslStorageHydrationSettledV386!==true/);
 assert.match(boot,/__unvrslProgramsMigratedV386/);
 assert.match(boot,/await paintFinalInterface\(\)/);
 assert.doesNotMatch(html,/controllerchange|location\.reload\(\)/);
});

test('trainer Plan has one deferred owner and no polling renderer',()=>{
 const trainer=read('trainer-self-plan.js'),loader=read('frequent-patch.js');
 assert.match(trainer,/stableHtml\(hosts\.history/);
 assert.doesNotMatch(trainer,/setInterval\([^\n]*renderSelf/);
 assert.equal((loader.match(/'trainer-self-plan\.js\?v=406'/g)||[]).length,1);
 assert.doesNotMatch(loader,/trainer-self-plan-v110/);
});

test('v260 queues boot renders and paints once after every canonical owner is ready',async()=>{
  const htmlClasses=new Set(),bodyClasses=new Set();
  const classList=set=>({contains:name=>set.has(name),add:(...names)=>names.forEach(name=>set.add(name))});
  const splashClasses=new Set();let removed=0,renders=0,intervalCleared=0;
  const splash={querySelector:()=>null,classList:{add:name=>splashClasses.add(name)},remove:()=>removed++};
  const context={
    console,Promise,CustomEvent:class{constructor(name,init){this.type=name;this.detail=init?.detail}},
    __unvrslDynamicModulesReadyV260:false,__unvrslReadinessStackReadyV260:false,__unvrslCloudModulesSettledV260:false,
    __unvrslStatsAuthorityV254:false,__unvrslTrainerShellV252:false,__unvrslClientWorkoutScrollV261:false,
    cloud:{initSettled:false,user:null,profile:null},render:()=>renders++,
    requestAnimationFrame:fn=>fn(),setTimeout:fn=>{fn();return 1},setInterval:()=>7,clearInterval:id=>{if(id===7)intervalCleared++},
    addEventListener:()=>{},dispatchEvent:()=>{},
    document:{
      readyState:'complete',documentElement:{classList:classList(htmlClasses)},body:{classList:classList(bodyClasses)},
      getElementById:id=>id==='unvrsl-startup-v258'?splash:id==='plan'?{classList:{contains:()=>false}}:id==='unvrsl-startup-v258-style'?{remove:()=>{}}:null
    }
  };
  context.window=context;
  vm.runInNewContext(read('startup-orchestrator.js'),context);
  context.render();assert.equal(renders,0);
  Object.assign(context,{__unvrslDynamicModulesReadyV260:true,__unvrslReadinessStackReadyV260:true,__unvrslCloudModulesSettledV260:true,__unvrslStatsAuthorityV254:true,__unvrslTrainerShellV252:true,__unvrslClientWorkoutScrollV261:true});
  Object.assign(context,{__unvrslCriticalModulesReadyV320:true,__unvrslUiStabilityV316:true,unvrslProgramModelV386:{},__unvrslProgramsMigratedV386:true,__unvrslStorageHydrationSettledV386:true,__unvrslReadinessStackReadyV386:true,trainingRequestProgramStartV382:()=>{}});
  context.cloud.initSettled=true;
  await context.unvrslTryFinalizeStartupV260();
  assert.equal(renders,1);
  assert.ok(htmlClasses.has('unvrsl-app-ready-v260'));
  assert.ok(bodyClasses.has('unvrsl-app-ready-v260'));
  assert.ok(splashClasses.has('out'));
  assert.equal(removed,1);assert.equal(intervalCleared,1);
});

test('v260 preloads only active runtime files before ordered execution',()=>{
  const loader=read('frequent-patch.js');
  assert.match(loader,/link\.rel='preload';link\.as='script'/);
  assert.match(loader,/__unvrslCanonicalPreloadsV260/);
  for(const old of ['stats-dashboard-v2.js','home-stats-v2.js','stats-cleanup.js','startup-splash-v156.js'])assert.doesNotMatch(loader,new RegExp(old.replaceAll('.','\\.')));
  assert.equal(fs.existsSync(path.join(root,'legacy-retirement.js')),false);
});

test('client Plan history supplements one canonical renderer without wrapping it',()=>{
  const journal=read('client-journal-profile.js'),picker=read('client-program-picker.js');
  assert.match(picker,/clientPlanPageV3\.__clientPlanV255=true/);
  assert.match(journal,/client-plan-history-v256/);
  assert.match(journal,/__clientPlanHistoryHtml!==html/);
  assert.doesNotMatch(journal,/window\.clientCleanPlanPage=w/);
  assert.doesNotMatch(journal,/\[0,300,900,1800\]/);
  assert.doesNotMatch(journal,/setInterval\([^\n]*planExtras/);
});
