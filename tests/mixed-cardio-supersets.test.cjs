'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const D=require('../workout-domain'),M=require('../program-model'),F=require('../focus-flow');
function begin(cardio){
 const source=read('coach-programs.js');
 const program={id:'mixed-program',name:'Mixed program',weeks:[{days:[{id:'day',name:'Функциональная',ex:[
 {...cardio,id:'ski',kind:'cardio',method:'STANDARD',rest:0,superGroup:'pair',superPos:0,superSize:2,transitionSec:0,afterGroupRestSec:150,sets:Array.from({length:3},()=>({workSeconds:cardio.durationSec||0}))},
 {id:'press',n:'Жим гири',kind:'compound',method:'STANDARD',rest:150,superGroup:'pair',superPos:1,superSize:2,transitionSec:0,afterGroupRestSec:150,reps:{mode:'manual',min:10,max:12},rpe:8,sets:Array.from({length:3},()=>({w:16,r:10}))}
 ]}]}]};
 let counter=0;
 const context={programModel:M,WorkoutDomain:D,WorkoutFocusFlow:F,st:{programs:[program]},programById:()=>program,
 programResolveExerciseParametersV381:(_p,_w,e)=>({reps:e.reps,effort:{rpeMin:7,rpeMax:8}}),
 uid:()=>String(++counter),iso:()=> '2026-11-21',save(){},closeModal(){},nav(){},toast(){},document:{head:{appendChild(){}},createElement:()=>({})}};
 context.window=context;
 vm.createContext(context);
 vm.runInContext(source.slice(source.indexOf('function programWorkoutRepTarget'),source.indexOf('window.programBeginDayCoreV382=beginProgramDay;')),context);
 context.beginProgramDay(program.id,0,0);
 return {context,program};
}
test('distance cardio retains all paired rounds, target distance and transition rest',()=>{
 const {context}=begin({n:'Лыжный тренажёр',cardioMachineId:'skierg',cardio:{mode:'distance',distanceKm:.25}});
 const s=context.st.current,e=s.ex[0],q=F.queue(s);
 assert.equal(e.cardio.distanceKm,.25);assert.equal(e.cardio.durationMin,null);assert.equal(e.workSeconds,0);
 assert.equal(e.set.length,3);assert.ok(e.set.every(s=>s.workSeconds===0));
 assert.deepEqual(q.slice(0,4).map(r=>[r.ei,r.si]),[[0,0],[1,0],[0,1],[1,1]]);
 assert.equal(F.restAfter(s,q[0]).seconds,0);assert.equal(F.restAfter(s,q[1]).seconds,150);
 assert.equal(e.target,undefined);assert.equal(e.programExerciseId,'ski');
});
test('legacy cardio conversion cannot turn distance goals into a timed workout',()=>{
 const {context}=begin({n:'Гребной тренажёр',cardioMachineId:'rower',cardio:{mode:'distance',distanceKm:.35}});
 context.prescriptionText=e=>`${e.cardio.distanceKm} км`;
 const before=JSON.stringify(context.st.current);
 vm.runInContext(read('cardio-exercise-library.js'),context);
 assert.equal(JSON.stringify(context.st.current),before);
 assert.equal(context.prescriptionText(context.st.programs[0].weeks[0].days[0].ex[0]),'0.35 км');
});
test('timed cardio still keeps its prescribed interval and all rounds',()=>{
 const {context}=begin({n:'Аэробайк',durationSec:40,cardioMachineId:'air-bike',cardio:{mode:'steady',durationMin:40/60}});
 const e=context.st.current.ex[0];assert.equal(e.workSeconds,40);assert.equal(e.set.length,3);
 assert.ok(e.set.every(s=>s.workSeconds===40));assert.equal(e.cardio.durationMin,40/60);
});
