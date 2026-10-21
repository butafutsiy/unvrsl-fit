'use strict';
const {JSDOM}=require(process.env.UNVRSL_JSDOM||'jsdom'),fs=require('node:fs'),assert=require('node:assert/strict');
const D=require('../workout-domain.js');
const reg=D.registry([{id:'row',n:'Тяга блока',loadType:'external_total',tg:'lats'}]);
const sample=(i)=>({id:'w'+i,external_id:'s'+i,user_id:'client',workout_date:'2026-10-01',completed_sets:1,total_sets:1,payload:{id:'s'+i,date:'2026-10-01',started:1000000000000+i*1000,ended:1000003600000+i*1000,c:'Спина',ex:[{n:'Тяга блока',sourceId:'row',equipmentProfileId:'matrix',equipmentProfile:{id:'matrix',name:'Matrix'},set:[{w:50+i%5,r:10,rpe:8,ok:true}]}]}});
const source={kind:'coach-program',program:{name:'Мой 8-недельный цикл · новый движок',weeks:[]}};
const db={profiles:[{id:'client',display_name:'Артём'}],workouts:Array.from({length:501},(_,i)=>sample(i)),bodyweights:[{user_id:'client',measure_date:'2026-10-01',weight_kg:70},{user_id:'client',measure_date:'2026-10-10',weight_kg:72}],body_measurements:[{user_id:'client',measure_date:'2026-10-01',measurements:{waist:80}},{user_id:'client',measure_date:'2026-10-10',measurements:{waist:79}}],plan_assignments:[{plan_id:'plan',trainer_id:'trainer',client_id:'client',version:1,status:'active',snapshot:JSON.parse(JSON.stringify(source)),updated_at:'original',plans:{title:'Общий план'}}],plans:[{id:'plan',trainer_id:'trainer',snapshot:JSON.parse(JSON.stringify(source)),title:'Общий план'}]};
const dom=new JSDOM('<html><head></head><body><div id="sheet"></div></body></html>',{runScripts:'dangerously',url:'https://app.test/'}),w=dom.window,calls=[];
w.st={sessions:[{id:'trainer-private',ex:[{n:'private',set:[{w:9999,r:1,ok:true}]}]}]};
w.WorkoutDomain=D;w.workoutRegistry=reg;w.StrengthAnalytics=require('../strength-analytics.js');w.esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
w.modal=html=>w.document.getElementById('sheet').innerHTML=html;w.toast=()=>{};w.closeModal=()=>{};w.alert=message=>{throw Error(message)};
const visual=name=>{if(process.env.UNVRSL_CLIENT_QA)fs.writeFileSync(process.env.UNVRSL_CLIENT_QA+'/'+name+'.html',w.document.documentElement.outerHTML)};
let failRead=false,failUpdate=false;
w.cloud={user:{id:'trainer'},client:{from(table){let filters=[],op='select',payload,single=false,range;const q={select(){return q},eq(k,v){filters.push([k,v]);return q},order(){return q},limit(n){range=[0,n-1];return q},range(a,b){range=[a,b];return q},maybeSingle(){single=true;return q},update(v){op='update';payload=v;return q},then(resolve){
 calls.push({table,op,range,filters,payload});if(failRead&&table==='workouts')return resolve({data:null,error:{message:'offline'}});if(failUpdate&&op==='update')return resolve({data:null,error:{message:'offline'}});
 let rows=(db[table]||[]).filter(x=>filters.every(([k,v])=>x[k]===v));if(range)rows=rows.slice(range[0],range[1]+1);if(op==='update')rows.forEach(x=>Object.assign(x,payload));return resolve({data:single?rows[0]||null:rows,error:null});
 }};return q}}};
for(const name of ['program-assignment-title.js','trainer-client-progress.js','trainer-direct-ui.js'])w.eval(fs.readFileSync(require.resolve('../'+name),'utf8'));
(async()=>{try{
 await w.trainerClientDetail('client');visual('overview');assert.equal(w.document.querySelectorAll('[data-client-tab]').length,4);assert.match(w.document.body.textContent,/501/);assert.ok(calls.some(x=>x.table==='workouts'&&x.range?.[0]===500));assert.doesNotMatch(w.document.body.textContent,/9999|private/);
 const trainerBefore=JSON.stringify(w.st);
 w.trainerClientTabV3('strength');visual('strength');assert.match(w.document.body.textContent,/Matrix/);assert.ok(w.document.querySelector('svg'));const graph=w.document.querySelector('.tcp-chart');w.trainerClientChartPoint521(graph.id,0);assert.match(graph.querySelector('[data-value]').textContent,/50/);
 w.trainerClientTabV3('measures');visual('measures');assert.match(w.document.body.textContent,/72 кг/);assert.match(w.document.body.textContent,/Талия/);
 w.trainerClientTabV3('workouts');assert.equal(w.document.querySelectorAll('.tcv3-workout').length,30);w.trainerClientMoreWorkouts521();assert.equal(w.document.querySelectorAll('.tcv3-workout').length,60);
 await w.trainerClientRenamePlan521('client','plan');w.document.getElementById('tc521Title').value='Артём · Сила';await w.document.getElementById('tc521RenameSave').onclick();
 assert.equal(db.plan_assignments[0].snapshot.program.name,'Артём · Сила');assert.equal(db.plans[0].snapshot.program.name,source.program.name);assert.match(w.document.body.textContent,/Артём · Сила/);assert.equal(JSON.stringify(w.st),trainerBefore);
 const update=calls.find(x=>x.op==='update');for(const field of ['trainer_id','client_id','plan_id','status','updated_at'])assert.ok(update.filters.some(([k])=>k===field));assert.equal(update.table,'plan_assignments');
 await w.trainerClientRenamePlan521('client','plan');w.document.getElementById('tc521Title').value='Не сохранено';failUpdate=true;await w.document.getElementById('tc521RenameSave').onclick();assert.equal(db.plan_assignments[0].snapshot.program.name,'Артём · Сила');assert.match(w.document.getElementById('tc521RenameStatus').textContent,/Не удалось/);assert.equal(w.document.getElementById('tc521RenameSave').disabled,false);failUpdate=false;
 failRead=true;await w.trainerClientDetail('client');assert.match(w.document.body.textContent,/Статистика может быть неполной/);
 console.log('PASS: 501-row pagination, overview/strength/measurements/history, interactive chart, isolated rename, scoped update, network failure, source and trainer data preservation.');
 }finally{dom.window.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
