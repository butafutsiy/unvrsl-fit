'use strict';
const assert = require('node:assert/strict');
const {adjust} = require('../adaptive-load.js');
const base = {
  weight:100, actualReps:9, actualRir:0, targetRepMin:10, targetRepMax:10,
  targetRirMin:2, targetRirMax:2, step:2.5,
  loadType:'external_total', exerciseName:'Жим штанги лёжа'
};
const cases = [
  [{},'down',95], [{actualRir:1},'down',97.5], [{actualRir:2},'hold',100],
  [{actualRir:3},'hold',100], [{actualReps:8,actualRir:0},'down',92.5],
  [{actualReps:10,actualRir:0},'down',97.5],
  [{actualReps:10,actualRir:2},'hold',100],
  [{actualReps:10,actualRir:4},'up',102.5],
  [{actualReps:10,actualRir:5},'up',102.5],
  [{actualReps:10,actualRir:6},'hold',100],
  [{actualReps:12,actualRir:0},'hold',100],
  [{actualReps:12,actualRir:2},'up',102.5],
  [{actualRir:null,actualRpe:0},'hold',100],
  [{actualReps:9,actualRir:6},'hold',100],
  [{actualReps:9,actualRir:0,pain:true},'stop',100],
  [{actualReps:9,actualRir:0,techniqueFailed:true},'hold',100],
  [{actualReps:9,actualRir:0,warmup:true},'hold',100],
  [{weight:8,step:2,actualReps:10,actualRir:4,loadType:'per_dumbbell',exerciseName:'Махи гантелями'},'hold',8],
  [{weight:8,step:1,actualReps:9,actualRir:0,loadType:'per_dumbbell',exerciseName:'Махи гантелями'},'hold',8],
  [{weight:200,step:5,actualReps:9,actualRir:0,loadType:'per_side',loadedSides:2,implementWeight:0,exerciseName:'Жим ногами'},'down',190],
  [{weight:30,step:5,actualReps:9,actualRir:0,loadType:'bodyweight_assisted',exerciseName:'Гравитрон',bodyWeight:80},'down',35],
  [{weight:30,step:5,actualReps:10,actualRir:4,loadType:'bodyweight_assisted',exerciseName:'Гравитрон',bodyWeight:80},'hold',30],
  [{weight:30,step:5,actualReps:10,actualRir:4,loadType:'bodyweight_assisted',exerciseName:'Гравитрон',bodyWeight:100},'hold',30],
  [{weight:30,step:5,actualReps:9,actualRir:0,loadType:'bodyweight_assisted',exerciseName:'Гравитрон'},'hold',30],
  [{weight:100,available:[90,95,100,110],actualReps:9,actualRir:0},'down',95],
  [{weight:100,actualReps:9,actualRir:0,targetRepMin:8,targetRepMax:12},'hold',100],
  [{actualReps:7,actualRir:4},'hold',100],
];
for(const [changes,expectedAction,expectedWeight] of cases){
  const actual=adjust({...base,...changes});
  assert.equal(actual.action,expectedAction,JSON.stringify(changes));
  assert.equal(actual.weight,expectedWeight,JSON.stringify(changes));
}
let previous=-Infinity;
for(const rir of [0,1,2,3,4]){
  const output=adjust({...base,actualRir:rir});
  assert.ok(output.weight>=previous,'More reserve must not result in lower external load');
  previous=output.weight;
}
for(const exerciseName of ['Приседания со штангой','Жим лёжа','Махи гантелями','Жим ногами']){
  for(const reps of [6,8,9,10,12,15]){
    for(const rir of [0,1,2,3,4]){
      const result=adjust({...base,weight:100,actualReps:reps,actualRir:rir,exerciseName});
      assert.ok(Number.isFinite(result.weight)&&result.weight>=0);
      assert.ok(Math.abs((result.weight/2.5)-Math.round(result.weight/2.5))<1e-8);
    }
  }
}
console.log('Adaptive-load: '+cases.length+' scenarios + monotonicity and range checks passed');
