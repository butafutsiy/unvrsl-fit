'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const A=require('../workout-domain');
const c={window:{}};vm.runInNewContext(fs.readFileSync(require.resolve('../exercise-catalog.js'),'utf8'),c);
const rows=c.window.UNVRSL_EXERCISES,reg=A.registry(rows),noWeight=t=>['bodyweight_only','time','distance','repetitions_only'].includes(t);
test('audit every catalog entry: defaults match load and implement; fractional equipment overrides win',()=>{
 assert.equal(rows.length,189);
 for(const e of rows){
  const expected=noWeight(e.loadType)?0:e.loadType==='bodyweight_added'?2.5:e.loadType==='bodyweight_assisted'?5:e.eq==='dumbbell'?2:e.eq==='kettlebell'?4:['cable','leverage machine','sled machine'].includes(e.eq)?5:2.5;
  assert.equal(A.profile(e,reg).step,expected,e.n);
  if(noWeight(e.loadType))continue;
  const configured={...e,equipmentProfile:{weightStep:.5}};
  const p=A.profile(configured,reg,{[e.id]:{step:10}});
  assert.equal(p.step,.5,e.n);assert.equal(A.roundWeight(135.5,p),135.5,e.n);
  configured.equipmentProfile={weightStep:.25,availableLoads:[130,135.25,140]};
  assert.equal(A.roundWeight(135.5,A.profile(configured,reg)),135.25,e.n);
 }
});
test('one total step vs one hand/side step; no implicit doubling or halving',()=>{
 for(const loadUnit of ['TOTAL','PER_HAND','PER_SIDE','ADDED_LOAD','ASSISTANCE']){
  const p=A.profile({equipmentProfile:{loadUnit,weightStep:.5}},reg);
  assert.equal(p.step,.5);assert.equal(A.roundWeight(135.5,p),135.5);
 }
 assert.equal(A.roundWeight(135.5,A.profile({equipmentProfile:{loadUnit:'TOTAL',weightStep:.5,implementWeight:20}},reg)),135.5);
});
function ui(){
 const profile={id:'rack',name:'Rack',type:'barbell',loadUnit:'TOTAL',weightStep:2.5,availableLoads:[],implementCount:1,loadedSides:1};
 const exercise=()=>({exerciseId:'bench',n:'Bench',eq:'barbell',equipmentProfileId:'rack',equipmentProfile:{...profile},set:[{w:135,ok:false},{w:100,ok:true,equipmentSnapshot:{...profile}}]});
 const st={current:{ex:[exercise(),exercise()]},equipmentProfiles:{rack:profile},sessions:[{ex:[exercise()]}]};
 const fields={},doc={getElementById:id=>fields[id]||null,createElement:()=>({}),head:{append(){}}};
 let recalcs=0;const messages=[];
 const w={WorkoutDomain:A,st,addEventListener(){},save(){},modal(){},toast:x=>messages.push(x),trainingLoadModel292:{run(){recalcs++}}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../equipment-profiles-v405.js'),'utf8'),{window:w,document:doc,workoutRegistry:A.registry([{id:'bench',n:'Bench',eq:'barbell',loadType:'external_total'}])});
 function save(step,available=''){
  for(const [k,value] of Object.entries({Name:'Rack',Type:'barbell',Unit:'TOTAL',Step:step,Available:available,Base:20}))fields['eq405'+k]={value};
  w.equipmentSave405(encodeURIComponent('bench@0'),'rack');
 }
 return {w,st,save,messages,get recalcs(){return recalcs}};
}
test('editing the same equipment ID refreshes all pending copies, preserves completed/history snapshots',()=>{
 const x=ui(),history=JSON.stringify(x.st.sessions);x.save('0,5');
 assert.equal(x.st.equipmentProfiles.rack.weightStep,.5);assert.ok(x.recalcs>0);
 for(const e of x.st.current.ex){assert.equal(e.equipmentProfile.weightStep,.5);assert.equal(e.set[0].equipmentSnapshot.weightStep,.5);assert.equal(e.set[0].w,135);assert.equal(e.set[1].equipmentSnapshot.weightStep,2.5)}
 assert.equal(JSON.stringify(x.st.sessions),history);assert.equal(x.st.equipmentProfiles.rack.implementCount,1);assert.equal(x.st.equipmentProfiles.rack.loadedSides,1);
 const reloaded=JSON.parse(JSON.stringify(x.st.current));reloaded.ex[0].equipmentProfile.weightStep=5;x.w.equipmentAttachDefaults405(reloaded);
 assert.equal(reloaded.ex[0].equipmentProfile.weightStep,.5);
});
test('decimal comma, decimal point, legacy comma list and invalid input',()=>{
 const x=ui();
 x.save('.25','5; 7,5; 10; 12.25');assert.deepEqual([...x.st.equipmentProfiles.rack.availableLoads],[5,7.5,10,12.25]);
 x.save('2','5, 10, 15');assert.deepEqual([...x.st.equipmentProfiles.rack.availableLoads],[5,10,15]);
 x.save('2','5,10,15');assert.deepEqual([...x.st.equipmentProfiles.rack.availableLoads],[5,10,15]);
 const before=JSON.stringify(x.st.equipmentProfiles);x.save('-1');assert.equal(JSON.stringify(x.st.equipmentProfiles),before);x.save('2','5; banana;10');assert.equal(JSON.stringify(x.st.equipmentProfiles),before);
});

test('an explicit equipment step clears an unrelated saved rack',()=>{
 const e={n:'Bench',equipmentProfile:{loadUnit:'TOTAL',weightStep:.5,availableLoads:[]}};
 const r=A.registry([{id:'bench',n:'Bench',weightProfile:{step:2.5}}]);
 const p=A.profile(e,r,{bench:{step:10,available:[130,140]}});
 assert.equal(A.roundWeight(135.5,p),135.5);assert.deepEqual(p.available,[]);
});
