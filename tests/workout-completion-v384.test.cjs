'use strict';
// v384 completion fallback was retired. Exercise its replacement through the public UI handler.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const A=require('../workout-domain.js'),S=require('../workout-store.js');
function runtime({signedIn=false,fail=false,modalFails=false}={}){
 const values=new Map(),storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)};
 const store=S.create(storage),session={id:'same-session',userId:signedIn?'user':null,started:100,date:'2026-09-19',ex:[{n:'Подтягивания',loadType:'bodyweight_added',set:[{w:0,r:10,rpe:'',rir:'',ok:true}]}]};
 const calls={uploads:0,summary:0,legacy:0},state={current:session,sessions:[]};
 const context={WorkoutDomain:A,workoutRegistry:A.registry([]),workoutStore:store,st:state,console:{warn(){}},
  cloud:signedIn?{user:{id:'user'}}:null,save:()=>store.save(state),persistWorkoutState:async()=>store.save(state),
  cloudSyncSession:async()=>{calls.uploads++;return !fail},toast(){},stopTimer(){},esc:String,
  finish:()=>{calls.legacy++;throw Error('retired wrapper must never execute')},
  modal:()=>{calls.summary++;if(modalFails)throw Error('render unavailable')},
  addEventListener(){},dispatchEvent(){},CustomEvent:class{},
  document:{querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>({}),head:{append(){}}}};
 context.window=context;
 vm.runInNewContext(fs.readFileSync(require.resolve('../workout-completion.js'),'utf8'),context);
 return{context,state,store,calls};
}
test('completion ignores retired wrappers and accepts bodyweight zero without effort',async()=>{
 const {context,state,calls}=runtime();await context.completeWorkout();
 assert.equal(state.current,null);assert.equal(state.sessions.length,1);
 assert.equal(state.sessions[0].ex[0].set[0].w,0);
 assert.equal(calls.legacy,0);assert.equal(calls.summary,1);
});
test('failed sync keeps the draft and does not publish a completed history entry',async()=>{
 const {context,state,store}=runtime({signedIn:true,fail:true});await context.completeWorkout();
 assert.equal(state.current.id,'same-session');assert.equal(state.sessions.length,0);
 assert.equal(store.journal().owners.user.id,'same-session');
});
test('summary render failure after successful save cannot duplicate the result',async()=>{
 const {context,state,calls}=runtime({signedIn:true,modalFails:true});
 await context.completeWorkout();await context.completeWorkout();
 assert.equal(state.current,null);assert.equal(state.sessions.length,1);assert.equal(calls.uploads,1);
});
test('concurrent finish clicks use one transaction and one session ID',async()=>{
 const {context,state,calls}=runtime({signedIn:true});
 await Promise.all([context.completeWorkout(),context.completeWorkout()]);
 assert.equal(calls.uploads,1);assert.equal(state.sessions.length,1);
 assert.equal(state.sessions[0].id,'same-session');
});
