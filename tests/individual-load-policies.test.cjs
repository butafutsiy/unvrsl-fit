'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const A=require('../workout-domain'),P=require('../exercise-load-policies');
const ctx={window:{}};vm.runInNewContext(fs.readFileSync(require.resolve('../exercise-catalog.js'),'utf8'),ctx);
const catalog=JSON.parse(JSON.stringify(ctx.window.UNVRSL_EXERCISES)),reg=A.registry(catalog);
const target={targetRepMin:8,targetRepMax:10,targetRpeMin:7,targetRpeMax:8};
function fixture(id,w=100,equipment={weightStep:2.5},actual={r:10,rpe:9}){
 const row=reg.resolve(id),done={...target,w,ok:true,...actual},pending={...target,w,ok:false,r:'',rpe:''};
 const e={...row,equipmentProfileId:equipment.id,equipmentProfile:equipment,programWeightMode:'adaptive',set:[done,pending]};
 const session={id:'now',started:Date.UTC(2026,9,24),ex:[e],bodyWeight:95};
 return {e,done,pending,session,rec:()=>A.recommend(e,pending,session,[],reg)};
}
test('all 189 real IDs have an explicit, independent audited record',()=>{
 assert.equal(Object.keys(P.definitions).length,189);const counts={};
 for(const row of catalog){const p=P.definitions[row.id];assert.ok(p,row.id);assert.equal(p.name,row.n);counts[p.status]=(counts[p.status]||0)+1;
  if(p.response){assert.ok(P.validate(p),row.id);const a=P.resolve(row,row),b=P.resolve(row,row);a.response.H1=99;assert.notEqual(b.response.H1,99,row.id);}}
 assert.deepEqual(counts,{nonweighted:16,needs_equipment:165,special_handler:5,review_metadata:3});
});
test('every weight-bearing canonical ID uses its own valid policy on actual equipment',()=>{
 for(const row of catalog.filter(r=>P.definitions[r.id].response)){
  const step=row.weightProfile.step,w=step*Math.ceil(100/step),f=fixture(row.id,w,{weightStep:step},{r:8,rpe:10});
  const before=JSON.stringify(f.session),rec=f.rec(),n=rec.nextSetSuggestion;
  assert.equal(rec.correctionPolicy.id,row.id);assert.equal(n.policyVersion,540);assert.ok(n.weight>=0);
  assert.ok(Number.isInteger(Math.round(n.weight/step*1e6)/1e6),row.id);assert.equal(JSON.stringify(f.session),before,row.id);
 }
});
for(const [id,w,expected] of [
 ['canon:high_bar_squat',100,[105,102.5,100,95,92.5,90]],
 ['canon:bench_press',80,[82.5,82.5,80,77.5,75,75]],
 ['canon:lateral_raise',10,[11,11,10,9,9,9]],
])test(`${id}: actual RPE determines different exercise-specific loads`,()=>{
 const results=[5,6,8,9,9.5,10].map(rpe=>fixture(id,w,{weightStep:id==='canon:lateral_raise'?1:2.5},{r:10,rpe}).rec().nextSetSuggestion.weight);
 assert.deepEqual(results,expected);
});
test('two physical machines for the same exercise have different racks and response policies',()=>{
 const a=fixture('canon:leg_press',150,{id:'A',availableLoads:Array.from({length:61},(_,i)=>i*5)});
 const base=A.profile(a.e,reg).correctionPolicy;
 const b=fixture('canon:leg_press',150,{id:'B',availableLoads:Array.from({length:31},(_,i)=>i*10),correctionPolicy:{...base,response:{L1:2.5,L2:4,H1:4,H2:6,H3:8},hardCapUpPct:4.5,hardCapDownPct:12,maxStepsUp:2,maxStepsDown:4}});
 a.done.rpe=b.done.rpe=6;assert.equal(a.rec().nextSetSuggestion.weight,155);assert.equal(b.rec().nextSetSuggestion.weight,150);
 a.done.rpe=b.done.rpe=10;assert.equal(a.rec().nextSetSuggestion.weight,130);assert.equal(b.rec().nextSetSuggestion.weight,140);
 b.e.equipmentProfile.correctionPolicy.response.H1=2;assert.equal(a.rec().correctionPolicy.response.H1,5);
});
test('equipment row wins; nonuniform adjacent loads and maximum step count are respected',()=>{
 const f=fixture('canon:high_bar_squat',100,{weightStep:2.5,availableLoads:[80,90,100,115,130]},{r:10,rpe:10});
 assert.equal(f.rec().nextSetSuggestion.weight,90);
 f.e.equipmentProfile.availableLoads=[100,120,140];f.done.rpe=6;assert.equal(f.rec().nextSetSuggestion.weight,100);
 f.e.equipmentProfile.availableLoads=[90,95,105];assert.equal(f.rec().nextSetSuggestion.reasonCode,'CURRENT_OFF_RACK');
});
test('RPE zero is missing; valid RIR zero is maximal effort; conflicting scales cannot increase',()=>{
 const f=fixture('canon:high_bar_squat');f.done.rpe=0;
 assert.equal(f.rec().nextSetSuggestion.weight,100);assert.equal(f.rec().nextSetSuggestion.reasonCode,'EFFORT_REQUIRED');
 f.done.rir=0;assert.equal(f.rec().nextSetSuggestion.weight,90);
 f.done.rpe=5;assert.equal(f.rec().nextSetSuggestion.weight,100);assert.equal(f.rec().nextSetSuggestion.reasonCode,'EFFORT_CONFLICT');
 f.done.actualRpe=8;f.done.actualRir=2;assert.equal(f.rec().nextSetSuggestion.weight,100);
});
test('low reps with low effort need clarification; exact thresholds keep their inclusivity',()=>{
 const f=fixture('canon:high_bar_squat',100,{weightStep:2.5},{r:4,rpe:5});assert.equal(f.rec().nextSetSuggestion.reasonCode,'REPS_EFFORT_CONFLICT');
 f.done.r=10;f.done.rpe=6.5;assert.equal(f.rec().nextSetSuggestion.weight,100);
 f.done.rpe=8.5;assert.equal(f.rec().nextSetSuggestion.weight,100);
 f.done.rpe=9.5;assert.equal(f.rec().nextSetSuggestion.weight,92.5);
});
test('changed future rep task is not mistaken for a failed comparable set',()=>{
 const f=fixture('canon:high_bar_squat');f.pending.targetRepMin=12;f.pending.targetRepMax=15;
 assert.equal(f.rec().nextSetSuggestion.reasonCode,'TARGET_CHANGED');assert.equal(f.rec().nextSetSuggestion.weight,100);
});
test('danger and metadata conflicts block application without touching facts',()=>{
 const f=fixture('canon:high_bar_squat');f.done.pain=true;const before=JSON.stringify(f.session),r=f.rec();
 assert.equal(r.canApply,false);assert.equal(A.applyAuto(f.pending,r),false);assert.equal(JSON.stringify(f.session),before);
 for(const id of ['og:0009','og:0011','og:0795']){
  const x=fixture(id);assert.equal(x.rec().canApply,false,id);assert.equal(x.rec().correctionPolicy.status,'review_metadata');
 }
});
test('manual and completed weights remain authoritative',()=>{
 const f=fixture('canon:high_bar_squat');f.pending.manualOverride=true;f.pending.weightSource='manual';
 const r=f.rec();assert.equal(r.nextSetSuggestion.weight,95);assert.equal(A.applyAuto(f.pending,r),false);assert.equal(f.pending.w,100);
 assert.equal(A.acceptRecommendation(f.done,r),false);assert.equal(f.done.w,100);
});
test('the weekly midpoint stays separate from the live correction and remains stable on reload',()=>{
 const f=fixture('canon:high_bar_squat');f.session.programWeekIntensityMin=70;f.session.programWeekIntensityMax=75;
 const old={id:'old',started:Date.UTC(2026,9,1),ended:1,ex:[{...f.e,set:[{...target,w:135,r:3,rpe:9,ok:true}]}]};
 const r=A.recommend(f.e,f.pending,f.session,[old],reg);
 assert.equal(r.weeklyCalculated,true);assert.equal(r.calculatedWeight,110);assert.equal(r.nextSetSuggestion.weight,95);assert.equal(A.recommendationWeight(r),95);
 const original=JSON.stringify(old),restored=JSON.parse(JSON.stringify(f.session));
 const again=A.recommend(restored.ex[0],restored.ex[0].set[1],restored,[old],reg);assert.equal(again.calculatedWeight,110);assert.equal(A.recommendationWeight(again),95);assert.equal(JSON.stringify(old),original);
});
test('new evidence and equipment policy revisions invalidate only future proposal keys',()=>{
 const f=fixture('canon:high_bar_squat');const first=f.rec().proposalKey;
 f.e.equipmentProfile.correctionPolicy={response:{H1:4}};assert.notEqual(f.rec().proposalKey,first);
 const second=f.rec().proposalKey;f.done.rpe=9.5;assert.notEqual(f.rec().proposalKey,second);
});
test('inherited targets shift once, manual and unknown legacy targets are unchanged',()=>{
 const f=fixture('canon:high_bar_squat');f.pending.effortTargetSource='week_inherited';f.pending.effortBaseMin=7;f.pending.effortBaseMax=8;
 assert.deepEqual(A.effortTarget(f.e,f.pending,f.session),{lo:6.5,hi:7.5});
 f.pending.targetRpeMin=6.5;f.pending.targetRpeMax=7.5;assert.deepEqual(A.effortTarget(f.e,f.pending,f.session),{lo:6.5,hi:7.5});
 f.pending.effortTargetSource='set_override';assert.deepEqual(A.effortTarget(f.e,f.pending,f.session),{lo:6.5,hi:7.5});
 delete f.pending.effortTargetSource;Object.assign(f.pending,target);assert.deepEqual(A.effortTarget(f.e,f.pending,f.session),{lo:7,hi:8});
 f.pending.effortTargetSource='week_inherited';f.session.deload=true;assert.deepEqual(A.effortTarget(f.e,f.pending,f.session),{lo:7,hi:8});
});
test('display preserves quarter goals, completed facts and inheritance across repeated annotation',()=>{
 const Rsrc=fs.readFileSync(require.resolve('../rpe-range-display.js'),'utf8'),w={WorkoutDomain:A};
 const c={window:w,module:{exports:{}}};vm.runInNewContext(Rsrc,c);const R=c.module.exports;
 const f=fixture('canon:db_shoulder_press',30,{weightStep:2},{r:10,rpe:8});Object.assign(f.session,{programWeekRpeMin:7,programWeekRpeMax:8});
 delete f.pending.targetRpeMin;delete f.pending.targetRpeMax;delete f.e.targetRpeMin;delete f.e.targetRpeMax;
 const done=JSON.stringify(f.done);R.annotate(f.session);const once=JSON.stringify(f.session);R.annotate(f.session);
 assert.equal(JSON.stringify(f.session),once);assert.equal(JSON.stringify(f.done),done);assert.equal(f.pending.targetRpeMin,6.75);assert.equal(f.pending.targetRpeLabel,'6,75–7,75');
});
test('assistance inverts the physical direction; external added load uses known body mass',()=>{
 const f=fixture('canon:assisted_pullup',30,{weightStep:5},{r:10,rpe:6});assert.equal(f.rec().nextSetSuggestion.weight,25);
 f.done.rpe=10;assert.equal(f.rec().nextSetSuggestion.weight,40);
 const pull=fixture('canon:weighted_pullup',10,{weightStep:2.5},{r:10,rpe:9});assert.equal(pull.rec().nextSetSuggestion.weight,7.5);
 delete pull.session.bodyWeight;assert.equal(pull.rec().nextSetSuggestion.reasonCode,'POLICY_BASE_REQUIRED');
});
test('a partial series cannot increase; a complete mastered series uses the exercise policy',()=>{
 const f=fixture('canon:high_bar_squat');f.e.set=Array.from({length:3},()=>({...target,w:100,r:'',rpe:'',ok:false}));f.pending=f.e.set[0];
 const old={id:'old',started:Date.UTC(2026,9,1),ended:1,ex:[{...f.e,set:Array.from({length:3},()=>({...target,w:100,r:10,rpe:5,ok:true}))}]};
 let r=A.recommend(f.e,f.pending,f.session,[old],reg);assert.equal(r.weight,105);
 old.ex[0].set[2].r=9;r=A.recommend(f.e,f.pending,f.session,[old],reg);assert.equal(r.weight,100);
 old.ex[0].set[2].skipped=true;old.ex[0].set[2].ok=false;r=A.recommend(f.e,f.pending,f.session,[old],reg);assert.equal(r.weight,100);
});
test('equipment editor saves an independent policy and refreshes pending snapshots only',()=>{
 const f=fixture('canon:high_bar_squat',100,{id:'rack',name:'Rack',type:'barbell',loadUnit:'TOTAL',weightStep:2.5,availableLoads:[],exerciseKey:'canon:high_bar_squat'});
 f.pending.equipmentSnapshot={...f.e.equipmentProfile};f.done.equipmentSnapshot={...f.e.equipmentProfile};
 const past=JSON.parse(JSON.stringify(f.session)),fields={},state={current:f.session,sessions:[past],programs:[],equipmentProfiles:{rack:{...f.e.equipmentProfile}}};
 let recalcs=0;const w={WorkoutDomain:A,ExerciseLoadPolicies:P,st:state,addEventListener(){},save(){},modal(){},toast(){},trainingLoadModel292:{run(){recalcs++}}};
 const doc={getElementById:id=>fields[id]||null,createElement:()=>({}),head:{append(){}}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../equipment-profiles-v405.js'),'utf8'),{window:w,document:doc,workoutRegistry:reg});
 const values={Name:'Rack',Type:'barbell',Unit:'TOTAL',Step:'0,5',Available:'',Base:20,PolicyL1:2.5,PolicyL2:5,PolicyH1:6,PolicyH2:8,PolicyH3:10,PolicyCapUp:6,PolicyCapDown:15,PolicyStepsUp:3,PolicyStepsDown:6,PolicyOffset:-.5,PolicyTolerance:.5};
 for(const [key,value] of Object.entries(values))fields['eq405'+key]={value};
 const history=JSON.stringify(state.sessions),done=JSON.stringify(f.done);
 w.equipmentSave405(encodeURIComponent('canon:high_bar_squat@0'),'rack');
 assert.equal(state.equipmentProfiles.rack.correctionPolicy.response.H1,6);assert.equal(f.pending.equipmentSnapshot.correctionPolicy.response.H1,6);assert.equal(f.pending.equipmentSnapshot.weightStep,.5);assert.ok(recalcs>0);
 assert.equal(JSON.stringify(state.sessions),history);assert.equal(JSON.stringify(f.done),done);
 fields.eq405PolicyH1.value=30;const before=JSON.stringify(state.equipmentProfiles);w.equipmentSave405(encodeURIComponent('canon:high_bar_squat@0'),'rack');assert.equal(JSON.stringify(state.equipmentProfiles),before);
});
test('an explicit legacy set goal is not reinterpreted through an inherited exercise goal',()=>{
 const f=fixture('canon:high_bar_squat');Object.assign(f.e,{effortTargetSource:'week_inherited',effortBaseMin:7,effortBaseMax:8});
 assert.deepEqual(A.effortTarget(f.e,f.pending,f.session),{lo:7,hi:8});
 const ended={...f.session,ended:1};Object.assign(f.pending,{effortTargetSource:'week_inherited',effortBaseMin:7,effortBaseMax:8,targetRpeMin:6.5,targetRpeMax:7.5});
 assert.deepEqual(A.effortTarget(f.e,f.pending,ended),{lo:6.5,hi:7.5});
});
