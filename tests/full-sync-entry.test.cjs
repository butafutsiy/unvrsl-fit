'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../cloud.js'),'utf8');
const entry=source.slice(source.indexOf('async function cloudSyncAll()'),source.indexOf('\n\n\nfunction inviteNeedsCloudSheet'));
function fixture(sync){
 const messages=[],c={cloud:{user:{id:'owner'}},window:{},toast:m=>messages.push(m),console:{warn(){}},cloudAccountSheet(){throw Error('Unexpected login')}};
 if(sync)c.window.accountSyncNow=sync;
 vm.createContext(c);vm.runInContext(entry,c);return{c,messages};
}
test('sync button delegates to full account upload regardless of module load order',async()=>{
 let calls=0;const f=fixture(async()=>{calls++;return true;});
 assert.equal(await f.c.cloudSyncAll(),true);assert.equal(calls,1);assert.match(f.messages.at(-1),/программы/);
 const late=fixture();late.c.window.loadExternalScript=async()=>{late.c.window.accountSyncNow=async()=>true;};
 assert.equal(await late.c.cloudSyncAll(),true);assert.match(late.messages.at(-1),/программы/);
});
test('missing module and failed upload never produce a successful sync message',async()=>{
 for(const f of [fixture(),fixture(async()=>false),fixture(async()=>{throw Error('offline');})]){
  assert.equal(await f.c.cloudSyncAll(),false);assert.match(f.messages.at(-1),/не завершена/);assert.ok(!f.messages.some(m=>/^Синхронизировано/.test(m)));
 }
});
