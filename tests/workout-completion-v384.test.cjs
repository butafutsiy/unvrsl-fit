'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

function runtime(session,finish){
  const calls=[],listeners={};
  const context={
    console:{error:value=>calls.push(['error',String(value)]),warn:()=>{},log:()=>{}},
    st:{current:session,sessions:[],nextSuggestions:{}},
    document:{addEventListener:(name,fn)=>{listeners[name]=fn}},
    CustomEvent:function(name,init){this.type=name;this.detail=init?.detail},
    setTimeout:fn=>{calls.push('sync');return 1},
    confirm:()=>true,
    save:()=>calls.push('save'),
    stopTimer:()=>calls.push('stop'),
    summary:value=>calls.push(['summary',value.id]),
    dispatchEvent:event=>calls.push(['event',event.type]),
    finish
  };
  context.window=context;
  vm.runInNewContext(read('workout-completion.js'),context);
  return{context,calls,listeners}
}

test('finish control falls back safely when a legacy finish wrapper throws',()=>{
  const session={id:'s1',target:7,ex:[{n:'Жим ногами',set:[{w:120,r:10,rpe:'',rir:'',ok:true}]}]};
  const {context,calls}=runtime(session,()=>{throw new Error('legacy wrapper')});
  const button={textContent:'Завершить тренировку',setAttribute(){},removeAttribute(){}};
  assert.equal(context.completeWorkoutV384(button),true);
  assert.equal(context.st.current,null);
  assert.equal(context.st.sessions.length,1);
  assert.equal(context.st.sessions[0].ended>0,true);
  assert.deepEqual(JSON.parse(JSON.stringify(context.st.sessions[0].suggest)),[]);
  assert.equal(calls.some(call=>Array.isArray(call)&&call[0]==='summary'),true)
});

test('fallback recommendations require an actual RPE or RIR value',()=>{
  const session={id:'s2',target:7,ex:[{n:'Жим ногами',set:[{w:120,r:10,rpe:'',actualRir:4,ok:true}]}]};
  const {context}=runtime(session,()=>{});
  context.completeWorkoutV384({textContent:'Завершить тренировку',setAttribute(){},removeAttribute(){}});
  assert.equal(context.st.sessions[0].suggest.length,1);
  assert.equal(context.st.sessions[0].suggest[0].r,6)
});

test('completion screen is restored when saving succeeded but a wrapper failed before the modal',()=>{
  const session={id:'s3',target:7,ex:[{n:'Жим ногами',set:[{w:120,r:10,rpe:7,rir:3,ok:true}]}]};
  let context;
  const runtimeState=runtime(session,()=>{context.st.sessions.push(session);context.st.current=null;throw new Error('summary layer')});
  context=runtimeState.context;
  context.completeWorkoutV384({textContent:'Завершить тренировку',setAttribute(){},removeAttribute(){}});
  assert.equal(context.st.current,null);
  assert.equal(runtimeState.calls.filter(call=>Array.isArray(call)&&call[0]==='summary').length,1)
});

test('all workout renderers expose one delegated finish action loaded last',()=>{
  for(const file of ['app.js','og-core.js','anton-plan-rules.js'])assert.match(read(file),/data-workout-finish="1"/,file);
  const html=read('index.html');
  assert.match(html,/trainer-client-clean\.js\?v=384"><\/script>\s*<script src="workout-completion\.js\?v=384"/);
  assert.match(read('workout-completion.js'),/stopImmediatePropagation\(\)/)
});
