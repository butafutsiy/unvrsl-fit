'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=name=>fs.readFileSync(path.join(root,name),'utf8');

test('W5 Romanian deadlift shows 4–6 in preview and repairs a started workout',()=>{
  let previewHtml='',saves=0;
  const oldSet={w:135,r:7,ok:false,targetRepMin:5,targetRepMax:7,targetRepLabel:'5–7'};
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
  assert.equal(source.r,6);assert.match(source.d,/4–6 повторений/);
  vm.runInNewContext(read('preview-authority.js'),context);
  vm.runInNewContext(read('preview-mobile-fix.js'),context);
  context.preview(5,'A2');
  assert.match(previewHtml,/4×4–6 · 135 кг/);
  assert.doesNotMatch(previewHtml,/4×5–7/);
  vm.runInNewContext(read('active-rep-ranges.js'),context);
  assert.equal(context.unvrslActiveRepRangeV316(5,source).min,4);
  const ghostMap=JSON.parse(read('rep-range-ghost.js').match(/const R=(\{.*?\});/)[1]);
  assert.deepEqual(ghostMap['5']['Румынская тяга'],[4,6]);
  vm.runInNewContext(read('training-prescription-bridge.js'),context);
  assert.equal(context.unvrslTrainingPrescriptionPrepareV292(current),true);
  assert.deepEqual([oldSet.targetRepMin,oldSet.targetRepMax,oldSet.targetRepLabel,oldSet.r],[4,6,'4–6','']);
  assert.equal(finished.r,5);
  assert.deepEqual([manual.r,manual.targetRepMin,manual.targetRepMax],[7,4,6]);
  assert.ok(saves>0);
});
