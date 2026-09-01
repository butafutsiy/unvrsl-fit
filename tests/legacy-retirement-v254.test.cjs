'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');

test('v254 retirement guard loads before every application module',()=>{
  const html=read('index.html');
  const first=html.match(/<script src="([^"]+)"/);
  assert.equal(first?.[1],'legacy-retirement-v254.js');
});

test('active loaders refuse retired scripts and use only canonical Statistics modules',()=>{
  const loader=read('frequent-patch.js');
  const settings=read('og-settings.js');
  const client=read('client-final-runtime-v222.js');
  for(const source of [loader,settings,client])assert.match(source,/unvrslScriptRetiredV254/);
  for(const name of ['stats-dashboard-v254.js','home-stats-v254.js','stats-cleanup-v254.js','stats-authority-v254.js'])assert.match(loader,new RegExp(name.replaceAll('.','\\.')));
  assert.doesNotMatch(loader,/loadExternalScript\('(stats-dashboard-v2|home-stats-v2|stats-cleanup|stats-authority-v253)\.js'\)/);
  assert.match(client,/client-final-runtime-v254-style/);
  assert.match(read('og-style.js'),/og-enhance-v254\.js/);
  assert.doesNotMatch(read('og-style.js'),/og-style-legacy-v157\.js/);
});

test('retired registry blocks every superseded renderer family',()=>{
  const source=read('legacy-retirement-v254.js');
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
  for(const name of ['stats-authority-v252.js','stats-authority-v253.js','stats-dashboard-v2.js','home-stats-v2.js','stats-cleanup.js','og-style-legacy-v157.js','trainer-client-detail-v2.js']){
    assert.equal(window.unvrslScriptRetiredV254(name),true,name);
  }
  assert.equal(window.unvrslScriptRetiredV254('stats-authority-v254.js'),false);
  assert.equal(window.unvrslScriptRetiredV254('stats-dashboard-v254.js'),false);
  assert.equal(window.__unvrslStatsAuthorityV253,true);
  assert.equal(window.__unvrslStatsDashboardV2,true);
  assert.equal(window.__unvrslTrainerClientDetailV2,true);
  assert.equal(appended[0]?.id,'legacy-retirement-v254-style');
});

test('superseded source files are removed from the published tree',()=>{
  for(const name of ['legacy-retirement-v253.js','og-style-legacy-v157.js','stats-dashboard-v2.js','home-stats-v2.js','stats-cleanup.js','stats-authority-v253.js']){
    assert.equal(fs.existsSync(path.join(root,name)),false,name);
  }
});
