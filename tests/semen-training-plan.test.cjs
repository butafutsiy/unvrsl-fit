'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs');
const domain=require('../workout-domain.js'),api=require('../semen-training-plan.js');
test('personal plan preserves both original days and glute bridge replacement across eight weeks',()=>{
  const plan=api.build(domain,'2026-10-23');
  assert.equal(plan.weeks.length,8);
  assert.equal(plan.weeks[0].days[0].date,'2026-10-23');
  assert.equal(plan.weeks[0].days[1].date,'2026-10-26');
  for(const w of plan.weeks){
    assert.equal(w.days.length,2);
    w.days.forEach((day,di)=>assert.deepEqual(day.ex.map(e=>e.n),api.days[di].ex.map(e=>e[0])));
    assert.equal(w.days[1].ex[5].n,'Ягодичный мост со штангой');
    for(const day of w.days)for(const e of day.ex){
      assert.ok(e.cycleManaged);assert.ok(e.sets.length>0);assert.ok(e.rest>0);
      assert.ok(e.sets.every(s=>s.w===0&&!s.allowFailure));
    }
  }
  assert.equal(plan.weeks[0].days[0].ex[2].sets.length,4);
  assert.equal(plan.weeks[0].days[0].ex[7].sets.length,2);
  for(const wi of [3,5]){
    assert.ok(plan.weeks[wi].deload);
    assert.ok(plan.weeks[wi].days.flatMap(d=>d.ex).every(e=>e.sets.every(s=>s.targetRpeMax===6)));
  }
  assert.equal(plan.cycleOptions.testWeek,false);
  assert.equal(plan.weeks[0].days[1].ex[2].loadType,'bodyweight_added');
  assert.equal(plan.weeks[0].days[0].ex[1].loadType,'per_dumbbell');
  const restored=JSON.parse(JSON.stringify(plan));
  assert.deepEqual(restored.weeks,JSON.parse(JSON.stringify(plan.weeks)));
});
test('loading never seeds other users; explicit add is idempotent and preserves an active workout',async()=>{
  const current={id:'unfinished',ex:[{n:'Existing',set:[{w:100,r:8,ok:true}]}]};
  const st={programs:[],current};let saves=0,syncs=0;
  const root={st,WorkoutDomain:domain,location:{href:'https://example.test/?addPlan='+api.ID},history:{replaceState(){}},addEventListener(){},templatesSheet(){},accountSyncNow(){syncs++}};
  const context={window:root,st,save(){saves++},URL,document:{}};
  vm.runInNewContext(fs.readFileSync(require.resolve('../semen-training-plan.js'),'utf8'),context);
  assert.equal(st.programs.length,0);
  await root.addSemenTrainingPlan();
  assert.equal(st.programs.length,1);assert.equal(st.primaryProgramId,api.ID);
  st.programs[0].weeks[0].days[0].ex[0].sets[0].w=95;
  await root.addSemenTrainingPlan();
  assert.equal(st.programs.length,1);
  assert.equal(st.programs[0].weeks[0].days[0].ex[0].sets[0].w,95);
  assert.equal(st.current,current);assert.equal(saves,2);assert.equal(syncs,2);
});
