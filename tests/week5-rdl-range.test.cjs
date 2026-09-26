'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=name=>fs.readFileSync(path.join(root,name),'utf8');

test('W5 Romanian deadlift uses September 21 for its 5–7 recommendation after a wrapped preview',async()=>{
  let previewHtml='',saves=0;
  const oldSet={w:135,r:6,ok:false,targetRepMin:4,targetRepMax:6,targetRepLabel:'4–6'};
  const finished={w:135,r:5,ok:true,targetRepMin:5,targetRepMax:7,targetRepLabel:'5–7'};
  const manual={w:135,r:7,actualReps:7,ok:false,manualFields:{r:true},targetRepMin:5,targetRepMax:7};
  const current={w:5,c:'A2',target:8,ex:[{n:'Румынская тяга',set:[oldSet,finished,manual]}]};
  const context={console,st:{current},save:()=>{saves++},modal:html=>{previewHtml=html},
    setTimeout:()=>0,setInterval:()=>0,queueMicrotask:fn=>fn(),CustomEvent:function(type){this.type=type}};
  context.window=context;context.addEventListener=()=>{};context.dispatchEvent=()=>{};
  context.document={readyState:'complete',head:{appendChild:()=>{}},body:{appendChild:()=>{}},
    getElementById:()=>null,addEventListener:()=>{},querySelector:()=>null,
    createElement:tag=>tag==='template'?{
      content:{querySelectorAll:()=>[]},
      set innerHTML(html){
        const text=html.match(/rp281-name[^>]*>Румынская тяга<\/div><div class="rp281-prescription">([^<]*)/)?.[1]||'';
        this.content.querySelectorAll=()=>html.includes('Румынская тяга')?[{
          querySelector:selector=>({textContent:selector==='.rp281-name'?'Румынская тяга':text})
        }]:[];
      }
    }:({textContent:'',style:{}})};
  vm.runInNewContext(read('plan-w5.js'),context);
  const routine=context.UNVRSL_ROUTINES.find(r=>r.c==='A2'),source=routine.e.find(e=>e.n==='Румынская тяга');
  assert.equal(source.r,5);assert.match(source.d,/5–7 повторений/);
  vm.runInNewContext(read('preview-authority.js'),context);
  vm.runInNewContext(read('preview-mobile-fix.js'),context);
  context.preview(5,'A2');
  assert.match(previewHtml,/4×5–7 · 135 кг/);
  assert.doesNotMatch(previewHtml,/4×4–6/);
  vm.runInNewContext(read('active-rep-ranges.js'),context);
  assert.equal(context.unvrslActiveRepRangeV316(5,source).min,5);
  const ghostMap=JSON.parse(read('rep-range-ghost.js').match(/const R=(\{.*?\});/)[1]);
  assert.deepEqual(ghostMap['5']['Румынская тяга'],[5,7]);
  const decoratedPreview=function(w,c){return context.previewBeforeCollapse(w,c)};
  context.previewBeforeCollapse=context.preview;
  decoratedPreview.__methodPreviewCollapseBase=context.preview;
  context.preview=decoratedPreview;
  vm.runInNewContext(read('training-prescription-bridge.js'),context);
  assert.equal(context.unvrslTrainingPrescriptionPrepareV292(current),true);
  assert.deepEqual([oldSet.targetRepMin,oldSet.targetRepMax,oldSet.targetRepLabel,oldSet.r],[5,7,'5–7','']);
  assert.equal(finished.r,5);
  assert.deepEqual([manual.r,manual.targetRepMin,manual.targetRepMax],[7,5,7]);
  context.WorkoutDomain=require('../workout-domain.js');
  context.workoutRegistry=context.WorkoutDomain.registry([{id:'rdl',n:'Румынская тяга со штангой',aliases:['Румынская тяга']}]);
  current.id='w5-active';
  context.st.sessions=[
    {id:'sep-12',date:'2026-09-12',ended:Date.parse('2026-09-12T06:00:00Z'),ex:[{n:'Румынская тяга',set:[{w:115,r:12,rpe:8,ok:true}]}]},
    {id:'sep-21',date:'2026-09-21',ex:[{n:'Румынская тяга со штангой',set:[{w:140,r:7,rpe:8,ok:true}]}]}
  ];
  vm.runInNewContext(read('training-load-model.js'),context);
  await Promise.resolve();
  assert.deepEqual(JSON.parse(JSON.stringify(oldSet.recommendation.repRange)),{lo:5,hi:7});
  assert.equal(oldSet.recommendation.basis.date,'2026-09-21');
  assert.equal(oldSet.recommendation.basis.estimatedOneRepMax,182);
  assert.ok(saves>0);
});
