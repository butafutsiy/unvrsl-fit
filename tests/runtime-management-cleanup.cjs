'use strict';
const assert=require('node:assert/strict');
const {make,wait,errors}=require('./runtime-v392.cjs');
const {memoryIndexedDB}=require('./storage-fixture.cjs');
(async()=>{
 const indexedDB=memoryIndexedDB(),dom=make(null,{indexedDB,trackObservers:true}),w=dom.window;
 try{
  for(let i=0;i<150&&!w.__unvrslStartupComplete;i++)await wait(100);
  assert.equal(w.__unvrslStartupComplete,true);await w.unvrslWarmDeferredModulesV320();
  // Reject every localStorage write, including sync metadata, rather than only
  // the two workout keys covered by the older Safari quota fixture.
  w.Storage.prototype.setItem=function(){throw new w.DOMException('The quota has been exceeded.','QuotaExceededError')};
  w.cloud={user:{id:'quota-owner',email:'fixture@example.test'},profile:{role:'trainer'},initSettled:true};w.st.accountOwnerId='quota-owner';
  w.st.sessions=[{id:'history-to-keep',date:'2026-10-24',ended:1,ex:[]}];
  const p=w.ensureProgramShape({id:'quota-program',name:'Сохранение',weeks:[{days:[{ex:[]}]}]});w.st.programs.push(p);w.openProgramEditor(p.id);
  p.name='Сохранено при полной квоте';assert.equal(await w.saveProgram(p.id),true);
  assert.equal(w.document.getElementById('modal').classList.contains('show'),false);assert.equal(w.__unvrslStorageModeV393,'indexeddb');
  assert.match(w.document.getElementById('toast').textContent,/Программа сохранена/);
  assert.equal(indexedDB.stores.get('state').get('latest').state.programs.find(x=>x.id===p.id).name,p.name);
  // Settings keep the account entry without manual synchronization controls.
  w.settingsSheet();assert.match(w.document.getElementById('sheet').textContent,/UNVRSL Cloud/);assert.doesNotMatch(w.document.getElementById('sheet').textContent,/Синхронизировать|Облачная копия|Синхронизация/);
  const template=await w.saveProgramAsTemplate(p.id);await w.hideTemplateOption(encodeURIComponent('saved:'+template.id));
  w.hiddenTemplateOptionsSheet();assert.match(w.document.getElementById('sheet').textContent,/Удалить все скрытые/);
  const persist=w.persistWorkoutState;w.persistWorkoutState=async()=>false;
  assert.equal(await w.deleteHiddenTemplate(encodeURIComponent('saved:'+template.id)),false);assert.ok(w.st.programTemplates.some(t=>t.id===template.id));
  w.persistWorkoutState=persist;assert.equal(await w.deleteHiddenTemplate(encodeURIComponent('saved:'+template.id)),true);assert.ok(!w.st.programTemplates.some(t=>t.id===template.id));
  await w.keepOnlyPopularTemplates();assert.equal(await w.clearHiddenTemplates(),true);w.hiddenTemplateOptionsSheet();assert.match(w.document.getElementById('sheet').textContent,/Скрытых шаблонов нет/);
  w.templatesSheet();assert.match(w.document.getElementById('sheet').textContent,/StrongLifts/);assert.doesNotMatch(w.document.getElementById('sheet').textContent,/Мой 8-недельный цикл/);
  for(const id of ['trash-a','trash-b']){w.st.programs.push(w.ensureProgramShape({id,name:id,weeks:[{days:[]}]}));await w.trainerDeleteOwnProgram(id)}
  w.openProgramTrash();assert.match(w.document.getElementById('sheet').textContent,/Очистить корзину/);
  assert.equal(await w.purgeDeletedProgram('trash-a'),true);assert.equal(w.st.programTrash.length,1);assert.ok(w.st.deletedProgramKeys.includes('id:trash-a'));
  const before=JSON.stringify(w.st.programTrash);w.persistWorkoutState=async()=>false;assert.equal(await w.clearProgramTrash(),false);assert.equal(JSON.stringify(w.st.programTrash),before);w.persistWorkoutState=persist;
  await w.deleteBuiltinProgram();assert.equal(await w.clearProgramTrash(),true);assert.equal(w.st.programTrash.length,0);assert.ok(w.st.builtinProgramHidden&&w.st.builtinProgramPurgedAt);
  w.openProgramTrash();assert.match(w.document.getElementById('sheet').textContent,/Корзина пуста/);assert.doesNotMatch(w.document.getElementById('sheet').textContent,/Восстановить/);
  assert.ok(w.st.programs.some(x=>x.id===p.id));assert.equal(w.st.sessions[0].id,'history-to-keep');assert.deepEqual(errors,[]);
  w.__disconnectTestObservers();w.close();
  const reload=make(null,{indexedDB,quota:true,trackObservers:true});
  try{for(let i=0;i<150&&!reload.window.__unvrslStartupComplete;i++)await wait(100);await reload.window.unvrslWarmDeferredModulesV320();const r=reload.window;
   assert.equal(r.st.programTrash.length,0);assert.ok(r.st.programs.some(x=>x.id==='quota-program'));assert.equal(r.st.sessions[0].id,'history-to-keep');r.hiddenTemplateOptionsSheet();assert.match(r.document.getElementById('sheet').textContent,/Скрытых шаблонов нет/);r.openProgramTrash();assert.match(r.document.getElementById('sheet').textContent,/Корзина пуста/);assert.deepEqual(errors,[]);
  }finally{reload.window.__disconnectTestObservers();reload.window.close()}
  console.log('PASS full localStorage quota + IndexedDB save/close/reload, quiet settings, hidden template deletion, trash purge, failed write rollback and history preservation');
 }finally{w.__disconnectTestObservers?.();w.close()}
})().catch(e=>{console.error(e,errors);process.exitCode=1});
