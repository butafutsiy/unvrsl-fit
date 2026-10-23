'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync('coach-programs.js','utf8');
function fixture(){
 const status={textContent:''},button={disabled:false},messages=[];
 const c={document:{getElementById:id=>id==='saveProgramStatus'?status:button},programById:()=>({id:'p'}),Date,toast:x=>messages.push(x),persistWorkoutState:async()=>true};
 c.window=c;vm.createContext(c);vm.runInContext(source.slice(source.indexOf('let programSaveBusy='),source.indexOf('function renderProgramEditor()')),c);return {c,status,button,messages};
}
test('explicit save reports durable storage failure and permits retry',async()=>{
 const {c,status,button,messages}=fixture();c.persistWorkoutState=async()=>false;
 assert.equal(await c.saveProgram('p'),false);assert.match(status.textContent,/Не удалось сохранить/);assert.equal(button.disabled,false);assert.deepEqual(messages,[]);
 c.persistWorkoutState=async()=>true;assert.equal(await c.saveProgram('p'),true);assert.match(status.textContent,/сохранена на устройстве/);
});
test('double tap saves once and cloud failure reports only local success',async()=>{
 const {c,status}=fixture();let release,writes=0;c.persistWorkoutState=()=>{writes++;return new Promise(resolve=>release=resolve)};
 c.cloud={user:{id:'owner'}};c.accountSyncNow=async()=>false;
 const saving=c.saveProgram('p');await c.saveProgram('p');assert.equal(writes,1);release(true);await saving;
 assert.match(status.textContent,/Облачная синхронизация не завершена/);
 c.persistWorkoutState=async()=>true;c.accountSyncNow=async()=>true;await c.saveProgram('p');assert.match(status.textContent,/сохранена и синхронизирована/);
});
