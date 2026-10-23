'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function fixture(){
 const program={id:'mine',seedId:'seed',cloudPlanId:'cloud',name:'My cycle',weeks:[{days:[{id:'d',ex:[{n:'Bench',sets:[{w:95,r:8}]}]}]}]};
 const storage=new Map(),state={programs:[program],primaryProgramId:'mine',startProgramId:'mine'};
 const c={st:state,console,Date,Set,encodeURIComponent,decodeURIComponent,setTimeout(){},confirm:()=>true,
  save:()=>true,persistWorkoutState:async()=>true,toast(){},closeModal(){},modal(html){c.html=html},esc:String,
  localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
  document:{querySelector:()=>null,addEventListener(){},getElementById:()=>null},addEventListener(){}};
 c.window=c;vm.createContext(c);vm.runInContext(fs.readFileSync('program-delete.js','utf8'),c);return c;
}
test('delete keeps a full snapshot; restore clears every tombstone and survives reload',async()=>{
 const c=fixture(),original=JSON.stringify(c.st.programs[0]);
 await c.trainerDeleteOwnProgram('mine');assert.equal(c.st.programs.length,0);assert.equal(JSON.stringify(c.st.programTrash[0].program),original);
 c.openProgramTrash();assert.match(c.html,/Восстановить/);
 await c.restoreDeletedProgram('mine');assert.equal(c.st.programs.length,1);assert.equal(c.st.programs[0].weeks[0].days[0].ex[0].sets[0].w,95);
 assert.equal(c.st.programTrash.length,0);assert.equal(c.st.deletedProgramKeys.length,0);
 for(const key of ['id:mine','seed:seed','cloud:cloud'])assert.ok(c.st.programRestoredAt[key]>c.st.programDeletedAt[key]);
 c.st=JSON.parse(JSON.stringify(c.st));assert.equal(c.unvrslIsDeletedProgram(c.st.programs[0]),false);
 await c.trainerDeleteOwnProgram('mine');assert.equal(c.st.programTrash.length,1);assert.equal(c.st.programs.length,0);
});
test('failed durable deletion rolls back the program, trash and tombstones',async()=>{
 const c=fixture();c.persistWorkoutState=async()=>false;
 await c.trainerDeleteOwnProgram('mine');assert.equal(c.st.programs.length,1);assert.equal(c.st.primaryProgramId,'mine');assert.equal(c.st.programTrash,undefined);assert.equal(c.st.programDeletedAt,undefined);assert.equal(c.st.deletedProgramKeys.length,0);
});
test('failed restoration retains the snapshot and original deletion',async()=>{
 const c=fixture();await c.trainerDeleteOwnProgram('mine');c.persistWorkoutState=async()=>false;
 await c.restoreDeletedProgram('mine');assert.equal(c.st.programs.length,0);assert.equal(c.st.programTrash.length,1);assert.ok(c.st.deletedProgramKeys.includes('seed:seed'));assert.equal(c.st.programRestoredAt,undefined);
});
