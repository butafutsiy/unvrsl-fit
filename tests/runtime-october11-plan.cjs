'use strict';
const assert=require('node:assert/strict');
const {make,wait,errors}=require('./runtime-v392.cjs');
(async()=>{
  const dom=make();await wait(2200);const w=dom.window;
  try{
    assert.equal(w.eval("st.programs.filter(p=>p.seedId==='semen-five-day-8-oct11').length"),0);
    w.history.replaceState(null,'','?addPlan=semen-five-day-8-oct11');
    w.showOctober11CycleLink();
    assert.match(w.document.getElementById('sheet').textContent,/Твой план от 11 октября/);
    const before=w.eval('JSON.stringify({sessions:st.sessions,current:st.current,routines:ROUTINES})');
    const p=await w.addOctober11Cycle();assert.ok(p);
    assert.equal(p.weeks.length,8);
    assert.deepEqual(Array.from(p.weeks[0].days,d=>d.name.split(' · ')[0]),['A1','B','C','A2','D']);
    assert.equal(w.eval('JSON.stringify({sessions:st.sessions,current:st.current,routines:ROUTINES})'),before);
    assert.equal(p.weeks[2].days[1].ex.find(e=>e.exerciseId==='canon:bench_press').method,'UNVRSL');
    assert.equal(p.weeks[7].testWeek,true);
    const second=await w.addOctober11Cycle();assert.equal(second.id,p.id);
    assert.equal(w.eval("st.programs.filter(p=>p.seedId==='semen-five-day-8-oct11').length"),1);
    assert.equal(w.eval('st.startProgramId'),p.id);
    const originalSave=w.persistWorkoutState;
    w.persistWorkoutState=async()=>false;
    const saved=w.eval('JSON.stringify(st)');
    assert.equal(await w.addOctober11Cycle(),null);
    assert.equal(w.eval('JSON.stringify(st)'),saved);
    w.persistWorkoutState=originalSave;
    assert.deepEqual(errors,[]);
    console.log('October 11 plan: opt-in preview, eight weeks, five days, method recipe, history preservation, idempotency and save rollback passed');
  }finally{dom.window.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
