'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const D=require('../program-day-effort.js');
const W=require('../workout-domain.js');
const profile=W.weekProfiles[1];
const cardio={n:'Аэробайк',kind:'cardio',rpe:5,workMode:'timer',sets:[{workSeconds:360}]};
const base={n:'Жим лёжа',kind:'compound',rpe:7.5,sets:[{targetRpeMin:7,targetRpeMax:8}]};
const isolation={n:'Сгибание рук',kind:'isolation',rpe:8.5,sets:[{targetRpeMin:8,targetRpeMax:9}]};

test('W1 first-exercise cardio RPE 5 cannot overwrite strength prescription',()=>{
 const result=D.summary({weeklyLoadProfile:profile},{ex:[cardio,base,isolation]});
 assert.equal(result,'База RPE 7–8 · Изоляция RPE 8–9');
});
test('base, isolation, and their position never determine a misleading day-wide RPE',()=>{
 assert.equal(D.summary({weeklyLoadProfile:profile},{ex:[isolation,base]}),'База RPE 7–8 · Изоляция RPE 8–9');
 assert.equal(D.summary({weeklyLoadProfile:profile},{ex:[base]}),'База RPE 7–8');
 assert.equal(D.summary({weeklyLoadProfile:profile},{ex:[isolation]}),'Изоляция RPE 8–9');
 assert.equal(D.summary({weeklyLoadProfile:profile},{ex:[cardio]}),'Кардио · RPE по упражнению');
});
test('W8 test is marked as a test, with no fake isolation target',()=>{
 const week={weeklyLoadProfile:W.weekProfiles[8],testWeek:true,rpeMin:9,rpeMax:10};
 const text=D.summary(week,{ex:[cardio,base,isolation]});
 assert.equal(text,'Тест · RPE 9–10');assert.doesNotMatch(text,/Изоляция/);
});
test('manual plans without a week profile aggregate all exercise targets rather than first only',()=>{
 const manual={days:[]};
 assert.equal(D.summary(manual,{ex:[base,isolation]}),'База RPE 7–8 · Изоляция RPE 8–9');
 assert.equal(D.summary(manual,{ex:[{kind:'compound',rpe:6},{kind:'compound',rpe:8}]}),'База RPE 6–8');
 assert.equal(D.summary(manual,{ex:[{n:'Кардио',kind:'cardio'}]}),'Кардио · RPE по упражнению');
});
test('formatting retains fractional RPE targets',()=>{
 assert.equal(D.format([8.5,9.5]),'8,5–9,5');
 assert.equal(D.format([8,8]),'8');
});
