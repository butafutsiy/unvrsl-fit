'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const exercise=(name,weight,reps)=>({
  n:name,kind:'strength',set:[{ok:true,w:weight,r:reps,rpe:8,rir:2}]
});
const sample=()=>({
  id:'workout-596',userId:'athlete',name:'Верх тела',date:'2026-11-03',
  started:100000,ended:460000,
  ex:[exercise('Жим лёжа',100,8),exercise('Тяга блока',75,10)]
});

function fixture({summaryThrows=false,recommendThrows=false}={}){
  const completed=sample(),state={current:completed,sessions:[]};
  const calls={html:[],shares:[],toasts:[],events:[],syncs:0};
  const report={
    id:completed.id,name:completed.name,date:completed.date,durationMs:360000,
    exercises:completed.ex.map((e)=>({
      name:e.n,
      sets:[{exercise:e,set:e.set[0],label:e.set[0].w+' кг × '+e.set[0].r}],
      best:{exercise:e,set:e.set[0],label:e.set[0].w+' кг × '+e.set[0].r},
      records:[]
    })),
    exerciseCount:2,setCount:2,volume:1550,unknownVolumeSets:0,records:[],comparison:null
  };
  const ctx={
    st:state,
    WorkoutDomain:{
      complete:(_e,set)=>!!set.ok,
      summary:()=>{if(summaryThrows)throw Error('Stats engine error');return report},
      setLabel:(_e,set)=>set.w+' кг × '+set.r,
      tonnageLoad:(_e,set)=>set.w,
      recommend:()=>{if(recommendThrows)throw Error('Recommendation error');return {sessionIds:[],action:'hold'}}
    },
    workoutRegistry:{},
    workoutStore:{finish:async()=>{state.current=null;state.sessions.push(completed);return completed}},
    save:()=>true,persistWorkoutState:async()=>true,
    stopTimer:()=>{},esc:value=>String(value??'').replace(/</g,'&lt;'),
    modal:html=>calls.html.push(html),
    toast:text=>calls.toasts.push(text),
    cloud:null,
    addEventListener:()=>{},
    dispatchEvent:e=>calls.events.push(e.type),
    CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail}},
    setTimeout:()=>{},
    console:{warn:()=>{},error:()=>{}},
    document:{
      querySelector:()=>null,querySelectorAll:()=>[],
      createElement:()=>({}),getElementById:()=>null,head:{append:()=>{}}
    }
  };
  ctx.window=ctx;
  vm.runInNewContext(fs.readFileSync(require.resolve('../workout-completion.js'),'utf8'),ctx);
  ctx.openShareProgressV264=s=>{calls.shares.push(s);return true};
  return {ctx,state,completed,calls};
}

test('normal completion always displays full statistics and all share layouts entry',async()=>{
  const {ctx,state,completed,calls}=fixture();
  await ctx.completeWorkout();
  assert.equal(state.current,null);
  assert.equal(calls.html.length,1);
  const html=calls.html[0];
  for(const label of ['Тренировка завершена','Время','Упражнения','Рабочие подходы','Тоннаж','Средний RPE','Жим лёжа','Тяга блока','Поделиться результатом'])
    assert.ok(html.includes(label),label);
  assert.equal((html.match(/onclick="previewWorkoutShare\\(\\)"/g)||[]).length,1,
    'only the bottom share action should remain');
  assert.doesNotMatch(html,/6 шаблонов|Постер · Минимал/);
  assert.ok(html.indexOf('Поделиться результатом')>html.indexOf('Тяга блока'),
    'share button must be below the exercise report');
  assert.ok(!calls.toasts.some(x=>/истори|облак|не удалось/i.test(x)),JSON.stringify(calls.toasts));
  ctx.previewWorkoutShare();
  assert.equal(calls.shares.length,1);
  assert.equal(calls.shares[0].id,completed.id);
});

test('a recommendation failure cannot prevent report modal or sharing',async()=>{
  const {ctx,calls}=fixture({recommendThrows:true});
  await ctx.completeWorkout();
  assert.equal(calls.html.length,1);
  assert.match(calls.html[0],/Поделиться результатом/);
  ctx.previewWorkoutShare();
  assert.equal(calls.shares.length,1);
});

test('a detailed summary calculation failure falls back to saved set statistics and sharing',async()=>{
  const {ctx,calls,state}=fixture({summaryThrows:true});
  await ctx.completeWorkout();
  assert.equal(state.sessions.length,1);
  assert.equal(calls.html.length,1);
  assert.match(calls.html[0],/Тоннаж/);
  assert.match(calls.html[0],/1\s?550/);
  assert.match(calls.html[0],/Жим лёжа/);
  assert.match(calls.html[0],/Тяга блока/);
  assert.match(calls.html[0],/Поделиться результатом/);
  ctx.previewWorkoutShare();
  assert.equal(calls.shares.length,1);
});

test('all six existing share template layouts remain connected to the summary action',()=>{
  const sharing=fs.readFileSync(require.resolve('../share-progress-template.js'),'utf8');
  const layouts=['poster','minimal','exercises','record','tonnage','progress'];
  for(const layout of layouts)
    assert.match(sharing,new RegExp("\\['"+layout+"','"));
});
