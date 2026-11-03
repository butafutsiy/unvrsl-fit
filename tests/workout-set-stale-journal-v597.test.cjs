'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const Store=require('../workout-store.js');
function memory(){
  const entries=new Map();
  return {getItem:key=>entries.get(key)||null,setItem:(key,value)=>entries.set(key,value),entries};
}
function exercise(weight=132.5,done=false){
  return {n:'Жим лёжа',mode:'strength',set:[{w:weight,r:3,rpe:8,rir:2,ok:done}]};
}
function session(id,weight=132.5,done=false){
  return {id,userId:'athlete',date:'2026-11-03',started:1762200000000,ex:[exercise(weight,done)]};
}
const clone=x=>JSON.parse(JSON.stringify(x));
function fixture({archive=true,changeOld=false}={}){
  const storage=memory(),store=Store.create(storage,{now:()=>1762202000000});
  const old=session('old-session',132.5,true),initial={current:old,sessions:[]};
  store.save(initial); // A session from before iOS draft close failed.
  const saved=clone(old);saved.ended=1762201000000;saved.syncStatus='synced';
  if(changeOld){old.ex[0].set[0].r=4;} // A truly unsaved older draft.
  const state={current:session('new-session'),sessions:archive?[saved]:[]};
  return {storage,store,state,old,saved};
}
test('a cloud-completed old journal no longer blocks saving the next workout set',()=>{
  const {storage,store,state}=fixture();
  state.current.ex[0].set[0].ok=true;
  assert.doesNotThrow(()=>store.save(state));
  const j=JSON.parse(storage.getItem(Store.DRAFT));
  assert.equal(j.owners.athlete.id,'new-session');
  assert.equal(j.closed['old-session'].reason,'completed');
  assert.equal(JSON.parse(storage.getItem(Store.PRIMARY)).current.ex[0].set[0].ok,true);
});
test('an older draft with unsaved differing sets is never erased',()=>{
  const {storage,store,state}=fixture({changeOld:true});
  // Journal is still the originally saved old session, which is identical to
  // archive. Mutate the actual journal as if user changed old set offline.
  const j=JSON.parse(storage.getItem(Store.DRAFT));
  j.owners.athlete.ex[0].set[0].r=4;
  storage.setItem(Store.DRAFT,JSON.stringify(j));
  state.current.ex[0].set[0].ok=true;
  assert.throws(()=>store.save(state),/Сначала завершите/);
  const persisted=JSON.parse(storage.getItem(Store.DRAFT));
  assert.equal(persisted.owners.athlete.id,'old-session');
  assert.equal(persisted.owners.athlete.ex[0].set[0].r,4);
  assert.equal(persisted.closed['old-session'],undefined);
});
test('an unresolved old draft without a history entry remains protected',()=>{
  const {storage,store,state}=fixture({archive:false});
  assert.throws(()=>store.checkpoint(state),/Сначала завершите/);
  assert.equal(JSON.parse(storage.getItem(Store.DRAFT)).owners.athlete.id,'old-session');
});
test('real toggleSet on the 132.5 kg / 3 rep row can persist after an archived stale draft',()=>{
  const {storage,store,state}=fixture();
  const source=fs.readFileSync(require.resolve('../app.js'),'utf8');
  const from=source.indexOf('function toggleSet('),to=source.indexOf('async function cancelWorkout()',from);
  assert.ok(from>0&&to>from);
  const toasts=[];
  const c={
    st:state, workoutRegistry:{},
    WorkoutDomain:{validSet:()=>true,loadType:()=> 'external_total',number:x=>x==null?null:Number(x)},
    save:()=>store.save(state),toast:s=>toasts.push(s),startPage:()=>{},
    window:{dispatchEvent(){}},CustomEvent:class{},console,Date,
  };
  vm.runInNewContext(source.slice(from,to)+'\ntoggleSet(0,0,{timer:false});',c);
  assert.equal(state.current.ex[0].set[0].ok,true);
  assert.deepEqual(toasts,[]);
  assert.equal(JSON.parse(storage.getItem(Store.DRAFT)).owners.athlete.id,'new-session');
});
test('Safari InvalidStateError is recognized as fallback-eligible without masking logical journal conflicts',()=>{
  const source=fs.readFileSync(require.resolve('../storage-resilience.js'),'utf8');
  assert.match(source,/InvalidStateError/);
  assert.match(source,/if \(localError && !storageFailure\)/);
  assert.match(source,/UNVRSL save conflict/);
});
