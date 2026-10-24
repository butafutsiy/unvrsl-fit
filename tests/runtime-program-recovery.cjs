'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {make,wait,errors}=require('./runtime-v392.cjs');
(async()=>{
 const dom=make();await wait(2500);const w=dom.window;
 try{
  await w.addSemenTrainingPlan();
  assert.match(w.document.getElementById('sheet').textContent,/Сохранить программу/);
  await w.saveProgram('semen-upper-lower-8');
  assert.equal(w.document.getElementById('modal').classList.contains('show'),false);assert.match(w.document.getElementById('toast').textContent,/Программа сохранена/);
  w.st.programs.find(p=>p.seedId==='semen-upper-lower-8').weeks[0].days[0].ex[0].sets[0].w=95;
  await w.trainerDeleteOwnProgram('semen-upper-lower-8');
  assert.equal(w.st.programs.some(p=>p.seedId==='semen-upper-lower-8'),false);
  assert.equal(w.st.programTrash[0].program.weeks.length,8);
  // Re-adding the linked plan clears seed, id and name tombstones.
  await w.addSemenTrainingPlan();
  await wait(300);
  assert.equal(w.st.programs.filter(p=>p.seedId==='semen-upper-lower-8').length,1);
  assert.equal(w.st.programs.find(p=>p.seedId==='semen-upper-lower-8').weeks[0].days[0].ex[0].sets[0].w,95);
  assert.equal(w.st.programTrash.length,0);
  await w.trainerDeleteOwnProgram('semen-upper-lower-8');
  w.openProgramTrash();assert.match(w.document.getElementById('sheet').textContent,/Восстановить/);
  await w.restoreDeletedProgram('semen-upper-lower-8');
  assert.equal(w.st.programs.filter(p=>p.seedId==='semen-upper-lower-8').length,1);
  // Standalone links remain visible in client Plan/Start without granting access to revoked assignments.
  w.cloud={user:{id:'client'},profile:{role:'client'}};
  w.unvrslTrainerMode=()=>false;
  w.eval(fs.readFileSync('client-program-picker.js','utf8'));
  const status=await w.eval(`(async()=>{
   st.clientAssignmentsLoaded=false;st.clientAssignedUserId='client';st.clientAssignedPlanIds=[];
   st.programs.push({id:'revoked',cloudPlanId:'revoked-cloud',trainerId:'trainer',importedFromLink:true,weeks:[{days:[]}]});
   clientCleanPlanPage();
   const visible=assignedClientPrograms().map(p=>p.id);
   const planText=document.getElementById('plan').textContent;
   openClientStartProgramPicker();
   return {visible,planText,startText:document.getElementById('sheet').textContent};
  })()`);
  assert.ok(status.visible.includes('semen-upper-lower-8'));assert.ok(!status.visible.includes('revoked'));
  assert.match(status.planText,/Семён/);assert.match(status.startText,/Семён/);
  // A failed import keeps the URL and existing programs intact; retry imports once.
  w.history.replaceState(null,'','#plan=retry');
  w.__sharedProgram={type:'unvrsl-program',program:{id:'linked',seedId:'linked-seed',name:'По ссылке',weeks:[{days:[{ex:[]}]}]}};
  w.st.deletedProgramKeys.push('id:linked','seed:linked-seed','name:по ссылке');
  const persist=w.persistWorkoutState;w.persistWorkoutState=async()=>false;
  const count=w.st.programs.length;await w.importSharedProgram();assert.equal(w.st.programs.length,count);assert.equal(w.location.hash,'#plan=retry');
  w.persistWorkoutState=persist;await w.importSharedProgram();
  assert.equal(w.st.programs.filter(p=>p.id==='linked').length,1);assert.equal(w.location.hash,'');
  assert.equal(w.st.deletedProgramKeys.includes('seed:linked-seed'),false);
  assert.match(w.document.getElementById('plan').textContent,/По ссылке/);
  assert.deepEqual(errors,[]);console.log('Program save, trash, restoration, re-import and client visibility passed');
 }finally{dom.window.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
