'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const Nutrition=require('../nutrition-state.js');
function fixture(conflict=false,localSaved=true){
 const storage=new Map(),events=[],writes=[];
 const user={id:'fixture-user'},local={accountOwnerId:user.id,sessions:[],bw:[],mealNutritionV1:{updatedAt:200,days:{'2026-10-12':{extra:[{id:'local',updatedAt:200,nutrition:{k:100}}],eaten:{},updatedAt:200}}}};
 const remote={accountOwnerId:user.id,sessions:[],bw:[],mealNutritionV1:{updatedAt:100,days:{'2026-10-12':{extra:[{id:'remote',updatedAt:100,nutrition:{k:200}}],eaten:{},updatedAt:100}}}};
 const window={st:local,UNVRSLNutritionState:Nutrition,dispatchEvent:e=>events.push(e),addEventListener(){},save:()=>localSaved};
 const client={from(table){let payload,operation='read',filters=[];const query={select(){return query;},eq(key,value){filters.push([key,value]);return query;},order(){return query;},range:async()=>({data:[],error:null}),maybeSingle:async()=>({data:{state:remote,updated_at:'2026-10-12T00:00:00.000Z',client_updated_at:'2026-10-12T00:00:00.000Z'},error:null}),update(value){operation='update';payload=value;return query;},insert(value){operation='insert';payload=value;return query;},then(resolve){writes.push({table,operation,filters,payload});return Promise.resolve({data:conflict?[]:[{user_id:user.id}],error:null}).then(resolve);}};return query;},auth:{getSession:async()=>({data:{session:{user}}}),onAuthStateChange(){}}};
 window.cloud={client,user};
 const context={window,localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,v)=>storage.set(key,v)},workoutStore:{journal:()=>({closed:{}}),activateAccount:state=>state,restore(){}},restoreAppearance(){},save(){return true;},st:local,CustomEvent:class {constructor(type){this.type=type}},document:{addEventListener(){},querySelector(){return null;}},setTimeout(){return 1;},clearTimeout(){},Date,console:{warn(){}}};
 vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'../account-sync.js'),'utf8'),context);
 return {context,window,writes,storage,events};
}
test('account synchronization uses a version condition and retains both device diary entries',async()=>{
 const f=fixture();await f.window.accountSyncNow({quiet:true});
 const write=f.writes.find(x=>x.table==='user_app_state');assert.equal(write.operation,'update');assert.deepEqual(write.filters[1],['updated_at','2026-10-12T00:00:00.000Z']);assert.deepEqual(JSON.parse(JSON.stringify(write.payload.state.mealNutritionV1.days['2026-10-12'].extra.map(x=>x.id))).sort(),['local','remote']);assert.equal(f.window.__unvrslSyncState.status,'synced');
});
test('a concurrent server update is not overwritten and the interface reports an unsynced local copy',async()=>{
 const f=fixture(true);assert.equal(await f.window.accountSyncNow({quiet:true}),false);assert.equal(f.window.__unvrslSyncState.status,'error');assert.equal(f.context.st.mealNutritionV1.days['2026-10-12'].extra.length,2);
});
test('failed local storage is never marked as a new successful save',()=>{
 const f=fixture(false,false);const before=f.storage.size;assert.equal(f.window.save(),false);assert.equal(f.storage.size,before);
});
