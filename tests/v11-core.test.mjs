import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyRecommendation,createWorkout,emptyState,exerciseRecommendation,mergeStates,
  migrateLegacy,muscleLoad,readinessAdjustment,replaceProgramExercise,workoutWeightHistory
} from '../v11/core.mjs';
import {createSergeyPlan,ensureSergeyPlan} from '../v11/sergey-plan.mjs';

function completedWorkout({id='previous',date='2026-08-29',name='Жим лёжа',sets=[],endedAt=1000}={}){
  return {
    id,date,week:1,code:'B',name:'Грудь',targetRpe:8,startedAt:500,endedAt,updatedAt:endedAt,
    exercises:[{id:'exercise-1',name,note:'',restSeconds:120,targetReps:10,targetRpe:8,planWeight:120,sourceHasWeight:true,sets:sets.map((set,index)=>({id:`set-${index+1}`,done:true,...set}))}]
  };
}

test('legacy migration preserves real data and adds no demo bodyweight',()=>{
  const empty=migrateLegacy({sessions:[],bw:[]},123);
  assert.deepEqual(empty.bodyweights,[]);
  const migrated=migrateLegacy({
    bw:[{d:'2026-08-25',w:97.5,t:10}],
    sessions:[{id:'s1',date:'2026-08-29',w:2,c:'B',name:'Грудь',target:8,started:1,ended:2,ex:[{n:'Жим лёжа',rest:150,set:[{w:120,r:8,rpe:9,ok:true}]}]}]
  },123);
  assert.equal(migrated.bodyweights[0].value,97.5);
  assert.equal(migrated.workouts[0].exercises[0].sets[0].weight,120);
});

test('bodyweight tombstone wins over stale cloud data',()=>{
  const local=emptyState(200);
  local.deletedBodyweights=[{date:'2026-08-29',deletedAt:200}];
  const remote=emptyState(100);
  remote.bodyweights=[{date:'2026-08-29',value:97,updatedAt:100}];
  const merged=mergeStates(local,remote);
  assert.deepEqual(merged.bodyweights,[]);
});

test('cloud merge migrates legacy remote programs and measurements',()=>{
  const local=emptyState(200);
  const remote={
    sessions:[],bw:[],
    measurements:[{id:'m1',date:'2026-08-28',waist:82}],
    remotePlans:[{id:'p1',title:'План тренера',snapshot:{routines:[]}}]
  };
  const merged=mergeStates(local,remote);
  assert.equal(merged.measurements[0].waist,82);
  assert.equal(merged.assignedPrograms[0].title,'План тренера');
});

test('readiness keeps excellent day at zero and limits reduction to ten percent',()=>{
  assert.equal(readinessAdjustment({sleep:5,energy:5,stress:5,soreness:5}),0);
  assert.equal(readinessAdjustment({sleep:1,energy:1,stress:1,soreness:1}),-10);
  assert.equal(readinessAdjustment({sleep:4,energy:4,stress:4,soreness:4}),-2.5);
});

test('recommendation uses every completed set and actual RPE',()=>{
  const workout=completedWorkout({sets:[
    {weight:20,reps:10,rpe:10},
    {weight:18,reps:10,rpe:6},
    {weight:18,reps:10,rpe:6}
  ]});
  const recommendation=exerciseRecommendation([workout],'Жим лёжа',10,8);
  assert.equal(recommendation.weight,19);
  assert.equal(recommendation.averageRpe,7.3);
  assert.equal(recommendation.sourceSets.length,3);
});

test('planned weight is shown first and recommendation stays optional',()=>{
  const state=emptyState();
  state.workouts=[completedWorkout({sets:[{weight:120,reps:8,rpe:9},{weight:120,reps:7,rpe:9}]})];
  const routine={w:2,c:'B',t:'Грудь',e:[{n:'Жим лёжа',s:3,r:10,w:120}]};
  const workout=createWorkout(routine,{targetRpe:8,manualPercent:-5,state});
  assert.equal(workout.exercises[0].sets[0].weight,115);
  assert.equal(workout.exercises[0].recommendationApplied,false);
  assert.ok(workout.exercises[0].recommendation.weight>0);
  assert.ok(workout.exercises[0].recommendation.weight<=workout.exercises[0].recommendation.baseWeight);
  applyRecommendation(workout,'exercise-1');
  assert.equal(workout.exercises[0].sets[0].weight,workout.exercises[0].recommendation.weight);
});

test('weightless plan learns from first completed workout for later sessions',()=>{
  const state=emptyState();
  state.workouts=[completedWorkout({name:'Тяга блока',sets:[{weight:42,reps:10,rpe:8}],endedAt:5000})];
  state.learnedWeights={'тяга блока':{weight:42,date:'2026-08-29',workoutId:'previous',updatedAt:5000}};
  const routine={w:1,c:'A',t:'Без весов',e:[{n:'Тяга блока',s:3,r:12}]};
  const workout=createWorkout(routine,{targetRpe:8,manualPercent:0,state});
  assert.equal(workout.exercises[0].sourceHasWeight,false);
  assert.equal(workout.exercises[0].sets[0].weight,42);
});

test('muscle load includes lower-body and upper-body groups',()=>{
  const now=Date.now();
  const squat=completedWorkout({id:'squat',name:'Присед HB',sets:[{weight:100,reps:10,rpe:8}],endedAt:now});
  const bench=completedWorkout({id:'bench',name:'Жим лёжа',sets:[{weight:80,reps:10,rpe:8}],endedAt:now});
  const load=muscleLoad([squat,bench],7,now);
  const byName=Object.fromEntries(load.map(item=>[item.name,item.volume]));
  assert.ok(byName['Квадрицепс']>0);
  assert.ok(byName['Ягодицы']>0);
  assert.ok(byName['Грудь']>0);
  assert.ok(byName['Трицепс']>0);
  assert.equal(load.length,17);
});

test('workout weight history never drops lower-body sessions',()=>{
  const lower=completedWorkout({id:'lower',name:'Присед HB',sets:[{weight:150,reps:8,rpe:8}],endedAt:2000});
  const history=workoutWeightHistory([lower],'Присед HB');
  assert.equal(history.length,1);
  assert.equal(history[0].workoutId,'lower');
});

test('deleted workout cannot return during merge',()=>{
  const stale=completedWorkout({id:'removed',sets:[{weight:120,reps:8,rpe:8}],endedAt:100});
  const local=emptyState(200);
  local.deletedWorkoutIds=[{id:'removed',deletedAt:200}];
  const remote=emptyState(100);
  remote.workouts=[stale];
  assert.deepEqual(mergeStates(local,remote).workouts,[]);
});

test('deleted measurements cannot return during cloud merge',()=>{
  const local=emptyState(200);
  local.deletedMeasurements=[{date:'2026-08-29',deletedAt:200}];
  const remote=emptyState(100);
  remote.measurements=[{id:'measurement-2026-08-29',date:'2026-08-29',waist:82,updatedAt:100}];
  assert.deepEqual(mergeStates(local,remote).measurements,[]);
});

test('Sergey plan is seeded once with eight weeks and a lower-body day',()=>{
  const state=emptyState(100);
  assert.equal(ensureSergeyPlan(state,100),true);
  assert.equal(ensureSergeyPlan(state,200),false);
  assert.equal(state.programs.length,1);
  const plan=createSergeyPlan(100);
  assert.equal(plan.weeks.length,8);
  assert.ok(plan.weeks.every(week=>week.days.some(day=>/Ноги/.test(day.name))));
});

test('exercise replacement preserves its prescription',()=>{
  const program=createSergeyPlan(100),day=program.weeks[0].days[0],before=structuredClone(day.ex[0]);
  assert.equal(replaceProgramExercise(program,0,day.id,0,{name:'Жим в Смите'}),true);
  assert.equal(day.ex[0].n,'Жим в Смите');
  assert.deepEqual(day.ex[0].sets,before.sets);
  assert.equal(day.ex[0].rpe,before.rpe);
  assert.equal(day.ex[0].tempo,before.tempo);
  assert.equal(day.ex[0].rest,before.rest);
});
