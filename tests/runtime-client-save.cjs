'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{JSDOM}=require(process.env.UNVRSL_JSDOM||'jsdom');
function fixture(failWeight){
 const dom=new JSDOM('<div id="plan"></div><div id="sheet"></div>',{runScripts:'dangerously',url:'https://fixture.test/'}),w=dom.window,writes=[],toasts=[];
 w.st={accountOwnerId:'fixture-client',sessions:[],bw:[]};w.iso=()=> '2026-10-12';w.unvrslTrainerMode=()=>false;w.save=()=>true;w.render=()=>{};w.toast=message=>toasts.push(message);w.modal=html=>w.document.getElementById('sheet').innerHTML=html;w.closeModal=()=>w.document.getElementById('sheet').innerHTML='';
 w.cloud={user:{id:'fixture-client'},profile:{role:'client'},client:{from(table){const q={select(){return q;},eq(){return q;},order(){return q;},limit:async()=>({data:[],error:null}),maybeSingle:async()=>({data:{},error:null}),upsert:async payload=>{writes.push({table,payload});return {data:[],error:failWeight&&table==='bodyweights'?{message:'offline'}:null};}};return q;}}};
 w.eval(fs.readFileSync(path.join(__dirname,'../client-journal-profile.js'),'utf8'));return {dom,w,writes,toasts};
}
(async()=>{
 let f=fixture(true);await f.w.clientMeasure107();f.w.document.getElementById('cjWeight').value='95,5';f.w.document.getElementById('cj_chest').value='110';const saving=f.w.clientSaveMeasure107();await f.w.clientSaveMeasure107();await saving;
 assert.equal(f.writes.filter(x=>x.table==='bodyweights').length,1);assert.equal(f.w.st.bw.length,0);assert.ok(f.toasts.some(x=>/вес не удалось записать/.test(x)));assert.equal(f.w.document.querySelector('[onclick="clientSaveMeasure107()"]').disabled,false);f.dom.window.close();
 f=fixture(false);await f.w.clientMeasure107();f.w.document.getElementById('cjWeight').value='95,5';await f.w.clientSaveMeasure107();assert.equal(f.w.st.bw[0].w,95.5);assert.equal(f.w.st.bw[0].d,'2026-10-12');assert.equal(f.writes.filter(x=>x.table==='bodyweights').length,1);assert.equal(f.writes.filter(x=>x.table==='body_measurements').length,0);f.dom.window.close();
 console.log('Client save: comma input, weight-only entry, failed weight upload retains the form, no false success and double-tap prevention passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
