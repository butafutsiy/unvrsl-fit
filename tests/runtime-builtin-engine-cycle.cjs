'use strict';
const assert=require('node:assert/strict');
const {make,wait,errors}=require('./runtime-v392.cjs');
(async()=>{
  const dom=make();await wait(2200);
  try{
    const result=await dom.window.eval(`(async()=>{
      const original=JSON.stringify(ROUTINES),history=JSON.stringify(st.sessions);
      const current=st.current;
      newProgramSheet();const entryVisible=document.getElementById('sheet').textContent.includes('Мой цикл · 8 недель · новый движок');
      const p=ensureProgramShape(buildBuiltinEngineCycle(iso(),'strength',true,8));st.programs.push(p);openProgramEditor(p.id);if(!p)throw Error('Cycle creation failed');
      const currentPreserved=current===st.current;
      const editor=document.getElementById('sheet').textContent;
      const summary=[];
      for(let wi=0;wi<8;wi++){
        if(st.current)workoutStore.discard(st);
        programBeginDayCoreV382(p.id,wi,1);
        await unvrslTrainingPrescriptionSyncV292(true);
        const bench=st.current.ex.filter(e=>e.exerciseId==='canon:bench_press');
        const iso=st.current.ex.find(e=>e.exerciseId==='canon:pec_deck');
        summary.push({week:wi+1,base:p.weeks[wi].weeklyLoadProfile.base,isoProfile:p.weeks[wi].weeklyLoadProfile.isolation,
          bench:bench.flatMap(e=>e.set.map(s=>({method:e.method,role:WorkoutDomain.setRole(e,s),reps:WorkoutDomain.repRange(e,s),
            pct:[s.targetIntensityMin??e.targetIntensityMin,s.targetIntensityMax??e.targetIntensityMax],rpe:[s.targetRpeMin,s.targetRpeMax],w:s.w}))),
          iso:iso&&iso.set.map(s=>({pct:[s.targetIntensityMin,s.targetIntensityMax],reps:[s.targetRepMin,s.targetRepMax],rpe:[s.targetRpeMin,s.targetRpeMax]}))});
      }
      if(st.current)workoutStore.discard(st);
      programBeginDayCoreV382(p.id,0,0);await unvrslTrainingPrescriptionSyncV292(true);
      const cardio=st.current.ex.find(e=>e.kind==='cardio');
      const firstNames=p.weeks[0].days.map(d=>d.name.split(' · ')[0]);
      const french=p.weeks[0].days[2].ex.find(e=>e.exerciseId==='canon:ez_lying_triceps')?.kind;
      const ropeSets=p.weeks[0].days.flatMap(d=>d.ex.filter(e=>e.exerciseId==='canon:rope_pushdown')).reduce((n,e)=>n+e.sets.length,0);
      if(st.current)workoutStore.discard(st);
      cycleBuildFromFirstWeek(p.id);
      const regenerated=p.weeks[2].days[1].ex.find(e=>e.exerciseId==='canon:bench_press');
      cycleUndo(p.id);
      const serialized=JSON.parse(JSON.stringify(p));ensureProgramShape(serialized);
      newProgramSheet();document.getElementById('npStart').value='2026-11-01';
      document.getElementById('npTest').checked=false;
      const configured=createBuiltinEngineCycle();
      return {summary,firstNames,entryVisible,editor,currentPreserved,originalPreserved:JSON.stringify(ROUTINES)===original,
        historyPreserved:JSON.stringify(st.sessions)===history,french,ropeSets,cardio:cardio&&{mode:cardio.mode,seconds:cardio.set[0].workSeconds},
        regenerated:{method:regenerated.method,count:regenerated.sets.length},savedTest:serialized.weeks[7].days[1].ex[0].sets.map(s=>s.targetRepMin),
        configured:{start:configured.cycleOptions.startDate,priority:configured.cycleOptions.priority,phase:configured.weeks[7].phase,test:configured.weeks[7].testWeek}};
    })()`);
    assert.equal(result.entryVisible,false);
    assert.ok(result.currentPreserved&&result.originalPreserved&&result.historyPreserved);
    assert.match(result.editor,/Периодизация/);assert.match(result.editor,/Изоляция:/);
    assert.deepEqual(Array.from(result.firstNames),['A1','B','C','A2','D']);
    assert.equal(result.french,'isolation');assert.equal(result.ropeSets,3);
    assert.deepEqual(JSON.parse(JSON.stringify(result.cardio)),{mode:'timer',seconds:480});
    for(const row of result.summary){
      if([3,5].includes(row.week)){
        assert.deepEqual(Array.from(row.bench,s=>s.role),['heavy','light','heavy','light','heavy','light','middle','middle']);
        assert.deepEqual(Array.from(row.bench,s=>s.reps.lo),[3,9,3,9,3,9,6,6]);
      }else if([4,6].includes(row.week)){
        assert.equal(row.bench.length,9);
        assert.ok(row.bench.every(s=>s.method==='SLDR'));
        assert.deepEqual(Array.from(row.bench,s=>s.reps.lo),[12,10,8,12,10,8,12,10,8]);
        for(const set of row.bench)assert.deepEqual(Array.from(set.rpe),Array.from(row.base.rpe));
      }else if(row.week===8){
        assert.equal(row.bench.length,3);assert.deepEqual(Array.from(row.bench,s=>s.reps.lo),[2,2,1]);
        assert.equal(row.bench.at(-1).role,'test_attempt');assert.equal(row.iso,undefined);
      }else{
        assert.equal(row.bench.length,row.base.sets);
        for(const set of row.bench){assert.deepEqual(Array.from(set.pct),Array.from(row.base.pct));assert.deepEqual([set.reps.lo,set.reps.hi],Array.from(row.base.reps));}
      }
      for(const set of row.iso||[]){
        assert.deepEqual(Array.from(set.pct),Array.from(row.isoProfile.pct));
        assert.deepEqual(Array.from(set.reps),Array.from(row.isoProfile.reps));
        assert.deepEqual(Array.from(set.rpe),Array.from(row.isoProfile.rpe));
      }
    }
    assert.equal(result.summary[0].bench[0].w,110,'authored manual weight is retained');
    assert.equal(result.regenerated.method,'UNVRSL');assert.equal(result.regenerated.count,8);
    assert.deepEqual(JSON.parse(JSON.stringify(result.configured)),{start:'2026-11-01',phase:'strength',test:false});
    assert.deepEqual(Array.from(result.savedTest),[2,2,1]);assert.deepEqual(errors,[]);
    console.log('Built-in engine cycle: 8 weeks, 5 days, base/isolation, method roles, weekly volume, cardio, manual weights, regeneration and history protection passed');
  }finally{dom.window.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
