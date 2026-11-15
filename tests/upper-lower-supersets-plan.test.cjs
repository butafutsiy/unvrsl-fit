'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const api=require('../upper-lower-supersets-plan.js');
const flow=require('../focus-flow.js'),model=require('../program-model.js');
const source=fs.readFileSync(require.resolve('../upper-lower-supersets-plan.js'),'utf8');
test('saved manual periodization survives normalization and JSON roundtrip',()=>{
  const p=model.normalizeProgram(JSON.parse(JSON.stringify(api.build(null,'2026-11-16'))));
  assert.equal(p.weeks.length,2);assert.equal(p.cycleOptions.periodizationMode,'manual');
  for(const [wi,w] of p.weeks.entries()){
    assert.equal(w.useIntensity,true);assert.equal(w.testWeek,false);
    assert.equal(w.days[0].ex.length,7);assert.equal(w.days[1].ex.length,10);
    for(const e of w.days.flatMap(d=>d.ex)){
      const bodyweight=e.loadType==='bodyweight_only',spec=w.weeklyLoadProfile[e.kind==='isolation'?'isolation':'base'];
      const [lo,hi]=bodyweight?[8,8]:spec.rpe;
      assert.equal(e.rpeMin,lo);assert.equal(e.rpeMax,hi);
      assert.deepEqual([e.reps.min,e.reps.max],bodyweight?[15,20]:spec.reps);
      for(const set of e.sets){
        assert.equal(set.targetRpeMin,lo);assert.equal(set.targetRpeMax,hi);assert.equal(set.targetRirMin,10-hi);assert.equal(set.allowFailure,false);
      }
      const band=require('../workout-domain').intensityBand({programWeekUseIntensity:true,programWeekIntensityMin:w.intensityMin,programWeekIntensityMax:w.intensityMax},e,e.sets[0]);
      assert.deepEqual(band,bodyweight?null:{lo:spec.pct[0]/100,hi:spec.pct[1]/100});
    }
  }
});
test('supersets and triset rotate per round with rest only after the entire round',()=>{
  for(const w of api.build(null,'2026-11-16').weeks)for(const d of w.days){
    const session={ex:flow.programEntries(d.ex).map(e=>({...e,set:e.sets}))};
    const rows=flow.queue(session);
    assert.deepEqual(rows.slice(0,4).map(r=>[r.ei,r.si]),[[0,0],[1,0],[0,1],[1,1]]);
    assert.equal(flow.restAfter(session,rows[0]).seconds,0);
    assert.equal(flow.restAfter(session,rows[1]).seconds,150);
    if(d.ex.length===10){
      const triset=rows.filter(r=>r.ei>=6&&r.ei<=8);
      assert.deepEqual(triset.slice(0,4).map(r=>[r.ei,r.si]),[[6,0],[7,0],[8,0],[6,1]]);
      assert.equal(flow.restAfter(session,triset[0]).seconds,0);
      assert.equal(flow.restAfter(session,triset[1]).seconds,0);
      assert.equal(flow.restAfter(session,triset[2]).seconds,90);
    }
  }
});
test('upgrade preserves kilograms, equipment, notes and completed sets; is idempotent',()=>{
  const p=api.build(null,'2026-11-16');p.sourceRevision=1;
  const e=p.weeks[0].days[0].ex[0];e.sets[0].w=123;e.equipmentProfileId='personal';
  e.note='Моя заметка';e.reps={mode:'manual',min:9,max:11};
  e.sets[1].ok=true;e.sets[1].targetRpeMin=9;
  const completed=JSON.stringify(e.sets[1]);
  assert.equal(api.upgrade(p),true);assert.equal(e.sets[0].w,123);
  assert.match(e.note,/Моя заметка/);assert.equal(e.equipmentProfileId,'personal');assert.equal(e.reps.min,10);
  assert.equal(JSON.stringify(e.sets[1]),completed);assert.equal(api.upgrade(p),false);
});
test('editor renders all group members once and startup only upgrades an existing personal plan',async()=>{
  const p=api.build(null,'2026-11-16');p.sourceRevision=1;
  const current={id:'unfinished',ex:[{set:[{w:100,ok:true}]}]},st={programs:[p],current,sessions:[{id:'history'}]};
  const before=JSON.stringify([current,st.sessions]),events={};let saves=0;
  const root={st,WorkoutDomain:require('../workout-domain'),location:{href:'https://example.test/'},addEventListener(n,fn){events[n]=fn},
    programExerciseRow(_p,_d,e,ei){return `<p data-index="${ei}">${e.n}</p>`},save(){saves++}};
  vm.runInNewContext(source,{window:root,st,URL});
  const day=p.weeks[0].days[1],html=day.ex.map((e,i)=>root.programExerciseRow(p,day,e,i)).join('');
  assert.equal((html.match(/data-upper-lower-group/g)||[]).length,4);
  const sharedCopy={...p,id:'client-program-copy'};delete sharedCopy.seedId;
  const sharedHtml=day.ex.map((e,i)=>root.programExerciseRow(sharedCopy,day,e,i)).join('');
  assert.equal((sharedHtml.match(/data-upper-lower-group/g)||[]).length,4);
  assert.match(html,/Трисет/);assert.match(html,/A → B → C/);
  for(let i=0;i<day.ex.length;i++)assert.equal((html.match(new RegExp(`data-index="${i}"`,'g'))||[]).length,1);
  events['unvrsl:app-ready']();await new Promise(r=>setImmediate(r));
  assert.equal(p.sourceRevision,api.REVISION);assert.equal(saves,1);
  assert.equal(JSON.stringify([current,st.sessions]),before);assert.equal(st.programs.length,1);
  st.programs=[];events['unvrsl:app-ready']();assert.equal(st.programs.length,0);
});
