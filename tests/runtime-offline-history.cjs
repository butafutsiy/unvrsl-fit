'use strict';
const {JSDOM}=require(process.env.UNVRSL_JSDOM||'jsdom');
const fs=require('node:fs'),assert=require('node:assert/strict');
const dom=new JSDOM('<html><head></head><body><div id="sheet"></div></body></html>',{runScripts:'dangerously',url:'https://app.test/'}),w=dom.window;
const db={offline_clients:[{id:'c1',trainer_id:'t1',display_name:'Client'}],offline_client_measurements:[{id:'m1',offline_client_id:'c1',trainer_id:'t1',measure_date:'2026-10-01',weight_kg:96,measurements:{waist:90},entry_source:'client'}],offline_client_strengths:[{id:'s1',offline_client_id:'c1',trainer_id:'t1',exercise_key:'bench',exercise_name:'Жим',measured_at:'2026-10-01',weight_kg:100,reps:10,e1rm:133.3,entry_source:'client'}],offline_progress_shares:[{id:'share',trainer_id:'t1',offline_client_id:'c1'}]};
let alerts=[],confirm=true;
w.modal=html=>w.document.getElementById('sheet').innerHTML=html;w.alert=x=>alerts.push(x);w.confirm=()=>confirm;w.toast=()=>{};
w.cloud={user:{id:'t1'},client:{from(table){let filters=[],action='',payload,single=false,range;const query={select(){return this},eq(k,v){filters.push([k,v]);return this},order(){return this},range(a,b){range=[a,b];return this},limit(){return this},single(){single=true;return this},maybeSingle(){single=true;return this},update(p){action='update';payload=p;return this},insert(p){action='insert';payload=p;return this},delete(){action='delete';return this},then(resolve,reject){try{let rows=db[table].filter(r=>filters.every(([k,v])=>r[k]===v));if(action==='insert'){db[table].push({...payload,id:'new'});rows=[db[table].at(-1)]}if(action==='update')rows.forEach(r=>Object.assign(r,payload));if(action==='delete')db[table]=db[table].filter(r=>!rows.includes(r));if(range)rows=rows.slice(range[0],range[1]+1);return Promise.resolve({data:single?rows[0]||null:rows,error:single&&!rows.length&&action?{message:'Row not found'}:null}).then(resolve,reject)}catch(e){return Promise.reject(e).then(resolve,reject)}}};return query}}};
w.WorkoutDomain=require('../workout-domain.js');w.eval(fs.readFileSync(require.resolve('../offline-progress.js'),'utf8'));
const val=(id,v)=>w.document.getElementById(id).value=v;
(async()=>{
 await w.offlineClientDetail('c1');
 assert.equal(w.document.querySelectorAll('details.ofp-journal').length,2);
 await w.offlineProgressEditEntry('measurement','c1','m1');val('omWeight','95');await w.offlineSaveMeasurement('c1');
 assert.equal(db.offline_client_measurements.length,1);assert.equal(db.offline_client_measurements[0].weight_kg,95);assert.equal(db.offline_client_measurements[0].measurements.waist,90);assert.equal(db.offline_client_measurements[0].entry_source,'client');
 await w.offlineStrengthHistory('c1','bench','Жим');assert.match(w.document.body.textContent,/Изменить/);assert.match(w.document.body.textContent,/Удалить/);
 await w.offlineProgressEditEntry('strength','c1','s1');val('osWeight','110');val('osReps','10');val('osRpe','9');w.offlineProgressEffortChangedV578('rpe');assert.equal(w.document.getElementById('osRir').value,'1');await w.offlineSaveStrength('c1','bench','Жим');
 assert.equal(db.offline_client_strengths.length,1);assert.equal(db.offline_client_strengths[0].e1rm,150.3);assert.equal(db.offline_client_strengths[0].rpe,9);assert.equal(db.offline_client_strengths[0].rir,1);assert.equal(db.offline_client_strengths[0].entry_source,'client');
 await w.offlineProgressWeeklyLoad('c1');assert.equal(w.document.querySelectorAll('tbody tr').length,8);assert.ok(Number(w.document.querySelector('tbody tr td:last-child b').textContent.replace(',','.'))>100);
 val('ofpCycleWeeks','4');w.document.getElementById('ofpCycleWeeks').dispatchEvent(new w.Event('change'));assert.equal(w.document.querySelectorAll('tbody tr').length,4);
 assert.ok(!JSON.stringify(db.offline_progress_shares[0].snapshot).includes('weekly'));
 await w.offlineProgressEditEntry('strength','c1','s1');
 assert.equal(w.document.getElementById('osRpe').value,'9');
 assert.equal(w.document.getElementById('osRir').value,'1');
 w.document.getElementById('osDeload').checked=true;await w.offlineSaveStrength('c1','bench','Жим');
 assert.equal(db.offline_client_strengths[0].is_deload,true);
 assert.equal(db.offline_client_strengths[0].e1rm,null,'recovery record remains in history but does not influence 1RM');
 await w.offlineClientDetail('c1');
 assert.match(w.document.querySelector('.ofp-strength').textContent,/150,3/,'chart-only 1RM reconstructed from 110 kg × 10 @ RPE 9');
 assert.equal(w.document.querySelectorAll('.ofp-strength .ofp-graph-point').length,1,'deload point stays on historical chart');
 assert.equal(db.offline_client_strengths[0].e1rm,null,'display never persists derived 1RM');
 await w.offlineProgressWeeklyLoad('c1');assert.match(w.document.body.textContent,/нет данных/);
 confirm=false;await w.offlineProgressDeleteStrength('c1','s1');assert.equal(db.offline_client_strengths.length,1);
 confirm=true;await w.offlineProgressDeleteStrength('c1','s1');assert.equal(db.offline_client_strengths.length,0);
 await w.offlineProgressWeeklyLoad('c1');assert.match(w.document.body.textContent,/Сначала добавь/);
 await w.offlineClientDetail('c1');await w.offlineProgressDeleteMeasurementV334('m1');assert.equal(db.offline_client_measurements.length,0);
 assert.deepEqual(alerts,[]);await w.offlineProgressEditEntry('strength','other','s1');assert.equal(alerts.length,1);
 // Every qualifying working record contributes exactly once. A 100 kg single
 // must not be dropped by hidden median trimming and a deload must not lower
 // the mean or change the percentage table.
 db.offline_clients.push({id:'n1',trainer_id:'t1',display_name:'Example'});
 const rows=[
  ['2026-09-12',65,6,8,false],
  ['2026-09-21',70,8,8,false],
  ['2026-09-28',65,8,8,true],
  ['2026-10-07',100,1,8,false],
  ['2026-10-21',80,5,8,false],
 ];
 rows.forEach(([measured_at,weight_kg,reps,rpe,is_deload],i)=>db.offline_client_strengths.push({
  id:'n'+i,offline_client_id:'n1',trainer_id:'t1',
  exercise_name:'Присед со штангой',exercise_key:'squat',
  measured_at,created_at:measured_at,weight_kg,reps,rpe,rir:10-rpe,is_deload}));
 const before=JSON.stringify(db.offline_client_strengths);
 await w.offlineProgressWeeklyLoad('n1');
 const text=w.document.getElementById('ofpWeeklyExercises').textContent;
 assert.match(text,/Актуальный 1ПМ:\s*100 кг/);assert.match(text,/TM:\s*90 кг/);assert.match(text,/Исторический средний:\s*96,1 кг/);
 assert.match(text,/Подтверждённый одиночный подъём: 100 кг/);
 assert.match(text,/не даёт занизить актуальный 1ПМ/);
 assert.match(text,/Рабочих записей всего:\s*4 из 5/);
 assert.match(text,/Разгрузочных подходов исключено:\s*1/);
 assert.match(text,/110 кг/,'the higher successful single is included in full');
 assert.match(text,/82,3 \+ 93,3 \+ 110 \+ 98,7/);
 assert.equal(w.document.querySelectorAll('tbody tr').length,8);
 assert.equal(w.document.querySelector('tbody tr td:last-child b').textContent,'72,50','week 1 uses confirmed 100 kg baseline, not smoothed 96.5 kg');
 assert.equal(JSON.stringify(db.offline_client_strengths),before,'read-only weekly projections');
 db.offline_client_strengths.push({id:'new-working',offline_client_id:'n1',trainer_id:'t1',exercise_name:'Присед со штангой',exercise_key:'squat',measured_at:'2026-10-28',created_at:'2026-10-28',weight_kg:100,reps:3,rpe:8,rir:2,is_deload:false});
 await w.offlineProgressWeeklyLoad('n1');
 assert.match(w.document.getElementById('ofpWeeklyExercises').textContent,/Актуальный 1ПМ:\s*110 кг/,'new working result updates rolling e1RM');assert.match(w.document.getElementById('ofpWeeklyExercises').textContent,/Исторический средний:\s*100,2 кг/,'full history is kept separately');
 console.log('Offline history: edit, ownership, author preservation, recalculation, delete/cancel, weekly projection and private snapshot passed.');dom.window.close();
})().catch(e=>{console.error(e);dom.window.close();process.exitCode=1});
