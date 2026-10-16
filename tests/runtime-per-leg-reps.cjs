'use strict';
const assert=require('node:assert/strict'),{make,wait,errors}=require('./runtime-v392.cjs');
(async()=>{
 const dom=make();await wait(2600);const W=dom.window;
 try{
 const result=JSON.parse(JSON.stringify(await W.eval(`(async()=>{
  const e={n:'Выпады назад с гантелями',method:'STANDARD',loadType:'per_dumbbell',implementCount:2,rest:75,set:[{w:26,r:24,ok:false,targetRepMin:10,targetRepMax:12}]};
  st.current={id:'legs-ui',w:1,c:'test-legs',started:Date.now(),ex:[e]};
  const mount=document.createElement('div');document.body.appendChild(mount);mount.innerHTML=workoutRepsInput(e,e.set[0],0,0);
  const input=mount.querySelector('input'),shown=input.value,placeholder=input.placeholder;
  input.value='12';input.dispatchEvent(new Event('change',{bubbles:true}));const edited={r:e.set[0].r,actual:e.set[0].actualReps,shown:input.value};
  input.value='14 / 12';input.dispatchEvent(new Event('change',{bubbles:true}));const unequal={r:e.set[0].r,shown:input.value};
  input.value='12oops';input.dispatchEvent(new Event('change',{bubbles:true}));const invalid=e.set[0].r;
  const restored=JSON.parse(JSON.stringify(e));mount.innerHTML=workoutRepsInput(restored,restored.set[0],0,0);const reopened=mount.querySelector('input').value;
  if(st.current)workoutStore.discard(st);
  const plan={id:'legs-plan',name:'Ноги',weeks:[{n:1,days:[{id:'legs-day',name:'Ноги',ex:[{n:e.n,method:'STANDARD',reps:{mode:'manual',min:24,max:24},weightMode:'manual',sets:[{w:26,r:24}],rpe:7,rest:75}]}]}]};
  st.programs.push(plan);programUi={pid:plan.id,week:0,day:0};
  const q=programResolveExerciseParametersV381(plan.id,0,plan.weeks[0].days[0].ex[0]);
  const planText=prescriptionText(plan.weeks[0].days[0].ex[0],plan.id,0);
  programExerciseForm({pid:plan.id,wi:0,di:0,n:e.n,existingIndex:0});
  const min=document.getElementById('pmRepsMin'),max=document.getElementById('pmRepsMax');const form={min:min.value,max:max.value,heading:document.getElementById('pmRepsSection').textContent};
  min.value='14';max.value='14 / 14';
  saveProgramExercise(plan.id,0,0,encodeURIComponent(e.n),'','','','',0);
  const saved=plan.weeks[0].days[0].ex[0],after=programResolveExerciseParametersV381(plan.id,0,saved);
  const persisted={reps:JSON.parse(JSON.stringify(saved.reps)),set:saved.sets[0].r,range:after.reps};
  programExerciseForm({pid:plan.id,wi:0,di:0,n:e.n,existingIndex:0});
  persisted.reopened=document.getElementById('pmRepsMin').value;
  saveProgramExercise(plan.id,0,0,encodeURIComponent(e.n),'','','','',0);
  persisted.savedAgain=plan.weeks[0].days[0].ex[0].reps.min;
  if(st.current)workoutStore.discard(st);save();closeModal();beginProgramDay(plan.id,0,0);await trainingConfirmReadiness200(false);await new Promise(resolve=>setTimeout(resolve,350));
  const started={pid:st.current.programId,min:st.current.ex[0].set[0].targetRepMin,max:st.current.ex[0].set[0].targetRepMax};
  if(st.current)workoutStore.discard(st);mount.remove();return {shown,placeholder,edited,unequal,invalid,reopened,q:q.reps,planText,form,persisted,started};
 })()`)));
 assert.equal(result.shown,'12 / 12');assert.equal(result.placeholder,'10–12 / 10–12');
 assert.deepEqual(result.edited,{r:24,actual:24,shown:'12 / 12'});
 assert.deepEqual(result.unequal,{r:26,shown:'14 / 12'});assert.equal(result.invalid,26);assert.equal(result.reopened,'14 / 12');
 assert.equal(result.q.min,12);assert.ok(result.planText.includes('12 / 12'),result.planText);
 assert.equal(result.form.min,'12 / 12');assert.match(result.form.heading,/на каждую ногу/);
 assert.equal(result.persisted.reps.min,28);assert.equal(result.persisted.set,28);assert.equal(result.persisted.range.min,14);assert.equal(result.persisted.reopened,'14 / 14');assert.equal(result.persisted.savedAgain,28);
 assert.equal(result.started.pid,'legs-plan');assert.equal(result.started.min,14);assert.equal(result.started.max,14);
 assert.equal(errors.length,0,errors.join('\n'));
 console.log('PASS: legacy 24 → 12 / 12; single and asymmetric input; invalid input; serialization; plan editing, save, launch and target units.');
 }finally{dom.window.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
