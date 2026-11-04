'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {webcrypto}=require('node:crypto');
const {TextEncoder}=require('node:util');

const rootDir=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(rootDir,'public-progress.js'),'utf8');
const page=fs.readFileSync(path.join(rootDir,'progress.html'),'utf8');
const snapshot={client:{name:'Тестовый клиент',height:175,birthDate:'2000-02-10'},measurements:[],strengths:[]};
const response={data:{data:snapshot,updated_at:'2026-11-04',viewer_source:'client'},error:null};

async function runScenario(primary,anonymous,{fastTimeout=false}={}){
  const calls=[];
  const root={innerHTML:'<div class="pp-loader">Загружаю прогресс</div>',querySelectorAll:()=>[]};
  let finished=0,timeoutCount=0,sessionChecks=0;
  const window={
    location:{hash:'#t='+('a'.repeat(48)),reload(){}},
    UNVRSL_CLOUD:{url:'https://example.supabase.co',anonKey:'test-anon-key'},
    supabase:{createClient(_url,_key,options){
      calls.push(options);
      return {
        auth:{getSession(){sessionChecks++;return new Promise(()=>{})}},
        rpc(){return options.auth.persistSession?primary():anonymous()}
      };
    }},
    setTimeout(fn,ms){
      if(fastTimeout&&ms===9000&&timeoutCount++===0){queueMicrotask(fn);return 0}
      return setTimeout(fn,ms);
    },
    clearTimeout,
    localStorage:{getItem:()=>null,setItem(){}},
    __unvrslProgressFinish(){finished++}
  };
  const document={getElementById:()=>root,addEventListener(){},title:''};
  vm.runInNewContext(source,{
    window,document,crypto:webcrypto,TextEncoder,URLSearchParams,
    requestAnimationFrame:cb=>cb(),setTimeout,clearTimeout,console:{warn(){}}
  },{filename:'public-progress.js'});
  for(let i=0;i<50;i++){
    await new Promise(resolve=>setImmediate(resolve));
    if(finished)break;
  }
  return {html:root.innerHTML,calls,finished,sessionChecks};
}

test('client page starts its own loader before optional nutrition scripts',()=>{
  const main=page.indexOf('<script src="public-progress.js?v=601"></script>');
  const meals=page.indexOf('<script src="meal-engine.js');
  assert.ok(main>0&&meals>main);
  assert.match(page,/window\.__unvrslProgressFinish/);
  assert.match(page,/UNVRSL_PUBLIC_SUPABASE_READY/);
  assert.match(page,/unpkg\.com\/@supabase/);
  assert.match(source,/await bounded\(W\.UNVRSL_PUBLIC_SUPABASE_READY,14000\)/);
  assert.match(page,/23000/);
  assert.match(page,/pp-retry/);
});

test('shared progress loads without an extra blocking getSession call',async()=>{
  const view=await runScenario(()=>Promise.resolve(response),()=>{throw Error('Anonymous retry should not run')});
  assert.match(view.html,/Тестовый клиент/);
  assert.equal(view.calls.length,1);
  assert.equal(view.calls[0].auth.persistSession,true);
  assert.equal(view.sessionChecks,0);
  assert.equal(view.finished,1);
});

test('a failed authenticated request retries anonymously with the same private share',async()=>{
  const view=await runScenario(()=>Promise.reject(Error('Storage is locked')),()=>Promise.resolve(response));
  assert.match(view.html,/Тестовый клиент/);
  assert.equal(view.calls.length,2);
  assert.equal(view.calls[1].auth.persistSession,false);
  assert.equal(view.calls[1].auth.autoRefreshToken,false);
  assert.equal(view.finished,1);
});

test('a never-resolving request times out instead of keeping the spinner',async()=>{
  const view=await runScenario(()=>new Promise(()=>{}),()=>Promise.resolve(response),{fastTimeout:true});
  assert.match(view.html,/Тестовый клиент/);
  assert.equal(view.calls.length,2);
  assert.equal(view.finished,1);
});

test('an inaccessible share produces a useful error rather than a spinner',async()=>{
  const view=await runScenario(()=>Promise.resolve({data:{data:null},error:null}),()=>Promise.resolve(response));
  assert.match(view.html,/Прогресс не найден/);
  assert.match(view.html,/Повторить/);
  assert.doesNotMatch(view.html,/pp-loader/);
  assert.equal(view.finished,1);
});
