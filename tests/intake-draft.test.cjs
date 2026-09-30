'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const api=require('../intake-engine');const ctx={window:{}};vm.runInNewContext(fs.readFileSync(require.resolve('../exercise-catalog.js'),'utf8'),ctx);const catalog=ctx.window.UNVRSL_EXERCISES;
const answer=(extra={})=>({name:'Анна',age:30,goal:'muscle',experience:'beginner',days:3,minutes:60,limitations:false,equipment:['dumbbells','bench','cable','legpress','legcurl','chestpress'],excluded:[],...extra});
test('all curated candidates have real catalog IDs',()=>{for(const [id] of Object.values(api.POOL).flat())assert.ok(catalog.some(e=>e.id===id),id)});
test('36 profiles produce valid drafts and preserve ranges through existing program model',()=>{
 const model=require('../program-model');let n=0;
 for(const goal of Object.keys(api.GOALS))for(const experience of ['beginner','regular'])for(const days of [2,3,4])for(const minutes of [30,60]){
  const r=api.generate(answer({goal,experience,days,minutes}),catalog);assert.ok(r.program);assert.equal(r.program.intakeDraft.status,'review');assert.equal(r.program.weeks.length,4);
  model.normalizeProgram(r.program);
  for(const w of r.program.weeks){assert.equal(w.days.length,days);for(const d of w.days){assert.ok(d.ex.length>=3);assert.equal(new Set(d.ex.map(e=>e.sourceId)).size,d.ex.length);if(d.estimatedMinutes>minutes)assert.ok(r.issues.length);for(const e of d.ex){assert.equal(e.reps.mode,'manual');assert.ok(e.reps.min<e.reps.max);assert.ok(e.sets.every(s=>s.w===null));}}}n++;
 }assert.equal(n,36);
});
test('limitations and age outside pilot get no automatic prescription',()=>{for(const extra of [{limitations:true},{age:16},{age:75}]){const r=api.generate(answer(extra),catalog);assert.equal(r.program,null);assert.ok(r.issues.length)}});
test('no invented pulling exercise with no equipment',()=>{const r=api.generate(answer({equipment:[]}),catalog);assert.equal(r.program,null);assert.ok(r.issues.length)});
test('only selected equipment and exclusions are honored',()=>{
 const r=api.generate(answer({equipment:['dumbbells'],excluded:['og:3211']}),catalog);assert.ok(r.program);
 for(const e of r.program.weeks.flatMap(w=>w.days.flatMap(d=>d.ex))){assert.ok(['dumbbell','body weight'].includes(e.eq));assert.notEqual(e.sourceId,'3211');assert.notEqual(e.sourceId,'0289');}
});
test('review link round trips unicode and rejects invalid/tampered input',()=>{const a=answer({name:'Семён <img onerror=x>'});assert.deepEqual(api.decode(api.encode(a)),api.validate(a));for(const s of ['!!','a'.repeat(10001),'eyJ2IjoyfQ'])assert.throws(()=>api.decode(s));assert.throws(()=>api.validate(answer({days:99})));assert.throws(()=>api.validate(answer({limitations:'false'})));assert.throws(()=>api.validate(answer({equipment:['unknown']})))});
