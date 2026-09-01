'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');

test('retirement guard loads before every application module',()=>{
  const html=read('index.html');
  const first=html.match(/<script src="([^"]+)"/);
  assert.equal(first?.[1],'legacy-retirement-v253.js');
});

test('active loaders refuse retired scripts and skip superseded client renderers',()=>{
  const loader=read('frequent-patch.js');
  const settings=read('og-settings.js');
  const client=read('client-final-runtime-v222.js');
  for(const source of [loader,settings,client])assert.match(source,/unvrslScriptRetiredV253/);
  assert.doesNotMatch(loader,/loadExternalScript\('trainer-client-detail-v2\.js'\)|loadExternalScript\('client-experience-v2\.js'\)/);
  assert.doesNotMatch(loader,/['"]trainer-client-detail-v2\.js['"],|['"]client-experience-v2\.js['"],/);
  assert.match(client,/client-final-runtime-v253-style/);
});

test('retired module registry blocks old renderer families',()=>{
  const source=read('legacy-retirement-v253.js');
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
  assert.equal(window.unvrslScriptRetiredV253('./stats-authority-v252.js?v=1'),true);
  assert.equal(window.unvrslScriptRetiredV253('trainer-client-detail-v2.js'),true);
  assert.equal(window.unvrslScriptRetiredV253('stats-authority-v253.js'),false);
  assert.equal(window.__unvrslStatsAuthorityV252,true);
  assert.equal(window.__unvrslTrainerClientDetailV2,true);
  assert.equal(appended[0]?.id,'legacy-retirement-v253-style');
});
