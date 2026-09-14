const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');

test('service worker never forces navigation or reload',()=>{
  const source=read('sw.js');
  assert.match(source,/v389-stable-startup/);
  assert.doesNotMatch(source,/client\.navigate|location\.reload|controllerchange/);
  assert.match(source,/UNVRSL_RELEASE_READY/);
});

test('startup is local-shell first and begins at zero',()=>{
  const source=read('startup-orchestrator.js');
  assert.match(source,/RELEASE=389/);
  assert.match(source,/paintProgress\(0\)/);
  assert.match(source,/function localCoreReady\(\)/);
  assert.match(source,/__unvrslUiStabilityV316/);
  assert.doesNotMatch(source,/function coreReady\([\s\S]*cloudSettled/);
  assert.doesNotMatch(source,/__unvrslClientRuntimeSettledV260/);
  assert.match(source,/W\.__unvrslStartupComplete=true/);
  assert.match(source,/target=100/);
});

test('cloud and client events hydrate after release instead of blocking startup',()=>{
  const source=read('startup-orchestrator.js');
  assert.match(source,/function hydrateRuntime\(\)/);
  assert.match(source,/unvrsl:cloud-ready/);
  assert.match(source,/unvrsl:client-ready/);
  assert.match(source,/if\(!released\)return/);
});
