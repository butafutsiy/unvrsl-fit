'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const P=require('../trainer-client-progress.js'),D=require('../workout-domain.js'),S=require('../strength-analytics.js'),{withTitle}=require('../program-assignment-title.js');
const reg=D.registry([{id:'row',n:'Тяга блока',loadType:'external_total',tg:'lats'}]);
const workout=(id,date,weights,rpes,equipment='matrix')=>({id,user_id:'client',workout_date:date,payload:{id,date,started:Date.parse(date),ended:Date.parse(date)+3600000,ex:[{n:'Тяга блока',sourceId:'row',equipmentProfileId:equipment,equipmentProfile:{id:equipment,name:equipment},set:weights.map((w,i)=>({w,r:10,rpe:rpes[i],ok:true}))}]}});
const data=workouts=>({workouts,weights:[{measure_date:'2026-10-01',weight_kg:70},{measure_date:'2026-10-10',weight_kg:71}],measurements:[{measure_date:'2026-10-01',measurements:{waist:80}},{measure_date:'2026-10-10',measurements:{waist:79}}]});
test('client overview uses only completed owned sets and averages effort by actual sets',()=>{
 const rows=[workout('a','2026-10-01',[50,60],[6,8]),workout('b','2026-10-10',[65],[10])];
 rows[0].payload.ex[0].set.push({w:500,r:20,ok:false});const foreign=workout('other','2026-10-12',[999],[10]);foreign.user_id='another';rows.push(foreign);
 const pending=workout('pending','2026-10-13',[999],[10]);pending.payload.pendingCompletion=true;rows.push(pending,rows[0]);
 const before=JSON.stringify(rows),m=P.build(data(rows),reg,D,S,'client');
 assert.equal(m.totals.workouts,2);assert.equal(m.totals.sets,3);assert.equal(m.totals.volume,1750);assert.equal(m.totals.rpe,8);assert.equal(m.totals.duration,3600000);assert.equal(JSON.stringify(rows),before);
 assert.deepEqual(m.sessions.map(x=>x.session.id),['a','b']);assert.equal(m.weightPoints.at(-1).value,71);assert.equal(m.measurePoints.waist.at(-1).value,79);
});

test('missing data remains unknown; charts and titles escape user text',()=>{
 const m=P.build(data([]),reg,D,S,'client');assert.equal(m.totals.duration,null);assert.equal(m.totals.rpe,null);assert.equal(m.totals.volume,null);
 const html=P.chart([{date:'2026-10-01',value:50,note:'<img src=x onerror=alert(1)>'}],{label:'<script>',unit:'кг'});assert.doesNotMatch(html,/<img|<script/);assert.match(html,/&lt;img/);
 assert.equal(P.duration({started:'2026-10-01T00:00:00Z',ended:'2026-10-01T01:32:00Z'}),5520000);
});
test('client titles are independent and survive a new shared snapshot without changing prescribed weights',()=>{
 const source={kind:'coach-program',program:{name:'Общий план',weeks:[{days:[{ex:[{sets:[{w:80}]}]}]}]}};
 const first=withTitle(source,{},'Артём · Набор'),second=withTitle(source,{},'Тимур · Сила');
 const update=withTitle({...source,program:{...source.program,name:'Общий план 2'}},first);
 assert.equal(first.clientTitle,'Артём · Набор');assert.equal(update.program.name,'Артём · Набор');assert.equal(second.program.name,'Тимур · Сила');assert.equal(source.program.name,'Общий план');assert.equal(update.program.weeks[0].days[0].ex[0].sets[0].w,80);
});
test('publishing an update preserves each client title and scopes assignment writes',async()=>{
 const fs=require('node:fs'),vm=require('node:vm'),updates=[];
 const assignments=[{client_id:'one',snapshot:{clientTitle:'Артём · Сила'},updated_at:'old-one'},{client_id:'two',snapshot:{clientTitle:'Тимур · Набор'},updated_at:'old-two'}];
 const p={id:'source',name:'Общий план',cloudPlanId:'plan',cloudVersion:1,weeks:[]},c={window:{assignmentSnapshotTitle521:withTitle},console,setTimeout(){},programById:()=>p,trainerIsTrainer:()=>true,esc:String,save(){},modal(){},cloud:{user:{id:'trainer'},client:{from(table){let op='select',payload,filters=[];const q={select(){return q},eq(k,v){filters.push([k,v]);return q},single(){return q},update(value){op='update';payload=value;return q},insert(){op='insert';return q},then(resolve){
 if(table==='plans')return resolve({data:op==='select'?{version:1}:{id:'plan'}});
 if(table==='plan_assignments'&&op==='select')return resolve({data:assignments});
 if(table==='plan_assignments'){updates.push({payload,filters});return resolve({data:[{client_id:filters.find(([key])=>key==='client_id')[1]}]})}
 return resolve({data:null,error:null});
 }};return q}}}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../cloud-programs.js'),'utf8'),c);await c.cloudPushProgramUpdate('source');
 assert.equal(updates.length,2);assert.equal(updates[0].payload.snapshot.program.name,'Артём · Сила');assert.equal(updates[1].payload.snapshot.program.name,'Тимур · Набор');
 for(const update of updates)for(const key of ['trainer_id','plan_id','client_id','status','updated_at'])assert.ok(update.filters.some(([field])=>field===key));
 assert.equal(p.name,'Общий план');
});
