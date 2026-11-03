'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const Store=require('../workout-store.js');
const session=(pending=false)=>({
  id:'saved-1',userId:'user-1',started:100,ended:200,
  ...(pending?{pendingCompletion:true}:{}),
  ex:[{n:'Жим',set:[{w:100,r:8,rpe:8,rir:2,ok:true}]}]
});

test('saved cloud workout is not reactivated by a stale local draft journal',()=>{
  const mem=new Map(),store=Store.create({getItem:k=>mem.get(k)||null,setItem:(k,v)=>mem.set(k,v)});
  const draft=session(true),state={current:draft,sessions:[]};
  store.save(state);
  state.sessions.push(session(false));
  state.current=null;
  store.restore(state,'user-1');
  assert.equal(state.current,null);
  const altered=session(true);altered.ex[0].set[0].w=110;
  state.sessions=[session(false)];state.current=altered;store.save(state);
  state.current=null;
  store.restore(state,'user-1');
  assert.equal(state.current.ex[0].set[0].w,110);
});

function fixture({mismatch=false,closeFails=false}={}){
  const current=session(true),remote=session(false),state={current,sessions:[]};
  if(mismatch)remote.ex[0].set[0].w=90;
  const status={summary:0,finishCalls:0,queries:0,stop:0};
  const ctx={
    st:state,console:{warn(){}},WorkoutDomain:{complete:()=>true,summary:()=>({})},
    workoutRegistry:{},
    workoutStore:{
      finish:async()=>{status.finishCalls++;return null},
      close:()=>{if(closeFails)throw new Error('quota');state.current=null}
    },
    save:()=>true,persistWorkoutState:async()=>true,toast:()=>{},
    stopTimer:()=>{status.stop++},esc:String,modal:()=>{},
    closeWorkoutDraft:async()=>{if(closeFails)return false;state.current=null;return true},
    cloud:{user:{id:'user-1'},client:{from(table){
      assert.equal(table,'workouts');return{
        select(col){assert.equal(col,'payload');return this},
        eq(){return this},
        async maybeSingle(){status.queries++;return {data:{payload:remote},error:null}}
      }
    }}},
    document:{
      querySelector:()=>null,querySelectorAll:()=>[],
      getElementById:()=>null,
      createElement:()=>({}),head:{append(){}}
    },addEventListener(){},dispatchEvent(){},
    CustomEvent:class{constructor(name,opts){this.type=name;this.detail=opts.detail}},
    setTimeout(){}
  };
  ctx.window=ctx;
  vm.runInNewContext(fs.readFileSync(require.resolve('../workout-completion.js'),'utf8'),ctx);
  ctx.renderWorkoutSummary=()=>{status.summary++};
  return {ctx,state,status};
}

test('retry recognizes previously uploaded identical workout and closes stale draft exactly once',async()=>{
  const {ctx,state,status}=fixture();
  await ctx.completeWorkout();
  assert.equal(state.current,null);
  assert.equal(state.sessions.length,1);
  assert.equal(state.sessions[0].syncStatus,'synced');
  assert.equal(status.finishCalls,0);
  assert.equal(status.queries,1);
  assert.equal(status.summary,1);
  await ctx.completeWorkout();
  assert.equal(state.sessions.length,1);
});

test('cloud recovery never overwrites unsaved changes to set weights',async()=>{
  const {ctx,state,status}=fixture({mismatch:true});
  await ctx.completeWorkout();
  assert.equal(status.finishCalls,1);
  assert.equal(state.current.ex[0].set[0].w,100);
  assert.equal(state.sessions.length,0);
});

test('confirmed cloud result is accessible even when local storage draft close fails',async()=>{
  const {ctx,state,status}=fixture({closeFails:true});
  await ctx.completeWorkout();
  assert.equal(state.current,null);
  assert.equal(state.sessions.length,1);
  assert.equal(status.summary,1);
});
