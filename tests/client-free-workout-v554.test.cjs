'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'..','client-free-workout.js'),'utf8');
function setup(){
 const map=new Map(),output=[],state={programs:[],clientFreeWorkoutDraftV334:{},sessions:[{id:'historical',ex:[{n:'Жим штанги лёжа',set:[{ok:true,w:100,r:8}]}]}],current:null};
 const defaults={cfwSets:'3',cfwRepMin:'8',cfwRepMax:'12',cfwWeight:'0',cfwWeightMode:'manual',cfwRpe:'8',cfwRir:'2',cfwRest:'90',
  cfwCardioMode:'steady',cfwCardioMinutes:'30',cfwCardioRpe:'5',cfwCardioIntensity:'moderate',cfwCardioRounds:'8',
  cfwCardioWork:'30',cfwCardioRest:'60',cfwCardioDistance:'',cfwCardioSpeed:'',cfwCardioIncline:'',cfwCardioResistance:'',
  cfwCardioPower:'',cfwCardioHr:'',cfwCardioKcal:'',cfwCardioMass:''};
 function el(id){if(!map.has(id))map.set(id,{id,value:defaults[id]||'',hidden:false,disabled:false,innerHTML:'',textContent:'',dataset:{},style:{},listeners:{},
   addEventListener(type,callback){this.listeners[type]=callback},blur(){},focus(){}});
   return map.get(id);
 }
 const D={getElementById:el,createElement:()=>({style:{},dataset:{}}),head:{appendChild(){}},querySelector:()=>null};
 const exercises=[
  {id:'cardio:treadmill',n:'Беговая дорожка',bp:'cardio',eq:'cardio machine',tg:'cardiovascular system',cardioMachine:{id:'treadmill'}},
  {id:'canon:bench_press',n:'Жим штанги лёжа',bp:'chest',eq:'barbell',tg:'pectorals'}
 ];
 const registry={identity:e=>e.n,resolve:query=>exercises.find(e=>e.id===query.exerciseId||e.n===query.n)||null};
 const domain={number:v=>v==null||String(v).trim()===''?null:(Number.isFinite(Number(v))?Number(v):null),
    setLabel:(_ex,s)=>s.w+' кг × '+s.r,profile:()=>({step:2.5})};
 const W={cloud:{user:{id:'user'}},UNVRSL_EXERCISES:exercises,catalogRecords:()=>exercises,ruExerciseName:s=>s,ruTarget:s=>s,
  UNVRSLCardio:{lookup:n=>exercises.find(e=>e.n===n),summary:e=>(e.cardio?.durationMin||30)+' мин'},
  modal:html=>{output.push(html)},toast:msg=>{throw Error('Toast '+msg)},confirm:()=>true,
  addEventListener(){},beginProgramDay:(id,wi,di)=>output.push({begin:[id,wi,di]})};
 const ctx=vm.createContext({window:W,document:D,st:state,WorkoutDomain:domain,workoutRegistry:registry,
  save(){},setTimeout(){},queueMicrotask(f){f()},Date,Math});
 vm.runInContext(source,ctx);
 return {W,state,output,el,search(q){
  W.clientFreeWorkoutOpenV334();
  const input=el('cfwExercise');input.value=q;input.listeners.input();
  el('cfwResults').listeners.click({target:{closest:()=>({dataset:{cfwIndex:'0'}})}});
 }};
}
test('free workout separates cardio and strength forms and shows focused search',()=>{
 const t=setup();t.W.clientFreeWorkoutOpenV334();
 assert.match(t.output.at(-1),/cfwCardioBox/);
 assert.match(t.output.at(-1),/cfwStrengthBox/);
 assert.match(t.output.at(-1),/Дополнительные показатели/);
 assert.match(t.output.at(-1),/Твоя тренировка/);
 assert.equal(t.el('cfwResults').hidden,true,'unfiltered catalog should stay collapsed');
 t.search('беговая');
 assert.equal(t.el('cfwCardioBox').hidden,false);
 assert.equal(t.el('cfwStrengthBox').hidden,true);
 assert.equal(t.el('cfwSearchBox').hidden,true);
 t.W.clientFreeWorkoutAddV334();
 assert.equal(t.state.clientFreeWorkoutDraftV334.user[0].kind,'cardio');
});
test('min and max repetitions share one accessible field while preserving their separate values',()=>{
 const t=setup();t.W.clientFreeWorkoutOpenV334();
 const form=t.output.at(-1);
 assert.match(form,/class="cfw-reps-field" role="group" aria-label="Повторения"/);
 assert.match(form,/class="cfw-reps-range"/);
 assert.match(form,/id="cfwRepMin"[^>]*aria-label="Повторения от"/);
 assert.match(form,/id="cfwRepMax"[^>]*aria-label="Повторения до"/);
 assert.doesNotMatch(form,/<span>Повторы от<\/span>/);
 t.search('жим штанги');
 t.el('cfwRepMin').value='6';t.el('cfwRepMax').value='10';
 t.W.clientFreeWorkoutAddV334();t.W.clientFreeWorkoutStartV334();
 const e=t.state.programs[0].weeks[0].days[0].ex[0];
 assert.equal(e.repMin,6);assert.equal(e.repMax,10);
 assert.equal(e.sets[0].rMin,6);assert.equal(e.sets[0].rMax,10);
});
test('paired RPE and RIR controls stay synchronized and keep the same surface styling',()=>{
 const t=setup();t.W.clientFreeWorkoutOpenV334();
 const form=t.output.at(-1);
 assert.match(form,/class="cfw-effort-field" role="group" aria-label="Интенсивность"/);
 assert.match(form,/id="cfwRpe"[^>]*aria-label="RPE"/);
 assert.match(form,/id="cfwRir"[^>]*aria-label="RIR"/);
 assert.match(source,/cfw-effort-range/);
 assert.match(source,/\.cfw-reps-range\{[^}]*background:var\(--panel\)/);
 assert.match(source,/\.cfw-effort-range\{[^}]*background:var\(--panel\)/);
 t.search('жим штанги');
 t.el('cfwRpe').value='9';t.el('cfwRpe').listeners.change();
 assert.equal(t.el('cfwRir').value,'1');
 t.el('cfwRir').value='0.5';t.el('cfwRir').listeners.change();
 assert.equal(t.el('cfwRpe').value,'9.5');
 t.W.clientFreeWorkoutAddV334();t.W.clientFreeWorkoutStartV334();
 const e=t.state.programs[0].weeks[0].days[0].ex[0];
 assert.equal(e.rpe,9.5);assert.equal(e.rir,0.5);
 assert.equal(e.sets[0].targetRpeMin,9.5);assert.equal(e.sets[0].targetRirMin,0.5);
});
test('cardio steady mode creates one timed block without strength reps',()=>{
 const t=setup();t.search('беговая');t.el('cfwCardioMinutes').value='40';
 t.el('cfwCardioSpeed').value='7';t.el('cfwCardioKcal').value='300';
 t.W.clientFreeWorkoutAddV334();const history=JSON.stringify(t.state.sessions);
 t.W.clientFreeWorkoutStartV334();
 const ex=t.state.programs[0].weeks[0].days[0].ex[0];
 assert.equal(ex.kind,'cardio');assert.equal(ex.sets.length,1);
 assert.equal(ex.durationSec,2400);assert.equal(ex.sets[0].workSeconds,2400);
 assert.equal(ex.cardio.speedKmh,7);assert.equal(ex.cardio.reportedKcal,300);
 assert.equal(ex.repMin,undefined);assert.equal(JSON.stringify(t.state.sessions),history);
});
test('cardio intervals produce one block with correct total work and rest',()=>{
 const t=setup();t.search('беговая');t.el('cfwCardioMode').value='interval';
 t.el('cfwCardioMode').listeners.change();
 assert.equal(t.el('cfwCardioIntervalFields').hidden,false);
 t.W.clientFreeWorkoutAddV334();t.W.clientFreeWorkoutStartV334();
 const ex=t.state.programs[0].weeks[0].days[0].ex[0];
 assert.equal(ex.cardio.mode,'interval');assert.equal(ex.durationSec,660);
 assert.equal(ex.sets.length,1);
});
test('ordinary exercises retain sets, rep ranges, manual weight and RPE',()=>{
 const t=setup();t.search('жим штанги');
 assert.equal(t.el('cfwCardioBox').hidden,true);assert.equal(t.el('cfwStrengthBox').hidden,false);
 t.el('cfwWeight').value='82.5';
 t.W.clientFreeWorkoutAddV334();t.W.clientFreeWorkoutStartV334();
 const ex=t.state.programs[0].weeks[0].days[0].ex[0];
 assert.equal(ex.kind,undefined);assert.equal(ex.sets.length,3);
 assert.deepEqual([...ex.sets.map(s=>s.r)],[8,8,8]);
 assert.deepEqual([...ex.sets.map(s=>s.w)],[82.5,82.5,82.5]);
 assert.equal(ex.rpe,8);
});
