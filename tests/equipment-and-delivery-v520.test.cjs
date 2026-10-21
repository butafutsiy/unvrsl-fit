'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const A=require('../workout-domain.js'),{prepareProgramWeights}=require('../program-weight-choice.js');
const read=name=>fs.readFileSync(require.resolve('../'+name),'utf8');
const exercise=(name='Тяга',id='row')=>({n:name,sourceId:id,method:'STANDARD',weightMode:'manual',parameterOverrides:{weight:{mode:'manual',value:81},rest:{mode:'manual',min:90,max:90}},sets:[{w:81,r:10,rest:90,programW:81,recommendation:{weight:85}}]});
const program=()=>({id:'source',name:'План',cloudPlanId:'manual-plan',autoWeightCloudPlanId:'auto-plan',weeks:[{n:1,intensityMin:70,intensityMax:75,days:[{id:'d',ex:[exercise()]}]}],cycleSources:[exercise()],cycleWeekSources:[[exercise()]]});
test('auto delivery clears all weight seeds and cycle recipes without changing the original',()=>{
 const source=program();source.previousCycle={weeks:source.weeks};source.cycleSources[0].lightWeight=60;source.cycleSources[0].cycleOriginalSets=[{w:91,r:4}];
 const before=JSON.stringify(source),copy=prepareProgramWeights(source,'auto');
 assert.equal(JSON.stringify(source),before);assert.equal(copy.weeks[0].intensityMin,70);assert.equal(copy.previousCycle,undefined);
 for(const ex of [copy.weeks[0].days[0].ex[0],copy.cycleSources[0],copy.cycleWeekSources[0][0]]){
  assert.equal(ex.weightMode,'auto');assert.deepEqual(ex.parameterOverrides.weight,{mode:'auto',value:null});assert.equal(ex.sets[0].w,'');assert.equal(ex.sets[0].programW,'');assert.equal(ex.sets[0].recommendation,undefined);assert.equal(ex.sets[0].r,10);assert.equal(ex.sets[0].rest,90);
 }
 assert.equal(copy.cycleSources[0].lightWeight,'');assert.equal(copy.cycleSources[0].cycleOriginalSets[0].w,'');
 assert.equal(prepareProgramWeights(source,'keep').weeks[0].days[0].ex[0].sets[0].w,81);
});
function equipmentRuntime(){
 const reg=A.registry([{id:'row',n:'Тяга',loadType:'external_total'},{id:'leg',n:'Разгибание ног',loadType:'external_total'}]);
 const row={n:'Тяга',sourceId:'row',set:[{w:81,r:10,ok:false}]},leg={n:'Разгибание ног',sourceId:'leg',set:[]},values={};let markup='';
 const c={console,WorkoutDomain:A,workoutRegistry:reg,st:{current:{ex:[row,leg]},equipmentProfiles:{leg:{id:'leg',name:'Leg Extension',exerciseKey:reg.identity(leg),weightStep:5,loadUnit:'TOTAL'}}},
 document:{head:{append(){}},createElement:()=>({}),getElementById:id=>values[id]||null},addEventListener(){},modal:html=>markup=html,save(){},toast(){},closeModal(){}};
 c.window=c;vm.runInNewContext(read('equipment-profiles-v405.js'),c);
 const key=encodeURIComponent(reg.identity(row)+'@0');
 const create=name=>{for(const [field,value] of Object.entries({Name:name,Type:'machine',Unit:'TOTAL',Step:'2.5',Available:'',Base:'0'}))values['eq405'+field]={value};c.equipmentSave405(key,'');return row.equipmentProfileId};
 return{c,row,leg,reg,key,create,markup:()=>markup};
}
test('picker and editor show only the current exercise equipment and reject foreign ids',()=>{
 const r=equipmentRuntime();r.c.equipmentOpen405(r.key);assert.doesNotMatch(r.markup(),/Leg Extension/);
 r.c.equipmentSelect405(r.key,'leg');assert.equal(r.row.equipmentProfileId,undefined);
 const id=r.create('Foreman Row');assert.equal(r.c.st.equipmentProfiles[id].exerciseKey,r.reg.identity(r.row));
 r.c.equipmentOpen405(r.key);assert.match(r.markup(),/Foreman Row/);assert.doesNotMatch(r.markup(),/Leg Extension/);
 assert.doesNotMatch(r.c.equipmentEditorField405(r.leg),/Foreman Row/);
});
test('switching machines resets pending seeds, preserves completed snapshots and keeps history separate',()=>{
 const r=equipmentRuntime(),first=r.create('Matrix Row');r.row.set[0]={w:80,r:10,ok:true};r.row.set.push({w:80,r:10,ok:false,programW:80,plannedW:80,recommendation:{weight:85}});
 const second=r.create('Foreman Row');assert.notEqual(first,second);assert.equal(r.row.set[0].w,80);assert.equal(r.row.set[0].equipmentSnapshot.id,first);
 assert.equal(r.row.set[1].w,'');assert.equal(r.row.set[1].programW,0);assert.equal(r.row.set[1].plannedW,undefined);assert.equal(r.row.set[1].equipmentSnapshot.id,second);
 assert.equal(A.loadComparable(r.row,r.row,r.reg,r.row.set[0],r.row.set[1]),false);
 const old={...r.row,equipmentProfileId:first,equipmentProfile:{id:first,weightStep:2.5,loadUnit:'TOTAL'},set:[r.row.set[0]]};
 const rec=A.recommend(r.row,r.row.set[1],{id:'new',ex:[r.row]},[{id:'old',ex:[old]}],r.reg);
 assert.equal(rec.sessionIds.length,0);
});
test('legacy selected equipment remains available only for its exercise',()=>{
 const r=equipmentRuntime();r.c.st.equipmentProfiles.legacy={id:'legacy',name:'Old Row',weightStep:5,loadUnit:'TOTAL'};r.c.st.equipmentDefaultByExercise={[r.reg.identity(r.row)]:'legacy'};
 r.c.equipmentOpen405(r.key);assert.match(r.markup(),/Old Row/);assert.doesNotMatch(r.c.equipmentEditorField405(r.leg),/Old Row/);
});
test('summary formats the hour boundary and screenshot duration without wrapping after a day',()=>{
 const reg=A.registry([]);let html='';const c={WorkoutDomain:A,workoutRegistry:reg,st:{sessions:[],bw:[]},esc:String,modal:v=>html=v,document:{head:{append(){}},createElement:()=>({}),querySelector:()=>null},addEventListener(){}};c.window=c;
 vm.runInNewContext(read('workout-completion.js'),c);
 for(const [seconds,expected] of [[3599,'59:59'],[3600,'1:00:00'],[19931,'5:32:11'],[90061,'25:01:01']]){
  c.renderWorkoutSummary({id:'s',started:1000000000000,ended:1000000000000+seconds*1000,ex:[]});assert.ok(html.includes(`<b>${expected}</b>`),expected);
 }
});
test('copy waits for the selected weight mode and creates an independent editable program',()=>{
 const p=program(),c={st:{programs:[p]},programById:()=>p,uid:prefix=>prefix+Math.random(),save(){},openProgramEditor(){},closeModal(){},modal:()=>{}};c.window=c;
 vm.runInNewContext(read('program-weight-choice.js'),c);c.duplicateProgram(p.id);assert.equal(c.st.programs.length,1);c.applyProgramWeightChoice('auto');assert.equal(c.st.programs.length,2);
 const copy=c.st.programs[1];assert.notEqual(copy.id,p.id);assert.equal(copy.cloudPlanId,undefined);assert.equal(copy.weeks[0].days[0].ex[0].sets[0].w,'');assert.equal(p.weeks[0].days[0].ex[0].sets[0].w,81);
});
function cloudRuntime(){
 const source=program();delete source.autoWeightCloudPlanId;let serial=0;const plans=new Map([['manual-plan',{id:'manual-plan',title:source.name,version:1,snapshot:{}}]]),writes=[],invites=[];
 const c={console,URLSearchParams,URL,location:{search:'',origin:'https://app.test',pathname:'/'},document:{addEventListener(){}},setInterval(){},setTimeout(){},st:{programs:[source]},programById:()=>source,save(){},toast(){},closeModal(){},modal(){},esc:String,alert:message=>{throw Error(message)},trainerIsTrainer:()=>true,cloudConfigured:()=>true,crypto:{randomUUID:()=>String(++serial)},trainerShareSheet(){},cloud:{user:{id:'trainer'},client:{from(table){
  let op='select',value,filters={};const q={select(){return q},eq(k,v){filters[k]=v;return q},insert(v){op='insert';value=v;return q},update(v){op='update';value=v;return q},upsert(v){op='upsert';value=v;return q},single(){return q},maybeSingle(){return q},then(resolve){
   let data=null;
   if(table==='plans'){
    if(op==='insert'){data={...value,id:'plan-'+(++serial)};plans.set(data.id,data)}
    else{data=plans.get(filters.id)||null;if(op==='update'&&data){data={...data,...value};plans.set(filters.id,data)}}
   }else if(table==='plan_assignments'){if(op==='select')data=[{client_id:'client',snapshot:{}}];else{writes.push(JSON.parse(JSON.stringify(value)));data=op==='update'?[{client_id:'client'}]:value}}
   else if(table==='plan_invites'){invites.push(value);data=value}
   resolve({data,error:null});
  }};return q;
 }}}};
 c.window=c;vm.createContext(c);for(const name of ['program-weight-choice.js','cloud-programs.js','client-link.js'])vm.runInContext(read(name),c);
 return{c,source,plans,writes,invites};
}
test('cloud assignment publishes separate keep/auto snapshots and preserves source weights',async()=>{
 const r=cloudRuntime();await r.c.trainerAssignProgram('client','source');assert.equal(r.writes.length,0);
 await r.c.applyProgramWeightChoice('auto');assert.equal(r.writes.length,1);const auto=r.writes[0];
 assert.notEqual(auto.plan_id,'manual-plan');assert.equal(auto.snapshot.program.weeks[0].days[0].ex[0].sets[0].w,'');
 assert.equal(r.source.weeks[0].days[0].ex[0].sets[0].w,81);assert.equal(r.source.cloudPlanId,'manual-plan');
 await r.c.trainerAssignProgram('other-client','source','keep');const keep=r.writes.at(-1);assert.equal(keep.plan_id,'manual-plan');assert.equal(keep.snapshot.program.weeks[0].days[0].ex[0].sets[0].w,81);
 await r.c.cloudShareProgram('source','auto');assert.equal(r.invites.at(-1).plan_id,auto.plan_id);
});
test('cloud updates retain auto mode for auto recipients and manual mode for keep recipients',async()=>{
 const r=cloudRuntime();await r.c.trainerAssignProgram('auto-client','source','auto');await r.c.trainerAssignProgram('manual-client','source','keep');r.writes.length=0;
 r.source.weeks[0].days[0].ex[0].sets[0].w=95;await r.c.cloudPushProgramUpdate('source');
 assert.equal(r.writes.length,2);assert.equal(r.writes[0].snapshot.program.weeks[0].days[0].ex[0].sets[0].w,95);assert.equal(r.writes[1].snapshot.program.weeks[0].days[0].ex[0].sets[0].w,'');
});
test('legacy routine snapshots also support keep or auto without changing repetitions',()=>{
 const source={routines:[{w:1,c:'A',e:[{n:'Тяга',w:81,r:10,s:3}]}]};
 const auto=prepareProgramWeights(source,'auto');assert.equal(auto.routines[0].w,1);assert.equal(auto.routines[0].e[0].w,'');assert.equal(auto.routines[0].e[0].r,10);assert.equal(auto.routines[0].e[0].s,3);assert.equal(source.routines[0].e[0].w,81);
});
test('equipment included in an imported program is registered for later selection',()=>{
 const r=equipmentRuntime();r.row.equipmentProfile={id:'imported-row',name:'Imported Row',exerciseKey:r.reg.identity(r.row),loadUnit:'TOTAL',weightStep:5};r.row.equipmentProfileId='imported-row';
 r.c.equipmentProfileResolve405(r.row);assert.ok(r.c.st.equipmentProfiles['imported-row']);r.c.equipmentOpen405(r.key);assert.match(r.markup(),/Imported Row/);assert.doesNotMatch(r.c.equipmentEditorField405(r.leg),/Imported Row/);
});
