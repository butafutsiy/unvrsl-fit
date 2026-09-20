'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

test('program editor lifecycle and scroll are owned by the canonical program page',()=>{
 const editor=read('program-editor.js'),coach=read('coach-programs.js');
 assert.match(editor,/__unvrslProgramEditorV386/);
 assert.match(coach,/unvrsl:program-editor-rendered/);
 assert.match(coach,/scrollTop/);
 assert.match(editor,/trainingRequestProgramStartV382/);
});

test('week editor modules no longer rebuild themselves on polling loops',()=>{
  const intensity=read('program-intensity-autoweight.js');
  assert.doesNotMatch(intensity,/renderProgramEditor\.__pi261/);
  assert.match(intensity,/existing\?\.dataset\?\.editorKey===editorKey/);
  assert.match(intensity,/unvrsl:program-intensity-mounted/);
  for(const file of ['program-week-rpe-rir.js','program-week-rep-guidance.js']){
    const source=read(file);
    assert.doesNotMatch(source,/setInterval\(/,file);
    assert.doesNotMatch(source,/\[0,100,300,700,1400,2600\]/,file);
  }
  assert.doesNotMatch(read('program-week-rep-guidance.js'),/observe\(D\.documentElement/);
});

test('intensity card is inserted only once for the same program week',()=>{
  let mounted=null,insertions=0;
  const bar={insertAdjacentElement:(_where,node)=>{mounted=node;insertions++}};
  const sheet={querySelector:selector=>selector==='.weekbar'?bar:selector==='.pi261-week'?mounted:null};
  const document={
    head:{appendChild:()=>{}},hidden:false,
    createElement:()=>({dataset:{},className:'',innerHTML:''}),
    getElementById:id=>id==='sheet'?sheet:null,
    addEventListener:()=>{},querySelector:()=>null
  };
  const program={id:'p1',weeks:[{n:1,intensityMin:70,intensityMax:75,useIntensity:true,days:[]}]};
  const context={console,document,CustomEvent:function(name,init){this.type=name;this.detail=init?.detail},programUi:{pid:'p1',week:0},programById:id=>id==='p1'?program:null,st:{programs:[program]},save:()=>{},requestAnimationFrame:fn=>fn(),setTimeout:()=>0};
  context.window=context;context.addEventListener=()=>{};context.dispatchEvent=()=>{};
  vm.runInNewContext(read('program-intensity-autoweight.js'),context);
  assert.equal(insertions,1);
  context.programIntensityMountV382();
  context.programIntensityMountV382();
  assert.equal(insertions,1);
  assert.equal(mounted.dataset.editorKey,'p1|0');
});

test('editor start uses the canonical readiness request with an exact day',()=>{
  const coach=read('coach-programs.js'),engine=read('training-engine.js'),readiness=read('readiness-questionnaire.js');
  assert.match(coach,/data-program-editor-start="1"/);
  assert.match(coach,/programStartFromEditorV386\(event/);
  assert.match(coach,/programBeginDayCoreV382=beginProgramDay/);
  assert.match(engine,/function requestProgramStart\(pid,wi,di\)/);
  assert.match(engine,/programBeginDayCoreV382/);
  assert.match(engine,/trainingRequestProgramStartV382=requestProgramStart/);
  assert.match(readiness,/programStartFromEditorV382/);
  assert.match(readiness,/__unvrslPendingProgramStartV382/);
});

