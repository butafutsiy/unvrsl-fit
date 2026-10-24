'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const domain = require('../workout-domain.js');

const script = fs.readFileSync(path.join(__dirname, '../training-load-model.js'), 'utf8');
const past = (id, date, weight, reps, ok = true) => ({
  id, date, ended: Date.parse(date + 'T06:00:00Z'),
  ex: [{ n: 'Румынская тяга со штангой', set: [{ w: weight, r: reps, rpe: 8, ok }] }],
});

test('cloud history pages beyond 2500 workouts, scoped to the same owner',async()=>{
  const offsets=[];
  const query={select(){return this},eq(key,value){assert.equal(key,'user_id');assert.equal(value,'owner');return this},order(){return this},async range(start,end){offsets.push(start);assert.equal(end,start+499);return {data:Array.from({length:start<2500?500:1},(_,i)=>({external_id:String(start+i),payload:past(String(start+i),'2026-09-01',50,5)})),error:null}}};
  const context={console,st:{sessions:[],current:null},cloud:{user:{id:'owner'},client:{from:()=>query}},save(){},addEventListener(){},WorkoutDomain:domain,workoutRegistry:domain.registry([])};context.window=context;
  vm.runInNewContext(script,context);await new Promise(resolve=>setImmediate(resolve));
  assert.deepEqual(offsets,[0,500,1000,1500,2000,2500]);assert.equal(context.trainingLoadModel292.history().length,2501);
});
