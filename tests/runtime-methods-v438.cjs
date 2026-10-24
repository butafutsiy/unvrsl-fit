'use strict';
const assert=require('node:assert/strict');
const {make,wait,errors}=require('./runtime-v392.cjs');
(async()=>{
  const dom=make(),w=dom.window;for(let i=0;i<200&&!w.__unvrslStartupComplete;i++)await wait(50);await w.unvrslWarmDeferredModulesV320?.();
  try {
    assert.ok(w.__unvrslStartupComplete);
    const result=await w.eval(`(async()=>{
      st.sessions=[{id:'sep',date:'2026-09-26',started:Date.parse('2026-09-26T04:00:00Z'),ended:Date.parse('2026-09-26T05:00:00Z'),ex:[{n:'Жим лёжа',method:'UNVRSL',set:[{w:135,r:3,rpe:8,ok:true,role:'unvrsl-heavy'},{w:100,r:9,rpe:8,ok:true,role:'unvrsl-light'},{w:135,r:3,rpe:9,ok:true,role:'unvrsl-heavy'}]}]}];
      st.sessions.push({id:'standard',date:'2026-09-25',started:Date.parse('2026-09-25T04:00:00Z'),ended:Date.parse('2026-09-25T05:00:00Z'),ex:[{n:'Жим лёжа',method:'STANDARD',set:[{w:135,r:3,rpe:8,ok:true}]}]});
      const outcomes=[];
      for(const week of [1,2,3,4,5,6,7,8]){
        if(st.current)workoutStore.discard(st);
        st.current=session(UNVRSL_ROUTINES.find(r=>r.w===week&&r.c==='B'));st.current.started=Date.parse('2026-09-27T04:00:00Z');st.current.date='2026-09-27';
        nav('start');startPage();unvrslApplyBuiltinLoadProfileV296(st.current);unvrslTrainingPrescriptionPrepareV292(st.current);await trainingEngine200Tick();await new Promise(r=>setTimeout(r,30));await trainingLoadModel292.run();
        const ex=st.current.ex.filter(e=>/Жим (?:штанги )?л[её]жа/i.test(e.n));
        outcomes.push({week,sets:ex.flatMap(e=>e.set.map(s=>({name:e.n,role:s.role,weight:s.recommendedW,reason:s.recommendation?.reasonCode,version:s.recommendation?.engineVersion,scope:s.recommendation?.scope,range:s.recommendation?.repRange,basis:s.recommendation?.basis,date:s.recommendation?.basis?.date}))),text:document.querySelector('#start .te200-rec')?.textContent});
      }
      return outcomes;
    })()`);
    if(process.env.DEBUG_METHODS)console.log(JSON.stringify(result,null,2));
    for(const row of result){
      assert.ok(row.sets.length,'week '+row.week);
      assert.ok(row.sets.every(s=>s.version===3&&s.range.lo>=1&&s.range.hi>=s.range.lo),'v3 target week '+row.week);
      // Old history lacks matching tempo/equipment and cannot authorise an invented load.
      assert.ok(row.sets.every(s=>s.weight==null),'incomparable history week '+row.week);
    }
    const attempts=result.find(x=>x.week===8).sets.filter(s=>s.role==='test_attempt');
    assert.equal(attempts.length,3);assert.ok(attempts.every(s=>s.weight==null));
    assert.equal(result.find(x=>x.week===3).sets.length,8);
    assert.equal(result.find(x=>x.week===6).sets.length,9);
    const surface=w.eval(`(()=>{const group=groupIndexedEntries(st.current.ex).find(g=>/Жим (?:штанги )?л[её]жа/i.test(g.base));const html=exerciseGroupCard(st.current,group);return {html,targets:group.entries.flatMap(e=>e.set.map(s=>({role:WorkoutDomain.setRole(e,s),target:effortTargets(st.current,e,s)})))}})()`);
    assert.ok(!surface.html.includes('Прошлый:'),'UNVRSL sets must not appear as previous TEST/back-off rows');
    assert.ok(surface.targets.filter(x=>x.role==='backoff').every(x=>x.target.rpe==='7–8'&&x.target.rir==='2–3'));
    w.eval(`renderExerciseDetail(workoutRegistry.resolve('Жим лёжа'))`);
    const controls=await w.eval(`(async()=>{
      startPage();await trainingEngine200Tick();
      const ex=st.current.ex.find(e=>e.set.some(s=>s.role==='test_attempt')),set=ex.set[0],before=JSON.stringify(ex.set.map(s=>({w:s.w,role:s.role})));
      const card=document.querySelector('#start .te200-rec');
      const apply=card.querySelector('[data-rec-v3="apply"]'),cancel=card.querySelector('[data-rec-v3="dismiss"]');
      cancel.click();await trainingLoadModel292.run();await trainingEngine200Tick();
      return {blocked:!apply,preserved:JSON.stringify(ex.set.map(s=>({w:s.w,role:s.role})))===before,dismissed:set.dismissedRecommendation===set.recommendation.proposalKey,iso:st.current.ex.filter(e=>e.set.some(s=>s.role==='isolation_test')).length};
    })()`);
    assert.ok(controls.blocked&&controls.preserved&&controls.dismissed);assert.equal(controls.iso,0);
    assert.ok(!errors.length,errors.join('\n'));
    console.log(JSON.stringify({status:'passed',weeks:result.map(x=>({week:x.week,weights:x.sets.map(s=>s.weight),reps:x.sets.map(s=>s.range)})),errors},null,2));
  } finally {await wait(150);dom.window.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
