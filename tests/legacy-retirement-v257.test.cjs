'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');

test('v260 retirement guard loads before every application module',()=>{
  const html=read('index.html');
  const first=html.match(/<script src="([^"]+)"/);
  assert.equal(first?.[1],'legacy-retirement-v257.js?v=260');
});

test('active loaders refuse retired scripts and use only canonical Statistics modules',()=>{
  const loader=read('frequent-patch.js');
  const settings=read('og-settings.js');
  const client=read('client-final-runtime-v222.js');
  for(const source of [loader,settings,client])assert.match(source,/unvrslScriptRetiredV257/);
  for(const name of ['stats-dashboard-v254.js','home-stats-v254.js','stats-cleanup-v254.js','stats-authority-v254.js'])assert.match(loader,new RegExp(name.replaceAll('.','\\.')));
  assert.doesNotMatch(loader,/loadExternalScript\('(stats-dashboard-v2|home-stats-v2|stats-cleanup|stats-authority-v253)\.js'\)/);
  assert.match(client,/client-runtime-v257-style/);
  assert.match(read('og-style.js'),/og-enhance-v254\.js/);
  assert.doesNotMatch(read('og-style.js'),/og-style-legacy-v157\.js/);
});

test('retired registry blocks every superseded renderer family',()=>{
  const source=read('legacy-retirement-v257.js');
  const appended=[];
  const document={
    readyState:'complete',documentElement:{},
    head:{appendChild:el=>appended.push(el)},
    createElement:()=>({id:'',textContent:''}),
    querySelectorAll:()=>[],getElementById:()=>null,
    addEventListener(){}
  };
  const window={addEventListener(){}};
  const context={window,document,requestAnimationFrame:fn=>fn(),MutationObserver:class{observe(){}},console};
  vm.runInNewContext(source,context);
  for(const name of ['stats-authority-v252.js','stats-authority-v253.js','stats-dashboard-v2.js','home-stats-v2.js','stats-cleanup.js','og-style-legacy-v157.js','trainer-client-detail-v2.js','client-plan-profile-first-v198.js']){
    assert.equal(window.unvrslScriptRetiredV257(name),true,name);
  }
  assert.equal(window.unvrslScriptRetiredV257('legacy-retirement-v256.js'),true);
  assert.equal(window.unvrslScriptRetiredV257('stats-authority-v254.js'),false);
  assert.equal(window.unvrslScriptRetiredV257('stats-dashboard-v254.js'),false);
  assert.equal(window.__unvrslStatsAuthorityV253,true);
  assert.equal(window.__unvrslStatsDashboardV2,true);
  assert.equal(window.__unvrslTrainerClientDetailV2,true);
  assert.equal(window.__unvrslClientPlanProfileFirstV198,true);
  assert.equal(appended[0]?.id,'legacy-retirement-v257-style');
});

test('superseded source files are removed from the published tree',()=>{
  const source=read('legacy-retirement-v257.js');
  const block=source.match(/const retired=\[([\s\S]*?)\];/)?.[1]||'';
  const retired=[...block.matchAll(/'([^']+)'/g)].map(x=>x[1]);
  assert.ok(retired.length>30);
  for(const name of retired){
    assert.equal(fs.existsSync(path.join(root,name)),false,name);
  }
  const active=fs.readdirSync(root).filter(name=>name.endsWith('.js')&&name!=='legacy-retirement-v257.js');
  for(const name of retired){
    const owners=active.filter(file=>read(file).includes(name));
    assert.deepEqual(owners,[],`${name} is still referenced by ${owners.join(', ')}`);
  }
});

test('client Home and Plan have one canonical owner',()=>{
  const runtime=read('client-final-runtime-v222.js');
  const picker=read('client-program-picker.js');
  const journal=read('client-journal-profile-v107.js');
  assert.doesNotMatch(runtime,/function renderClientPlan\s*\(/);
  assert.match(runtime,/canonicalClientPlan\.__clientPlanAuthorityV255/);
  assert.match(runtime,/await script\('client-program-picker\.js\?v=260'\)[\s\S]*await script\('client-journal-profile-v107\.js\?v=260'\)/);
  assert.match(picker,/clientPlanPageV3\.__clientPlanV255=true/);
  assert.match(picker,/clientPlanProfileV255/);
  assert.match(journal,/client-plan-history-v256/);
  assert.doesNotMatch(journal,/window\.clientCleanPlanPage=w/);
  assert.doesNotMatch(read('frequent-patch.js'),/loadExternalScript\('(client-program-picker|client-journal-profile-v107)\.js'\)/);
});
