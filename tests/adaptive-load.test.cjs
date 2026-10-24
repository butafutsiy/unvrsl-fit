'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),E=require('../recommendation-engine'),A=require('../adaptive-load');
const base={weight:100,actualReps:9,actualRir:0,targetRepMin:10,targetRepMax:10,targetRirMin:2,targetRirMax:2,step:2.5,min:20,max:300,exerciseName:'Жим штанги лёжа',loadType:'external_total'};
test('legacy load entry point delegates correction and safety to Engine 3',()=>{
 assert.equal(A.version,3);assert.equal(A.adjust(base).weight,95);
 assert.equal(A.adjust({...base,actualRir:1}).weight,97.5);
 assert.equal(A.adjust({...base,actualRir:5}).weight,100);
 const pain=A.adjust({...base,pain:true});assert.equal(pain.action,'stop');assert.equal(pain.weight,null);
 const unknown=A.adjust({...base,exerciseName:'Неизвестное движение'});assert.equal(unknown.effortAction,'review');assert.equal(unknown.weight,null);
 assert.equal(E.CONFIG.engineVersion,3);
});
