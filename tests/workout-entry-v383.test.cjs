const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const functionSource=(source,name,next)=>source.slice(source.indexOf(`function ${name}`),source.indexOf(`\nfunction ${next}`,source.indexOf(`function ${name}`)));

test('custom program launch keeps the complete repetition range as an empty target field',()=>{
  const source=read('coach-programs.js');
  const code=functionSource(source,'programWorkoutRepTarget','beginProgramDay');
  const context={result:null,programModel:require("../program-model.js")};
  vm.runInNewContext(`${code};result=programWorkoutRepTarget({method:'STANDARD',repMode:'manual'},{reps:{mode:'manual',min:8,max:15}},{r:8,rMin:8,rMax:15})`,context);
  assert.deepEqual(JSON.parse(JSON.stringify(context.result)),{r:'',programR:8,targetRepMin:8,targetRepMax:15,targetRepLabel:'8–15',repMode:'manual'});
});

test('late program builder uses the exact editor start route',()=>{
  const source=read('program-builder-restored.js');
  assert.match(source,/data-program-editor-start="1"/);
  assert.match(source,/programStartFromEditorV386\(event,/);
  assert.doesNotMatch(source,/class="btn tiny primary" onclick="beginProgramDay/);
  assert.match(read('training-engine.js'),/const fn=typeof W\.beginProgramDay==='function'\?W\.beginProgramDay:W\.programBeginDayCoreV382/);
});

test('rep target is rendered as translucent placeholder text',()=>{
  const app=read('app.js'),styles=read('active-workout-compact.js');
  const code=functionSource(app,'workoutRepTargetText','migrateEffortState');
  const context={result:null,programModel:require("../program-model.js")};
  vm.runInNewContext(`${code};result=workoutRepTargetText({targetRepMin:8,targetRepMax:15})`,context);
  assert.equal(context.result,'8–15');
  assert.match(read('smart-training.js'),/rep-target-placeholder/);
  assert.match(styles,/input\.rep-target-placeholder::placeholder\{color:#8e8e93!important;opacity:\.72/);
});

test('strength and cardio sets can be completed without RPE or RIR',()=>{
 const A=require('../workout-domain.js'), reg=A.registry([]);
 assert.equal(A.validSet({loadType:'external_total'},{w:100,r:10,rpe:'',rir:''},reg),true);
 assert.equal(A.validSet({loadType:'time'},{min:6,rpe:'',rir:''},reg),true);
 assert.equal(A.validSet({loadType:'time'},{min:0},reg),false);
});

test('recommendations and autoweight have a single analytics owner',()=>{
 assert.match(read('training-load-model.js'),/A\.recommend/);
 assert.doesNotMatch(read('training-load-model.js'),/function (?:estimate1RM|aggregateRecommendation)/);
 assert.doesNotMatch(read('index.html'),/src="(?:machine-weight-adaptation|performance-control)\.js/);
});
