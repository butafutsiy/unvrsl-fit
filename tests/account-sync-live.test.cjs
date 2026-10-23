'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const clone=x=>JSON.parse(JSON.stringify(x));
async function device(server){
 const timers=new Map(),intervals=[],storage=new Map();let timerId=0;
 const local={accountOwnerId:'owner',programs:[],sessions:[],bw:[],current:null};
 const w={save:()=>true,addEventListener(){},dispatchEvent(){}};
 const client={auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange(){}},from(table){
  let payload,filterStamp;const q={select(){return q},eq(k,v){if(k==='updated_at')filterStamp=v;return q},order(){return q},range:async()=>({data:[],error:null}),
   maybeSingle:async()=>({data:server.row?clone(server.row):null,error:null}),update(v){payload=clone(v);return q},insert(v){payload=clone(v);return q},
   then(resolve,reject){return(async()=>{
    if(server.fail)return{data:null,error:{message:'offline'}};
    if(server.hook){const hook=server.hook;server.hook=null;await hook()}
    if(filterStamp&&server.row?.updated_at!==filterStamp)return{data:[],error:null};
    server.writes++;server.row={...payload,updated_at:'revision-'+server.writes};
    return{data:[{user_id:'owner'}],error:null};
   })().then(resolve,reject)}
  };return q;
 }};
 w.cloud={client,user:null};
 const c={window:w,st:local,save:w.save,console:{warn(){}},Date,CustomEvent:class{},
  localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
  document:{visibilityState:'visible',addEventListener(){},querySelector(){return null}},
  workoutStore:{activateAccount:s=>s,restore(){},journal:()=>({closed:{}})},restoreAppearance(){},
  setTimeout:(fn,delay)=>{timers.set(++timerId,{fn,delay});return timerId},clearTimeout:id=>timers.delete(id),setInterval:fn=>intervals.push(fn)};
 Object.defineProperty(w,'st',{get:()=>c.st});vm.createContext(c);vm.runInContext(fs.readFileSync('account-sync.js','utf8'),c);
 await new Promise(resolve=>setImmediate(resolve));w.cloud.user={id:'owner',email:'owner@example.test'};
 return{c,w,timers,intervals};
}
test('repeated local saves do not postpone the first cloud upload',async()=>{
 const d=await device({writes:0});for(let i=0;i<10;i++)d.w.save();
 assert.equal(d.timers.size,1);assert.equal([...d.timers.values()][0].delay,1200);
});
test('browser and installed app converge on program additions and edits',async()=>{
 const server={writes:0},browser=await device(server),app=await device(server);
 browser.c.st.programs.push({id:'p',name:'Browser plan',updated:100});browser.w.save();await browser.w.accountSyncNow({quiet:true});
 await app.w.accountSyncNow({quiet:true});assert.equal(app.c.st.programs[0].name,'Browser plan');
 app.c.st.programs[0].name='Edited in app';app.c.st.programs[0].updated=200;app.w.save();await app.w.accountSyncNow({quiet:true});
 await browser.w.accountSyncNow({quiet:true});assert.equal(browser.c.st.programs[0].name,'Edited in app');
 assert.match(browser.w.accountSyncStatusText(),/owner@example.test.*Синхронизировано/);
});
test('explicit save during an upload waits until the newly added program reaches the cloud',async()=>{
 const server={writes:0},d=await device(server);let release;
 server.hook=()=>new Promise(resolve=>release=resolve);
 d.c.st.programs.push({id:'one',updated:100});d.w.save();const first=d.w.accountSyncNow({quiet:true});
 while(!release)await new Promise(resolve=>setImmediate(resolve));
 d.c.st.programs.push({id:'two',updated:200});d.w.save();const second=d.w.accountSyncNow({quiet:true});
 release();assert.equal(await first,true);assert.equal(await second,true);
 assert.deepEqual(server.row.state.programs.map(p=>p.id).sort(),['one','two']);assert.equal(server.writes,2);assert.equal(d.w.__unvrslSyncState.status,'synced');
});
test('visible installed app polls new programs; failed sync keeps the local copy',async()=>{
 const server={writes:0},browser=await device(server),app=await device(server);
 browser.c.st.programs.push({id:'new',updated:1});browser.w.save();await browser.w.accountSyncNow({quiet:true});
 app.intervals[0]();for(let i=0;i<3;i++)await new Promise(resolve=>setImmediate(resolve));
 assert.equal(app.c.st.programs[0].id,'new');server.fail=true;app.c.st.programs[0].name='Local edit';app.w.save();
 assert.equal(await app.w.accountSyncNow({quiet:true}),false);assert.equal(app.c.st.programs[0].name,'Local edit');assert.equal(app.w.__unvrslSyncState.status,'error');
});
