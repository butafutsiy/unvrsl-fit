'use strict';
const assert=require('node:assert/strict');
const {make,wait,errors}=require('./runtime-v392.cjs');
(async()=>{
  const dom=make();await wait(2700);const w=dom.window;
  try {
    assert.ok(w.__unvrslStartupComplete);
    const result=await w.eval(`(async()=>{
      st.sessions=[{id:'sep',date:'2026-09-26',started:Date.parse('2026-09-26T04:00:00Z'),ended:Date.parse('2026-09-26T05:00:00Z'),ex:[{n:'Жим лёжа',method:'UNVRSL',set:[{w:135,r:3,rpe:8,ok:true,role:'unvrsl-heavy'},{w:100,r:9,rpe:8,ok:true,role:'unvrsl-light'},{w:135,r:3,rpe:9,ok:true,role:'unvrsl-heavy'}]}]}];
      const outcomes=[];
      for(const week of [1,2,3,4,5,6,7,8]){
        if(st.current)workoutStore.discard(st);
        st.current=session(UNVRSL_ROUTINES.find(r=>r.w===week&&r.c==='B'));st.current.started=Date.parse('2026-09-27T04:00:00Z');st.current.date='2026-09-27';
        nav('start');startPage();unvrslApplyBuiltinLoadProfileV296(st.current);unvrslTrainingPrescriptionPrepareV292(st.current);await trainingEngine200Tick();await new Promise(r=>setTimeout(r,30));await trainingLoadModel292.run();
        const ex=st.current.ex.filter(e=>/Жим (?:штанги )?л[её]жа/i.test(e.n));
        outcomes.push({week,sets:ex.flatMap(e=>e.set.map(s=>({name:e.n,role:s.role,weight:s.recommendedW,range:s.recommendation?.repRange,basis:s.recommendation?.basis,date:s.recommendation?.basis?.date}))),text:document.querySelector('#start .te200-rec')?.textContent});
      }
      return outcomes;
    })()`);
    if(process.env.DEBUG_METHODS)console.log(JSON.stringify(result,null,2));
    for(const row of result){assert.ok(row.sets.length,'week '+row.week);assert.ok(row.sets.every(s=>s.weight>=0),'week '+row.week)}
    const test=result.find(x=>x.week===8).sets.find(s=>/тест/i.test(s.name));
    assert.equal(test.range.lo,1);assert.equal(test.range.hi,1);assert.ok(test.weight>=140&&test.weight<=150);assert.equal(test.date,'2026-09-26');
    const back=result.find(x=>x.week===8).sets.filter(s=>/back-off/i.test(s.name));assert.ok(back.every(s=>s.range.lo===5&&s.range.hi===5));
    assert.equal(back.length,3);
    const attempts=result.find(x=>x.week===8).sets.filter(s=>/тест/i.test(s.name));assert.equal(attempts.length,3);assert.ok(attempts[0].weight<=attempts[1].weight&&attempts[1].weight<=attempts[2].weight);
    const unvrsl=result.find(x=>x.week===3).sets;assert.equal(unvrsl.length,8);assert.ok(unvrsl[0].weight>unvrsl[1].weight);
    const sldr=result.find(x=>x.week===6).sets;assert.equal(sldr.length,9);assert.equal(new Set(sldr.map(s=>s.weight)).size,1);
    const surface=w.eval(`(()=>{const group=groupIndexedEntries(st.current.ex).find(g=>/Жим (?:штанги )?л[её]жа/i.test(g.base));const html=exerciseGroupCard(st.current,group);return {html,targets:group.entries.flatMap(e=>e.set.map(s=>({role:WorkoutDomain.setRole(e,s),target:effortTargets(st.current,e,s)})))}})()`);
    assert.ok(!surface.html.includes('Прошлый:'),'UNVRSL sets must not appear as previous TEST/back-off rows');
    assert.ok(surface.targets.filter(x=>x.role==='backoff').every(x=>x.target.rpe==='7–8'&&x.target.rir==='2–3'));
    w.eval(`renderExerciseDetail(workoutRegistry.resolve('Жим лёжа'))`);
    const expected=w.eval(`WorkoutDomain.strengthEstimate(st.current.ex[0],WorkoutDomain.history(st.current.ex[0],st.sessions,workoutRegistry),workoutRegistry).estimate.toFixed(1)`);
    assert.ok(w.document.querySelector('.catalog394-estimate').textContent.includes(expected+' кг'));
    const controls=await w.eval(`(async()=>{
      startPage();await trainingEngine200Tick();
      const card=document.querySelector('#start .te200-rec');
      const apply=[...card.querySelectorAll('button')].find(b=>b.textContent==='Применить рекомендацию');
      const cancel=[...card.querySelectorAll('button')].find(b=>b.textContent==='Отменить');
      const ex=st.current.ex.find(e=>/Жим (?:штанги )?л[её]жа.*тест/i.test(e.n)),set=ex.set[0];
      const weight=set.w;cancel.click();await trainingLoadModel292.run(true);await trainingEngine200Tick();
      return {buttons:!!apply&&!!cancel,weightPreserved:weight===set.w,dismissed:set.dismissedRecommendation===set.recommendation.proposalKey,iso:st.current.ex.filter(e=>e.set.some(s=>s.role==='isolation_test')).map(e=>e.set.filter(s=>s.role==='isolation_test').length)};
    })()`);
    assert.ok(controls.buttons&&controls.weightPreserved&&controls.dismissed);
    assert.ok(controls.iso.length>0&&controls.iso.every(n=>n===3));
    assert.ok(!errors.length,errors.join('\n'));
    console.log(JSON.stringify({status:'passed',weeks:result.map(x=>({week:x.week,weights:x.sets.map(s=>s.weight),reps:x.sets.map(s=>s.range)})),errors},null,2));
  } finally {await wait(150);dom.window.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
