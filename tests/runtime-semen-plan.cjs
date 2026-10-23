'use strict';
const assert=require('node:assert/strict');
const {make,wait,errors}=require('./runtime-v392.cjs');
(async()=>{
  const dom=make();await wait(2200);const w=dom.window;
  try{
    w.history.replaceState(null,'','?addPlan=semen-upper-lower-8');
    w.dispatchEvent(new w.CustomEvent('unvrsl:app-ready'));
    assert.match(w.document.getElementById('sheet').textContent,/Добавить в мои программы/);
    await w.addSemenTrainingPlan();
    const result=await w.eval(`(async()=>{
      const p=st.programs.find(p=>p.seedId==='semen-upper-lower-8');
      const rows=[];
      for(const [wi,di] of [[0,0],[0,1],[3,1],[7,1]]){
        if(st.current)workoutStore.discard(st);
        programBeginDayCoreV382(p.id,wi,di);
        await unvrslTrainingPrescriptionSyncV292(true);
        rows.push(JSON.parse(JSON.stringify(st.current)));
      }
      return rows;
    })()`);
    for(const s of result){assert.equal(s.ex.length,10);assert.equal(s.programId,'semen-upper-lower-8');}
    assert.equal(result[1].ex[5].n,'Ягодичный мост со штангой');
    assert.equal(result[2].ex[0].set[0].targetRpeMax,6);
    assert.ok(result[3].ex.every(e=>e.set.every(s=>s.role!=='test_attempt')));
    assert.deepEqual(errors,[]);
    console.log('Personal plan: linked preview, import, both day launches, deload and final week passed');
  }finally{dom.window.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
