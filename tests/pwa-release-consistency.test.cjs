'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const html=read('index.html'),sw=read('sw.js');
const pageRelease=html.match(/__unvrslRelease\s*=\s*['"](v\d+)['"]/)?.[1];
const workerRelease=sw.match(/SW_RELEASE\s*=\s*['"](v\d+)['"]/)?.[1];
test('page, service worker and registration use the same current release',()=>{
  assert.ok(pageRelease);assert.equal(pageRelease,workerRelease);
  assert.equal('v'+html.match(/serviceWorker\.register\('\.\/sw\.js\?v=(\d+)'/)?.[1],pageRelease);
});
test('both update notices stay absent after loading the published release',async()=>{
  const events={},notices=[];let reloads=0;
  const document={hidden:false,head:{appendChild(){}},body:{appendChild:n=>notices.push(n)},
    createElement:()=>({setAttribute(){},querySelector:()=>({addEventListener(){}})}),
    getElementById:()=>null,querySelector:()=>({insertAdjacentElement:(_,n)=>notices.push(n)}),
    addEventListener:(name,fn)=>events['document:'+name]=fn};
  const navigator={onLine:true,serviceWorker:{addEventListener:(name,fn)=>{(events['sw:'+name]||=[]).push(fn)},getRegistration:async()=>({update:async()=>{}})}};
  const window={__unvrslRelease:pageRelease,document,navigator,location:{reload(){reloads++}},
    addEventListener:(name,fn)=>events[name]=fn,fetch:async()=>({ok:true,text:async()=>html}),persistWorkoutState:async()=>true};
  vm.runInNewContext(read('app-refresh.js'),{window,document,Date,Error});
  vm.runInNewContext(read('pwa-refresh-ui.js'),{window,document,navigator,Date,fetch:async()=>({ok:true,text:async()=>sw})});
  for(const fn of events['sw:message'])fn({data:{type:'UNVRSL_RELEASE_READY',release:workerRelease}});
  await window.checkAppUpdate();events.pageshow();await new Promise(r=>setImmediate(r));
  assert.equal(notices.length,0);assert.equal(reloads,0);
  assert.equal(await window.applyAppUpdate(),false);
});
