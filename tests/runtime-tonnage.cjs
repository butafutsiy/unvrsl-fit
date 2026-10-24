'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require(process.env.UNVRSL_JSDOM||'jsdom');
const root=path.resolve(__dirname,'..');
const set=(w,r)=>({w,r,ok:true,rpe:8});
const triple=(n,w,r)=>({n,set:Array.from({length:3},()=>set(w,r))});
const session={id:'screenshot',date:new Date().toISOString().slice(0,10),ended:2,started:1,bodyWeight:95,advancedMetrics:{tonnage:7094},ex:[
 triple('Жим штанги лёжа',120,8),triple('Жим гантелей на наклонной скамье',44,8),
 triple('Разведение гантелей лёжа',19,15),triple('Жим гантелей сидя',30,8),triple('Махи гантелями в стороны',15,15),
 {n:'Сведение рук в кроссовере',set:[set(20,13),set(17.5,10),set(15,10)]},
 {n:'Отжимания с дополнительным весом',set:[set(19,8),set(19,5),set(19,4)]}
]};
function fixture(role){
 const dom=new JSDOM('<div id="sheet"></div><div id="plan"></div>',{runScripts:'dangerously',url:'https://fixture.test/'}),W=dom.window;
 W.st={sessions:[JSON.parse(JSON.stringify(session))],bw:[]};W.unvrslTrainerMode=()=>role==='trainer';
 W.modal=html=>W.document.getElementById('sheet').innerHTML=html;W.setTimeout=()=>0;W.requestAnimationFrame=()=>0;W.toast=()=>{};W.save=()=>{};W.esc=String;
 const row={external_id:session.id,workout_date:session.date,payload:W.st.sessions[0]};
 W.cloud={user:{id:'fixture-user'},profile:{role},client:{from(table){
  const result={data:table==='workouts'?[row]:table==='profiles'?{id:'fixture-user',display_name:'Fixture'}:[],error:null};
  const q={select(){return q},eq(){return q},order(){return q},limit:async()=>result,maybeSingle:async()=>result,then(resolve,reject){return Promise.resolve(result).then(resolve,reject)}};
  return q;
 }}};
 const load=name=>{const script=W.document.createElement('script');script.textContent=fs.readFileSync(path.join(root,name),'utf8');W.document.head.appendChild(script)};
 load('exercise-catalog.js');load('exercise-profiles.js');load('recommendation-engine.js');load('recommendation-adapter.js');load('workout-domain.js');W.workoutRegistry=W.WorkoutDomain.registry(W.UNVRSL_EXERCISES);
 return {dom,W,load};
}
function metric(W){
 const el=[...W.document.querySelectorAll('.cj107-metric,.tcv3-session-metric')].find(e=>e.querySelector('span')?.textContent==='Тоннаж');
 assert.equal(el?.querySelector('b')?.textContent.replace(/\s/g,''),'10985кг');
}
(async()=>{
 let f=fixture('trainer');f.load('trainer-self-plan.js');await f.W.trainerSelfWorkout110(session.id);metric(f.W);f.dom.window.close();
 f=fixture('client');f.load('client-journal-profile.js');await f.W.clientWorkout107(session.id);metric(f.W);f.dom.window.close();
 f=fixture('trainer');f.load('trainer-direct-ui.js');await f.W.trainerClientDetail('fixture-user');f.W.trainerClientWorkoutV3(0);metric(f.W);f.dom.window.close();
 f=fixture('trainer');f.load('advanced-training.js');assert.equal(f.W.advSessionTonnage(session),10985);
 f.load('muscle-map-full.js');const map=f.W.unvrslMuscleMapCalculate211([session],7);assert.equal(map.volume,10985);
 const zero={...session,advancedMetrics:{tonnage:999},ex:[{n:'Отжимания',set:[set(0,10)]}]};assert.equal(f.W.unvrslMuscleMapCalculate211([zero],7).volume,0);
 f.dom.window.close();
 console.log('PASS: screenshot shows 10985 kg in trainer history, client history, trainer client view, workout metrics and muscle statistics; stale cached totals cannot override raw sets.');
})().catch(error=>{console.error(error);process.exitCode=1});
