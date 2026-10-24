'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync('coach-programs.js','utf8');
function fixture(){
 const status={textContent:''},button={disabled:false},messages=[];let closed=0;
 const c={document:{getElementById:id=>id==='saveProgramStatus'?status:button},programById:()=>({id:'p'}),Date,toast:x=>messages.push(x),persistWorkoutState:async()=>true,programEditorCloseV386:()=>closed++};
 c.window=c;vm.createContext(c);vm.runInContext(source.slice(source.indexOf('let programSaveBusy='),source.indexOf('function renderProgramEditor()')),c);return {c,status,button,messages,closed:()=>closed};
}
test('failed durable save keeps editor open; retry closes only after success',async()=>{
 const f=fixture(),{c,status,button,messages}=f;c.persistWorkoutState=async()=>false;
 assert.equal(await c.saveProgram('p'),false);assert.match(status.textContent,/Не удалось сохранить/);assert.equal(button.disabled,false);assert.deepEqual(messages,[]);assert.equal(f.closed(),0);
 c.persistWorkoutState=async()=>true;assert.equal(await c.saveProgram('p'),true);assert.equal(f.closed(),1);assert.deepEqual(messages,['Программа сохранена']);
});
test('double tap saves once and success does not wait for a network request',async()=>{
 const f=fixture(),{c}=f;let release,writes=0,cloudCalls=0;c.persistWorkoutState=()=>{writes++;return new Promise(resolve=>release=resolve)};
 c.cloud={user:{id:'owner'}};c.accountSyncNow=()=>{cloudCalls++;return new Promise(()=>{})};
 const saving=c.saveProgram('p');await c.saveProgram('p');assert.equal(writes,1);assert.equal(f.closed(),0);release(true);assert.equal(await saving,true);
 assert.equal(f.closed(),1);assert.equal(cloudCalls,0);assert.deepEqual(f.messages,['Программа сохранена']);
});
